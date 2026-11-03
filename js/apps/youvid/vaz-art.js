(function () {
  const { rand } = window.P3D;
  const { PI, S, C } = window.YouVidKit;

  function blob(ctx, x, y, rx, ry, a, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), a, 0, PI * 2);
    ctx.fill();
  }

  function specks(ctx, w, h, seed, n, amount) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 2), 1);
    }
  }

  function checker(ctx, w, h) {
    const n = 2, s = w / n;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const dark = (i + j) % 2 === 1;
        const g = ctx.createLinearGradient(i * s, j * s, (i + 1) * s, (j + 1) * s);
        g.addColorStop(0, dark ? '#26262c' : '#f2f0ea');
        g.addColorStop(1, dark ? '#16161a' : '#dcd9d2');
        ctx.fillStyle = g;
        ctx.fillRect(i * s, j * s, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(120,120,130,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s, 0);
      ctx.lineTo(i * s, h);
      ctx.moveTo(0, i * s);
      ctx.lineTo(w, i * s);
      ctx.stroke();
    }
    specks(ctx, w, h, 7, w * h * 0.08, 0.05);
  }

  function counterTiles(ctx, w, h) {
    ctx.fillStyle = '#8fa6bf';
    ctx.fillRect(0, 0, w, h);
    const n = 4, s = w / n, gap = 2;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const g = ctx.createLinearGradient(0, j * s, 0, (j + 1) * s);
        g.addColorStop(0, '#f4f6f8');
        g.addColorStop(1, '#d9e0e8');
        ctx.fillStyle = g;
        ctx.fillRect(i * s + gap, j * s + gap, s - gap * 2, s - gap * 2);
      }
    }
  }

  function sky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7fc6e6');
    g.addColorStop(0.55, '#a6dcf0');
    g.addColorStop(1, '#cdeef8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rand(17);
    for (let i = 0; i < 18; i++) {
      const x = r() * w, bw = 20 + r() * 60, bh = h * (0.25 + r() * 0.5);
      ctx.fillStyle = `rgba(${150 + r() * 40},${200 + r() * 30},${225 + r() * 25},0.55)`;
      ctx.fillRect(x, h - bh, bw, bh);
    }
    for (let i = 0; i < 10; i++) blob(ctx, r() * w, h * (0.15 + r() * 0.3), 30 + r() * 50, 8 + r() * 10, 0, 'rgba(255,255,255,0.35)');
    for (let i = 0; i < 6; i++) blob(ctx, r() * w, h * 0.88, 26 + r() * 30, 18 + r() * 12, 0, 'rgba(110,190,150,0.45)');
  }

  function shelfWall(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c7dbe6');
    g.addColorStop(1, '#a9c2d2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    specks(ctx, w, h, 23, w * h * 0.05, 0.04);
  }

  function ceiling(ctx, w, h) {
    ctx.fillStyle = '#4a2a2c';
    ctx.fillRect(0, 0, w, h);
    specks(ctx, w, h, 29, w * h * 0.1, 0.06);
  }

  function grille(ctx, w, h) {
    ctx.fillStyle = '#2c1a14';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9b26a';
    ctx.lineWidth = 3;
    const n = 7;
    for (let i = -n; i <= n * 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i / n) * w, 0);
      ctx.lineTo((i / n) * w + w, h);
      ctx.moveTo((i / n) * w, 0);
      ctx.lineTo((i / n) * w - w, h);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,200,140,0.6)';
    ctx.lineWidth = 1;
    for (let i = -n; i <= n * 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i / n) * w + 4, 0);
      ctx.lineTo((i / n) * w + w + 4, h);
      ctx.stroke();
    }
  }

  function swirl(ctx, w, h) {
    const cx = w / 2, cy = h / 2, r = w * 0.48;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      ctx.fillStyle = '#d4202a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        const aa = a + u * 0.9;
        ctx.lineTo(cx + C(aa) * r * u, cy + S(aa) * r * u);
      }
      for (let k = 12; k >= 0; k--) {
        const u = k / 12;
        const aa = a + 0.42 + u * 0.9;
        ctx.lineTo(cx + C(aa) * r * u, cy + S(aa) * r * u);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#b8b8b8';
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI * 2);
    ctx.stroke();
  }

  function stripes(ctx, w, h) {
    ctx.fillStyle = '#f6f2ee';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d1252c';
    for (let i = -4; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 4) * h);
      ctx.lineTo(w, (i / 4) * h + h * 0.5);
      ctx.lineTo(w, (i / 4) * h + h * 0.62);
      ctx.lineTo(0, (i / 4) * h + h * 0.12);
      ctx.closePath();
      ctx.fill();
    }
  }

  function leather(base) {
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.4, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      specks(ctx, w, h, 41, w * h * 0.06, 0.05);
    };
  }

  function serif(ctx, str, x, y, px, fill, spacing) {
    ctx.font = `bold ${px}px "Times New Roman", Georgia, serif`;
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (spacing) {
      const chars = [...str];
      const wsum = chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * (chars.length - 1);
      let cx = x - wsum / 2;
      ctx.textAlign = 'left';
      chars.forEach(ch => {
        ctx.fillText(ch, cx, y);
        cx += ctx.measureText(ch).width + spacing;
      });
      return;
    }
    ctx.fillText(str, x, y);
  }

  function historyCover(ctx, w, h) {
    ctx.fillStyle = '#d8b98a';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(90,60,30,0.35)');
    g.addColorStop(0.12, 'rgba(90,60,30,0)');
    g.addColorStop(1, 'rgba(90,60,30,0.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(110,76,40,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.1, h * 0.06, w * 0.82, h * 0.88);
    serif(ctx, 'HISTORY', w * 0.52, h * 0.42, w * 0.17, '#5a3a1c', 1);
    specks(ctx, w, h, 61, w * h * 0.05, 0.08);
  }

  function dictCover(ctx, w, h) {
    ctx.fillStyle = '#1f3b2a';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    serif(ctx, 'DICTIONARY', w * 0.5, h * 0.5, w * 0.11, '#d9c27a', 2);
    ctx.fillStyle = '#d9c27a';
    ctx.fillRect(w * 0.14, h * 0.58, w * 0.72, h * 0.012);
    ctx.fillRect(w * 0.14, h * 0.42, w * 0.72, h * 0.012);
  }

  function textLines(ctx, x0, y0, x1, y1, step, seed, ink) {
    const g = rand(seed);
    ctx.fillStyle = ink;
    for (let y = y0; y < y1; y += step) {
      let x = x0;
      const end = x1 - (g() < 0.12 ? (x1 - x0) * 0.4 * g() : 0);
      while (x < end) {
        const ww = 4 + g() * 14;
        ctx.fillRect(x, y, Math.min(ww, end - x), step * 0.45);
        x += ww + 3 + g() * 2;
      }
    }
  }

  function limb(ctx, pts, width, fill, edge) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 3;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function claw(ctx, x, y, a, s, fill, edge) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = fill;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * s, 6 * s, 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineCap = 'round';
    [-0.7, 0, 0.7].forEach(d => {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 4.5 * s;
      ctx.beginPath();
      ctx.moveTo(C(d) * 6 * s, S(d) * 6 * s);
      ctx.quadraticCurveTo(C(d) * 13 * s, S(d) * 13 * s, C(d + 0.6) * 13 * s, S(d + 0.6) * 13 * s);
      ctx.stroke();
      ctx.strokeStyle = fill;
      ctx.lineWidth = 3 * s;
      ctx.stroke();
    });
    ctx.restore();
  }

  function dancer(ctx, cx, base, s, ink) {
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale(s, s);
    const suit = '#2a282e', edge = '#111014', skin = '#d9d4cc', shoe = '#f2f0ec';
    limb(ctx, [[-8, -112], [-38, -70], [-64, -4]], 21, suit, edge);
    limb(ctx, [[14, -112], [46, -72], [60, -2]], 21, suit, edge);
    [[-66, 2, -0.2], [64, 4, 0.15]].forEach(([x, y, a]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = shoe;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x < 0 ? -8 : 8, 0, 17, 7, 0, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = edge;
      ctx.fillRect(x < 0 ? 0 : -6, 3, 6, 5);
      ctx.restore();
    });
    const g = ctx.createLinearGradient(-30, -190, 30, -100);
    g.addColorStop(0, '#47444c');
    g.addColorStop(1, suit);
    ctx.fillStyle = g;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, -188);
    ctx.quadraticCurveTo(-4, -198, 24, -186);
    ctx.lineTo(28, -106);
    ctx.quadraticCurveTo(4, -96, -22, -104);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f4f2ee';
    ctx.beginPath();
    ctx.moveTo(-8, -188);
    ctx.lineTo(6, -188);
    ctx.lineTo(-1, -150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = edge;
    ctx.fillRect(-3, -186, 4, 30);
    limb(ctx, [[-28, -180], [-56, -176], [-52, -214]], 15, suit, edge);
    claw(ctx, -50, -222, -1.9, 1, skin, edge);
    limb(ctx, [[22, -176], [40, -140], [62, -132]], 15, suit, edge);
    claw(ctx, 70, -132, -0.2, 1, skin, edge);
    ctx.fillStyle = '#efede8';
    ctx.fillRect(-55, -212, 10, 5);
    ctx.fillRect(57, -136, 5, 9);
    limb(ctx, [[-2, -186], [2, -206]], 9, skin, edge);
    const hx = 6, hy = -228;
    ctx.fillStyle = skin;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 20, 29, 0.25, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8c2ba';
    ctx.beginPath();
    ctx.ellipse(hx + 24, hy + 12, 15, 11, 0.5, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.ellipse(hx + 8, hy - 6, 13, 5, 0.3, 0, PI * 2);
    ctx.fill();
    const hg = ctx.createLinearGradient(hx - 30, hy - 60, hx + 20, hy - 20);
    hg.addColorStop(0, '#5a565e');
    hg.addColorStop(1, '#1c1a20');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy - 8);
    ctx.quadraticCurveTo(hx - 34, hy - 46, hx - 6, hy - 62);
    ctx.quadraticCurveTo(hx + 22, hy - 70, hx + 22, hy - 40);
    ctx.quadraticCurveTo(hx + 12, hy - 22, hx + 2, hy - 18);
    ctx.quadraticCurveTo(hx - 6, hy - 14, hx - 16, hy - 8);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx + 18, hy + 30);
    ctx.quadraticCurveTo(hx + 12, hy + 34, hx + 6, hy + 30);
    ctx.stroke();
    ctx.restore();
  }

  function dictPage(ctx, w, h) {
    ctx.fillStyle = '#f3f1ec';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(120,110,100,0.25)');
    g.addColorStop(0.08, 'rgba(120,110,100,0)');
    g.addColorStop(0.92, 'rgba(120,110,100,0)');
    g.addColorStop(1, 'rgba(120,110,100,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    dancer(ctx, w * 0.5, h * 0.66, w / 290, '#26242a');
    ctx.font = `bold ${Math.round(w * 0.032)}px "Times New Roman", serif`;
    ctx.fillStyle = '#26242a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('cool daddy-o', w * 0.12, h * 0.66);
    textLines(ctx, w * 0.36, h * 0.665, w * 0.86, h * 0.68, h * 0.02, 3, 'rgba(40,38,44,0.85)');
    textLines(ctx, w * 0.12, h * 0.69, w * 0.86, h * 0.95, h * 0.02, 5, 'rgba(40,38,44,0.85)');
    textLines(ctx, w * 0.12, h * 0.05, w * 0.86, h * 0.12, h * 0.02, 9, 'rgba(40,38,44,0.75)');
  }

  function dictColumn(ctx, w, h) {
    ctx.fillStyle = '#efecf2';
    ctx.fillRect(0, 0, w, h);
    textLines(ctx, w * 0.1, h * 0.04, w * 0.9, h * 0.96, h * 0.018, 13, 'rgba(70,60,110,0.8)');
  }

  function paperEdge(ctx, w, h) {
    ctx.fillStyle = '#ebe6dc';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(150,140,120,${0.1 + ((y * 7) % 5) * 0.03})`;
      ctx.fillRect(0, y, w, 1);
    }
  }

  function nameTag(ctx, w, h) {
    ctx.fillStyle = '#20232c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8ccd4';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.font = `bold ${Math.round(h * 0.62)}px Arial, sans-serif`;
    ctx.fillStyle = '#f2f2f2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sam', w / 2, h * 0.54);
  }

  function logo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(5);
    const cx = w * 0.5, cy = h * 0.52;
    ctx.fillStyle = 'rgba(244,138,22,0.92)';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * PI * 2;
      const spike = i % 3 === 0 ? 1.22 + g() * 0.25 : 1;
      const rx = w * 0.4 * spike, ry = h * 0.3 * spike;
      ctx.lineTo(cx + C(a) * rx, cy + S(a) * ry);
    }
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = g() * PI * 2;
      blob(ctx, cx + C(a) * w * 0.47, cy + S(a) * h * 0.4, w * 0.02 + g() * w * 0.02, h * 0.03 + g() * h * 0.03, 0, 'rgba(244,138,22,0.92)');
    }
    blob(ctx, cx - w * 0.36, cy + h * 0.32, w * 0.018, h * 0.1, 0.1, 'rgba(244,138,22,0.92)');
    blob(ctx, cx + w * 0.22, cy + h * 0.38, w * 0.014, h * 0.09, -0.1, 'rgba(244,138,22,0.92)');
    ctx.font = `900 ${Math.round(h * 0.34)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = h * 0.05;
    ctx.strokeStyle = 'rgba(120,52,6,0.9)';
    ctx.strokeText('ПЯТАК', cx, cy + h * 0.02);
    ctx.fillStyle = '#fff6e6';
    ctx.fillText('ПЯТАК', cx, cy + h * 0.02);
  }

  function glow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#9a9a9a');
    g.addColorStop(0.7, '#2c2c2c');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function shaft(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.3, '#6a6a6a');
    g.addColorStop(0.5, '#a0a0a0');
    g.addColorStop(0.7, '#6a6a6a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,0.75)');
    v.addColorStop(0.25, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  function coinFace(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#c9ccd2');
    g.addColorStop(1, '#7e828a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,84,92,0.8)';
    ctx.lineWidth = w * 0.04;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, PI * 2);
    ctx.stroke();
    blob(ctx, w * 0.5, h * 0.5, w * 0.16, h * 0.2, 0, 'rgba(110,114,122,0.6)');
  }

  function guitarBody(ctx, w, h) {
    ctx.fillStyle = '#c3202a';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function jarLabel(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.25)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.0)');
    g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(w * 0.36, h * 0.15, w * 0.05, h * 0.6);
  }

  const FACE = { y0: -1.15, y1: 1.15 };

  function faceXY(w, h, yaw, pit, p0, p1) {
    return [((yaw - FACE.y0) / (FACE.y1 - FACE.y0)) * w, (1 - (pit - p0) / (p1 - p0)) * h];
  }

  function eyesTex(look, state) {
    const E = look.eyes;
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const at = (yaw, pit) => faceXY(w, h, yaw, pit, E.p0, E.p1);
      const ex = w * E.rx, ey = h * E.ry;
      const st = state || 'open';
      [-1, 1].forEach(side => {
        const [cx, cy] = at(side * E.yaw, E.pit);
        const lid = st === 'closed' || (st === 'wink' && side === -1) ? 1 : st === 'half' ? 0.55 : st === 'cool' ? 0.42 : st === 'happy' ? 1 : 0;
        const wide = st === 'wide' || st === 'shock' ? 1.2 : 1;
        if (st === 'happy') {
          ctx.strokeStyle = E.line;
          ctx.lineWidth = h * 0.06;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.ellipse(cx, cy + ey * 0.25, ex * 0.8, ey * 0.55, 0, PI * 1.1, PI * 1.9);
          ctx.stroke();
          return;
        }
        if (lid >= 1) {
          ctx.strokeStyle = E.line;
          ctx.lineWidth = h * 0.05;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.ellipse(cx, cy - ey * 0.1, ex * 0.85, ey * 0.35, 0, PI * 0.05, PI * 0.95);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, ex * wide, ey * wide, 0, 0, PI * 2);
        ctx.fill();
        const look2 = { open: [0, 0], cool: [0, 0.1], half: [0, 0.1], wide: [0, 0], shock: [0, 0], up: [0, -0.45], down: [0, 0.4], left: [-0.45, 0], right: [0.45, 0], upleft: [-0.35, -0.35], upright: [0.35, -0.35] }[st] || [0, 0];
        const px = cx + look2[0] * ex, py = cy + look2[1] * ey;
        const pr = ex * (E.pupil || 0.42) * (st === 'shock' ? 0.6 : 1);
        if (E.iris) blob(ctx, px, py, pr * 1.25, pr * 1.35, 0, E.iris);
        blob(ctx, px, py, pr * 0.75, pr * 0.85, 0, '#140c0a');
        blob(ctx, px - pr * 0.35, py - pr * 0.4, pr * 0.28, pr * 0.28, 0, 'rgba(255,255,255,0.9)');
        if (lid > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(cx, cy, ex * wide + 1, ey * wide + 1, 0, 0, PI * 2);
          ctx.clip();
          ctx.fillStyle = look.lid;
          ctx.fillRect(cx - ex * 1.3, cy - ey * 1.3, ex * 2.6, ey * 2.6 * lid);
          ctx.restore();
          ctx.strokeStyle = E.line;
          ctx.lineWidth = h * 0.035;
          ctx.beginPath();
          ctx.moveTo(cx - ex, cy - ey * 1.3 + ey * 2.6 * lid);
          ctx.lineTo(cx + ex, cy - ey * 1.3 + ey * 2.6 * lid);
          ctx.stroke();
        }
        ctx.strokeStyle = E.line;
        ctx.lineWidth = h * 0.025;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ex * wide, ey * wide, 0, 0, PI * 2);
        ctx.stroke();
      });
      if (E.brow) {
        const lift = st === 'wide' || st === 'shock' || st === 'up' ? -0.5 : st === 'cool' || st === 'half' ? 0.25 : 0;
        [-1, 1].forEach(side => {
          const [cx, cy] = at(side * E.yaw, E.pit);
          ctx.strokeStyle = E.brow;
          ctx.lineWidth = h * (E.browW || 0.07);
          ctx.lineCap = 'round';
          ctx.beginPath();
          const by = cy - ey * (1.55 - lift * 0.6);
          ctx.moveTo(cx - side * ex * 0.95, by + ey * 0.15 * (st === 'angry' ? -1 : 1));
          ctx.quadraticCurveTo(cx, by - ey * 0.35, cx + side * ex * 1.0, by + ey * 0.1);
          ctx.stroke();
        });
      }
    };
  }

  function mouthTex(look, shape, level) {
    const M = look.mouth;
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const [cx, cy] = faceXY(w, h, 0, M.pit, M.p0, M.p1);
      const mw = w * M.w, mh = h * M.h;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const open = shape === 'scream' ? 1.25 : shape === 'o' ? 0.75 : [0, 0.32, 0.62, 1][level] || 0;
      if (open <= 0.01 && shape !== 'grin') {
        ctx.strokeStyle = M.line;
        ctx.lineWidth = h * 0.05;
        ctx.beginPath();
        const curve = shape === 'frown' ? -0.35 : shape === 'smirk' ? 0.25 : 0.4;
        ctx.moveTo(cx - mw * 0.55, cy - mh * curve * 0.3);
        ctx.quadraticCurveTo(cx, cy + mh * curve, cx + mw * (shape === 'smirk' ? 0.6 : 0.55), cy - mh * curve * (shape === 'smirk' ? 0.9 : 0.3));
        ctx.stroke();
        return;
      }
      const rx = shape === 'o' ? mw * 0.32 : mw * (0.5 + open * 0.08);
      const ry = shape === 'grin' ? mh * 0.45 : mh * (0.18 + open * 0.75);
      ctx.fillStyle = M.inside;
      ctx.beginPath();
      if (shape === 'grin' || shape === 'smile') {
        ctx.moveTo(cx - rx, cy - ry * 0.35);
        ctx.quadraticCurveTo(cx, cy - ry * 0.55, cx + rx, cy - ry * 0.35);
        ctx.quadraticCurveTo(cx + rx * 0.7, cy + ry * 1.2, cx, cy + ry * 1.25);
        ctx.quadraticCurveTo(cx - rx * 0.7, cy + ry * 1.2, cx - rx, cy - ry * 0.35);
      } else {
        ctx.ellipse(cx, cy + ry * 0.3, rx, ry, 0, 0, PI * 2);
      }
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(cx - rx, cy - ry * 1.2, rx * 2, ry * (shape === 'grin' ? 0.9 : 0.55));
      blob(ctx, cx, cy + ry * 1.1, rx * 0.55, ry * 0.5, 0, M.tongue);
      ctx.restore();
      ctx.strokeStyle = M.line;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();
    };
  }

  window.VazArt = {
    checker, counterTiles, sky, shelfWall, ceiling, grille, swirl, stripes, leather,
    historyCover, dictCover, dictPage, dictColumn, paperEdge, nameTag, logo, glow, shaft, coinFace, guitarBody, jarLabel,
    FACE, eyesTex, mouthTex
  };
})();
