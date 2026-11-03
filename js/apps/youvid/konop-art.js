(function () {
  const { rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const JP = '"Yu Gothic", "MS Gothic", sans-serif';
  const LAT = '"Segoe UI", Arial, sans-serif';

  function fillBg(ctx, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, h);
  }

  function vgrad(ctx, w, h, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(([k, c]) => g.addColorStop(k, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function puff(ctx, g, x, y, sc, top, shade, alpha, flat) {
    const parts = [];
    const n = 6 + Math.floor(g() * 5);
    for (let i = 0; i < n; i++) {
      const k = (i / (n - 1)) * 2 - 1;
      parts.push([k * 46 + (g() - 0.5) * 18, -(1 - k * k) * (24 + g() * 26) + (g() - 0.5) * 8, 20 + (1 - Math.abs(k)) * 22 + g() * 12]);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc * (flat || 0.6));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = shade;
    parts.forEach(([px, py, r]) => { ctx.beginPath(); ctx.arc(px, py + 9, r, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = top;
    parts.forEach(([px, py, r]) => { ctx.beginPath(); ctx.arc(px - 3, py - 3, r * 0.9, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    parts.forEach(([px, py, r]) => { ctx.beginPath(); ctx.arc(px - 8, py - 10, r * 0.45, 0, PI * 2); ctx.fill(); });
    ctx.restore();
  }

  function sky(o) {
    return (ctx, w, h) => {
      vgrad(ctx, w, h, o.stops);
      const g = rand(o.seed || 1);
      if (o.glow) {
        const [gx, gy, gr, gc] = o.glow;
        const rg = ctx.createRadialGradient(gx * w, gy * h, 2, gx * w, gy * h, gr * w);
        rg.addColorStop(0, gc);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      }
      for (let i = 0; i < (o.stars || 0); i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + g() * 0.7})`;
        const s = g() < 0.1 ? 2 : 1;
        ctx.fillRect(g() * w, g() * h * 0.8, s, s);
      }
      for (let i = 0; i < (o.wisps || 0); i++) {
        const y = h * (0.08 + g() * 0.75), x = g() * w, len = 60 + g() * 220;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((g() - 0.5) * 0.3);
        ctx.fillStyle = o.wispCol || 'rgba(255,255,255,0.35)';
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.ellipse((g() - 0.5) * len * 0.4, (g() - 0.5) * 8, len * (0.3 + g() * 0.4), 3 + g() * 7, 0, 0, PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      for (let i = 0; i < (o.clouds || 0); i++) {
        const y = h * (o.cloudBand ? lerp(o.cloudBand[0], o.cloudBand[1], g()) : 0.25 + g() * 0.7);
        const x = g() * w;
        const sc = (o.cloudScale || 0.5) * (0.5 + g() * 0.9) * (0.5 + y / h);
        const top = o.cloudTop || '#ffffff', shade = o.cloudShade || '#b8cbe8';
        puff(ctx, g, x, y, sc, top, shade, 0.95, o.cloudFlat);
        if (x < 120) puff(ctx, rand(i + 50), x + w, y, sc, top, shade, 0.95, o.cloudFlat);
        if (x > w - 120) puff(ctx, rand(i + 50), x - w, y, sc, top, shade, 0.95, o.cloudFlat);
      }
    };
  }

  function ridge(g, w, base, amp, rough) {
    const pts = [];
    const f1 = 1 + Math.floor(g() * 3), f2 = 3 + Math.floor(g() * 5), p1 = g() * 6, p2 = g() * 6;
    for (let x = 0; x <= w; x += 4) {
      const u = x / w;
      const y = base - amp * (0.55 + 0.3 * S(u * PI * 2 * f1 + p1) + 0.15 * S(u * PI * 2 * f2 + p2)) - rough * (g() - 0.5);
      pts.push([x, y]);
    }
    return pts;
  }

  function pano(o) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = rand(o.seed || 3);
      (o.ridges || []).forEach(rd => {
        const pts = ridge(g, w, rd.base * h, rd.amp * h, rd.rough || 2);
        ctx.fillStyle = rd.col;
        ctx.beginPath();
        ctx.moveTo(0, h);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        if (rd.light) {
          ctx.strokeStyle = rd.light;
          ctx.lineWidth = 2;
          ctx.beginPath();
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 2) : ctx.moveTo(x, y + 2)));
          ctx.stroke();
        }
        if (rd.trees) {
          ctx.fillStyle = rd.trees;
          pts.forEach(([x, y], i) => {
            if (i % 2) return;
            ctx.beginPath();
            ctx.arc(x, y + 2, 3 + g() * 5, 0, PI * 2);
            ctx.fill();
          });
        }
      });
      if (o.fields) {
        const top = o.fields[0] * h;
        ctx.fillStyle = o.fieldCol || '#5a9a4a';
        ctx.fillRect(0, top, w, h - top);
        for (let i = 0; i < 420; i++) {
          const y = top + g() * (h - top), x = g() * w;
          const pw = 8 + g() * 34, ph = 2 + g() * 5 * (0.4 + (y - top) / (h - top));
          ctx.fillStyle = ['#6fae52', '#4e8a3e', '#86b85c', '#a6c46a', '#3f7a3a', '#7aa24e'][Math.floor(g() * 6)];
          ctx.fillRect(x, y, pw, ph);
        }
        if (o.town) {
          const [cx, cw] = o.town;
          for (let i = 0; i < 900; i++) {
            const x = cx * w + (g() - 0.5) * cw * w * (0.4 + g() * 0.6);
            const y = top + 2 + g() * (h - top) * 0.45;
            ctx.fillStyle = g() < 0.6 ? ['#c86a4a', '#d88a5a', '#b85a3e'][Math.floor(g() * 3)] : ['#e8dcc8', '#c8b8a0'][Math.floor(g() * 2)];
            ctx.fillRect(x, y, 2 + g() * 3, 1 + g() * 2);
          }
        }
        if (o.river) {
          ctx.strokeStyle = o.river;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 8) {
            const y = top + (h - top) * (0.35 + 0.25 * S(x / w * PI * 3 + 1) + 0.15 * S(x / w * PI * 7));
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      if (o.haze) {
        const hg = ctx.createLinearGradient(0, 0, 0, h);
        hg.addColorStop(0, 'rgba(0,0,0,0)');
        hg.addColorStop(1, o.haze);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  function grass(base, light, dark, seed) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, base);
      const g = rand(seed || 11);
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = g() < 0.5 ? light : dark;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, 8 + g() * 36, 4 + g() * 14, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'round';
      for (let i = 0; i < 2400; i++) {
        const x = g() * w, y = g() * h, bh = 4 + g() * 12, tilt = (g() - 0.5) * 7;
        ctx.strokeStyle = g() < 0.5 ? light : dark;
        ctx.globalAlpha = 0.4 + g() * 0.4;
        ctx.lineWidth = 1 + g() * 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + tilt * 0.3, y - bh * 0.6, x + tilt, y - bh);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  function speckle(base, cols, seed, n, size) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, base);
      const g = rand(seed);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.globalAlpha = 0.35 + g() * 0.5;
        const s = (size || 6) * (0.3 + g());
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, s, s * (0.4 + g() * 0.6), g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  }

  function rock(base, light, dark, seed) {
    return (ctx, w, h) => {
      speckle(base, [light, dark, base], seed, 260, 18)(ctx, w, h);
      const g = rand(seed + 7);
      ctx.strokeStyle = dark;
      ctx.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        let x = g() * w, y = g() * h;
        ctx.lineWidth = 1 + g() * 2.5;
        ctx.globalAlpha = 0.5 + g() * 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (g() - 0.3) * 40;
          y += (g() - 0.5) * 22;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = light;
      for (let i = 0; i < 30; i++) {
        const x = g() * w, y = g() * h;
        ctx.lineWidth = 2 + g() * 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20 + g() * 40, y + (g() - 0.5) * 10);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  function bricks(base, mortar, seed, rows, cols, jitter) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, mortar);
      const g = rand(seed);
      const rh = h / rows, bw = w / cols;
      for (let r = 0; r < rows; r++) {
        for (let c = -1; c <= cols; c++) {
          const x = c * bw + (r % 2 ? bw / 2 : 0);
          const v = (g() - 0.5) * (jitter || 24);
          ctx.fillStyle = shadeHex(base, v);
          ctx.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(x + 2, r * rh + 2, bw - 4, 3);
        }
      }
    };
  }

  function shadeHex(hex, v) {
    const n = parseInt(hex.slice(1), 16);
    const r = clamp(((n >> 16) & 255) + v, 0, 255), gg = clamp(((n >> 8) & 255) + v, 0, 255), b = clamp((n & 255) + v, 0, 255);
    return `rgb(${r | 0},${gg | 0},${b | 0})`;
  }

  function planks(base, line, seed, n, vertical) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, base);
      const g = rand(seed);
      for (let i = 0; i < n; i++) {
        const v = (g() - 0.5) * 30;
        ctx.fillStyle = shadeHex(base, v);
        if (vertical) ctx.fillRect((i / n) * w + 1, 0, w / n - 2, h);
        else ctx.fillRect(0, (i / n) * h + 1, w, h / n - 2);
      }
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        if (vertical) { ctx.moveTo((i / n) * w, 0); ctx.lineTo((i / n) * w, h); } else { ctx.moveTo(0, (i / n) * h); ctx.lineTo(w, (i / n) * h); }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 80; i++) {
        ctx.strokeStyle = g() < 0.5 ? '#000' : '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const x = g() * w, y = g() * h;
        if (vertical) { ctx.moveTo(x, y); ctx.lineTo(x + (g() - 0.5) * 3, y + 20 + g() * 40); } else { ctx.moveTo(x, y); ctx.lineTo(x + 20 + g() * 40, y + (g() - 0.5) * 3); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  function tiles(base, edge, seed) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, edge);
      const g = rand(seed);
      const rows = 10, cols = 8, rh = h / rows, cw = w / cols;
      for (let r = 0; r < rows; r++) {
        for (let c = -1; c <= cols; c++) {
          const x = c * cw + (r % 2 ? cw / 2 : 0);
          ctx.fillStyle = shadeHex(base, (g() - 0.5) * 30);
          ctx.beginPath();
          ctx.moveTo(x + 1, r * rh);
          ctx.lineTo(x + cw - 1, r * rh);
          ctx.lineTo(x + cw - 1, r * rh + rh * 0.8);
          ctx.quadraticCurveTo(x + cw / 2, r * rh + rh * 1.05, x + 1, r * rh + rh * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x + 2, r * rh + 1, cw - 4, 3);
        }
      }
    };
  }

  function plaster(seed) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, '#efe6d6');
      const g = rand(seed);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = g() < 0.5 ? 'rgba(170,150,120,0.12)' : 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, 6 + g() * 20, 3 + g() * 10, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#6a4a32';
      ctx.fillRect(0, 0, w, 10);
      ctx.fillRect(0, h - 10, w, 10);
      ctx.fillRect(0, 0, 10, h);
      ctx.fillRect(w - 10, 0, 10, h);
      [[0.32, 0.3], [0.68, 0.3]].forEach(([u, v]) => {
        const x = u * w, y = v * h;
        ctx.fillStyle = '#5a3a26';
        ctx.fillRect(x - 30, y - 34, 60, 76);
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(x - 24, y - 28, 48, 64);
        ctx.fillStyle = 'rgba(200,230,255,0.45)';
        ctx.fillRect(x - 24, y - 28, 20, 64);
        ctx.fillStyle = '#5a3a26';
        ctx.fillRect(x - 2, y - 28, 4, 64);
        ctx.fillRect(x - 24, y + 2, 48, 4);
      });
      ctx.fillStyle = '#6a4a32';
      ctx.fillRect(0, h * 0.62, w, 8);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.8);
      ctx.fillRect(-6, -40, 12, 80);
      ctx.restore();
    };
  }

  function stoneBlocks(base, seed) {
    return bricks(base, shadeHex(base, -40), seed, 8, 4, 30);
  }

  function darkFloor(ctx, w, h) {
    fillBg(ctx, w, h, '#07080c');
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#0e1016' : '#15171f';
        ctx.fillRect(i * s, j * s, s, s);
      }
    }
    const g = rand(97);
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(200,220,255,${0.05 + g() * 0.2})`;
      ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1);
    }
    ctx.strokeStyle = 'rgba(160,190,230,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10 + g() * 50, y + (g() - 0.5) * 4);
      ctx.stroke();
    }
  }

  function water(base, light, seed) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, base);
      const g = rand(seed);
      ctx.strokeStyle = light;
      ctx.lineCap = 'round';
      for (let i = 0; i < 90; i++) {
        const x = g() * w, y = g() * h, l = 10 + g() * 40;
        ctx.globalAlpha = 0.3 + g() * 0.5;
        ctx.lineWidth = 1 + g() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  function lilyPad(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = w * 0.47;
    ctx.fillStyle = '#5cae3e';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -PI / 2 + 0.22, -PI / 2 - 0.22 + PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7cc850';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.8, PI * 0.2, PI * 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3e8a2e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = -PI / 2 + 0.4 + (i / 12) * (PI * 2 - 0.8);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + C(a) * r * 0.95, cy + S(a) * r * 0.95);
      ctx.stroke();
    }
  }

  function treeBill(top, mid, dark, trunk, seed) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = rand(seed);
      ctx.fillStyle = trunk;
      ctx.fillRect(w * 0.46, h * 0.55, w * 0.08, h * 0.45);
      const blobs = [];
      for (let i = 0; i < 18; i++) blobs.push([w * (0.2 + g() * 0.6), h * (0.12 + g() * 0.5), w * (0.1 + g() * 0.12)]);
      ctx.fillStyle = dark;
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y + 6, r, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = mid;
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x - 2, y, r * 0.9, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = top;
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x - 6, y - 6, r * 0.5, 0, PI * 2); ctx.fill(); });
    };
  }

  function bladeStrip(col, tip, seed, dense) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = rand(seed);
      for (let i = 0; i < (dense || 220); i++) {
        const x = g() * w, bh = h * (0.35 + g() * 0.65), lean = (g() - 0.5) * 30;
        const bw = 3 + g() * 6;
        ctx.fillStyle = g() < 0.3 ? tip : col;
        ctx.beginPath();
        ctx.moveTo(x - bw, h);
        ctx.quadraticCurveTo(x + lean * 0.3, h - bh * 0.6, x + lean, h - bh);
        ctx.quadraticCurveTo(x + lean * 0.3 + bw * 0.3, h - bh * 0.5, x + bw, h);
        ctx.closePath();
        ctx.fill();
      }
    };
  }

  function glow(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function spark(ctx, w, h) {
    glow(ctx, w, h);
    ctx.fillStyle = '#fff';
    const cx = w / 2, cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2, r = i % 2 ? w * 0.06 : w * 0.5;
      ctx.lineTo(cx + C(a) * r, cy + S(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function bubble(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const cx = w / 2, cy = h / 2, r = w * 0.46;
    const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    g.addColorStop(0, 'rgba(40,120,140,1)');
    g.addColorStop(0.85, 'rgba(110,210,230,1)');
    g.addColorStop(1, 'rgba(220,255,255,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.4, cy - r * 0.45, r * 0.2, r * 0.12, -0.6, 0, PI * 2);
    ctx.fill();
  }

  function feather(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.46);
    ctx.quadraticCurveTo(w * 0.2, -h * 0.1, w * 0.06, h * 0.36);
    ctx.lineTo(-w * 0.04, h * 0.36);
    ctx.quadraticCurveTo(-w * 0.16, -h * 0.05, 0, -h * 0.46);
    ctx.fill();
    ctx.strokeStyle = '#c8d4e4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.4);
    ctx.lineTo(w * 0.01, h * 0.46);
    ctx.stroke();
    ctx.strokeStyle = '#dde6f0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const y = -h * 0.3 + i * h * 0.07;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo((i % 2 ? 1 : -1) * w * 0.12, y - h * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  function puffSprite(top, shade, seed) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const g = rand(seed);
      const blobs = [];
      for (let i = 0; i < 9; i++) blobs.push([w * (0.25 + g() * 0.5), h * (0.3 + g() * 0.4), w * (0.14 + g() * 0.12)]);
      ctx.fillStyle = shade;
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y + r * 0.2, r, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = top;
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.1, r * 0.82, 0, PI * 2); ctx.fill(); });
    };
  }

  function streak(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    const v = ctx.createLinearGradient(0, 0, 0, h);
    ctx.fillRect(0, h * 0.35, w, h * 0.3);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(w * 0.2, h * 0.46, w * 0.6, h * 0.08);
  }

  function crossStar(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const cx = w / 2, cy = h / 2;
    const cols = ['#ff3060', '#ff9a20', '#f8f040', '#40f070', '#30c8ff', '#8a60ff'];
    [[w, h * 0.04], [w * 0.04, h]].forEach(([bw, bh], k) => {
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.6;
        const off = (i - 2.5) * (k ? 3 : 3);
        if (k) ctx.fillRect(cx - bw / 2 + off, cy - bh / 2, bw, bh);
        else ctx.fillRect(cx - bw / 2, cy - bh / 2 + off, bw, bh);
      });
    });
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function magicCircle(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const cx = w / 2, cy = h / 2, R = w * 0.48;
    ctx.shadowColor = 'rgba(255,120,40,1)';
    ctx.shadowBlur = 10;
    const ringAt = (r, lw, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, PI * 2);
      ctx.stroke();
    };
    ringAt(R, 6, '#ffb040');
    ringAt(R * 0.92, 3, '#ff6a20');
    ringAt(R * 0.72, 4, '#ffb040');
    ringAt(R * 0.66, 2, '#ff5020');
    ringAt(R * 0.3, 3, '#ffd060');
    const g = rand(1203);
    ctx.fillStyle = '#ffd890';
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * PI * 2;
      ctx.save();
      ctx.translate(cx + C(a) * R * 0.82, cy + S(a) * R * 0.82);
      ctx.rotate(a + PI / 2);
      const k = Math.floor(g() * 4);
      if (k === 0) ctx.fillRect(-5, -9, 10, 4);
      if (k <= 1) ctx.fillRect(-2, -9, 4, 18);
      if (k === 2) { ctx.beginPath(); ctx.arc(0, 0, 6, 0, PI * 2); ctx.fill(); }
      if (k === 3) { ctx.fillRect(-6, 4, 12, 4); ctx.fillRect(-6, -8, 4, 12); }
      ctx.restore();
    }
    ctx.strokeStyle = '#ff8a30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i * 2 / 6) * PI * 2 * 1.0 + PI / 2;
      const x = cx + C(a * 1) * R * 0.66, y = cy + S(a * 1) * R * 0.66;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    [0, PI].forEach(off => {
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = off + (i / 3) * PI * 2 - PI / 2;
        const x = cx + C(a) * R * 0.66, y = cy + S(a) * R * 0.66;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.32);
    cg.addColorStop(0, 'rgba(255,240,180,1)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);
  }

  function textLines(lines, o) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const sc = o.scale || 1;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.lineJoin = 'round';
      lines.forEach(([text, x0, y0, x1, y1, opt]) => {
        const lo = opt || {};
        const size = (y1 - y0) / (lo.latin ? 0.74 : 0.9) * sc;
        ctx.font = `${lo.weight || o.weight || 'bold'} ${size}px ${lo.latin ? LAT : o.font || JP}`;
        const tw = ctx.measureText(text).width || 1;
        const kx = clamp(((x1 - x0) * sc) / tw, 0.6, 1.5);
        ctx.save();
        ctx.translate((x0 - o.x0) * sc, ((y0 + y1) / 2 - o.y0) * sc);
        ctx.scale(kx, 1);
        if (o.edge) {
          ctx.strokeStyle = o.edge;
          ctx.lineWidth = (o.edgeW || 0.14) * size;
          ctx.strokeText(text, 0, 0);
        }
        ctx.fillStyle = lo.col || o.col;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      });
    };
  }

  function glyph(ch, o) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineJoin = 'round';
      if (ch === '!') {
        ctx.save();
        ctx.translate(w * 0.5, h * 0.5);
        ctx.rotate(0.12);
        ctx.beginPath();
        ctx.moveTo(-w * 0.14, -h * 0.47);
        ctx.lineTo(w * 0.16, -h * 0.47);
        ctx.lineTo(w * 0.05, h * 0.18);
        ctx.lineTo(-w * 0.07, h * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = w * 0.07;
        ctx.beginPath();
        ctx.arc(-w * 0.02, h * 0.36, w * 0.09, 0, PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }
      const size = h * (o && o.size || 0.86);
      ctx.font = `bold ${size}px ${JP}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = size * (o && o.fat !== undefined ? o.fat : 0.09);
      const txt = ch;
      if (o && o.slant) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.transform(1, 0, -o.slant, 1, 0, 0);
        ctx.strokeText(txt, 0, h * 0.04);
        ctx.fillText(txt, 0, h * 0.04);
        ctx.restore();
        return;
      }
      ctx.strokeText(txt, w / 2, h / 2 + h * 0.04);
      ctx.fillText(txt, w / 2, h / 2 + h * 0.04);
    };
  }

  function wordTex(text, o) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      let px = h * (o.size || 0.7);
      ctx.font = `${o.weight || 'bold'} ${px}px ${o.font || LAT}`;
      const tw = ctx.measureText(text).width;
      if (tw > w * 0.96) {
        px *= (w * 0.96) / tw;
        ctx.font = `${o.weight || 'bold'} ${px}px ${o.font || LAT}`;
      }
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'middle';
      const x = o.align === 'left' ? h * 0.1 : w / 2;
      if (o.shadow) {
        ctx.fillStyle = o.shadow;
        ctx.fillText(text, x + h * 0.04, h / 2 + h * 0.05);
      }
      if (o.edge) {
        ctx.strokeStyle = o.edge;
        ctx.lineWidth = h * (o.edgeW || 0.08);
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, h / 2);
      }
      ctx.fillStyle = o.col || '#fff';
      ctx.fillText(text, x, h / 2);
    };
  }

  const RING_TEXT = 'KONO SUBARASHII SEKAI NI SYUKUFUKU WO! ';

  function ring(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w * 0.49;
    const col = '#7a2626';
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = w * 0.006;
    [0.8, 0.7, 0.665].forEach(k => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * k, 0, PI * 2);
      ctx.stroke();
    });
    const n = 120;
    ctx.lineWidth = w * 0.004;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2;
      const r = R * (i % 2 ? 0.785 : 0.715);
      const x = cx + C(a) * r, y = cy + S(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < n; i += 2) {
      const a = ((i + 1) / n) * PI * 2;
      ctx.beginPath();
      ctx.arc(cx + C(a) * R * 0.735, cy + S(a) * R * 0.735, w * 0.004, 0, PI * 2);
      ctx.fill();
    }
    ctx.font = `bold ${w * 0.075}px ${LAT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = RING_TEXT + RING_TEXT;
    for (let i = 0; i < txt.length; i++) {
      const a = (i / txt.length) * PI * 2;
      ctx.save();
      ctx.translate(cx + C(a) * R * 0.9, cy + S(a) * R * 0.9);
      ctx.rotate(a + PI / 2);
      ctx.fillText(txt[i], 0, 0);
      ctx.restore();
    }
  }

  function cardLetter(ch, col, label) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `bold ${h * 0.9}px ${JP}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(150,150,160,1)';
      ctx.strokeStyle = 'rgba(150,150,160,1)';
      ctx.lineWidth = h * 0.05;
      ctx.strokeText(ch, w / 2 + w * 0.05, h / 2 + h * 0.07);
      ctx.fillText(ch, w / 2 + w * 0.05, h / 2 + h * 0.07);
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.strokeText(ch, w / 2, h / 2 + h * 0.03);
      ctx.fillText(ch, w / 2, h / 2 + h * 0.03);
      if (label) {
        ctx.fillStyle = '#7a2626';
        ctx.font = `bold ${h * 0.09}px ${LAT}`;
        ctx.fillText(label, w * 0.5, h * 0.95);
      }
    };
  }

  function episode(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    const draw = (text, x, y, size) => {
      ctx.font = `bold ${size}px ${JP}`;
      ctx.shadowColor = 'rgba(80,200,255,1)';
      ctx.shadowBlur = size * 0.25;
      ctx.strokeStyle = '#eaf8ff';
      ctx.lineWidth = size * 0.16;
      ctx.strokeText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1e9cf0';
      ctx.fillText(text, x, y);
    };
    draw('第2話', w * 0.02, h * 0.36, h * 0.27);
    draw('「この中二病に爆焔を！」', w * 0.0, h * 0.86, h * 0.3);
  }

  function endLabel(text) {
    return wordTex(text, { size: 0.62, col: '#ffffff', shadow: 'rgba(0,0,0,0.55)', font: LAT });
  }

  function copyright(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${h * 0.62}px ${JP}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(40,40,40,0.8)';
    ctx.fillText('© 2016 暁なつめ・三嶋くろね／KADOKAWA／このすば製作委員会', w * 0.012, h * 0.56);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('© 2016 暁なつめ・三嶋くろね／KADOKAWA／このすば製作委員会', w * 0.01, h * 0.52);
  }

  function windowLattice(warm) {
    return (ctx, w, h) => {
      fillBg(ctx, w, h, warm ? '#f8d890' : '#9ad8ff');
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 4, w * 0.5, h * 0.4, w * 0.7);
      g.addColorStop(0, warm ? 'rgba(255,250,220,1)' : 'rgba(230,250,255,1)');
      g.addColorStop(1, warm ? 'rgba(200,140,60,1)' : 'rgba(40,110,200,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = warm ? '#4a2a14' : '#0a1a3a';
      ctx.lineWidth = w * 0.035;
      ctx.strokeRect(0, 0, w, h);
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo((i / 3) * w, 0);
        ctx.lineTo((i / 3) * w, h);
        ctx.moveTo(0, (i / 3) * h);
        ctx.lineTo(w, (i / 3) * h);
        ctx.stroke();
      }
      ctx.lineWidth = w * 0.02;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc((i + 0.5) / 3 * w, (j + 0.5) / 3 * h, w * 0.1, 0, PI * 2);
          ctx.stroke();
        }
      }
    };
  }

  function gothicWindow(ctx, w, h) {
    fillBg(ctx, w, h, '#020610');
    ctx.fillStyle = '#2a8ae0';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h);
    ctx.lineTo(w * 0.1, h * 0.25);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.05, w * 0.9, h * 0.25);
    ctx.lineTo(w * 0.9, h);
    ctx.closePath();
    ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(180,240,255,0.9)');
    g.addColorStop(1, 'rgba(20,80,180,0.2)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#020610';
    ctx.lineWidth = w * 0.05;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.1 + i * 0.2), h * 0.2);
      ctx.lineTo(w * (0.1 + i * 0.2), h);
      ctx.stroke();
    }
    for (let j = 1; j < 6; j++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * (0.25 + j * 0.13));
      ctx.lineTo(w * 0.9, h * (0.25 + j * 0.13));
      ctx.stroke();
    }
  }

  function shelves(ctx, w, h) {
    fillBg(ctx, w, h, '#3a2214');
    const g = rand(1301);
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y0 = (r / rows) * h;
      ctx.fillStyle = '#2a160c';
      ctx.fillRect(0, y0, w, h / rows);
      let x = 6;
      while (x < w - 10) {
        const bw = 10 + g() * 18, bh = h / rows * (0.45 + g() * 0.4);
        const cols = ['#5aa8a0', '#8a3a7a', '#c8a040', '#3a6ab0', '#a84a2a', '#6aa84a'];
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.beginPath();
        ctx.moveTo(x, y0 + h / rows - 4);
        ctx.lineTo(x, y0 + h / rows - bh * 0.6);
        ctx.lineTo(x + bw * 0.3, y0 + h / rows - bh);
        ctx.lineTo(x + bw * 0.7, y0 + h / rows - bh);
        ctx.lineTo(x + bw, y0 + h / rows - bh * 0.6);
        ctx.lineTo(x + bw, y0 + h / rows - 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 2, y0 + h / rows - bh * 0.55, 3, bh * 0.4);
        x += bw + 3 + g() * 6;
      }
      ctx.fillStyle = '#6a4024';
      ctx.fillRect(0, y0 + h / rows - 5, w, 5);
    }
  }

  function wizSign(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#c8783a';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.48, h * 0.44, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a2a10';
    ctx.lineWidth = h * 0.06;
    ctx.stroke();
    ctx.strokeStyle = '#f0c890';
    ctx.lineWidth = h * 0.025;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.4, h * 0.34, 0, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4a1e0c';
    ctx.font = `bold ${h * 0.34}px ${LAT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ᚹᛁᛉ ✦ ᛊᚺᛟᛈ', w / 2, h / 2);
  }

  function lightRays(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = rand(1409);
    for (let i = 0; i < 9; i++) {
      const x = w * (0.1 + g() * 0.8), bw = w * (0.03 + g() * 0.08);
      const lg = ctx.createLinearGradient(0, 0, 0, h);
      lg.addColorStop(0, `rgba(255,250,220,${0.5 + g() * 0.4})`);
      lg.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + bw, 0);
      ctx.lineTo(x + bw * 2.5 + w * 0.15, h);
      ctx.lineTo(x + w * 0.15, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function fireTex(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = ctx.createRadialGradient(w / 2, h * 0.75, 2, w / 2, h * 0.6, w * 0.5);
    g.addColorStop(0, 'rgba(255,250,200,1)');
    g.addColorStop(0.3, 'rgba(255,170,40,1)');
    g.addColorStop(0.7, 'rgba(200,50,10,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h);
    ctx.quadraticCurveTo(w * 0.05, h * 0.5, w * 0.35, h * 0.35);
    ctx.quadraticCurveTo(w * 0.4, h * 0.6, w * 0.5, 0);
    ctx.quadraticCurveTo(w * 0.62, h * 0.55, w * 0.68, h * 0.3);
    ctx.quadraticCurveTo(w * 0.98, h * 0.6, w * 0.85, h);
    ctx.closePath();
    ctx.fill();
  }

  function dome(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,230,1)');
    g.addColorStop(0.45, 'rgba(255,220,90,1)');
    g.addColorStop(0.8, 'rgba(255,120,20,1)');
    g.addColorStop(1, 'rgba(120,20,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rand(1511);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 6 + r() * 20, 3 + r() * 6, r() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function bread(ctx, w, h) {
    fillBg(ctx, w, h, '#c88a40');
    const g = rand(1601);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(150,90,30,0.6)' : 'rgba(240,200,130,0.6)';
      ctx.beginPath();
      ctx.arc(g() * w, g() * h, 2 + g() * 5, 0, PI * 2);
      ctx.fill();
    }
  }

  function burger(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const band = (y0, y1, col) => { ctx.fillStyle = col; ctx.fillRect(w * 0.1, y0 * h, w * 0.8, (y1 - y0) * h); };
    ctx.fillStyle = '#d89a48';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.35, w * 0.42, h * 0.25, 0, PI, 0);
    ctx.fill();
    band(0.35, 0.45, '#78c040');
    band(0.45, 0.55, '#d8382a');
    band(0.55, 0.68, '#6a3a1e');
    band(0.68, 0.74, '#f0c030');
    band(0.74, 0.88, '#d89a48');
  }

  function speedLines(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(1701);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const y = g() * h, x = g() * w, len = w * (0.2 + g() * 0.5), th = 1 + g() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y - th);
      ctx.lineTo(x + len, y + th);
      ctx.closePath();
      ctx.fill();
    }
  }

  function ribbon(ctx, w, h) {
    fillBg(ctx, w, h, '#000');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,170,230,1)');
    g.addColorStop(0.5, 'rgba(255,120,200,1)');
    g.addColorStop(1, 'rgba(160,110,255,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.1, w, h * 0.8);
  }

  window.KonopArt = {
    JP, LAT, sky, pano, grass, speckle, rock, bricks, planks, tiles, plaster, stoneBlocks, darkFloor, water, lilyPad, treeBill, bladeStrip,
    glow, spark, bubble, feather, puffSprite, streak, crossStar, magicCircle, textLines, glyph, wordTex, ring, cardLetter, episode,
    endLabel, copyright, windowLattice, gothicWindow, shelves, wizSign, lightRays, fireTex, dome, bread, burger, speedLines, ribbon, shadeHex
  };
})();
