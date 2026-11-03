(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Mts = window.MtsArt;
  const PI = Math.PI;

  const CREAM = '#f4ece6';
  const CARD = '#9aa8ad';
  const BAND = '#3d3c39';
  const INK = '#efe4da';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';
  const STENCIL = '"Arial Black", Impact, sans-serif';

  function arcBand(cx, cy, rxo, ryo, rxi, ryi, a0, a1, n) {
    const pts = [];
    const k = n || 28;
    for (let i = 0; i <= k; i++) {
      const a = a0 + (a1 - a0) * (i / k);
      pts.push([cx + Math.cos(a) * rxo, cy + Math.sin(a) * ryo]);
    }
    for (let i = k; i >= 0; i--) {
      const a = a0 + (a1 - a0) * (i / k);
      pts.push([cx + Math.cos(a) * rxi, cy + Math.sin(a) * ryi]);
    }
    return pts;
  }

  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  const SLAB = {
    D: { w: 114, polys: [rect(14, 0, 42, 100), rect(0, 0, 56, 14), rect(0, 86, 56, 100), arcBand(56, 50, 58, 50, 30, 36, -PI / 2, PI / 2, 30)] },
    E: { w: 106, polys: [rect(14, 0, 42, 100), rect(0, 0, 100, 16), rect(86, 0, 100, 34), rect(42, 42, 80, 58), rect(70, 32, 82, 68), rect(0, 84, 106, 100), rect(92, 64, 106, 100)] },
    M: { w: 152, polys: [rect(16, 0, 32, 100), [[18, 0], [50, 0], [86, 100], [62, 100]], [[62, 100], [78, 100], [120, 0], [106, 0]], rect(108, 0, 136, 100), rect(0, 0, 48, 14), rect(104, 0, 152, 14), rect(0, 86, 46, 100), rect(92, 86, 152, 100)] },
    O: { w: 116, polys: [arcBand(58, 50, 58, 50, 27, 34, 0, PI * 2, 48)] },
    A: { w: 132, polys: [[[44, 0], [74, 0], [44, 86], [14, 86]], [[58, 0], [88, 0], [118, 86], [88, 86]], rect(34, 52, 98, 66), rect(40, 0, 92, 12), rect(0, 86, 58, 100), rect(74, 86, 132, 100)] },
    N: { w: 128, polys: [rect(16, 0, 34, 100), [[16, 0], [48, 0], [112, 100], [80, 100]], rect(94, 0, 112, 100), rect(0, 0, 48, 14), rect(0, 86, 50, 100), rect(80, 0, 128, 14)] }
  };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    ctx.fillStyle = color;
    for (const ch of word) {
      const g = SLAB[ch];
      g.polys.forEach(poly => {
        ctx.beginPath();
        poly.forEach(([px, py], i) => (i ? ctx.lineTo(cx + px * kx, y + py * k) : ctx.moveTo(cx + px * kx, y + py * k)));
        ctx.closePath();
        ctx.fill();
      });
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function smallLogo(ctx, x, y, h) {
    ctx.save();
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    const word = (fill, dx, dy) => {
      ctx.fillStyle = fill;
      const wa = ctx.measureText('TEAM').width;
      ctx.fillText('TEAM', x + dx, y + dy);
      ctx.fillText('FORTRESS 2', x + dx + wa + h * 0.22, y + dy);
    };
    for (let i = 8; i >= 1; i--) word(i > 4 ? '#3a3632' : '#56504a', -i * h * 0.03, i * h * 0.04);
    word('#d8d0c6', 0, 0);
    ctx.restore();
  }

  function launcherIcon(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.fillRect(-60, -18, 92, 30);
    ctx.fillRect(32, -14, 40, 22);
    ctx.fillRect(68, -20, 10, 34);
    ctx.fillRect(-30, -28, 50, 12);
    ctx.beginPath();
    ctx.moveTo(-50, 10);
    ctx.lineTo(-30, 10);
    ctx.lineTo(-40, 52);
    ctx.lineTo(-62, 52);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 12);
    ctx.lineTo(28, 12);
    ctx.lineTo(24, 44);
    ctx.lineTo(8, 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CARD;
    ctx.beginPath();
    ctx.arc(-22, -3, 9, 0, PI * 2);
    ctx.fill();
    [-50, -38].forEach(px => ctx.fillRect(px, 18, 4, 18));
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(70, -26, 6, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function boomIcon(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 8, 20, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = CARD;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      ctx.fillRect(Math.cos(a) * 12 - 2, 8 + Math.sin(a) * 12 - 2, 4, 4);
    }
    ctx.fillRect(-20, 6, 40, 4);
    ctx.fillStyle = col;
    [[18, -14, 14], [34, -24, 12], [6, -26, 10], [26, -2, 9]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    const pts = [[40, -8], [62, -40], [58, -16], [96, -30], [70, -6], [100, 6], [68, 8], [80, 30], [52, 12], [44, 22]];
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      const s = (size || 2) * (0.5 + g());
      ctx.fillRect(g() * W, g() * H, s, s);
    }
  }

  function planks(ctx, W, H, base, n, seed, vertical) {
    const g = rand(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * (vertical ? W : H), w = (vertical ? W : H) / n;
      ctx.fillStyle = `rgba(${g() < 0.5 ? '40,24,14' : '230,200,160'},${0.05 + g() * 0.09})`;
      if (vertical) ctx.fillRect(a, 0, w, H); else ctx.fillRect(0, a, W, w);
      ctx.fillStyle = 'rgba(26,16,10,0.6)';
      if (vertical) ctx.fillRect(a, 0, 2, H); else ctx.fillRect(0, a, W, 2);
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = `rgba(30,18,10,${0.05 + g() * 0.08})`;
        if (vertical) ctx.fillRect(a + g() * w, 0, 1, H); else ctx.fillRect(0, a + g() * w, W, 1);
      }
    }
  }

  function crateFace(ctx, W, H, base, seed) {
    planks(ctx, W, H, base, 5, seed, false);
    ctx.strokeStyle = 'rgba(60,40,24,0.75)';
    ctx.lineWidth = Math.max(4, W * 0.05);
    ctx.strokeRect(W * 0.03, H * 0.04, W * 0.94, H * 0.92);
  }

  function stencil(ctx, text, x, y, size, col, angle) {
    ctx.save();
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    ctx.font = `${Math.round(size)}px ${STENCIL}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function clouds(ctx, W, H, y0, y1, seed, alpha) {
    const g = rand(seed);
    for (let i = 0; i < 70; i++) {
      const x = g() * W, y = y0 + g() * (y1 - y0), rx = W * (0.04 + g() * 0.1), ry = (y1 - y0) * (0.08 + g() * 0.14);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
      gr.addColorStop(0, `rgba(255,252,250,${alpha * (0.5 + g() * 0.5)})`);
      gr.addColorStop(1, 'rgba(255,252,250,0)');
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-x, -y);
      ctx.fillStyle = gr;
      ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
      ctx.restore();
    }
  }

  const DRAW = {
    title(ctx, W) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = CARD;
      ctx.beginPath();
      ctx.moveTo(82, 30);
      ctx.lineTo(1205, 44);
      ctx.lineTo(1190, 672);
      ctx.lineTo(87, 660);
      ctx.closePath();
      ctx.fill();
      const band = () => {
        ctx.beginPath();
        ctx.moveTo(240, 158);
        ctx.lineTo(1280, 162);
        ctx.lineTo(1280, 552);
        ctx.lineTo(262, 462);
        ctx.lineTo(196, 222);
        ctx.closePath();
      };
      ctx.fillStyle = BAND;
      band();
      ctx.fill();
      ctx.save();
      band();
      ctx.clip();
      Meet.emblem(ctx, 780, 330, 330, '#4a4845', BAND);
      ctx.restore();
      launcherIcon(ctx, 790, 108, 0.95, '#e8dcc2');
      boomIcon(ctx, 888, 106, 0.95, '#e8dcc2');
      ctx.fillStyle = INK;
      ctx.font = `62px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 280, 255);
      ctx.font = `40px ${SANS}`;
      ctx.fillText('THE', 330, 290);
      slabWord(ctx, 'DEMOMAN', 330, 306, 58, 12, INK, 1.5);
      smallLogo(ctx, 530, 624, 30);
      ctx.fillStyle = '#e4ded6';
      ctx.font = `bold 12px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 761, 605);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('A Valve Picture', 761, 627);
      ctx.restore();
    },

    orange(ctx, W, H) {
      Meet.DRAW.orange(ctx, W, H);
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Disclaimer: All information regarding Demoman grenade behavior was obtained from Australians believed to be reliable at the time.', 640, 689);
      ctx.fillText('It is submitted subject to the possibility of errors, omissions, or nerfing without notice.', 640, 709);
      ctx.restore();
    },

    crateLabel(ctx, W, H) {
      crateFace(ctx, W, H, '#a88a6a', 401);
      speckle(ctx, W, H, 402, 900, '230,210,180', '60,40,24', 2);
      stencil(ctx, '50 LBS.', W * 0.2, H * 0.17, H * 0.09, 'rgba(40,30,24,0.85)');
      stencil(ctx, 'HIGH GRADE', W * 0.6, H * 0.21, H * 0.11, 'rgba(170,60,46,0.55)', -0.03);
      stencil(ctx, 'DYNAMITE', W * 0.5, H * 0.42, H * 0.17, 'rgba(36,28,22,0.92)');
      stencil(ctx, '2-4 LOAD', W * 0.5, H * 0.57, H * 0.08, 'rgba(36,28,22,0.85)');
      stencil(ctx, '40 %', W * 0.5, H * 0.69, H * 0.11, 'rgba(36,28,22,0.9)');
      stencil(ctx, 'N° 4', W * 0.2, H * 0.86, H * 0.1, 'rgba(36,28,22,0.85)');
      stencil(ctx, '11 X 7', W * 0.8, H * 0.86, H * 0.1, 'rgba(36,28,22,0.85)');
    },

    crateWood(ctx, W, H) {
      crateFace(ctx, W, H, '#a08264', 403);
      speckle(ctx, W, H, 404, 600, '230,210,180', '60,40,24', 2);
    },

    fragile(ctx, W, H) {
      ctx.fillStyle = '#b09a74';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 405, 900, '230,214,180', '70,50,30', 2);
      ctx.strokeStyle = 'rgba(70,52,34,0.7)';
      ctx.lineWidth = H * 0.06;
      ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H * 0.9);
      stencil(ctx, 'FRAGILE', W / 2, H * 0.52, H * 0.3, 'rgba(46,34,24,0.85)', -0.06);
    },

    redShed(ctx, W, H) {
      crateFace(ctx, W, H, '#9c7c5c', 406);
      speckle(ctx, W, H, 407, 900, '230,210,180', '60,40,24', 2);
      stencil(ctx, 'RED SHED', W * 0.5, H * 0.38, H * 0.17, 'rgba(46,30,22,0.88)', -0.12);
      stencil(ctx, '1923', W * 0.52, H * 0.6, H * 0.12, 'rgba(46,30,22,0.8)', -0.12);
    },

    label(ctx, W, H) {
      ctx.fillStyle = '#e8e2d2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(90,70,50,0.25)';
      ctx.fillRect(0, 0, W, H * 0.08);
      ctx.fillRect(0, H * 0.92, W, H * 0.08);
      const cx = W * 0.5, cy = H * 0.5, R = H * 0.34;
      ctx.fillStyle = '#4a3a2a';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.9, R * 0.32, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e8e2d2';
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.92, R * 0.82, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a3a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.8, R * 0.7, 0, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#3a2a1c';
      ctx.font = `bold ${Math.round(H * 0.26)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('XXX', cx, cy + H * 0.02);
    },

    blueprint(ctx, W, H) {
      ctx.fillStyle = '#c9cdb8';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 408, 700, '240,240,226', '80,80,60', 2);
      ctx.strokeStyle = 'rgba(70,64,58,0.55)';
      ctx.lineWidth = 1.5;
      const g = rand(409);
      for (let i = 0; i < 10; i++) {
        const x = g() * W, y = g() * H, w = 20 + g() * 60, h = 10 + g() * 40;
        ctx.strokeRect(x, y, w, h);
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, 0, PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 22; i++) {
        ctx.beginPath();
        ctx.moveTo(g() * W, g() * H);
        ctx.lineTo(g() * W, g() * H);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(70,64,58,0.5)';
      ctx.font = 'italic 12px Georgia, serif';
      for (let i = 0; i < 6; i++) ctx.fillText('kaboom ~ ' + (i + 3), g() * W * 0.8, g() * H);
    },

    concrete(ctx, W, H) {
      ctx.fillStyle = '#a6a29a';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 410, 4200, '210,206,198', '70,66,60', 2);
      const g = rand(411);
      for (let i = 0; i < 18; i++) {
        const x = g() * W, len = H * (0.2 + g() * 0.6);
        const gr = ctx.createLinearGradient(0, 0, 0, len);
        gr.addColorStop(0, 'rgba(70,64,56,0.18)');
        gr.addColorStop(1, 'rgba(70,64,56,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, 4 + g() * 16, len);
      }
      ctx.fillStyle = 'rgba(60,56,50,0.35)';
      ctx.fillRect(0, H * 0.5, W, 2);
      ctx.fillRect(W * 0.5, 0, 2, H);
    },

    tin(ctx, W, H) {
      ctx.fillStyle = '#8c9094';
      ctx.fillRect(0, 0, W, H);
      const n = 18;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W, w = W / n;
        const gr = ctx.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, 'rgba(30,34,40,0.35)');
        gr.addColorStop(0.45, 'rgba(240,240,246,0.2)');
        gr.addColorStop(1, 'rgba(30,34,40,0.35)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, w, H);
      }
      const g = rand(412);
      for (let i = 0; i < 90; i++) {
        const x = g() * W, y = g() * H, len = 20 + g() * 120;
        const gr = ctx.createLinearGradient(0, y, 0, y + len);
        gr.addColorStop(0, `rgba(${g() < 0.6 ? '120,70,40' : '60,56,50'},${0.12 + g() * 0.18})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, y, 3 + g() * 8, len);
      }
    },

    rust(ctx, W, H) {
      Mts.DRAW.corrugated(ctx, W, H);
    },

    planks(ctx, W, H) {
      planks(ctx, W, H, '#6e5644', 8, 413, true);
    },

    darkWood(ctx, W, H) {
      planks(ctx, W, H, '#3e2e24', 10, 414, false);
    },

    rock(ctx, W, H) {
      ctx.fillStyle = '#c8a678';
      ctx.fillRect(0, 0, W, H);
      const g = rand(415);
      for (let i = 0; i < 60; i++) {
        const x = g() * W, y = g() * H, rx = W * (0.05 + g() * 0.18), ry = rx * (0.3 + g() * 0.5);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
        gr.addColorStop(0, `rgba(${g() < 0.5 ? '150,112,82' : '220,190,152'},${0.18 + g() * 0.2})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        ctx.translate(-x, -y);
        ctx.fillStyle = gr;
        ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
        ctx.restore();
      }
      for (let i = 0; i < 10; i++) {
        const y = g() * H, h = 2 + g() * 6;
        ctx.fillStyle = `rgba(${g() < 0.5 ? '140,104,76' : '226,198,160'},${0.08 + g() * 0.1})`;
        ctx.fillRect(0, y, W, h);
      }
      speckle(ctx, W, H, 416, 3600, '236,212,178', '100,72,50', 3);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(96,66,46,${0.15 + g() * 0.22})`;
        ctx.lineWidth = 1 + g() * 2;
        ctx.beginPath();
        let x = g() * W, y = g() * H;
        ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (g() - 0.5) * 24;
          y += 8 + g() * 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },

    gravel(ctx, W, H) {
      ctx.fillStyle = '#a49884';
      ctx.fillRect(0, 0, W, H);
      const g = rand(417);
      for (let i = 0; i < 2400; i++) {
        const c = g();
        ctx.fillStyle = c < 0.35 ? `rgba(80,72,62,${0.2 + g() * 0.3})` : c < 0.7 ? `rgba(200,190,172,${0.2 + g() * 0.3})` : `rgba(150,130,104,${0.25 + g() * 0.3})`;
        const s = 1.5 + g() * 3.5;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, s, s * (0.6 + g() * 0.4), g() * PI, 0, PI * 2);
        ctx.fill();
      }
    },

    sky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#8e8aa0');
      g.addColorStop(0.45, '#b4b0be');
      g.addColorStop(0.75, '#d6d0d2');
      g.addColorStop(1, '#e6dcd4');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      clouds(ctx, W, H, H * 0.35, H * 0.85, 418, 0.55);
      clouds(ctx, W, H, H * 0.55, H * 0.8, 419, 0.7);
    },

    warning(ctx, W, H) {
      ctx.fillStyle = '#e8c838';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#2a2420';
      ctx.lineWidth = H * 0.06;
      ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H * 0.9);
      ctx.fillStyle = '#2a2420';
      ctx.font = `bold ${Math.round(H * 0.3)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WARNING', W / 2, H * 0.3);
      ctx.font = `bold ${Math.round(H * 0.2)}px ${SANS}`;
      ctx.fillText('HAZARD', W / 2, H * 0.57);
      ctx.fillText('AREA', W / 2, H * 0.8);
    },

    danger(ctx, W, H) {
      ctx.fillStyle = '#ece8e0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1c1a18';
      ctx.fillRect(0, 0, W, H * 0.42);
      ctx.fillStyle = '#c8281e';
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.21, W * 0.4, H * 0.15, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4f0ea';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#f4f0ea';
      ctx.font = `bold ${Math.round(H * 0.17)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DANGER', W / 2, H * 0.22);
      ctx.fillStyle = '#1c1a18';
      ctx.font = `${Math.round(H * 0.24)}px ${COND}`;
      ctx.fillText('EXPLOSIVES', W / 2, H * 0.68);
      speckle(ctx, W, H, 420, 500, '255,255,255', '60,50,40', 2);
    },

    signB(ctx, W, H) {
      DRAW.pointSign(ctx, W, H, 'B');
    },

    signC(ctx, W, H) {
      DRAW.pointSign(ctx, W, H, 'C');
    },

    pointSign(ctx, W, H, letter) {
      ctx.fillStyle = '#ece6dc';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8352a';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.44, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ece6dc';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.36, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8352a';
      ctx.font = `bold ${Math.round(H * 0.56)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, W / 2, H * 0.53);
    },

    capture(ctx, W, H) {
      ctx.fillStyle = '#b8352a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ece6dc';
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.5);
      ctx.lineTo(W * 0.24, H * 0.14);
      ctx.lineTo(W * 0.24, H * 0.3);
      ctx.lineTo(W * 0.94, H * 0.3);
      ctx.lineTo(W * 0.94, H * 0.7);
      ctx.lineTo(W * 0.24, H * 0.7);
      ctx.lineTo(W * 0.24, H * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b8352a';
      ctx.font = `bold ${Math.round(H * 0.26)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CAPTURE POINT', W * 0.6, H * 0.52);
    },

    chain(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(150,150,146,1)';
      ctx.lineWidth = 2.2;
      const n = 8;
      for (let i = -n; i <= n * 2; i++) {
        ctx.beginPath();
        ctx.moveTo((i / n) * W, 0);
        ctx.lineTo((i / n) * W + W, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((i / n) * W, 0);
        ctx.lineTo((i / n) * W - W, H);
        ctx.stroke();
      }
    },

    hazard(ctx, W, H) {
      ctx.fillStyle = '#e0b830';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#26221e';
      for (let i = -4; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 6, 0);
        ctx.lineTo(i * W / 6 + W / 12, 0);
        ctx.lineTo(i * W / 6 + W / 12 + H, H);
        ctx.lineTo(i * W / 6 + H, H);
        ctx.closePath();
        ctx.fill();
      }
    },

    cloud(ctx, W, H) {
      DRAW.lumps(ctx, W, H, 441, ['rgba(250,250,250,1)', 'rgba(200,200,200,1)', 'rgba(140,140,140,1)']);
    },

    fireCloud(ctx, W, H) {
      DRAW.lumps(ctx, W, H, 442, ['rgba(255,244,176,1)', 'rgba(255,170,48,1)', 'rgba(226,88,18,1)']);
    },

    lumps(ctx, W, H, seed, cols) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(seed);
      const blobs = [[W / 2, H / 2, W * 0.27]];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2 + g() * 0.5, r = W * (0.16 + g() * 0.08);
        blobs.push([W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, W * (0.1 + g() * 0.07)]);
      }
      const paint = (scale, col) => {
        ctx.fillStyle = col;
        blobs.forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(W / 2 + (x - W / 2) * scale, H / 2 + (y - H / 2) * scale, r * scale, 0, PI * 2);
          ctx.fill();
        });
      };
      paint(1, cols[2]);
      paint(0.82, cols[1]);
      paint(0.55, cols[0]);
    },

    window(ctx, W, H) {
      ctx.fillStyle = '#3a3c40';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d8dce0';
      const g = rand(421);
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 4; i++) {
          const x = W * (0.06 + i * 0.235), y = H * (0.06 + j * 0.31);
          ctx.fillStyle = `rgba(${200 + g() * 40},${206 + g() * 30},${214 + g() * 30},0.85)`;
          ctx.fillRect(x, y, W * 0.2, H * 0.26);
        }
      }
    }
  };

  const SIZES = {
    title: [1024, 576], orange: [1024, 576], crateLabel: [256, 192], crateWood: [128, 128], fragile: [256, 128], redShed: [256, 256], label: [256, 128],
    blueprint: [256, 256], concrete: [256, 256], tin: [256, 256], rust: [256, 256], planks: [256, 256], darkWood: [256, 256], rock: [256, 256], gravel: [256, 256],
    sky: [512, 256], cloud: [256, 256], fireCloud: [256, 256], warning: [256, 160], danger: [256, 192], signB: [128, 128], signC: [128, 128], capture: [256, 96], chain: [128, 128], hazard: [256, 64], window: [128, 96]
  };

  const REPEAT = ['concrete', 'tin', 'rust', 'planks', 'darkWood', 'rock', 'gravel', 'chain', 'hazard', 'crateWood', 'sky'];
  const SHARED = ['tf2', 'tf2emblem', 'flash', 'glow', 'puff', 'flame'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (SHARED.includes(key)) return Meet.tex(r, cache, key);
      const [w, h] = SIZES[key] || [256, 256];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
    }
    return cache[key];
  }

  window.DemoArt = { DRAW, SIZES, SLAB, tex, slabWord };
})();
