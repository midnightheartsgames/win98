(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;
  const Faces = window.BreakFaces;

  function soft(ctx, x, y, rx, ry, col, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(Math.max(0.01, rx), Math.max(0.01, ry));
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

  function speckle(ctx, g, w, h, n, dark, light, size) {
    for (let i = 0; i < n; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${dark * g()})` : `rgba(255,255,255,${light * g()})`;
      const s = 1 + Math.floor(g() * (size || 2));
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), s, s);
    }
  }

  function streaks(ctx, g, w, h, n, col, a) {
    for (let i = 0; i < n; i++) {
      const x = g() * w, y = g() * h * 0.6, len = h * (0.15 + g() * 0.5);
      const gr = ctx.createLinearGradient(0, y, 0, y + len);
      gr.addColorStop(0, col.replace('A', a * g()));
      gr.addColorStop(1, col.replace('A', 0));
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, 2 + g() * w * 0.04, len);
    }
  }

  function title(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(1977);
    ctx.save();
    ctx.fillStyle = '#f2f0ee';
    ctx.font = `${Math.round(h * 1.16)}px Impact, "Arial Narrow", "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    const word = 'JOKER';
    const widths = [...word].map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    const gap = -w * 0.004;
    const k = (w * 0.975 - gap * (word.length - 1)) / total;
    let x = w * 0.012;
    ctx.strokeStyle = '#f2f0ee';
    ctx.lineJoin = 'miter';
    [...word].forEach((ch, i) => {
      ctx.save();
      ctx.translate(x, h * 0.975);
      ctx.scale(k, 1.0);
      ctx.lineWidth = h * 0.035 / k;
      ctx.strokeText(ch, 0, 0);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      x += widths[i] * k + gap;
    });
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3500; i++) {
      const px = g() * w, py = g() * h;
      const big = g() < 0.04;
      ctx.fillStyle = `rgba(0,0,0,${0.55 + g() * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(px, py, big ? 1.2 + g() * 2.5 : 0.4 + g() * 0.9, big ? 0.8 + g() * 1.8 : 0.4 + g() * 0.8, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 70; i++) {
      const px = g() * w, py = g() * h, len = 6 + g() * 40;
      line(ctx, [[px, py], [px + len * (g() - 0.5), py + len * (g() * 0.6 - 0.3)]], 0.6 + g() * 1.6, 'rgba(0,0,0,0.9)');
    }
    for (let i = 0; i < 9; i++) {
      const cx = g() * w, cy = g() * h;
      for (let j = 0; j < 260; j++) {
        const a = g() * PI * 2, d = g() * (12 + g() * 26);
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 1 + g() * 2, 1 + g() * 2);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.translate(w * 0.355, h * 0.2);
    ctx.rotate(-0.62);
    ctx.fillStyle = '#000';
    ctx.fillRect(-w * 0.03, -h * 0.012, w * 0.06, h * 0.024);
    ctx.restore();
    ctx.save();
    ctx.translate(w * 0.356, h * 0.205);
    ctx.rotate(-0.62);
    ctx.fillStyle = '#e8e6e2';
    ctx.fillRect(-w * 0.026, -h * 0.007, w * 0.052, h * 0.014);
    ctx.restore();
  }

  function frameOf(H, w, h) {
    return Faces.frame(H, w, h);
  }

  const JOKER_PAINT = { white: '#ebe8e2', blue: '#2d5aa0', red: '#b8322c', lip: '#a42a26' };

  function jokerFace(H, opts) {
    const o = opts || {};
    return (ctx, w, h) => {
      const M = frameOf(H, w, h);
      const g = rand(4242 + w);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#d6bcae';
      ctx.fillRect(0, 0, w, h);
      M.apply(ctx);
      const top = -0.66 * H.ry * 1000;
      ctx.fillStyle = '#2c2a1c';
      ctx.fillRect(-M.backX - 20, M.topY - 20, M.backX * 2 + 40, top - M.topY + 26);
      ctx.fillRect(-M.backX - 20, M.topY - 20, M.backX * 0.62, -M.topY + M.chinY + 80);
      ctx.fillRect(M.backX * 0.38 + 20, M.topY - 20, M.backX * 0.62, -M.topY + M.chinY + 80);
      for (let i = 0; i < 2600; i++) {
        const x = (g() * 2 - 1) * (M.backX + 20), y = M.topY + g() * (top - M.topY + 10);
        line(ctx, [[x, y], [x + (g() - 0.5) * 6, y + 6 + g() * 10]], 0.8, g() < 0.5 ? 'rgba(80,92,52,0.5)' : 'rgba(20,18,12,0.6)');
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-78, top + 10);
      ctx.bezierCurveTo(-40, top - 6, 40, top - 6, 78, top + 10);
      ctx.bezierCurveTo(96, 20, 94, 80, 68, M.chinY - 2);
      ctx.bezierCurveTo(40, M.chinY + 16, -40, M.chinY + 16, -68, M.chinY - 2);
      ctx.bezierCurveTo(-94, 80, -96, 20, -78, top + 10);
      ctx.closePath();
      ctx.fillStyle = JOKER_PAINT.white;
      ctx.fill();
      ctx.clip();
      for (let i = 0; i < 1800; i++) {
        const x = (g() * 2 - 1) * 100, y = top + g() * (M.chinY - top + 20);
        ctx.fillStyle = `rgba(150,140,130,${0.06 * g()})`;
        ctx.fillRect(x, y, 1 + g() * 3, 1 + g() * 2);
      }
      [-1, 1].forEach(s => {
        soft(ctx, s * 52, M.eyeY + 38, 18, 30, 'rgba(105,95,95,A)', 0.32);
        soft(ctx, s * 80, 24, 20, 70, 'rgba(110,100,95,A)', 0.38);
        soft(ctx, s * 66, M.eyeY - 30, 16, 22, 'rgba(120,110,105,A)', 0.25);
        soft(ctx, s * M.eyeX, M.eyeY - 2, 20, 12, 'rgba(90,85,95,A)', 0.22);
        soft(ctx, s * 18, M.tipY - 4, 8, 22, 'rgba(120,110,110,A)', 0.2);
        soft(ctx, s * 40, M.mouthY + 26, 16, 22, 'rgba(110,100,95,A)', 0.22);
      });
      soft(ctx, 0, M.eyeY - 46, 40, 16, 'rgba(255,255,250,A)', 0.4);
      soft(ctx, 0, M.chinY + 6, 60, 14, 'rgba(110,100,95,A)', 0.35);
      ctx.restore();
      [-1, 1].forEach(s => {
        const ex = s * M.eyeX, ey = M.eyeY;
        ctx.fillStyle = JOKER_PAINT.red;
        ctx.beginPath();
        ctx.moveTo(ex - s * 22, ey - 30);
        ctx.quadraticCurveTo(ex - s * 2, ey - 50, ex + s * 22, ey - 36);
        ctx.quadraticCurveTo(ex - s * 2, ey - 43, ex - s * 22, ey - 30);
        ctx.fill();
        ctx.fillStyle = JOKER_PAINT.blue;
        ctx.beginPath();
        ctx.moveTo(ex - s * 15, ey - 7);
        ctx.quadraticCurveTo(ex - s * 4, ey - 20, ex + s * 1, ey - 33);
        ctx.quadraticCurveTo(ex + s * 6, ey - 20, ex + s * 17, ey - 6);
        ctx.quadraticCurveTo(ex, ey - 10, ex - s * 15, ey - 7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex - s * 14, ey + 5);
        ctx.quadraticCurveTo(ex, ey + 9, ex + s * 15, ey + 4);
        ctx.quadraticCurveTo(ex + s * 6, ey + 16, ex + s * 1, ey + 30);
        ctx.quadraticCurveTo(ex - s * 4, ey + 16, ex - s * 14, ey + 5);
        ctx.fill();
        if (o.closed) {
          ctx.fillStyle = '#2a3a5c';
          ctx.beginPath();
          ctx.moveTo(ex - s * 13, ey + 0.5);
          ctx.quadraticCurveTo(ex, ey + 5, ex + s * 13, ey);
          ctx.quadraticCurveTo(ex, ey - 4, ex - s * 13, ey + 0.5);
          ctx.fill();
          line(ctx, [[ex - s * 13, ey + 1.5], [ex, ey + 5.5], [ex + s * 13.5, ey + 1]], 1.6, '#0e0c10');
        } else {
          ctx.fillStyle = '#e2d8cc';
          ctx.beginPath();
          ctx.moveTo(ex - s * 12, ey + 0.5);
          ctx.bezierCurveTo(ex - s * 6, ey - 4.6, ex + s * 6, ey - 4.4, ex + s * 12, ey - 0.4);
          ctx.bezierCurveTo(ex + s * 6, ey + 3.6, ex - s * 6, ey + 3.8, ex - s * 12, ey + 0.5);
          ctx.fill();
          ctx.save();
          ctx.clip();
          ctx.fillStyle = '#4a3a24';
          ctx.beginPath();
          ctx.ellipse(ex + s * (o.look || 0) - s * 0.6, ey + 0.2, 5.2, 5.4, 0, 0, PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0a0806';
          ctx.beginPath();
          ctx.ellipse(ex + s * (o.look || 0) - s * 0.6, ey + 0.2, 2.2, 2.3, 0, 0, PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.beginPath();
          ctx.ellipse(ex + s * (o.look || 0) + s * 1.2, ey - 1.5, 1.0, 1.0, 0, 0, PI * 2);
          ctx.fill();
          soft(ctx, ex, ey - 4, 13, 4, 'rgba(20,30,60,A)', 0.6);
          ctx.restore();
          line(ctx, [[ex - s * 12.5, ey + 0.4], [ex - s * 6, ey - 5.2], [ex + s * 6, ey - 5], [ex + s * 12.8, ey - 0.4]], 1.8, '#101018');
          line(ctx, [[ex - s * 11, ey + 1.2], [ex, ey + 4.6], [ex + s * 11.5, ey + 0.5]], 0.9, 'rgba(30,40,70,0.7)');
        }
      });
      ctx.fillStyle = '#c63a30';
      ctx.beginPath();
      ctx.ellipse(0, M.tipY + 2, M.noseW * 0.95, (M.baseY - M.tipY) * 0.5 + 10, 0, 0, PI * 2);
      ctx.fill();
      soft(ctx, -3, M.tipY - 3, 5, 4, 'rgba(255,200,190,A)', 0.55);
      [-1, 1].forEach(s => {
        ctx.fillStyle = '#5a1a16';
        ctx.beginPath();
        ctx.ellipse(s * M.noseW * 0.42, M.baseY - 1.5, M.noseW * 0.24, 1.8, s * 0.35, 0, PI * 2);
        ctx.fill();
      });
      const my = M.mouthY, cx = M.cornerX;
      ctx.fillStyle = JOKER_PAINT.red;
      ctx.beginPath();
      ctx.moveTo(-cx - 34, my - 22);
      ctx.bezierCurveTo(-cx - 22, my - 14, -cx - 10, my - 8, -cx + 2, my - 7);
      ctx.bezierCurveTo(-cx * 0.4, my - 9.5, -4, my - 8, 0, my - 6.5);
      ctx.bezierCurveTo(4, my - 8, cx * 0.4, my - 9.5, cx - 2, my - 7);
      ctx.bezierCurveTo(cx + 10, my - 8, cx + 22, my - 14, cx + 34, my - 22);
      ctx.bezierCurveTo(cx + 26, my - 6, cx + 14, my + 9, cx - 2, my + 12);
      ctx.bezierCurveTo(cx * 0.5, my + 15.5, -cx * 0.5, my + 15.5, -cx + 2, my + 12);
      ctx.bezierCurveTo(-cx - 14, my + 9, -cx - 26, my - 6, -cx - 34, my - 22);
      ctx.fill();
      soft(ctx, 0, my + 6, cx * 0.8, 3, 'rgba(255,170,160,A)', 0.3);
      line(ctx, [[-cx - 6, my - 1.5], [-cx * 0.4, my + 1.2], [0, my + 0.4], [cx * 0.4, my + 1.2], [cx + 6, my - 1.5]], 1.6, '#3a0c0a');
      [-1, 1].forEach(s => line(ctx, [[s * (cx + 6), my - 1.5], [s * (cx + 18), my - 7], [s * (cx + 30), my - 17]], 1.0, 'rgba(70,14,12,0.45)'));
      soft(ctx, 0, M.chinY + 34, 90, 26, 'rgba(70,40,30,A)', 0.25);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };
  }

  function mustache(ctx, M, col, grey, seed) {
    const g = rand(seed);
    const my = M.mouthY, cx = M.cornerX;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(-cx - 7, my + 3);
    ctx.bezierCurveTo(-cx - 4, my - 9, -10, my - 14, 0, my - 12);
    ctx.bezierCurveTo(10, my - 14, cx + 4, my - 9, cx + 7, my + 3);
    ctx.bezierCurveTo(cx - 2, my - 2, 8, my - 5, 0, my - 4);
    ctx.bezierCurveTo(-8, my - 5, -cx + 2, my - 2, -cx - 7, my + 3);
    ctx.fill();
    for (let i = 0; i < 900; i++) {
      const x = (g() * 2 - 1) * (cx + 6), y = my - 13 + g() * 13;
      ctx.strokeStyle = g() < 0.35 ? grey : col;
      ctx.globalAlpha = 0.35 + g() * 0.5;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sign(x) * (1 + g() * 2), y + 2 + g() * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function detectiveFace(who, H, skin) {
    const base = Faces.paint(who, H, null, skin);
    const extra = Faces.SPEC[who] && Faces.SPEC[who].mustache;
    return (ctx, w, h) => {
      base(ctx, w, h);
      if (!extra) return;
      const M = frameOf(H, w, h);
      M.apply(ctx);
      mustache(ctx, M, extra.col, extra.grey, 77);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
  }

  function hairStrands(ctx, w, h) {
    const g = rand(808);
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#36301e');
    gr.addColorStop(0.5, '#28221a');
    gr.addColorStop(1, '#3e3420');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = g() * w;
      const col = g() < 0.3 ? `rgba(96,84,52,${0.25 + g() * 0.35})` : g() < 0.5 ? `rgba(140,108,62,${0.2 + g() * 0.3})` : `rgba(12,10,8,${0.3 + g() * 0.4})`;
      const wob = (g() - 0.5) * w * 0.06;
      line(ctx, [[x, 0], [x + wob, h * 0.5], [x - wob * 0.5, h]], 0.6 + g() * 1.6, col);
    }
  }

  function brick(ctx, w, h, opts) {
    const o = opts || {};
    const g = rand(o.seed || 31);
    ctx.fillStyle = o.mortar || '#6a5e54';
    ctx.fillRect(0, 0, w, h);
    const rows = o.rows || 16, cols = o.cols || 4;
    const bh = h / rows, bw = w / cols;
    const base = o.base || [128, 66, 48];
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + off, y = r * bh;
        const v = 0.78 + g() * 0.32;
        const tint = g() < 0.1 ? 0.75 : 1;
        ctx.fillStyle = `rgb(${Math.round(base[0] * v * tint)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`;
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      }
    }
    speckle(ctx, g, w, h, w * h * 0.12, 0.25, 0.08, 2);
    streaks(ctx, g, w, h, 18, 'rgba(20,16,12,A)', 0.35);
  }

  function facade(ctx, w, h, opts) {
    const o = opts || {};
    brick(ctx, w, h, { rows: 40, cols: 6, base: o.base || [118, 64, 48], mortar: o.mortar || '#5a5048', seed: o.seed || 5 });
    const g = rand((o.seed || 5) + 9);
    const wx = w * 0.28, wy = h * 0.2, ww = w * 0.44, wh = h * 0.5;
    ctx.fillStyle = 'rgba(30,26,22,0.9)';
    ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
    const gl = ctx.createLinearGradient(0, wy, 0, wy + wh);
    gl.addColorStop(0, o.glassTop || '#3a4448');
    gl.addColorStop(1, o.glassBot || '#151a1c');
    ctx.fillStyle = gl;
    ctx.fillRect(wx, wy, ww, wh);
    if (g() < 0.6) {
      ctx.fillStyle = `rgba(${150 + g() * 60},${130 + g() * 50},${100 + g() * 40},0.55)`;
      ctx.fillRect(wx + 3, wy + 3, ww - 6, wh * (0.2 + g() * 0.4));
    }
    ctx.fillStyle = o.frame || '#c8c2b4';
    ctx.fillRect(wx - 6, wy + wh * 0.48, ww + 12, 4);
    ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
    ctx.fillStyle = o.sill || '#8a8478';
    ctx.fillRect(wx - 10, wy + wh + 4, ww + 20, 8);
    ctx.fillStyle = '#4a2a20';
    ctx.fillRect(wx - 8, wy - 16, ww + 16, 10);
  }

  function granite(ctx, w, h, opts) {
    const o = opts || {};
    const g = rand(o.seed || 44);
    ctx.fillStyle = o.base || '#7c7a74';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.5, 0.32, 0.22, 2);
    const rows = o.rows || 3;
    for (let r = 0; r < rows; r++) {
      const y = (r / rows) * h;
      ctx.fillStyle = 'rgba(30,28,26,0.55)';
      ctx.fillRect(0, y, w, 2);
      const n = 2 + Math.floor(g() * 2);
      for (let c = 0; c < n; c++) ctx.fillRect(((c + g() * 0.5) / n) * w, y, 2, h / rows);
    }
    streaks(ctx, g, w, h, 30, 'rgba(15,14,12,A)', 0.4);
  }

  function steps(ctx, w, h) {
    const g = rand(71);
    ctx.fillStyle = '#b4b6b4';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.3, 0.16, 0.1, 3);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(30,30,28,${0.05 + g() * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 2 + g() * 14, 1 + g() * 4, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function asphalt(ctx, w, h) {
    const g = rand(93);
    ctx.fillStyle = '#4a4a4c';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.7, 0.4, 0.15, 2);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(20,20,22,${0.1 + g() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 10 + g() * 40, 5 + g() * 20, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function sidewalk(ctx, w, h) {
    const g = rand(57);
    ctx.fillStyle = '#8e8c86';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.4, 0.3, 0.2, 2);
    ctx.fillStyle = 'rgba(40,38,36,0.6)';
    for (let i = 0; i <= 2; i++) {
      ctx.fillRect(0, (i / 2) * h - 1, w, 2);
      ctx.fillRect((i / 2) * w - 1, 0, 2, h);
    }
  }

  function wood(ctx, w, h) {
    const g = rand(212);
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#3a2412');
    gr.addColorStop(0.5, '#5a3618');
    gr.addColorStop(1, '#3a2412');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = g() * w;
      line(ctx, [[x, 0], [x + (g() - 0.5) * 20, h * 0.5], [x + (g() - 0.5) * 10, h]], 0.6 + g() * 2, g() < 0.5 ? `rgba(20,10,4,${0.2 + g() * 0.3})` : `rgba(140,90,40,${0.1 + g() * 0.2})`);
    }
    for (let i = 0; i < 26; i++) soft(ctx, g() * w, g() * h, 6 + g() * 20, 30 + g() * 80, 'rgba(230,170,90,A)', 0.08 + g() * 0.1);
    ctx.fillStyle = 'rgba(10,6,2,0.85)';
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);
  }

  function hallWall(ctx, w, h) {
    const g = rand(613);
    ctx.fillStyle = '#5c625a';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.3, 0.2, 0.08, 2);
    streaks(ctx, g, w, h, 10, 'rgba(20,24,20,A)', 0.3);
    ctx.fillStyle = '#3a3226';
    ctx.fillRect(0, h * 0.9, w, h * 0.1);
  }

  function steel(ctx, w, h) {
    const g = rand(339);
    ctx.fillStyle = '#5a5648';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, g, w, h, w * h * 0.5, 0.3, 0.15, 3);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${90 + g() * 40},${60 + g() * 20},${30},${0.15 + g() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 2 + g() * 10, 2 + g() * 16, 0, 0, PI * 2);
      ctx.fill();
    }
    streaks(ctx, g, w, h, 16, 'rgba(30,20,10,A)', 0.4);
  }

  const TAGS = [
    { text: 'SKEE', col: '#c8302a', edge: '#1a2a6a' },
    { text: 'ROX', col: '#2a4aa8', edge: '#e8e0d0' },
    { text: 'MEKO', col: '#d0d0c8', edge: '#a02020' },
    { text: 'VIBE', col: '#b83a8a', edge: '#202020' },
    { text: 'TRAZ', col: '#e06a1a', edge: '#1a1a1a' },
    { text: 'ZONE', col: '#3a8a4a', edge: '#e8e8e0' }
  ];

  function graffiti(index) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const T = TAGS[index % TAGS.length];
      const g = rand(index * 31 + 7);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((g() - 0.5) * 0.3);
      ctx.font = `bold ${Math.round(h * 0.55)}px "Comic Sans MS", Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const letters = [...T.text];
      const step = w * 0.8 / letters.length;
      letters.forEach((ch, i) => {
        ctx.save();
        ctx.translate((i - (letters.length - 1) / 2) * step, (g() - 0.5) * h * 0.12);
        ctx.rotate((g() - 0.5) * 0.5);
        ctx.scale(1 + g() * 0.3, 1 + g() * 0.4);
        ctx.lineWidth = h * 0.06;
        ctx.strokeStyle = T.edge;
        ctx.strokeText(ch, 0, 0);
        ctx.fillStyle = T.col;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const x = g() * w, y = h * 0.6 + g() * h * 0.2;
        ctx.fillStyle = T.col;
        ctx.fillRect(x, y, 3, h * (0.1 + g() * 0.25));
      }
    };
  }

  function puff(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(5150);
    for (let i = 0; i < 40; i++) {
      const a = g() * PI * 2, d = g() * w * 0.22;
      soft(ctx, w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, w * (0.08 + g() * 0.14), h * (0.08 + g() * 0.14), 'rgba(255,255,255,A)', 0.1 + g() * 0.12);
    }
    const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.7, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  function flare(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    soft(ctx, w / 2, h / 2, w * 0.5, h * 0.5, 'rgba(255,130,40,A)', 0.55);
    soft(ctx, w / 2, h / 2, w * 0.22, h * 0.22, 'rgba(255,200,120,A)', 0.7);
    soft(ctx, w / 2, h / 2, w * 0.08, h * 0.08, 'rgba(255,240,220,A)', 0.9);
  }

  function glow(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    soft(ctx, w / 2, h / 2, w * 0.5, h * 0.5, 'rgba(255,255,255,A)', 1);
  }

  function ivy(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(919);
    for (let i = 0; i < 900; i++) {
      const x = g() * w, y = g() * h * (0.3 + 0.7 * g());
      ctx.fillStyle = `rgb(${40 + g() * 40},${70 + g() * 50},${30 + g() * 20})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + g() * 5, 2 + g() * 4, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function storeSign(ctx, w, h) {
    ctx.fillStyle = '#d8b018';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b81e1a';
    ctx.fillRect(0, 0, w, h * 0.36);
    ctx.fillStyle = '#fff4d0';
    ctx.font = `bold ${Math.round(h * 0.26)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HOT DOGS', w / 2, h * 0.18);
    ctx.fillStyle = '#2a1a10';
    ctx.font = `bold ${Math.round(h * 0.2)}px Arial, sans-serif`;
    ctx.fillText('SODA · PRETZELS', w / 2, h * 0.62);
  }

  function woodPanel(ctx, w, h) {
    const g = rand(477);
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(${60 + g() * 40},${40 + g() * 20},20,0.6)`;
      ctx.fillRect(0, (i / 6) * h, w, 3);
    }
    for (let i = 0; i < 120; i++) line(ctx, [[g() * w, g() * h], [g() * w, g() * h]], 0.5, 'rgba(40,24,10,0.25)');
  }

  window.StairsArt = { soft, line, title, jokerFace, detectiveFace, hairStrands, brick, facade, granite, steps, asphalt, sidewalk, wood, hallWall, steel, graffiti, puff, flare, glow, ivy, storeSign, woodPanel, TAGS, JOKER_PAINT };
})();
