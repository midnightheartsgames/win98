(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Mts = window.MtsArt;
  const Msc = window.MscArt;
  const PI = Math.PI;

  const CREAM = '#f4eee4';
  const POSTER = '#6187a4';
  const BAND = '#2f2e2d';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';
  const STENCIL = '"Arial Black", Impact, sans-serif';

  function rects(ctx, list) {
    list.forEach(([x0, y0, x1, y1]) => ctx.rect(x0, y0, x1 - x0, y1 - y0));
  }

  const GLYPHS = {
    S: Mts.GLYPHS.S,
    P: {
      w: 116,
      draw(ctx) {
        ctx.beginPath();
        rects(ctx, [[14, 0, 42, 100], [0, 0, 60, 14], [0, 86, 58, 100]]);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(42, 0);
        ctx.lineTo(70, 0);
        ctx.ellipse(70, 31, 44, 31, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 62);
        ctx.lineTo(42, 48);
        ctx.lineTo(66, 48);
        ctx.ellipse(66, 31, 18, 17, 0, PI / 2, -PI / 2, true);
        ctx.lineTo(42, 14);
        ctx.closePath();
        ctx.fill();
      }
    },
    Y: {
      w: 124,
      draw(ctx) {
        [[[16, 14], [46, 14], [78, 58], [48, 58]], [[78, 14], [108, 14], [76, 58], [46, 58]], [[48, 50], [76, 50], [76, 88], [48, 88]], [[28, 86], [96, 86], [96, 100], [28, 100]],
          [[0, 0], [58, 0], [58, 14], [0, 14]], [[66, 0], [124, 0], [124, 14], [66, 14]]].forEach(poly => {
          ctx.beginPath();
          poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.fill();
        });
      }
    }
  };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    for (const ch of word) {
      const g = GLYPHS[ch];
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(kx, k);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      g.draw(ctx);
      ctx.restore();
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function tf2Words(ctx, x, y, h, fill) {
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fill;
    const wa = ctx.measureText('TEAM').width;
    ctx.fillText('TEAM', x, y);
    ctx.fillText('FORTRESS 2', x + wa + h * 0.22, y);
  }

  function smallLogo(ctx, x, y, h, top, mid, low) {
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.025, y + i * h * 0.035, h, i > 4 ? low : mid);
    tf2Words(ctx, x, y, h, top);
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      ctx.fillRect(g() * W, g() * H, size || 2, size || 2);
    }
  }

  function balisong(ctx, x, y, len, ang, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = col;
    const h = len * 0.09;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(len * 0.5, -h * 0.5);
    ctx.lineTo(len * 0.52, h * 0.5);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(len * 0.04, -h * 0.08, len * 0.42, h * 0.16);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.62, 0, PI * 2);
    ctx.arc(len * 0.5, 0, h * 0.62, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(len * 0.52, -h * 0.4);
    ctx.lineTo(len * 0.95, -h * 0.25);
    ctx.lineTo(len, 0);
    ctx.lineTo(len * 0.52, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function cigCase(ctx, x, y, w, h, open) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#8c8a86';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8c6c0';
    ctx.fillRect(w * 0.04, h * 0.05, w * 0.92, h * 0.9);
    if (open) {
      for (let i = 0; i < 7; i++) {
        const yy = h * (0.12 + i * 0.11);
        ctx.fillStyle = '#f4f2ec';
        ctx.fillRect(w * 0.08, yy, w * 0.84, h * 0.07);
        ctx.fillStyle = '#d29a52';
        ctx.fillRect(w * 0.08, yy, w * 0.2, h * 0.07);
      }
      ctx.fillStyle = 'rgba(80,80,80,0.6)';
      ctx.fillRect(w * 0.45, h * 0.05, w * 0.12, h * 0.9);
    }
    ctx.restore();
  }

  function kitScreen(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6e6c68';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#121414';
    ctx.fillRect(w * 0.06, h * 0.08, w * 0.6, h * 0.84);
    [['#e8b830', 0.2], ['#e8b830', 0.48], ['#c83a3a', 0.74]].forEach(([c, fy]) => {
      ctx.fillStyle = c;
      ctx.fillRect(w * 0.72, h * fy, w * 0.22, h * 0.2);
    });
    ctx.restore();
  }

  function folder(ctx, x, y, w, h, ang, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = '#b39a74';
    ctx.fillRect(-w * 0.02, -h * 0.06, w * 0.35, h * 0.1);
    ctx.fillStyle = '#c8b08a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d6c09a';
    ctx.fillRect(w * 0.03, h * 0.04, w * 0.94, h * 0.92);
    ctx.fillStyle = '#efece4';
    ctx.fillRect(w * 0.9, h * 0.06, w * 0.06, h * 0.86);
    ctx.save();
    ctx.translate(w * 0.36, h * 0.24);
    ctx.rotate(-0.05);
    ctx.strokeStyle = '#9a4040';
    ctx.lineWidth = h * 0.02;
    ctx.strokeRect(-w * 0.2, -h * 0.07, w * 0.4, h * 0.13);
    ctx.fillStyle = '#9a4040';
    ctx.font = `${Math.round(h * 0.09)}px ${STENCIL}`;
    ctx.textAlign = 'center';
    ctx.fillText('TOP SECRET', 0, h * 0.035);
    ctx.restore();
    ctx.fillStyle = '#6a5a44';
    ctx.font = `${Math.round(h * 0.05)}px Arial, sans-serif`;
    ctx.fillText(label || 'CLASSIFIED', w * 0.12, h * 0.88);
    ctx.restore();
  }

  function sepia(ctx, W, H, seed) {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.1, W * 0.5, H * 0.5, W * 0.7);
    g.addColorStop(0, 'rgba(255,230,190,0)');
    g.addColorStop(1, 'rgba(60,30,10,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, seed, W * H * 0.02, '255,240,210', '60,30,10', 2);
  }

  function blinds(ctx, W, H, n, a) {
    for (let i = 0; i < n; i++) {
      const y = H * (0.06 + i / n);
      const g = ctx.createLinearGradient(0, y, 0, y + H / n);
      g.addColorStop(0, `rgba(255,236,190,${a})`);
      g.addColorStop(0.55, `rgba(255,214,150,${a * 0.6})`);
      g.addColorStop(0.62, 'rgba(30,12,4,0.55)');
      g.addColorStop(1, 'rgba(30,12,4,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, H / n);
    }
  }

  function blob(ctx, x, y, rx, ry, rot, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, PI * 2);
    ctx.fill();
  }

  function shape(ctx, pts, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }

  function maskHead(ctx, x, y, r, rot, lit) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    blob(ctx, 0, 0, r * 0.8, r, 0, '#3a1c12');
    blob(ctx, -r * 0.25, -r * 0.3, r * 0.4, r * 0.5, 0.3, `rgba(255,210,150,${lit})`);
    shape(ctx, [[r * 0.15, -r * 0.2], [r * 0.85, -r * 0.25], [r * 0.85, -r * 0.02], [r * 0.2, 0.0]], '#c88a5a');
    shape(ctx, [[r * 0.45, r * 0.25], [r * 0.85, r * 0.2], [r * 0.82, r * 0.55], [r * 0.45, r * 0.55]], '#b87a4c');
    ctx.restore();
  }

  function ladyHead(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    blob(ctx, r * 0.55, -r * 0.65, r * 0.55, r * 0.5, 0.3, '#1e0e06');
    blob(ctx, 0, -r * 0.2, r * 0.9, r * 0.75, 0, '#24120a');
    blob(ctx, -r * 0.15, r * 0.15, r * 0.62, r * 0.8, -0.1, '#d89a68');
    blob(ctx, -r * 0.35, r * 0.05, r * 0.08, r * 0.05, 0, '#3a1e10');
    blob(ctx, -r * 0.4, r * 0.55, r * 0.14, r * 0.07, 0, '#8a3a24');
    blob(ctx, r * 0.45, r * 0.45, r * 0.09, r * 0.09, 0, '#f2d890');
    ctx.restore();
  }

  function couple(ctx, W, H, kind) {
    ctx.save();
    if (kind === 1 || kind === 2) {
      const bg = ctx.createLinearGradient(0, 0, W, 0);
      bg.addColorStop(0, '#2a1408');
      bg.addColorStop(0.6, '#8a4a1c');
      bg.addColorStop(1, '#e8b070');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,240,210,0.85)';
      ctx.fillRect(W * 0.9, 0, W * 0.1, H);
    }
    if (kind === 1) {
      shape(ctx, [[W * 0.1, H], [W * 0.14, H * 0.55], [W * 0.3, H * 0.42], [W * 0.5, H * 0.46], [W * 0.56, H]], '#a8683c');
      shape(ctx, [[W * 0.14, H * 0.6], [W * 0.3, H * 0.47], [W * 0.36, H], [W * 0.12, H]], 'rgba(255,214,160,0.35)');
      maskHead(ctx, W * 0.42, H * 0.28, H * 0.16, 0.15, 0.25);
      shape(ctx, [[W * 0.5, H], [W * 0.56, H * 0.6], [W * 0.7, H * 0.55], [W * 0.82, H * 0.62], [W * 0.86, H]], '#2e5a5a');
      ladyHead(ctx, W * 0.66, H * 0.36, H * 0.14, -0.2);
      shape(ctx, [[W * 0.46, H * 0.62], [W * 0.66, H * 0.56], [W * 0.68, H * 0.62], [W * 0.48, H * 0.7]], '#1c1a1a');
      blinds(ctx, W, H, 4, 0.22);
    } else if (kind === 2) {
      shape(ctx, [[W * 0.0, H], [W * 0.05, H * 0.55], [W * 0.3, H * 0.46], [W * 0.46, H * 0.62], [W * 0.5, H]], '#9a6036');
      maskHead(ctx, W * 0.46, H * 0.36, H * 0.2, 0.55, 0.2);
      ladyHead(ctx, W * 0.66, H * 0.44, H * 0.17, -0.7);
      shape(ctx, [[W * 0.22, H * 0.8], [W * 0.5, H * 0.72], [W * 0.55, H * 0.8], [W * 0.28, H * 0.9]], '#1c1a1a');
      blinds(ctx, W, H, 3, 0.25);
    } else if (kind === 3) {
      const bg = ctx.createLinearGradient(0, 0, W, 0);
      bg.addColorStop(0, '#3a1e0c');
      bg.addColorStop(1, '#c8884a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      shape(ctx, [[W * 0.08, H], [W * 0.14, H * 0.5], [W * 0.34, H * 0.44], [W * 0.48, H * 0.6], [W * 0.5, H]], '#9a5e34');
      maskHead(ctx, W * 0.38, H * 0.3, H * 0.15, -0.1, 0.2);
      shape(ctx, [[W * 0.48, H], [W * 0.5, H * 0.58], [W * 0.62, H * 0.5], [W * 0.8, H * 0.6], [W * 0.84, H]], '#c88a5c');
      ladyHead(ctx, W * 0.64, H * 0.28, H * 0.15, -0.9);
      shape(ctx, [[W * 0.44, H * 0.7], [W * 0.62, H * 0.62], [W * 0.64, H * 0.68], [W * 0.46, H * 0.78]], '#1c1a1a');
      blinds(ctx, W, H, 4, 0.28);
    } else {
      ctx.fillStyle = '#f4e4c0';
      ctx.fillRect(0, 0, W, H);
      const win = ctx.createRadialGradient(W * 0.45, H * 0.4, 4, W * 0.45, H * 0.4, W * 0.55);
      win.addColorStop(0, '#fff8e8');
      win.addColorStop(1, '#c8a070');
      ctx.fillStyle = win;
      ctx.fillRect(W * 0.12, H * 0.06, W * 0.66, H * 0.7);
      ctx.fillStyle = 'rgba(80,50,26,0.55)';
      ctx.fillRect(W * 0.12, H * 0.5, W * 0.66, H * 0.02);
      ctx.fillRect(W * 0.12, H * 0.58, W * 0.66, H * 0.015);
      for (let i = 0; i < 9; i++) ctx.fillRect(W * (0.14 + i * 0.07), H * 0.5, W * 0.008, H * 0.1);
      ctx.fillStyle = 'rgba(120,80,40,0.6)';
      ctx.fillRect(W * 0.8, 0, W * 0.2, H);
      const man = W * 0.42, lady = W * 0.6;
      blob(ctx, man, H * 0.22, W * 0.03, H * 0.055, 0, '#24140c');
      shape(ctx, [[man - W * 0.06, H * 0.95], [man - W * 0.055, H * 0.3], [man + W * 0.055, H * 0.3], [man + W * 0.05, H * 0.95]], '#2a1810');
      blob(ctx, lady, H * 0.3, W * 0.03, H * 0.05, 0, '#24140c');
      blob(ctx, lady + W * 0.015, H * 0.26, W * 0.025, H * 0.035, 0, '#1a0c06');
      shape(ctx, [[lady - W * 0.05, H * 0.86], [lady - W * 0.035, H * 0.36], [lady + W * 0.035, H * 0.36], [lady + W * 0.05, H * 0.86]], '#2a1810');
      ctx.strokeStyle = '#2a1810';
      ctx.lineWidth = W * 0.012;
      ctx.beginPath();
      ctx.moveTo(man + W * 0.045, H * 0.55);
      ctx.lineTo(lady - W * 0.035, H * 0.55);
      ctx.stroke();
      [[man - W * 0.03, H * 0.95], [man + W * 0.03, H * 0.95], [lady - W * 0.02, H * 0.9], [lady + W * 0.02, H * 0.9]].forEach(([x, y]) => ctx.fillRect(x - W * 0.012, y - H * 0.1, W * 0.024, H * 0.1));
    }
    ctx.restore();
    sepia(ctx, W, H, 13 + kind);
  }

  function photo(kind) {
    return (ctx, W, H) => {
      ctx.fillStyle = '#f2eee4';
      ctx.fillRect(0, 0, W, H);
      const m = W * 0.05;
      ctx.save();
      ctx.beginPath();
      ctx.rect(m, m, W - m * 2, H - m * 2);
      ctx.clip();
      ctx.translate(m, m);
      couple(ctx, W - m * 2, H - m * 2, kind);
      ctx.restore();
    };
  }

  function signPanel(text, size) {
    return (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2e9ad0');
      g.addColorStop(0.5, '#1f7fb4');
      g.addColorStop(1, '#16648f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, W, H * 0.08);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, H * 0.92, W, H * 0.08);
      let fs = Math.round(H * (size || 0.56));
      ctx.font = `${fs}px ${STENCIL}`;
      const tw = ctx.measureText(text).width;
      if (tw > W * 0.86) {
        fs = Math.floor(fs * W * 0.86 / tw);
        ctx.font = `${fs}px ${STENCIL}`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(10,40,60,0.5)';
      ctx.fillText(text, W / 2 + 3, H * 0.54 + 3);
      ctx.fillStyle = '#ead9b4';
      ctx.fillText(text, W / 2, H * 0.52);
    };
  }

  function noticeSign(lines, bg, fg, border, font) {
    return (ctx, W, H) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = border;
      ctx.lineWidth = W * 0.03;
      ctx.strokeRect(W * 0.04, H * 0.04, W * 0.92, H * 0.92);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lh = H * 0.8 / lines.length;
      lines.forEach((l, i) => {
        let fs = Math.round(lh * (l.s || 0.8));
        ctx.font = `${fs}px ${font || STENCIL}`;
        const tw = ctx.measureText(l.t).width;
        if (tw > W * 0.84) {
          fs = Math.floor(fs * W * 0.84 / tw);
          ctx.font = `${fs}px ${font || STENCIL}`;
        }
        ctx.fillText(l.t, W / 2, H * 0.1 + lh * (i + 0.55));
      });
      speckle(ctx, W, H, 31, W * H * 0.02, '255,255,255', '60,50,40', 2);
    };
  }

  const LAND = [
    [[0.042, 0.139], [0.069, 0.106], [0.167, 0.111], [0.236, 0.1], [0.239, 0.167], [0.272, 0.211], [0.283, 0.167], [0.328, 0.178], [0.347, 0.233], [0.319, 0.256], [0.294, 0.278],
      [0.278, 0.361], [0.272, 0.339], [0.25, 0.339], [0.231, 0.356], [0.258, 0.383], [0.269, 0.444], [0.283, 0.456], [0.261, 0.433], [0.208, 0.394], [0.194, 0.372], [0.167, 0.311],
      [0.156, 0.267], [0.139, 0.2], [0.083, 0.167], [0.056, 0.178]],
    [[0.292, 0.439], [0.328, 0.444], [0.403, 0.528], [0.392, 0.583], [0.381, 0.628], [0.347, 0.694], [0.319, 0.733], [0.311, 0.806], [0.294, 0.75], [0.303, 0.667], [0.286, 0.567],
      [0.275, 0.517], [0.283, 0.472]],
    [[0.475, 0.294], [0.475, 0.261], [0.494, 0.239], [0.514, 0.206], [0.525, 0.183], [0.514, 0.172], [0.542, 0.117], [0.572, 0.106], [0.611, 0.128], [0.667, 0.111], [0.694, 0.094],
      [0.778, 0.072], [0.861, 0.1], [0.972, 0.122], [0.998, 0.139], [0.944, 0.194], [0.889, 0.178], [0.875, 0.222], [0.858, 0.306], [0.836, 0.328], [0.825, 0.367], [0.8, 0.433],
      [0.794, 0.45], [0.786, 0.489], [0.778, 0.428], [0.761, 0.4], [0.75, 0.378], [0.722, 0.417], [0.714, 0.456], [0.703, 0.389], [0.686, 0.361], [0.658, 0.356], [0.664, 0.378],
      [0.622, 0.433], [0.594, 0.344], [0.597, 0.317], [0.583, 0.3], [0.561, 0.294], [0.553, 0.267], [0.544, 0.289], [0.533, 0.256], [0.511, 0.261], [0.5, 0.283], [0.486, 0.3]],
    [[0.483, 0.306], [0.528, 0.294], [0.556, 0.328], [0.589, 0.328], [0.606, 0.4], [0.642, 0.439], [0.617, 0.506], [0.611, 0.556], [0.597, 0.633], [0.575, 0.689], [0.55, 0.689],
      [0.539, 0.622], [0.536, 0.556], [0.525, 0.5], [0.525, 0.478], [0.514, 0.472], [0.494, 0.472], [0.472, 0.467], [0.453, 0.422], [0.456, 0.383], [0.472, 0.333]],
    [[0.817, 0.622], [0.819, 0.689], [0.861, 0.678], [0.889, 0.711], [0.917, 0.706], [0.925, 0.65], [0.903, 0.583], [0.894, 0.561], [0.878, 0.567], [0.861, 0.567], [0.847, 0.583]],
    [[0.375, 0.167], [0.444, 0.111], [0.444, 0.056], [0.333, 0.044], [0.306, 0.072], [0.347, 0.122]],
    [[0.486, 0.222], [0.503, 0.211], [0.494, 0.183], [0.486, 0.178], [0.483, 0.194]],
    [[0.472, 0.211], [0.483, 0.2], [0.478, 0.194]],
    [[0.861, 0.322], [0.889, 0.3], [0.894, 0.261], [0.892, 0.25], [0.886, 0.278], [0.869, 0.306]],
    [[0.622, 0.572], [0.639, 0.589], [0.631, 0.639], [0.622, 0.622]],
    [[0.803, 0.494], [0.825, 0.467], [0.831, 0.5], [0.817, 0.522]],
    [[0.864, 0.506], [0.892, 0.517], [0.917, 0.556], [0.892, 0.55], [0.875, 0.522]],
    [[0.764, 0.472], [0.772, 0.478], [0.794, 0.533], [0.783, 0.522]],
    [[0.981, 0.694], [0.994, 0.711], [0.978, 0.744], [0.964, 0.756]],
    [[0, 0.935], [0.2, 0.925], [0.4, 0.94], [0.6, 0.92], [0.8, 0.935], [1, 0.925], [1, 1], [0, 1]]
  ];

  function coast(poly, W, H, g) {
    const out = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      const dx = (b[0] - a[0]) * W, dy = (b[1] - a[1]) * H;
      const len = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(len / 7));
      for (let k = 0; k < n; k++) {
        const u = k / n, j = k ? (g() - 0.5) * Math.min(6, len * 0.12) : 0;
        out.push([a[0] * W + dx * u - dy / (len || 1) * j, a[1] * H + dy * u + dx / (len || 1) * j]);
      }
    });
    return out;
  }

  function continents(ctx, W, H, col, edge) {
    const g = rand(71);
    ctx.fillStyle = col;
    ctx.strokeStyle = edge || 'rgba(150,160,166,0.55)';
    ctx.lineWidth = Math.max(1, W / 900);
    LAND.forEach(poly => {
      const pts = coast(poly, W, H, g);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  const DRAW = {
    title(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = POSTER;
      ctx.beginPath();
      ctx.moveTo(84, 32);
      ctx.lineTo(1204, 50);
      ctx.lineTo(1196, 668);
      ctx.lineTo(86, 656);
      ctx.closePath();
      ctx.fill();
      speckle(ctx, 1280, 720, 5, 5000, '255,255,255', '0,20,40', 2);
      ctx.fillStyle = BAND;
      ctx.beginPath();
      ctx.moveTo(180, 160);
      ctx.lineTo(1280, 166);
      ctx.lineTo(1280, 556);
      ctx.lineTo(1196, 552);
      ctx.lineTo(1196, 520);
      ctx.lineTo(330, 470);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(180, 160);
      ctx.lineTo(1280, 166);
      ctx.lineTo(1280, 556);
      ctx.lineTo(330, 470);
      ctx.closePath();
      ctx.clip();
      Meet.emblem(ctx, 780, 330, 300, '#262524', BAND);
      ctx.restore();
      ctx.fillStyle = CREAM;
      ctx.font = `46px ${SANS}`;
      ctx.fillText('Meet', 280, 252);
      ctx.font = `30px ${SANS}`;
      ctx.fillText('THE', 330, 290);
      slabWord(ctx, 'SPY', 330, 302, 118, 26, CREAM, 1.62);
      balisong(ctx, 722, 108, 250, 0.02, '#ece4d2');
      ctx.fillStyle = '#ece4d2';
      ctx.beginPath();
      ctx.ellipse(966, 122, 5, 8, 0, 0, PI * 2);
      ctx.fill();
      folder(ctx, 120, 470, 420, 190, 0.26, 'CLASSIFIED');
      ctx.save();
      ctx.translate(150, 420);
      ctx.rotate(0.28);
      cigCase(ctx, 0, 60, 190, 130, true);
      kitScreen(ctx, 0, -30, 190, 92);
      ctx.restore();
      smallLogo(ctx, 532, 625, 40, '#2c2c2e', '#3e4a52', '#2a3236');
      ctx.fillStyle = '#ece4d2';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText('COPYRIGHT LOLOLOL', 762, 600);
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('A Valve Picture', 762, 624);
      ctx.restore();
    },

    bellPlate(ctx, W, H) {
      ctx.fillStyle = '#e2c43a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = `bold ${Math.round(H * 0.14)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ALARM-O-TRON', W / 2, H * 0.4);
      ctx.font = `${Math.round(H * 0.1)}px Arial, sans-serif`;
      ctx.fillText('5000', W / 2, H * 0.6);
    },

    signA: signPanel('INTRUDER ALERT', 0.5),
    signB: signPanel('RED SPY', 0.56),
    signC: signPanel('IN BASE', 0.56),

    board(ctx, W, H) {
      ctx.fillStyle = '#121a22';
      ctx.fillRect(0, 0, W, H);
      const cols = 16, rows = 9;
      const g = rand(51);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = W * (0.02 + c * 0.06), y = H * (0.04 + r * 0.1);
          const lit = g() < 0.75;
          ctx.fillStyle = lit ? `rgb(${40 + g() * 20},${110 + g() * 40},${170 + g() * 40})` : '#1c2a38';
          ctx.fillRect(x, y, W * 0.055, H * 0.085);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(x + W * 0.006, y + H * 0.02, W * 0.04, H * 0.008);
          ctx.fillRect(x + W * 0.006, y + H * 0.04, W * 0.03, H * 0.008);
        }
      }
      [['INTRUDER', 0.14, 0.46], ['RED SPY', 0.48, 0.66], ['BASE', 0.8, 0.56]].forEach(([t, fx, fy]) => {
        ctx.fillStyle = '#cfe8f6';
        ctx.fillRect(W * fx - W * 0.05, H * fy - H * 0.03, W * 0.1, H * 0.06);
        ctx.fillStyle = '#16303e';
        ctx.font = `bold ${Math.round(H * 0.035)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, W * fx, H * fy);
      });
    },

    console(ctx, W, H) {
      ctx.fillStyle = '#2a2c2e';
      ctx.fillRect(0, 0, W, H);
      const g = rand(61);
      for (let i = 0; i < 90; i++) {
        const c = ['#e8b830', '#d83a2a', '#3ad84a', '#e8e0c8'][Math.floor(g() * 4)];
        ctx.fillStyle = c;
        ctx.fillRect(g() * W, H * (0.2 + g() * 0.6), 4, 4);
      }
      ctx.fillStyle = '#3a3e42';
      for (let i = 0; i < 8; i++) ctx.fillRect(W * (0.04 + i * 0.12), H * 0.08, W * 0.08, H * 0.06);
    },

    concrete(ctx, W, H) {
      ctx.fillStyle = '#8a8c88';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 3, W * H * 0.3, '255,255,250', '40,40,36', 2);
      ctx.strokeStyle = 'rgba(40,40,40,0.25)';
      ctx.lineWidth = 2;
      for (let y = 0; y <= H; y += H / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    },

    bluWall(ctx, W, H) {
      ctx.fillStyle = '#c9bfa8';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 7, W * H * 0.15, '255,250,240', '80,70,50', 2);
      ctx.fillStyle = '#4f87a8';
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
      ctx.fillStyle = '#2f5a74';
      ctx.fillRect(0, H * 0.76, W, H * 0.025);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, H * 0.97, W, H * 0.03);
    },

    darkWall(ctx, W, H) {
      ctx.fillStyle = '#3a3e42';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 9, W * H * 0.2, '200,210,220', '0,0,0', 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 3;
      for (let x = 0; x <= W; x += W / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    },

    tiles(ctx, W, H) {
      ctx.fillStyle = '#5c5e5a';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(20,20,20,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 4, 0);
        ctx.lineTo(i * W / 4, H);
        ctx.moveTo(0, i * H / 4);
        ctx.lineTo(W, i * H / 4);
        ctx.stroke();
      }
      speckle(ctx, W, H, 11, W * H * 0.2, '220,220,210', '0,0,0', 2);
    },

    stairs(ctx, W, H) {
      ctx.fillStyle = '#6e706c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d8b03a';
      ctx.fillRect(0, 0, W, H * 0.12);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let x = 0; x < W; x += 8) ctx.fillRect(x, H * 0.02, 3, H * 0.08);
      speckle(ctx, W, H, 13, W * H * 0.2, '255,255,250', '0,0,0', 2);
    },

    hazard(ctx, W, H) {
      ctx.fillStyle = '#e0b42a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1e1c1a';
      for (let i = -4; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 6, H);
        ctx.lineTo(i * W / 6 + W / 12, H);
        ctx.lineTo(i * W / 6 + W / 12 + H, 0);
        ctx.lineTo(i * W / 6 + H, 0);
        ctx.closePath();
        ctx.fill();
      }
    },

    metal(ctx, W, H) {
      ctx.fillStyle = '#6a7076';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(20,24,28,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, W - 4, H - 4);
      [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].forEach(([x, y]) => {
        ctx.fillStyle = '#9aa0a6';
        ctx.beginPath();
        ctx.arc(x * W, y * H, 3, 0, PI * 2);
        ctx.fill();
      });
      speckle(ctx, W, H, 17, W * H * 0.15, '255,255,255', '0,0,0', 2);
    },

    planks(ctx, W, H) {
      ctx.fillStyle = '#7a5434';
      ctx.fillRect(0, 0, W, H);
      const g = rand(19);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '40,20,10' : '200,150,100'},${0.08 + g() * 0.12})`;
        ctx.fillRect(0, i * H / 8, W, H / 8);
        ctx.fillStyle = 'rgba(20,10,4,0.6)';
        ctx.fillRect(0, i * H / 8, W, 2);
      }
      for (let i = 0; i < 200; i++) {
        ctx.strokeStyle = `rgba(40,20,8,${g() * 0.2})`;
        ctx.beginPath();
        const y = g() * H;
        ctx.moveTo(g() * W, y);
        ctx.lineTo(g() * W, y + (g() - 0.5) * 3);
        ctx.stroke();
      }
    },

    map(ctx, W, H) {
      ctx.fillStyle = '#1a1e21';
      ctx.fillRect(0, 0, W, H);
      continents(ctx, W, H, '#4c555b');
      ctx.strokeStyle = 'rgba(160,170,180,0.1)';
      ctx.lineWidth = 2;
      for (let i = -H; i < W + H; i += W / 14) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.moveTo(i + H, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      const g = rand(23);
      ctx.fillStyle = '#e8c45a';
      for (let i = 0; i < 26; i++) {
        ctx.beginPath();
        ctx.arc(W * (0.66 + (i % 6) * 0.025 + g() * 0.01), H * (0.18 + Math.floor(i / 6) * 0.06), W * 0.006, 0, PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc(W * (0.1 + g() * 0.8), H * (0.2 + g() * 0.6), W * 0.004, 0, PI * 2);
        ctx.fill();
      }
      speckle(ctx, W, H, 29, W * H * 0.05, '255,255,255', '0,0,0', 2);
    },

    caseTop(ctx, W, H) {
      ctx.fillStyle = '#1e9cc8';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, W, H * 0.06);
      ctx.fillStyle = '#f2f6f8';
      ctx.fillRect(W * 0.62, 0, W * 0.08, H);
      ctx.save();
      ctx.translate(W * 0.82, H * 0.5);
      ctx.rotate(PI / 2);
      ctx.fillStyle = '#16384a';
      ctx.font = `${Math.round(H * 0.11)}px ${STENCIL}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOP SECRET', 0, 0);
      ctx.restore();
      ctx.fillStyle = '#3a4248';
      ctx.fillRect(W * 0.08, H * 0.24, W * 0.42, H * 0.52);
      [['#e8a020', 0.15, 0.36], ['#d83030', 0.15, 0.62]].forEach(([c, fx, fy]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(W * fx, H * fy, H * 0.07, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#2ab048';
      ctx.fillRect(W * 0.24, H * 0.3, W * 0.06, H * 0.08);
      ctx.fillStyle = '#d83030';
      ctx.fillRect(W * 0.24, H * 0.46, W * 0.06, H * 0.08);
      ctx.fillRect(W * 0.24, H * 0.58, W * 0.06, H * 0.08);
      ctx.fillStyle = '#e8e2d0';
      ctx.fillRect(W * 0.36, H * 0.32, W * 0.1, H * 0.36);
      ctx.fillStyle = '#5a5a56';
      for (let i = 0; i < 4; i++) ctx.fillRect(W * 0.365, H * (0.34 + i * 0.085), W * 0.09, H * 0.02);
      ctx.strokeStyle = 'rgba(232,226,208,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.21, H * 0.27, W * 0.12, H * 0.42);
    },

    folder(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      folder(ctx, W * 0.02, H * 0.08, W * 0.96, H * 0.88, 0, 'BLU INTELLIGENCE');
    },

    paper(ctx, W, H) {
      ctx.fillStyle = '#efece4';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(60,60,70,0.55)';
      for (let i = 0; i < 14; i++) ctx.fillRect(W * 0.1, H * (0.12 + i * 0.055), W * (0.5 + ((i * 37) % 30) / 100), H * 0.012);
      ctx.fillStyle = '#3a6a9a';
      ctx.beginPath();
      ctx.arc(W * 0.15, H * 0.9, W * 0.04, 0, PI * 2);
      ctx.fill();
    },

    photo1: photo(1),
    photo2: photo(2),
    photo3: photo(3),
    photo4: photo(4),

    doorSign(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#e6e8e6');
      g.addColorStop(1, '#c8ccca');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = W * 0.02;
      ctx.strokeRect(W * 0.05, H * 0.08, W * 0.9, H * 0.84);
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = `${Math.round(H * 0.24)}px ${STENCIL}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BRIEFCASE', W / 2, H * 0.36);
      ctx.fillText('ROOM', W / 2, H * 0.66);
      ctx.restore();
    },

    keypad(ctx, W, H) {
      ctx.fillStyle = '#2a2a2c';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `bold ${Math.round(H * 0.11)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
      keys.forEach((k, i) => {
        const c = i % 3, r = Math.floor(i / 3);
        const x = W * (0.12 + c * 0.27), y = H * (0.08 + r * 0.22);
        ctx.fillStyle = '#e8a43a';
        ctx.fillRect(x, y, W * 0.22, H * 0.18);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x, y, W * 0.22, H * 0.03);
        ctx.fillStyle = '#4a2a10';
        ctx.fillText(k, x + W * 0.11, y + H * 0.1);
      });
    },

    keepClosed: noticeSign([{ t: 'KEEP THIS' }, { t: 'DOOR' }, { t: 'CLOSED' }, { t: 'AT ALL' }, { t: 'TIMES.' }], '#eeeae0', '#1a1a1a', '#1a1a1a'),
    restricted: noticeSign([{ t: 'RESTRICTED AREA', s: 0.7 }, { t: 'AUTHORIZED', s: 0.6 }, { t: 'PERSONNEL ONLY', s: 0.6 }], '#eeeae0', '#a82a22', '#a82a22'),
    keepOut: noticeSign([{ t: 'KEEP OUT', s: 0.9 }, { t: 'AUTHORIZED', s: 0.55 }, { t: 'ONLY BEYOND', s: 0.55 }, { t: 'THIS POINT', s: 0.55 }], '#eeeae0', '#a82a22', '#a82a22'),

    intel(ctx, W, H) {
      ctx.fillStyle = '#2f6f9a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f2ecd6';
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.5);
      ctx.lineTo(W * 0.18, H * 0.2);
      ctx.lineTo(W * 0.18, H * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.font = `bold ${Math.round(H * 0.42)}px Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText('INTELLIGENCE', W * 0.22, H * 0.52);
    },

    poster(ctx, W, H) {
      ctx.fillStyle = '#e6dcc4';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3c6c90';
      ctx.fillRect(W * 0.08, H * 0.06, W * 0.84, H * 0.5);
      ctx.fillStyle = '#e6dcc4';
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.31, W * 0.2, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3c6c90';
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.31, W * 0.08, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.font = `bold ${Math.round(H * 0.08)}px ${STENCIL}`;
      ctx.textAlign = 'center';
      ctx.fillText('LOOSE LIPS', W / 2, H * 0.7);
      ctx.fillText('SINK SHIPS', W / 2, H * 0.82);
    },

    notice(ctx, W, H) {
      ctx.fillStyle = '#f0ece0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = `bold ${Math.round(H * 0.1)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('WANTED', W / 2, H * 0.16);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(W * 0.25, H * 0.22, W * 0.5, H * 0.4);
      ctx.fillStyle = '#2a2a2a';
      for (let i = 0; i < 5; i++) ctx.fillRect(W * 0.15, H * (0.7 + i * 0.05), W * 0.7, H * 0.015);
    },

    cabinet(ctx, W, H) {
      ctx.fillStyle = '#d8d4c8';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) {
        const y = H * (0.03 + i * 0.245);
        ctx.fillStyle = '#c4beae';
        ctx.fillRect(W * 0.05, y, W * 0.9, H * 0.22);
        ctx.fillStyle = '#8a867a';
        ctx.fillRect(W * 0.38, y + H * 0.08, W * 0.24, H * 0.03);
        ctx.fillStyle = '#f2eee2';
        ctx.fillRect(W * 0.42, y + H * 0.03, W * 0.16, H * 0.04);
      }
    },

    crate(ctx, W, H) {
      ctx.fillStyle = '#9a7a4a';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#5a4026';
      ctx.lineWidth = W * 0.06;
      ctx.strokeRect(W * 0.03, H * 0.03, W * 0.94, H * 0.94);
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.06);
      ctx.lineTo(W * 0.94, H * 0.94);
      ctx.stroke();
      speckle(ctx, W, H, 37, W * H * 0.1, '255,230,190', '40,20,0', 2);
    },

    blood(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(41);
      ctx.fillStyle = '#8a0c0c';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.16, 0, PI * 2);
      ctx.fill();
      for (let i = 0; i < 16; i++) {
        const a = g() * PI * 2, len = W * (0.2 + g() * 0.28);
        ctx.strokeStyle = '#8a0c0c';
        ctx.lineWidth = W * (0.02 + g() * 0.03);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W / 2, H / 2);
        ctx.quadraticCurveTo(W / 2 + Math.cos(a + 0.3) * len * 0.5, H / 2 + Math.sin(a + 0.3) * len * 0.5, W / 2 + Math.cos(a) * len, H / 2 + Math.sin(a) * len);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2 + Math.cos(a) * len, H / 2 + Math.sin(a) * len, W * 0.025, 0, PI * 2);
        ctx.fill();
      }
    },

    spark(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      g.addColorStop(0, 'rgba(230,245,255,1)');
      g.addColorStop(0.3, 'rgba(90,170,255,0.8)');
      g.addColorStop(1, 'rgba(20,60,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    lamp(ctx, W, H) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      g.addColorStop(0, 'rgba(255,250,236,1)');
      g.addColorStop(0.4, 'rgba(255,240,210,0.6)');
      g.addColorStop(1, 'rgba(255,230,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    cone(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,246,226,0.55)');
      g.addColorStop(1, 'rgba(255,246,226,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    retail(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, 1280, 720);
      Msc.retailBox(ctx, 420, 180, 236, 370);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = '19px Arial, sans-serif';
      ctx.fillText('Available Now for PC.', 880, 372);
      ctx.restore();
    },

    valve(ctx, W, H) {
      Msc.DRAW.valve(ctx, W, H);
    }
  };

  const SIZES = {
    title: [1024, 576], bellPlate: [128, 128], signA: [512, 128], signB: [512, 128], signC: [512, 128], board: [1024, 512], console: [256, 64],
    concrete: [256, 256], bluWall: [256, 256], darkWall: [256, 256], tiles: [256, 256], stairs: [128, 128], hazard: [256, 64], metal: [128, 128], planks: [256, 256],
    map: [1536, 512], caseTop: [512, 256], folder: [256, 256], paper: [128, 128], photo1: [256, 192], photo2: [256, 192], photo3: [256, 192], photo4: [256, 192],
    doorSign: [256, 128], keypad: [128, 160], keepClosed: [128, 192], restricted: [256, 128], keepOut: [128, 192], intel: [256, 64], poster: [128, 192], notice: [128, 192],
    cabinet: [128, 256], crate: [128, 128], blood: [128, 128], spark: [64, 64], lamp: [64, 64], cone: [32, 64], retail: [1024, 576], valve: [1024, 576]
  };

  const REPEAT = ['concrete', 'bluWall', 'darkWall', 'tiles', 'stairs', 'hazard', 'metal', 'planks'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (DRAW[key]) {
        const [w, h] = SIZES[key] || [256, 256];
        cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
      } else if (Msc.DRAW[key]) {
        cache[key] = Msc.tex(r, cache, key);
      } else {
        cache[key] = Meet.tex(r, cache, key);
      }
    }
    return cache[key];
  }

  window.MspArt = { DRAW, SIZES, GLYPHS, tex, slabWord };
})();
