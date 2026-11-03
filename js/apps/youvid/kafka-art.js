(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const SANS = 'Tahoma, Verdana, Arial, sans-serif';
  const HAND = '"Segoe Script", "Brush Script MT", "Monotype Corsiva", cursive';

  const EYE_PATCH = [-1.0, 1.0, -0.52, 0.32];
  const MOUTH_PATCH = [-0.6, 0.6, -0.95, -0.24];

  const PAL = {
    skin: '#f6d6cc',
    skinShade: '#e8bcb4',
    iris: ['#3c0a34', '#a8357f', '#f0a2d6'],
    glow: ['#ff4fc4', '#ffd2f2'],
    lash: '#24060f',
    brow: '#4e1636',
    lip: '#d4607a',
    lipDark: '#8a2440'
  };

  function fill(ctx, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, w, h);
  }

  function radial(ctx, x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach(([k, c]) => g.addColorStop(k, c));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function centerText(ctx, text, x, y, font, color) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function patchMap(patch, w, h) {
    const [y0, y1, p0, p1] = patch;
    return {
      x: (yaw) => ((yaw - y0) / (y1 - y0)) * w,
      y: (pit) => (1 - (pit - p0) / (p1 - p0)) * h,
      kx: w / (y1 - y0),
      ky: h / (p1 - p0)
    };
  }

  function almond(ctx, cx, ey, rw, rh, sd, open) {
    ctx.beginPath();
    ctx.moveTo(cx - sd * rw * 0.98, ey + rh * 0.18);
    ctx.bezierCurveTo(cx - sd * rw * 0.55, ey - rh * 1.25 * open, cx + sd * rw * 0.55, ey - rh * 1.3 * open, cx + sd * rw * 1.04, ey - rh * 0.32);
    ctx.bezierCurveTo(cx + sd * rw * 0.6, ey + rh * 0.95 * open, cx - sd * rw * 0.5, ey + rh * 1.0 * open, cx - sd * rw * 0.98, ey + rh * 0.18);
    ctx.closePath();
  }

  function drawEye(ctx, m, state, sd, glowOnly) {
    const cx = m.x(sd * 0.42);
    const ey = m.y(-0.1);
    const rw = 0.29 * m.kx;
    const rh = 0.16 * m.ky;
    const wide = state === 'wide';
    const open = wide ? 1.22 : state === 'half' ? 0.62 : 1;
    if (!glowOnly) {
      ctx.strokeStyle = PAL.brow;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2, 0.026 * m.ky);
      const by = m.y(wide ? 0.2 : state === 'half' ? 0.13 : 0.16);
      ctx.beginPath();
      ctx.moveTo(cx - sd * rw * 0.8, by + 0.03 * m.ky);
      ctx.quadraticCurveTo(cx + sd * rw * 0.1, by - 0.035 * m.ky, cx + sd * rw * 1.05, by + 0.02 * m.ky);
      ctx.stroke();
    }
    if (state === 'shut') {
      if (glowOnly) return;
      ctx.strokeStyle = PAL.lash;
      ctx.lineWidth = Math.max(3, 0.034 * m.ky);
      ctx.beginPath();
      ctx.moveTo(cx - sd * rw * 0.95, ey - rh * 0.05);
      ctx.quadraticCurveTo(cx, ey + rh * 0.75, cx + sd * rw * 1.05, ey - rh * 0.25);
      ctx.stroke();
      return;
    }
    const glow = state === 'glow';
    ctx.save();
    almond(ctx, cx, ey, rw, rh, sd, open);
    ctx.clip();
    if (!glowOnly) {
      ctx.fillStyle = glow ? '#ffe8f8' : '#fff8f8';
      ctx.fillRect(cx - rw * 1.2, ey - rh * 2, rw * 2.4, rh * 4);
    }
    const ix = cx - sd * rw * 0.04;
    const iy = ey + rh * 0.12;
    const irx = rw * (wide ? 0.42 : 0.52);
    const iry = rh * (wide ? 0.95 : 1.12);
    const g = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
    const cols = glow ? [PAL.glow[0], '#ff7ad6', PAL.glow[1]] : PAL.iris;
    g.addColorStop(0, cols[0]);
    g.addColorStop(0.55, cols[1]);
    g.addColorStop(1, cols[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(ix, iy, irx, iry, 0, 0, PI * 2);
    ctx.fill();
    if (!glow || glowOnly) {
      ctx.fillStyle = glow ? '#ffffff' : '#1c0416';
      ctx.beginPath();
      ctx.ellipse(ix, iy, irx * (wide ? 0.32 : 0.42), iry * (wide ? 0.4 : 0.5), 0, 0, PI * 2);
      ctx.fill();
    }
    if (!glowOnly) {
      ctx.fillStyle = 'rgba(40,0,30,0.32)';
      ctx.fillRect(cx - rw * 1.2, ey - rh * 2, rw * 2.4, rh * (1.25 + (1 - open) * 1.6));
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(ix - irx * 0.35, iy - iry * 0.42, irx * 0.24, iry * 0.2, -0.3, 0, PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ix + irx * 0.32, iy + iry * 0.38, irx * 0.11, iry * 0.1, 0, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (glowOnly) return;
    if (state === 'half') {
      ctx.fillStyle = PAL.skin;
      ctx.save();
      almond(ctx, cx, ey, rw, rh, sd, 1);
      ctx.clip();
      ctx.fillRect(cx - rw * 1.2, ey - rh * 2, rw * 2.4, rh * 1.55);
      ctx.restore();
    }
    ctx.strokeStyle = PAL.lash;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3.4, 0.042 * m.ky);
    ctx.beginPath();
    const lid = state === 'half' ? ey - rh * 0.25 : ey - rh * 1.02 * open;
    ctx.moveTo(cx - sd * rw * 0.98, ey + rh * 0.1);
    ctx.bezierCurveTo(cx - sd * rw * 0.5, lid - rh * 0.15, cx + sd * rw * 0.45, lid - rh * 0.2, cx + sd * rw * 1.08, ey - rh * 0.34);
    ctx.lineTo(cx + sd * rw * 1.28, ey - rh * 0.62);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.6, 0.018 * m.ky);
    ctx.beginPath();
    ctx.moveTo(cx - sd * rw * 0.62, ey + rh * 0.92 * open);
    ctx.quadraticCurveTo(cx + sd * rw * 0.2, ey + rh * 1.1 * open, cx + sd * rw * 0.95, ey + rh * 0.2);
    ctx.stroke();
  }

  function eyes(state) {
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      fill(ctx, w, h, PAL.skin);
      [-1, 1].forEach(sd => {
        radial(ctx, m.x(sd * 0.56), m.y(-0.3), 0.2 * m.kx, [[0, 'rgba(240,150,170,0.35)'], [1, 'rgba(240,150,170,0)']]);
        drawEye(ctx, m, state, sd, false);
      });
    };
  }

  function eyeGlow(ctx, w, h) {
    const m = patchMap(EYE_PATCH, w, h);
    fill(ctx, w, h, '#000');
    [-1, 1].forEach(sd => {
      radial(ctx, m.x(sd * 0.43), m.y(-0.06), 0.3 * m.kx, [[0, 'rgba(255,80,200,0.9)'], [0.4, 'rgba(255,40,170,0.35)'], [1, 'rgba(255,40,170,0)']]);
      drawEye(ctx, m, 'glow', sd, true);
    });
  }

  function mouth(state) {
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      fill(ctx, w, h, PAL.skin);
      ctx.strokeStyle = 'rgba(170,100,100,0.55)';
      ctx.lineWidth = Math.max(1.5, 0.018 * m.ky);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x(0.03), m.y(-0.3));
      ctx.lineTo(m.x(-0.02), m.y(-0.4));
      ctx.stroke();
      const cx = m.x(0);
      const my = m.y(-0.64);
      const mw = 0.15 * m.kx;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const openMap = { talk: 0.06, o: 0.11, open: 0.1 };
      const oh = (openMap[state] || 0) * m.ky;
      if (!oh) {
        const lift = state === 'smirk' ? 0.07 : state === 'smile' ? 0.05 : 0.015;
        ctx.strokeStyle = PAL.lipDark;
        ctx.lineWidth = Math.max(2.2, 0.03 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - mw, my - lift * m.ky * (state === 'smirk' ? 0.3 : 1));
        ctx.quadraticCurveTo(cx, my + lift * m.ky * 0.9, cx + mw, my - lift * m.ky * (state === 'smirk' ? 1.6 : 1));
        ctx.stroke();
        ctx.strokeStyle = 'rgba(212,96,122,0.55)';
        ctx.lineWidth = Math.max(2, 0.025 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.45, my + 0.07 * m.ky);
        ctx.quadraticCurveTo(cx, my + 0.1 * m.ky, cx + mw * 0.45, my + 0.07 * m.ky);
        ctx.stroke();
        return;
      }
      const wd = state === 'o' ? 0.45 : 0.75;
      const shape = () => {
        ctx.beginPath();
        ctx.moveTo(cx - mw * wd, my - oh * 0.2);
        ctx.quadraticCurveTo(cx, my - oh * 0.55, cx + mw * wd, my - oh * 0.2);
        ctx.bezierCurveTo(cx + mw * wd * 0.9, my + oh * 1.25, cx - mw * wd * 0.9, my + oh * 1.25, cx - mw * wd, my - oh * 0.2);
        ctx.closePath();
      };
      shape();
      ctx.fillStyle = '#5a1024';
      ctx.fill();
      ctx.save();
      shape();
      ctx.clip();
      ctx.fillStyle = '#e8788e';
      ctx.beginPath();
      ctx.ellipse(cx, my + oh * 0.95, mw * wd * 0.6, oh * 0.5, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = PAL.lip;
      ctx.lineWidth = 2;
      shape();
      ctx.stroke();
    };
  }

  function blot(seed, o) {
    return (ctx, w, h) => {
      if (o.clear) ctx.clearRect(0, 0, w, h);
      else fill(ctx, w, h, o.bg);
      const g = rand(seed);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w / 2 + 1, h);
      ctx.clip();
      if (o.blur) ctx.filter = `blur(${o.blur}px)`;
      const n = o.count || 26;
      for (let i = 0; i < n; i++) {
        const x = w * (0.18 + g() * 0.33);
        const y = h * (0.12 + g() * 0.76);
        const r = h * (0.04 + g() * (o.size || 0.13)) * (1 - Math.abs(y / h - 0.5));
        const pts = 16;
        ctx.beginPath();
        for (let k = 0; k <= pts; k++) {
          const a = (k / pts) * PI * 2;
          const rr = r * (0.6 + g() * 0.7);
          const px = x + Math.cos(a) * rr * 1.3;
          const py = y + Math.sin(a) * rr;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = o.ink[Math.floor(g() * o.ink.length)];
        ctx.globalAlpha = o.alpha || 1;
        ctx.fill();
        if (g() < 0.5) {
          const a = (g() - 0.5) * PI * 1.4 + (g() < 0.5 ? PI : 0);
          const len = r * (2 + g() * 3);
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a + 1.4) * r * 0.3, y + Math.sin(a + 1.4) * r * 0.3);
          ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
          ctx.lineTo(x + Math.cos(a - 1.4) * r * 0.3, y + Math.sin(a - 1.4) * r * 0.3);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(ctx.canvas, 0, 0, w / 2, h, 0, 0, w / 2, h);
      ctx.restore();
      if (o.core) radial(ctx, w / 2, h / 2, h * 0.5, [[0, o.core], [1, 'rgba(0,0,0,0)']]);
    };
  }

  function words(word, big) {
    return (ctx, w, h) => {
      fill(ctx, w, h, '#c4135e');
      ctx.font = `bold ${Math.round(h * 0.07)}px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#82093c';
      const cols = 3, rows = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) ctx.fillText(word, w * (0.17 + c * 0.33), h * (0.06 + r * 0.125));
      }
      if (big) {
        radial(ctx, w / 2, h / 2, h * 0.3, [[0, 'rgba(196,19,94,1)'], [1, 'rgba(196,19,94,0)']]);
        centerText(ctx, big, w / 2, h / 2, `bold ${Math.round(h * 0.12)}px ${SERIF}`, '#1a0410');
      }
    };
  }

  function caption(text, color, glowColor, size) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `bold ${Math.round(h * (size || 0.34))}px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = h * 0.12;
      }
      ctx.lineWidth = h * 0.03;
      ctx.strokeStyle = 'rgba(20,0,12,0.9)';
      ctx.strokeText(text, w / 2, h / 2);
      ctx.fillStyle = color;
      ctx.fillText(text, w / 2, h / 2);
    };
  }

  function glowWord(text, color) {
    return (ctx, w, h) => {
      fill(ctx, w, h, '#000');
      ctx.font = `bold ${Math.round(h * 0.36)}px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = color;
      ctx.shadowBlur = h * 0.18;
      ctx.fillStyle = color;
      ctx.fillText(text, w / 2, h / 2);
      ctx.shadowBlur = h * 0.05;
      ctx.fillStyle = '#ffe6f6';
      ctx.fillText(text, w / 2, h / 2);
    };
  }

  function spiral(ctx, w, h) {
    fill(ctx, w, h, '#c4135e');
    ctx.strokeStyle = '#16040e';
    ctx.lineWidth = h * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < PI * 12; a += 0.04) {
      const r = (a / (PI * 2)) * h * 0.072;
      const x = w / 2 + Math.cos(a) * r;
      const y = h / 2 + Math.sin(a) * r * 0.96;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.44, 0, PI * 2);
    ctx.stroke();
  }

  function gem(ctx, cx, cy, s, light, dark) {
    const pts = [[0, -1.25], [0.55, -0.45], [0.42, 0.55], [0, 1.05], [-0.42, 0.55], [-0.55, -0.45]];
    const P = ([x, y]) => [cx + x * s, cy + y * s];
    for (let i = 0; i < pts.length; i++) {
      const a = P(pts[i]), b = P(pts[(i + 1) % pts.length]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? light : dark;
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    pts.forEach((p, i) => { const q = P(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    ctx.stroke();
  }

  function crystal(ctx, w, h) {
    fill(ctx, w, h, '#14040e');
    const g = rand(77);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * PI * 2;
      const len = h * (0.7 + g() * 0.4);
      ctx.fillStyle = i % 2 ? '#b0105a' : '#2a0616';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.44);
      ctx.lineTo(w / 2 + Math.cos(a - 0.04) * len * 1.8, h * 0.44 + Math.sin(a - 0.04) * len);
      ctx.lineTo(w / 2 + Math.cos(a + 0.04) * len * 1.8, h * 0.44 + Math.sin(a + 0.04) * len);
      ctx.fill();
    }
    radial(ctx, w / 2, h * 0.44, h * 0.42, [[0, 'rgba(255,190,230,0.55)'], [1, 'rgba(255,60,160,0)']]);
    gem(ctx, w / 2, h * 0.38, h * 0.22, '#e8d2e4', '#8c6a88');
    ctx.strokeStyle = '#f4e6f0';
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.7, h * 0.07, h * 0.04, 0, 0.1, PI - 0.1);
    ctx.stroke();
  }

  function spiderMark(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.15, s * 0.16, s * 0.2, 0, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.25, s * 0.22, s * 0.3, 0, 0, PI * 2);
    ctx.fill();
    [-1, 1].forEach(sd => {
      [[-0.55, -0.9], [-0.1, -0.75], [0.25, 0.75], [0.6, 0.95]].forEach(([y0, y1], i) => {
        ctx.beginPath();
        ctx.moveTo(cx + sd * s * 0.12, cy + y0 * s * 0.3);
        ctx.quadraticCurveTo(cx + sd * s * (0.55 + i * 0.05), cy + (y0 - 0.3) * s * 0.5, cx + sd * s * (0.7 + i * 0.08), cy + y1 * s);
        ctx.stroke();
      });
    });
  }

  function emblemDark(ctx, w, h) {
    fill(ctx, w, h, '#0c0410');
    const g = rand(5);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(150,20,80,${0.2 + g() * 0.3})`;
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + g() * 8, 1 + g() * 4, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    spiderMark(ctx, w / 2, h / 2, h * 0.14, '#f0e8f0');
  }

  function spiderGlow(ctx, w, h) {
    fill(ctx, w, h, '#000');
    radial(ctx, w / 2, h / 2, w * 0.5, [[0, 'rgba(255,110,230,0.9)'], [0.35, 'rgba(190,40,200,0.45)'], [1, 'rgba(0,0,0,0)']]);
    ctx.shadowColor = '#ff7ae8';
    ctx.shadowBlur = w * 0.05;
    spiderMark(ctx, w / 2, h / 2, w * 0.24, '#ffe8fb');
    ctx.shadowBlur = 0;
  }

  function eyeShape(ctx, w, h) {
    fill(ctx, w, h, '#0a0410');
    ctx.strokeStyle = '#f4dcef';
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h / 2);
    ctx.quadraticCurveTo(w / 2, h * 0.28, w * 0.8, h / 2);
    ctx.quadraticCurveTo(w / 2, h * 0.72, w * 0.2, h / 2);
    ctx.stroke();
    radial(ctx, w / 2, h / 2, h * 0.16, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,120,200,0)']]);
    gem(ctx, w / 2, h / 2, h * 0.08, '#ffffff', '#a07aa0');
    ctx.fillStyle = '#d02070';
    [[0.14, 1], [0.86, -1]].forEach(([x, s]) => {
      ctx.beginPath();
      ctx.moveTo(w * x, h / 2);
      ctx.lineTo(w * (x + s * 0.06), h * 0.49);
      ctx.lineTo(w * (x + s * 0.06), h * 0.51);
      ctx.fill();
    });
  }

  function studioLogo(ctx, w, h) {
    fill(ctx, w, h, '#000');
    const cx = w / 2, cy = h * 0.42;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.font = `900 ${Math.round(h * 0.34)}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e8fff';
    ctx.fillText('БЛН', h * 0.03, h * 0.03);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('БЛН', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#1e8fff';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.95);
    ctx.fillRect(-h * 0.02, -h * 0.26, h * 0.04, h * 0.52);
    ctx.restore();
    const sx = cx + h * 0.42, sy = cy - h * 0.15, s = h * 0.06;
    ctx.beginPath();
    ctx.moveTo(sx, sy - s);
    ctx.quadraticCurveTo(sx, sy, sx + s, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy + s);
    ctx.quadraticCurveTo(sx, sy, sx - s, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy - s);
    ctx.fill();
    centerText(ctx, 'ブリンチク', cx + h * 0.05, cy + h * 0.22, `${Math.round(h * 0.06)}px ${SANS}`, '#7ec4ff');
    centerText(ctx, 'студия дубляжа «Блинчик»', cx, cy + h * 0.36, `bold ${Math.round(h * 0.07)}px ${SANS}`, '#ffffff');
  }

  function credits(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    centerText(ctx, 'Дубляж выполнен студией «Блинчик»', w / 2, h * 0.3, `${Math.round(h * 0.26)}px ${SANS}`, '#e8e8ee');
    centerText(ctx, 'Роли озвучивали артисты студии', w / 2, h * 0.72, `${Math.round(h * 0.26)}px ${SANS}`, '#e8e8ee');
  }

  function hsrLogo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cy = h * 0.46;
    const big = `bold italic ${Math.round(h * 0.22)}px ${SERIF}`;
    const nine = `bold italic ${Math.round(h * 0.2)}px ${SERIF}`;
    ctx.font = big;
    const tw = ctx.measureText('STAR RAIL').width;
    ctx.font = nine;
    const nw = ctx.measureText('98').width;
    const x0 = (w - tw - nw - h * 0.06) / 2;
    const mx = x0 + tw * 0.32, my = cy - h * 0.02;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, h * 0.3, 0, PI * 2);
    ctx.arc(mx + h * 0.1, my - h * 0.05, h * 0.27, 0, PI * 2, true);
    ctx.closePath();
    const moon = ctx.createLinearGradient(mx - h * 0.3, 0, mx + h * 0.2, 0);
    moon.addColorStop(0, '#f6f2ff');
    moon.addColorStop(1, '#8e9ad0');
    ctx.fillStyle = moon;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x0, cy + h * 0.08);
    ctx.transform(1, 0, -0.16, 1, 0, 0);
    ctx.font = big;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = h * 0.02;
    ctx.strokeStyle = '#1a1838';
    ctx.strokeText('STAR RAIL', 0, 0);
    const g = ctx.createLinearGradient(0, -h * 0.18, 0, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#b9c6f2');
    ctx.fillStyle = g;
    ctx.fillText('STAR RAIL', 0, 0);
    ctx.font = nine;
    ctx.shadowColor = '#ff3aa8';
    ctx.shadowBlur = h * 0.06;
    ctx.fillStyle = '#ff6ac2';
    ctx.fillText('98', tw + h * 0.06, 0);
    ctx.restore();
    ctx.font = `bold ${Math.round(h * 0.08)}px ${SERIF}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('HONKAI', x0 + h * 0.04, cy - h * 0.14);
    centerText(ctx, 'Событие «Охотники за Стелларонами»', w / 2, h * 0.78, `${Math.round(h * 0.075)}px ${SANS}`, '#d8c2e8');
  }

  function posterBack(ctx, w, h) {
    fill(ctx, w, h, '#04070a');
    radial(ctx, w / 2, h * 0.5, h * 0.75, [[0, '#123c3a'], [0.45, '#0a1c20'], [1, 'rgba(10,6,12,0)']]);
    radial(ctx, w * 0.08, h * 0.9, h * 0.6, [[0, 'rgba(150,10,90,0.45)'], [1, 'rgba(150,10,90,0)']]);
    radial(ctx, w * 0.92, h * 0.1, h * 0.6, [[0, 'rgba(150,10,90,0.4)'], [1, 'rgba(150,10,90,0)']]);
    ctx.strokeStyle = 'rgba(120,200,190,0.35)';
    ctx.lineWidth = h * 0.006;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.5, h * 0.34, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.5, h * 0.4, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,170,120,0.45)';
    ctx.lineWidth = h * 0.004;
    ctx.strokeRect(w * 0.03, h * 0.04, w * 0.94, h * 0.92);
    ctx.strokeRect(w * 0.04, h * 0.06, w * 0.92, h * 0.88);
    const g = rand(31);
    for (let i = 0; i < 9; i++) {
      const y0 = g() * h, y1 = g() * h;
      ctx.strokeStyle = 'rgba(255,60,180,0.55)';
      ctx.lineWidth = 1 + g() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(w, y1);
      ctx.stroke();
    }
    ctx.save();
    ctx.font = `bold ${Math.round(h * 0.17)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(h * 0.02)}px`;
    const tg = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.3);
    tg.addColorStop(0, '#e2f2ee');
    tg.addColorStop(1, '#7f9e9c');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('РОЗЫСК', w / 2 + h * 0.008, h * 0.2 + h * 0.008);
    ctx.fillStyle = tg;
    ctx.fillText('РОЗЫСК', w / 2, h * 0.2);
    ctx.restore();
    centerText(ctx, 'НАГРАДА', w * 0.33, h * 0.84, `bold ${Math.round(h * 0.03)}px ${SERIF}`, '#b8cfcc');
    centerText(ctx, '10,899,000,000', w / 2, h * 0.91, `bold ${Math.round(h * 0.085)}px ${SERIF}`, '#cfe0dd');
    for (let i = 0; i < 7; i++) {
      const x = w * (0.42 + i * 0.027);
      ctx.fillStyle = '#9fb9b6';
      ctx.beginPath();
      ctx.moveTo(x, h * 0.05);
      ctx.lineTo(x + h * 0.008, h * 0.065);
      ctx.lineTo(x, h * 0.08);
      ctx.lineTo(x - h * 0.008, h * 0.065);
      ctx.fill();
    }
  }

  function posterName(ctx, w, h) {
    fill(ctx, w, h, '#000');
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.05);
    ctx.font = `bold ${Math.round(h * 0.62)}px ${HAND}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff1e9a';
    ctx.shadowBlur = h * 0.16;
    ctx.fillStyle = '#ff2aa4';
    ctx.fillText('Кафка', 0, 0);
    ctx.shadowBlur = h * 0.05;
    ctx.fillStyle = '#ffb6e2';
    ctx.fillText('Кафка', 0, 0);
    ctx.restore();
  }

  function clockDial(ctx, w, h) {
    fill(ctx, w, h, '#2a1e1e');
    const cx = w / 2, cy = h / 2, R = w / 2;
    radial(ctx, cx, cy, R, [[0, '#fff4ee'], [0.7, '#f2dcd4'], [0.98, '#dcb8b0'], [1, '#6a4a40']]);
    ctx.strokeStyle = '#5a3a34';
    ctx.lineWidth = R * 0.012;
    [0.97, 0.9, 0.72].forEach(k => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * k, 0, PI * 2);
      ctx.stroke();
    });
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * PI * 2;
      const r0 = R * (i % 4 ? 0.92 : 0.905);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a2424';
    ctx.font = `bold ${Math.round(R * 0.1)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let n = 1; n <= 24; n++) {
      const a = (n / 24) * PI * 2 - PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * R * 0.81, cy + Math.sin(a) * R * 0.81);
      ctx.rotate(a + PI / 2);
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }
    ctx.fillStyle = '#4a2e2c';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.7, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      const lg = ctx.createLinearGradient(0, -R * 0.68, 0, -R * 0.18);
      lg.addColorStop(0, '#f6e2da');
      lg.addColorStop(1, '#b8908a');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(-R * 0.1, -R * 0.2);
      ctx.lineTo(-R * 0.12, -R * 0.52);
      ctx.quadraticCurveTo(0, -R * 0.74, R * 0.12, -R * 0.52);
      ctx.lineTo(R * 0.1, -R * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a2220';
      ctx.lineWidth = R * 0.014;
      ctx.stroke();
      ctx.restore();
    }
    radial(ctx, cx, cy, R * 0.2, [[0, '#f8e6e0'], [1, '#8a6460']]);
  }

  function liftDial(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.96, R = h * 0.92;
    ctx.beginPath();
    ctx.arc(cx, cy, R, PI, PI * 2);
    ctx.closePath();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, '#f6e8e2');
    g.addColorStop(0.8, '#d8bcb0');
    g.addColorStop(1, '#8a6a5c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#5a3c32';
    ctx.lineWidth = R * 0.025;
    ctx.stroke();
    for (let i = 0; i <= 18; i++) {
      const a = PI + (i / 18) * PI;
      ctx.lineWidth = R * (i % 2 ? 0.012 : 0.02);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25);
      ctx.lineTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a2420';
    ctx.font = `bold ${Math.round(R * 0.12)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let n = 1; n <= 9; n++) {
      const a = PI + ((n - 0.5) / 9) * PI;
      ctx.fillText(String(n), cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88);
    }
    ctx.fillStyle = '#7a5448';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.22, PI, PI * 2);
    ctx.fill();
  }

  function coinFace(ctx, w, h) {
    const cx = w / 2, cy = h / 2, R = w / 2;
    radial(ctx, cx, cy, R, [[0, '#f4f0f6'], [0.82, '#c8c0cc'], [0.88, '#8a8090'], [0.94, '#e8e2ec'], [1, '#6a6070']]);
    ctx.font = `bold ${Math.round(R * 1.15)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a5262';
    ctx.fillText('1', cx + R * 0.04, cy - R * 0.02);
    ctx.fillStyle = '#d8d2de';
    ctx.fillText('1', cx, cy - R * 0.06);
    ctx.fillStyle = '#6a6272';
    [-0.2, 0, 0.2].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * R, cy + R * 0.52);
      ctx.lineTo(cx + dx * R + R * 0.06, cy + R * 0.6);
      ctx.lineTo(cx + dx * R, cy + R * 0.68);
      ctx.lineTo(cx + dx * R - R * 0.06, cy + R * 0.6);
      ctx.fill();
    });
  }

  function coinBack(ctx, w, h) {
    const cx = w / 2, cy = h / 2, R = w / 2;
    radial(ctx, cx, cy, R, [[0, '#ece6f0'], [0.82, '#c0b8c6'], [0.88, '#827888'], [0.94, '#e2dce6'], [1, '#645a6a']]);
    ctx.strokeStyle = '#5c5464';
    ctx.lineWidth = R * 0.05;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.66, 0, PI * 2);
    ctx.stroke();
    [-0.36, -0.16, 0.16, 0.36].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * R, cy - R * 0.5);
      ctx.lineTo(cx + dx * R, cy + R * 0.5);
      ctx.stroke();
    });
    ctx.fillStyle = '#ece6f0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.22);
    ctx.lineTo(cx + R * 0.16, cy);
    ctx.lineTo(cx, cy + R * 0.22);
    ctx.lineTo(cx - R * 0.16, cy);
    ctx.fill();
    ctx.stroke();
  }

  function card(text, o) {
    return (ctx, w, h) => {
      const opt = o || {};
      fill(ctx, w, h, opt.bg || '#000');
      const x = w * 0.18, y = h * 0.22, cw = w * 0.64, ch = h * 0.56;
      ctx.save();
      ctx.shadowColor = opt.glow || 'rgba(255,160,200,0.9)';
      ctx.shadowBlur = h * 0.08;
      ctx.fillStyle = opt.paper || '#fffafc';
      ctx.fillRect(x, y, cw, ch);
      ctx.restore();
      ctx.strokeStyle = opt.edge || 'rgba(255,140,190,0.8)';
      ctx.lineWidth = h * 0.012;
      ctx.strokeRect(x + h * 0.02, y + h * 0.02, cw - h * 0.04, ch - h * 0.04);
      centerText(ctx, text, w / 2, h / 2, `${opt.italic ? 'italic ' : ''}${Math.round(h * (opt.size || 0.1))}px ${SERIF}`, opt.ink || '#d02a78');
    };
  }

  function kaleido(ctx, w, h) {
    fill(ctx, w, h, '#101010');
    const cx = w / 2, cy = h / 2;
    for (let i = 14; i > 0; i--) {
      ctx.fillStyle = i % 2 ? '#e6e6e6' : '#1a1a1a';
      ctx.beginPath();
      ctx.arc(cx, cy, (i / 14) * w * 0.72, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2f2f2';
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 6; gx++) {
        const x = (gx + 0.5) * (w / 6), y = (gy + 0.5) * (h / 6);
        const s = w * 0.03;
        ctx.fillStyle = (gx + gy) % 2 ? '#f0f0f0' : '#0c0c0c';
        ctx.fillRect(x - s * 0.25, y - s, s * 0.5, s * 2);
        ctx.fillRect(x - s, y - s * 0.25, s * 2, s * 0.5);
      }
    }
  }

  function bokeh(ctx, w, h) {
    fill(ctx, w, h, '#0e0a18');
    const hues = ['rgba(90,140,255,', 'rgba(255,170,90,', 'rgba(220,120,255,', 'rgba(120,230,255,'];
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 9; gx++) {
        const x = (gx + (gy % 2) * 0.5) * (w / 8.5), y = (gy + 0.5) * (h / 6);
        radial(ctx, x, y, w * 0.05, [[0, hues[(gx + gy) % 4] + '0.9)'], [0.6, hues[(gx + gy + 1) % 4] + '0.5)'], [1, 'rgba(0,0,0,0)']]);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(a) * w, h / 2 + Math.sin(a) * w);
      ctx.stroke();
    }
  }

  function flare(ctx, w, h) {
    fill(ctx, w, h, '#000');
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,1)');
    v.addColorStop(0.5, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    radial(ctx, w / 2, h / 2, h * 0.5, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
  }

  function beam(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.3, '#3a3a3a');
    g.addColorStop(0.44, '#b8b8b8');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(0.56, '#b8b8b8');
    g.addColorStop(0.7, '#3a3a3a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function star(ctx, w, h) {
    fill(ctx, w, h, '#000');
    radial(ctx, w / 2, h / 2, w * 0.3, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(200,200,200,0.5)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillStyle = '#ffffff';
    [[1, 0.07], [0.62, 0.05]].forEach(([len, wd], i) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(i * PI / 4);
      for (let k = 0; k < 4; k++) {
        ctx.rotate(PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -w * wd);
        ctx.lineTo(w * 0.5 * len, 0);
        ctx.lineTo(0, w * wd);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function halo(ctx, w, h) {
    fill(ctx, w, h, '#000');
    radial(ctx, w / 2, h / 2, w / 2, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(180,180,180,0.7)'], [0.6, 'rgba(60,60,60,0.35)'], [1, 'rgba(0,0,0,1)']]);
  }

  function smoke(ctx, w, h) {
    fill(ctx, w, h, '#000');
    const g = rand(13);
    for (let i = 0; i < 26; i++) {
      const a = g() * PI * 2, d = g() * w * 0.22;
      radial(ctx, w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, w * (0.12 + g() * 0.14), [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(0,0,0,0)']]);
    }
  }

  function cone(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.2, '#222222');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const s = ctx.createLinearGradient(0, 0, w, 0);
    s.addColorStop(0, 'rgba(0,0,0,1)');
    s.addColorStop(0.3, 'rgba(0,0,0,0)');
    s.addColorStop(0.7, 'rgba(0,0,0,0)');
    s.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, w, h);
  }

  function cracks(ctx, w, h) {
    fill(ctx, w, h, '#050407');
    const g = rand(91);
    ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      let x = g() * w, y = g() * h;
      let a = g() * PI * 2;
      ctx.strokeStyle = `rgba(230,230,240,${0.4 + g() * 0.5})`;
      ctx.lineWidth = 1 + g() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 12; k++) {
        a += (g() - 0.5) * 1.2;
        x += Math.cos(a) * w * 0.04;
        y += Math.sin(a) * w * 0.04;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function webCoat(ctx, w, h) {
    fill(ctx, w, h, '#1b1419');
    ctx.strokeStyle = 'rgba(222,212,226,0.55)';
    ctx.lineWidth = w * 0.012;
    const hubs = [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]];
    hubs.forEach(([x, y]) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2 + 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * w * 0.36, y + Math.sin(a) * w * 0.36);
        ctx.stroke();
      }
      [0.12, 0.22, 0.32].forEach(rr => {
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * PI * 2 + 0.2;
          const px = x + Math.cos(a) * w * rr, py = y + Math.sin(a) * w * rr;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      });
    });
  }

  function shirt(ctx, w, h) {
    fill(ctx, w, h, '#ffffff');
    ctx.strokeStyle = 'rgba(150,140,175,0.55)';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, w * 0.012);
    const g = rand(57);
    for (let i = 0; i < 16; i++) {
      const x = w * (0.08 + g() * 0.84), y0 = h * (0.28 + g() * 0.25), len = h * (0.15 + g() * 0.3);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + (g() - 0.5) * w * 0.08, y0 + len * 0.5, x + (g() - 0.5) * w * 0.05, y0 + len);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,110,150,0.8)';
    ctx.lineWidth = Math.max(1, w * 0.014);
    [w * 0.035, w * 0.965].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.26);
      ctx.lineTo(x, h - 8);
      ctx.stroke();
    });
    ctx.fillStyle = '#8a82a0';
    for (let y = h * 0.32; y < h - 10; y += h * 0.15) {
      ctx.beginPath();
      ctx.arc(w * 0.012, y, w * 0.012, 0, PI * 2);
      ctx.fill();
    }
  }

  function tights(ctx, w, h) {
    fill(ctx, w, h, '#4a1430');
    ctx.strokeStyle = 'rgba(150,60,100,0.5)';
    ctx.lineWidth = 1;
    for (let i = -4; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w / 4, 0);
      ctx.lineTo(i * w / 4 + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * w / 4, h);
      ctx.lineTo(i * w / 4 + h, 0);
      ctx.stroke();
    }
  }

  function wrap(ctx, w, h) {
    fill(ctx, w, h, '#16141a');
    ctx.fillStyle = '#ecebf0';
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.5) * (w / 4);
      ctx.beginPath();
      ctx.moveTo(x, h * 0.12);
      ctx.lineTo(x + w * 0.09, h / 2);
      ctx.lineTo(x, h * 0.88);
      ctx.lineTo(x - w * 0.09, h / 2);
      ctx.fill();
    }
  }

  function marble(ctx, w, h) {
    const g = rand(3);
    [[0, 0], [1, 1]].forEach(([a, b]) => {
      ctx.fillStyle = '#d9d0c6';
      ctx.fillRect(a * w / 2, b * h / 2, w / 2, h / 2);
    });
    [[1, 0], [0, 1]].forEach(([a, b]) => {
      ctx.fillStyle = '#c4b8ac';
      ctx.fillRect(a * w / 2, b * h / 2, w / 2, h / 2);
    });
    ctx.strokeStyle = 'rgba(120,100,90,0.25)';
    for (let i = 0; i < 18; i++) {
      ctx.lineWidth = 0.5 + g() * 1.5;
      ctx.beginPath();
      let x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (g() - 0.5) * w * 0.2;
        y += (g() - 0.3) * h * 0.15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = '#4a4038';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  function panel(ctx, w, h) {
    fill(ctx, w, h, '#d6d0dc');
    ctx.strokeStyle = '#8a8296';
    ctx.lineWidth = w * 0.02;
    ctx.strokeRect(w * 0.1, h * 0.08, w * 0.8, h * 0.84);
    ctx.strokeStyle = '#f2eef6';
    ctx.lineWidth = w * 0.01;
    ctx.strokeRect(w * 0.14, h * 0.12, w * 0.72, h * 0.76);
  }

  function painting(seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      fill(ctx, w, h, '#2a2018');
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#5a5a44');
      sky.addColorStop(1, '#2a2418');
      ctx.fillStyle = sky;
      ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = `rgba(${60 + g() * 60},${50 + g() * 40},${30 + g() * 30},0.8)`;
        ctx.beginPath();
        ctx.ellipse(w * (0.15 + g() * 0.7), h * (0.4 + g() * 0.45), w * (0.08 + g() * 0.2), h * (0.05 + g() * 0.15), 0, 0, PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#a8864a';
      ctx.lineWidth = w * 0.06;
      ctx.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
    };
  }

  function smileScreen(ctx, w, h) {
    fill(ctx, w, h, '#f4f2f4');
    ctx.fillStyle = '#1a1418';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.24, 0);
    ctx.quadraticCurveTo(w * 0.2, h * 0.6, w * 0.08, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.76, 0);
    ctx.quadraticCurveTo(w * 0.8, h * 0.6, w * 0.92, h);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = '#2a2026';
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.strokeStyle = '#e0306e';
    ctx.lineWidth = h * 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.42);
    ctx.quadraticCurveTo(w * 0.5, h * 0.52, w * 0.6, h * 0.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(224,48,110,0.5)';
    ctx.lineWidth = h * 0.02;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.52);
    ctx.quadraticCurveTo(w * 0.5, h * 0.56, w * 0.55, h * 0.52);
    ctx.stroke();
    ctx.fillStyle = '#d8d4d8';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h);
    ctx.lineTo(w * 0.42, h * 0.7);
    ctx.lineTo(w * 0.58, h * 0.7);
    ctx.lineTo(w * 0.7, h);
    ctx.fill();
  }

  function petal(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.95);
    ctx.bezierCurveTo(w * 0.05, h * 0.7, w * 0.1, h * 0.1, w * 0.45, h * 0.05);
    ctx.quadraticCurveTo(w * 0.5, h * 0.18, w * 0.58, h * 0.05);
    ctx.bezierCurveTo(w * 0.95, h * 0.15, w * 0.92, h * 0.7, w * 0.5, h * 0.95);
    ctx.fill();
  }

  function backMark(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e8dccf';
    ctx.lineWidth = w * 0.03;
    ctx.lineJoin = 'round';
    const cx = w / 2;
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.04);
    ctx.lineTo(cx, h * 0.96);
    ctx.stroke();
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.12);
      ctx.bezierCurveTo(cx + s * w * 0.45, h * 0.12, cx + s * w * 0.45, h * 0.5, cx + s * w * 0.12, h * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.3);
      ctx.bezierCurveTo(cx + s * w * 0.34, h * 0.3, cx + s * w * 0.36, h * 0.7, cx, h * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.08, h * 0.62);
      ctx.lineTo(cx + s * w * 0.42, h * 0.94);
      ctx.stroke();
    });
    ctx.fillStyle = '#e8dccf';
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.42);
    ctx.lineTo(cx + w * 0.06, h * 0.5);
    ctx.lineTo(cx, h * 0.58);
    ctx.lineTo(cx - w * 0.06, h * 0.5);
    ctx.fill();
  }

  function edges(seed) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = rand(seed);
      ctx.fillStyle = '#060208';
      for (let i = 0; i < 26; i++) {
        const side = i % 4;
        const k = g();
        const bx = side === 0 ? k * w : side === 1 ? w : side === 2 ? k * w : 0;
        const by = side === 0 ? 0 : side === 1 ? k * h : side === 2 ? h : k * h;
        const tx = lerpN(bx, w / 2, 0.25 + g() * 0.35) + (g() - 0.5) * w * 0.1;
        const ty = lerpN(by, h / 2, 0.25 + g() * 0.35) + (g() - 0.5) * h * 0.1;
        const wd = (0.04 + g() * 0.08) * w;
        ctx.beginPath();
        ctx.moveTo(bx - wd, by);
        ctx.quadraticCurveTo((bx + tx) / 2 + (g() - 0.5) * wd, (by + ty) / 2, tx, ty);
        ctx.quadraticCurveTo((bx + tx) / 2 + (g() - 0.5) * wd, (by + ty) / 2, bx + wd, by + (side % 2 ? wd : 0));
        ctx.closePath();
        ctx.fill();
        for (let f = 0; f < 3; f++) {
          ctx.beginPath();
          ctx.ellipse(tx + (g() - 0.5) * wd, ty + (g() - 0.5) * wd, wd * 0.18, wd * 0.08, g() * PI, 0, PI * 2);
          ctx.fill();
        }
      }
    };
  }

  function lerpN(a, b, k) {
    return a + (b - a) * k;
  }

  function windowGlass(ctx, w, h) {
    fill(ctx, w, h, '#ffffff');
    ctx.fillStyle = '#4a4048';
    const bars = 3;
    for (let i = 1; i < bars; i++) ctx.fillRect((i / bars) * w - w * 0.015, 0, w * 0.03, h);
    for (let i = 1; i < 6; i++) ctx.fillRect(0, (i / 6) * h - h * 0.006, w, h * 0.012);
    ctx.lineWidth = w * 0.03;
    ctx.strokeStyle = '#4a4048';
    ctx.strokeRect(0, 0, w, h);
  }

  function rose(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w * 0.48;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a3036';
    ctx.lineWidth = R * 0.05;
    [1, 0.72, 0.36].forEach(k => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * k * 0.98, 0, PI * 2);
      ctx.stroke();
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.36, cy + Math.sin(a) * R * 0.36);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
  }

  window.KafkaArt = {
    EYE_PATCH, MOUTH_PATCH, PAL, patchMap,
    eyes, eyeGlow, mouth, blot, words, caption, glowWord, spiral, crystal, emblemDark, spiderGlow, eyeShape,
    studioLogo, credits, hsrLogo, posterBack, posterName, clockDial, liftDial, coinFace, coinBack, card,
    kaleido, bokeh, flare, beam, star, halo, smoke, cone, cracks, webCoat, shirt, tights, wrap, marble, panel,
    painting, smileScreen, petal, backMark, windowGlass, rose, edges
  };
})();
