(function (T) {
  'use strict';
  const { RNG, rgb, vnorm, clamp, lerp, MB } = T;

  const cvs = (w, h) => T.makeCanvas(w, h);

  function noiseFill(g, w, h, rng, base, amp, n, size) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = (rng.next() - 0.5) * amp;
      g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
      const s = size * (0.5 + rng.next());
      g.fillRect(rng.next() * w, rng.next() * h, s, s);
    }
  }

  const FLOOR = {
    wood(g, S, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, S, S);
      const rows = o.rows || 8, ph = S / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rng.next() * S * 0.5;
        while (x < S) {
          const len = S * (0.35 + rng.next() * 0.5);
          const k = 0.8 + rng.next() * 0.35;
          const c = rgb(o.c1);
          g.fillStyle = `rgb(${c[0] * 255 * k | 0},${c[1] * 255 * k | 0},${c[2] * 255 * k | 0})`;
          g.fillRect(x, r * ph + 1, len - 2, ph - 2);
          g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            g.beginPath();
            const yy = r * ph + 4 + rng.next() * (ph - 8);
            g.moveTo(x, yy);
            g.bezierCurveTo(x + len * 0.3, yy + (rng.next() - 0.5) * 6, x + len * 0.6, yy + (rng.next() - 0.5) * 6, x + len - 2, yy);
            g.stroke();
          }
          g.fillStyle = 'rgba(0,0,0,0.5)';
          g.fillRect(x + len - 2, r * ph, 2, ph);
          x += len;
        }
        g.fillStyle = o.gap || 'rgba(0,0,0,0.55)';
        g.fillRect(0, r * ph, S, 2);
      }
    },
    stone(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.18, 3000, 3);
      const n = o.tiles || 4, ts = S / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = 0.85 + rng.next() * 0.3;
        const c = rgb(o.c2 || o.c1);
        g.fillStyle = `rgba(${c[0] * 255 * k | 0},${c[1] * 255 * k | 0},${c[2] * 255 * k | 0},0.55)`;
        g.fillRect(x * ts + 3, y * ts + 3, ts - 6, ts - 6);
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 3;
        g.strokeRect(x * ts + 1.5, y * ts + 1.5, ts - 3, ts - 3);
        if (rng.chance(0.4)) {
          g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
          g.beginPath(); let px = x * ts + rng.next() * ts, py = y * ts + rng.next() * ts; g.moveTo(px, py);
          for (let i = 0; i < 4; i++) { px += (rng.next() - 0.5) * ts * 0.4; py += (rng.next() - 0.5) * ts * 0.4; g.lineTo(px, py); }
          g.stroke();
        }
        if (o.moss && rng.chance(0.35)) {
          g.fillStyle = 'rgba(60,90,40,0.35)';
          g.beginPath(); g.arc(x * ts + rng.next() * ts, y * ts + rng.next() * ts, 6 + rng.next() * 14, 0, Math.PI * 2); g.fill();
        }
      }
    },
    sand(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.16, 9000, 2);
      g.strokeStyle = 'rgba(120,90,50,0.12)'; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        g.beginPath(); const y0 = rng.next() * S;
        for (let x = 0; x <= S; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.03 + i) * 6);
        g.stroke();
      }
      if (o.shells) for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(255,245,230,0.7)'; g.beginPath(); g.arc(rng.next() * S, rng.next() * S, 2 + rng.next() * 2, 0, 7); g.fill(); }
    },
    asphalt(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.22, 12000, 2);
      if (o.puddles) for (let i = 0; i < 5; i++) {
        const rg = g.createRadialGradient(0, 0, 4, 0, 0, 60);
        rg.addColorStop(0, o.puddles); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(rng.next() * S, rng.next() * S); g.scale(1.8, 0.8); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill(); g.restore();
      }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        g.beginPath(); let px = rng.next() * S, py = rng.next() * S; g.moveTo(px, py);
        for (let k = 0; k < 6; k++) { px += (rng.next() - 0.5) * 60; py += (rng.next() - 0.5) * 60; g.lineTo(px, py); }
        g.stroke();
      }
      if (o.line) { g.fillStyle = o.line; for (let x = 0; x < S; x += S / 2) g.fillRect(x + 20, S / 2 - 6, S / 4, 12); }
    },
    snow(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.12, 8000, 3);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(90,95,105,${0.15 + rng.next() * 0.2})`;
        g.beginPath(); g.ellipse(rng.next() * S, rng.next() * S, 20 + rng.next() * 50, 10 + rng.next() * 25, rng.next() * 3, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 400; i++) g.fillRect(rng.next() * S, rng.next() * S, 2, 2);
    },
    metal(g, S, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, S, S);
      const n = 4, ts = S / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = 0.9 + rng.next() * 0.2;
        const c = rgb(o.c1);
        g.fillStyle = `rgb(${c[0] * 255 * k | 0},${c[1] * 255 * k | 0},${c[2] * 255 * k | 0})`;
        g.fillRect(x * ts + 2, y * ts + 2, ts - 4, ts - 4);
        g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
        for (let d = -ts; d < ts; d += 10) { g.beginPath(); g.moveTo(x * ts + d, y * ts); g.lineTo(x * ts + d + ts, y * ts + ts); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.5)';
        for (const [rx, ry] of [[8, 8], [ts - 8, 8], [8, ts - 8], [ts - 8, ts - 8]]) { g.beginPath(); g.arc(x * ts + rx, y * ts + ry, 3, 0, 7); g.fill(); }
      }
      if (o.stripe) { g.fillStyle = o.stripe; for (let i = -S; i < S * 2; i += 48) { g.save(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 24, 0); g.lineTo(i + 24 - S * 0.1, 30); g.lineTo(i - S * 0.1, 30); g.closePath(); g.fill(); g.restore(); } }
    },
    grass(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.2, 6000, 3);
      for (let i = 0; i < 2500; i++) {
        const x = rng.next() * S, y = rng.next() * S;
        g.strokeStyle = rng.chance(0.5) ? 'rgba(20,40,10,0.35)' : 'rgba(160,200,90,0.25)';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rng.next() - 0.5) * 4, y - 4 - rng.next() * 6); g.stroke();
      }
      if (o.path) { g.fillStyle = o.path; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rng.next() * S, rng.next() * S, 10 + rng.next() * 16, 6 + rng.next() * 10, rng.next() * 3, 0, 7); g.fill(); } }
    },
    sawdust(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.2, 14000, 2);
      g.fillStyle = 'rgba(255,230,180,0.25)';
      for (let i = 0; i < 1400; i++) g.fillRect(rng.next() * S, rng.next() * S, 3, 1);
    },
    lava(g, S, rng, o) {
      noiseFill(g, S, S, rng, o.c1, 0.25, 8000, 3);
      g.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        let px = rng.next() * S, py = rng.next() * S;
        const w = 2 + rng.next() * 5;
        for (let pass = 0; pass < 2; pass++) {
          g.strokeStyle = pass ? 'rgba(255,220,120,0.9)' : 'rgba(255,90,10,0.7)';
          g.lineWidth = pass ? w * 0.35 : w * 2.2;
          g.beginPath(); let x = px, y = py; g.moveTo(x, y);
          const r2 = new RNG(i * 31 + 7);
          for (let k = 0; k < 7; k++) { x += (r2.next() - 0.5) * 70; y += (r2.next() - 0.5) * 70; g.lineTo(x, y); }
          g.stroke();
        }
      }
    },
    grid(g, S, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, S, S);
      g.strokeStyle = o.c2; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * S / 8, 0); g.lineTo(i * S / 8, S); g.stroke(); g.beginPath(); g.moveTo(0, i * S / 8); g.lineTo(S, i * S / 8); g.stroke(); }
      g.lineWidth = 4; g.strokeRect(0, 0, S, S);
    },
    tatami(g, S, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, S, S);
      const draw = (x, y, w, h) => {
        g.fillStyle = o.c1; g.fillRect(x, y, w, h);
        g.strokeStyle = 'rgba(80,90,40,0.25)'; g.lineWidth = 1;
        if (w > h) for (let yy = y; yy < y + h; yy += 3) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
        else for (let xx = x; xx < x + w; xx += 3) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
        g.fillStyle = o.c2; g.fillRect(x, y, w, 6); g.fillRect(x, y + h - 6, w, 6);
      };
      draw(0, 0, S, S / 2); draw(0, S / 2, S / 2, S / 2); draw(S / 2, S / 2, S / 2, S / 2);
    }
  };

  function paintFloor(st) {
    const S = 512;
    const c = cvs(S, S), g = c.getContext('2d');
    const rng = new RNG(T.hashStr(st.id + ':floor'));
    const f = st.floor;
    (FLOOR[f.kind] || FLOOR.stone)(g, S, rng, f);
    return c;
  }

  function paintDecal(st) {
    const d = st.decal;
    if (!d) return null;
    const S = 1024;
    const c = cvs(S, S), g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    if (d.kind === 'ring') {
      g.strokeStyle = d.c1; g.lineWidth = 28;
      g.beginPath(); g.arc(0, 0, 470, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = d.c2 || d.c1; g.lineWidth = 8;
      g.beginPath(); g.arc(0, 0, 420, 0, Math.PI * 2); g.stroke();
    } else if (d.kind === 'heli') {
      g.strokeStyle = d.c1; g.lineWidth = 26;
      g.beginPath(); g.arc(0, 0, 440, 0, Math.PI * 2); g.stroke();
      g.fillStyle = d.c1;
      g.fillRect(-190, -260, 80, 520); g.fillRect(110, -260, 80, 520); g.fillRect(-110, -40, 220, 80);
    } else if (d.kind === 'glyph') {
      g.strokeStyle = d.c1; g.lineWidth = 12;
      for (const r of [470, 380, 210]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
      g.lineWidth = 8;
      for (let i = 0; i < 12; i++) {
        g.save(); g.rotate(i * Math.PI / 6);
        g.beginPath(); g.moveTo(0, -380); g.lineTo(0, -210); g.stroke();
        g.strokeRect(-30, -450, 60, 50);
        g.beginPath(); g.moveTo(-20, -440); g.lineTo(20, -410); g.stroke();
        g.restore();
      }
      g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(Math.cos(a) * 200, Math.sin(a) * 200); }
      g.closePath(); g.stroke();
    } else if (d.kind === 'mat') {
      g.fillStyle = d.c1; g.fillRect(-470, -470, 940, 940);
      g.strokeStyle = d.c2; g.lineWidth = 16; g.strokeRect(-460, -460, 920, 920);
      g.beginPath(); g.arc(0, 0, 150, 0, 7); g.stroke();
    } else if (d.kind === 'taiji') {
      g.strokeStyle = d.c1; g.lineWidth = 14;
      g.beginPath(); g.arc(0, 0, 460, 0, 7); g.stroke();
      for (let i = 0; i < 8; i++) {
        g.save(); g.rotate(i * Math.PI / 4);
        for (let k = 0; k < 3; k++) { if ((i >> k) & 1) g.fillRect(-60, -440 + k * 34, 120, 18); else { g.fillRect(-60, -440 + k * 34, 50, 18); g.fillRect(10, -440 + k * 34, 50, 18); } }
        g.restore();
      }
    }
    return c;
  }

  function skyGrad(g, W, H, stops) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    stops.forEach(([p, c]) => gr.addColorStop(p, c));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }

  const PANO = {
    stars(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 300); i++) {
        const a = rng.next() * 0.8 + 0.2;
        g.fillStyle = `rgba(255,255,255,${a})`;
        const s = rng.next() < 0.1 ? 2 : 1;
        g.fillRect(rng.next() * W, rng.next() * H * (o.h || 0.6), s, s);
      }
    },
    sun(g, W, H, rng, o) {
      const x = o.x * W, y = o.y * H;
      const rg = g.createRadialGradient(x, y, 0, x, y, o.r * 5);
      rg.addColorStop(0, o.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(x - o.r * 5, y - o.r * 5, o.r * 10, o.r * 10);
      g.fillStyle = o.c; g.beginPath(); g.arc(x, y, o.r, 0, 7); g.fill();
      if (o.crater) { g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + (rng.next() - 0.5) * o.r, y + (rng.next() - 0.5) * o.r, o.r * 0.18, 0, 7); g.fill(); } }
    },
    clouds(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 12); i++) {
        const x = rng.next() * W, y = (o.y0 + rng.next() * (o.y1 - o.y0)) * H;
        const w = 80 + rng.next() * 200;
        for (let k = 0; k < 6; k++) {
          const rg = g.createRadialGradient(x + k * w * 0.15, y, 0, x + k * w * 0.15, y, w * 0.3);
          rg.addColorStop(0, o.c); rg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = rg; g.beginPath(); g.ellipse(x + k * w * 0.15, y + (rng.next() - 0.5) * 10, w * 0.3, w * 0.12, 0, 0, 7); g.fill();
        }
      }
    },
    ridge(g, W, H, rng, o) {
      g.fillStyle = o.c;
      g.beginPath(); g.moveTo(0, H);
      const f = [rng.range(1, 3), rng.range(3, 7), rng.range(8, 15)];
      for (let x = 0; x <= W; x += 4) {
        const t = x / W * Math.PI * 2;
        const y = o.y * H - (Math.sin(t * f[0] + 1) * 0.5 + Math.sin(t * f[1]) * 0.3 + Math.sin(t * f[2] + 2) * 0.15 + 0.5) * o.amp * H;
        g.lineTo(x, y);
      }
      g.lineTo(W, H); g.closePath(); g.fill();
    },
    skyline(g, W, H, rng, o) {
      let x = 0;
      while (x < W) {
        const w = o.w0 + rng.next() * o.w1;
        const h = (o.h0 + rng.next() * o.h1) * H;
        g.fillStyle = o.c;
        g.fillRect(x, o.y * H - h, w - 2, h + H);
        if (o.win) {
          for (let wy = o.y * H - h + 6; wy < o.y * H - 4; wy += 7) for (let wx = x + 4; wx < x + w - 6; wx += 6) {
            if (rng.chance(o.lit || 0.3)) { g.fillStyle = rng.chance(0.7) ? o.win : o.win2 || o.win; g.fillRect(wx, wy, 3, 3); }
          }
        }
        if (o.spire && rng.chance(0.15)) { g.fillStyle = o.c; g.fillRect(x + w / 2 - 2, o.y * H - h - 30, 4, 30); g.fillStyle = '#ff3030'; g.fillRect(x + w / 2 - 2, o.y * H - h - 32, 4, 4); }
        x += w;
      }
    },
    trees(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 80); i++) {
        const x = rng.next() * W, h = (o.h0 + rng.next() * o.h1) * H, y = o.y * H;
        g.fillStyle = o.c;
        if (o.kind === 'palm') {
          g.fillRect(x - 2, y - h, 4, h);
          for (let k = 0; k < 6; k++) { g.save(); g.translate(x, y - h); g.rotate(k * 1.05 + rng.next() * 0.3); g.beginPath(); g.ellipse(18, 0, 22, 4, 0.3, 0, 7); g.fill(); g.restore(); }
        } else if (o.kind === 'round') {
          g.beginPath(); g.ellipse(x, y - h * 0.6, h * 0.35, h * 0.45, 0, 0, 7); g.fill(); g.fillRect(x - 2, y - h * 0.3, 4, h * 0.3);
        } else {
          g.beginPath(); g.moveTo(x, y - h); g.lineTo(x - h * 0.22, y); g.lineTo(x + h * 0.22, y); g.closePath(); g.fill();
        }
      }
    },
    pagodas(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 4); i++) {
        const x = (i + 0.3 + rng.next() * 0.4) / (o.n || 4) * W, y = o.y * H, s = o.s * (0.7 + rng.next() * 0.5);
        g.fillStyle = o.c;
        for (let k = 0; k < (o.tiers || 4); k++) {
          const w = s * (1.2 - k * 0.18), yy = y - k * s * 0.45;
          g.fillRect(x - w * 0.35, yy - s * 0.3, w * 0.7, s * 0.3);
          g.beginPath(); g.moveTo(x - w * 0.75, yy - s * 0.28); g.quadraticCurveTo(x, yy - s * 0.55, x + w * 0.75, yy - s * 0.28); g.lineTo(x + w * 0.5, yy - s * 0.4); g.lineTo(x - w * 0.5, yy - s * 0.4); g.closePath(); g.fill();
        }
        g.fillRect(x - 2, y - (o.tiers || 4) * s * 0.45 - s * 0.5, 4, s * 0.6);
      }
    },
    cranes(g, W, H, rng, o) {
      g.strokeStyle = o.c; g.fillStyle = o.c;
      for (let i = 0; i < (o.n || 5); i++) {
        const x = rng.next() * W, y = o.y * H, h = o.h * H * (0.7 + rng.next() * 0.5);
        g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.lineTo(x + h * 0.8, y - h); g.stroke();
        g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - h - 20); g.lineTo(x + h * 0.8, y - h); g.moveTo(x, y - h - 20); g.lineTo(x - h * 0.2, y - h); g.stroke();
        g.fillRect(x + h * 0.5, y - h, 2, h * 0.4); g.fillStyle = '#ff4020'; g.fillRect(x - 2, y - h - 22, 4, 4); g.fillStyle = o.c;
      }
    },
    chimneys(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 6); i++) {
        const x = rng.next() * W, h = o.h * H * (0.6 + rng.next() * 0.6), w = 10 + rng.next() * 14, y = o.y * H;
        g.fillStyle = o.c; g.fillRect(x, y - h, w, h);
        g.fillStyle = '#b02020'; g.fillRect(x, y - h + 10, w, 4); g.fillRect(x, y - h + 24, w, 4);
        for (let k = 0; k < 8; k++) { g.fillStyle = `rgba(${o.smoke},${0.25 - k * 0.025})`; g.beginPath(); g.arc(x + w / 2 + k * 10, y - h - k * 14, 10 + k * 5, 0, 7); g.fill(); }
      }
    },
    neon(g, W, H, rng, o) {
      const cols = o.cols || ['#ff2a8a', '#2af0ff', '#ffd02a', '#8a2aff', '#2aff6a'];
      for (let i = 0; i < (o.n || 30); i++) {
        const x = rng.next() * W, y = (o.y0 + rng.next() * (o.y1 - o.y0)) * H, w = 10 + rng.next() * 40, h = 14 + rng.next() * 50;
        const c = cols[i % cols.length];
        g.shadowColor = c; g.shadowBlur = 12; g.strokeStyle = c; g.lineWidth = 2;
        g.strokeRect(x, y, w, h);
        g.fillStyle = c;
        for (let k = 0; k < 3; k++) g.fillRect(x + 4, y + 4 + k * (h - 8) / 3, w - 8, 2);
        g.shadowBlur = 0;
      }
    },
    boats(g, W, H, rng, o) {
      for (let i = 0; i < (o.n || 6); i++) {
        const x = rng.next() * W, y = o.y * H + rng.next() * 6, s = 20 + rng.next() * 20;
        g.fillStyle = o.hull; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.lineTo(x + s * 0.8, y + s * 0.2); g.lineTo(x - s * 0.8, y + s * 0.2); g.closePath(); g.fill();
        if (o.sail) { g.fillStyle = o.sail; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 1.6); g.quadraticCurveTo(x + s * 0.9, y - s * 0.9, x + s * 0.7, y - s * 0.1); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.4)'; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x, y - s * 1.6 * k / 5); g.lineTo(x + s * 0.75, y - s * 0.9 * k / 5 - s * 0.1); g.stroke(); } }
      }
    },
    water(g, W, H, rng, o) {
      const y = o.y * H;
      const gr = g.createLinearGradient(0, y, 0, H);
      gr.addColorStop(0, o.c1); gr.addColorStop(1, o.c2);
      g.fillStyle = gr; g.fillRect(0, y, W, H - y);
      g.fillStyle = o.glint || 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 400; i++) g.fillRect(rng.next() * W, y + rng.next() * (H - y), 6 + rng.next() * 14, 1);
    },
    aurora(g, W, H, rng, o) {
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let x = 0; x <= W; x += 8) g.lineTo(x, H * (0.18 + k * 0.08) + Math.sin(x * 0.006 + k * 2) * 30 + Math.sin(x * 0.02) * 10);
        g.strokeStyle = k === 1 ? 'rgba(120,255,180,0.28)' : 'rgba(80,220,255,0.2)';
        g.lineWidth = 40 - k * 8; g.stroke();
      }
    },
    tent(g, W, H, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 24; i++) {
        g.fillStyle = i % 2 ? o.c1 : o.c2;
        g.beginPath(); g.moveTo(i * W / 24, H * o.y); g.lineTo((i + 1) * W / 24, H * o.y); g.lineTo(W / 2 + (i + 0.5 - 12) * 6, 0); g.closePath(); g.fill();
      }
      for (let r = 0; r < 5; r++) {
        g.fillStyle = `rgba(0,0,0,${0.35 + r * 0.08})`; g.fillRect(0, H * (o.y + 0.05 + r * 0.05), W, H * 0.04);
        for (let i = 0; i < 260; i++) { g.fillStyle = `hsl(${rng.next() * 360},40%,${35 + rng.next() * 25}%)`; g.fillRect(rng.next() * W, H * (o.y + 0.05 + r * 0.05) + 2, 3, 5); }
      }
      for (let i = 0; i < 6; i++) {
        const x = (i + 0.5) / 6 * W;
        const rg = g.createRadialGradient(x, 0, 0, x, 0, H * 0.5);
        rg.addColorStop(0, 'rgba(255,250,210,0.35)'); rg.addColorStop(1, 'rgba(255,250,210,0)');
        g.fillStyle = rg; g.fillRect(x - H * 0.5, 0, H, H * 0.6);
      }
    },
    hangar(g, W, H, rng, o) {
      g.fillStyle = o.c1; g.fillRect(0, 0, W, H);
      g.strokeStyle = o.c2; g.lineWidth = 6;
      for (let x = 0; x < W; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * o.y); g.stroke(); }
      for (let y = 20; y < H * o.y; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.6)';
      for (let x = 64; x < W; x += 512) g.fillRect(x, H * 0.12, 256, H * 0.4);
      for (let x = 64; x < W; x += 512) { skyGradRect(g, x + 6, H * 0.12 + 6, 244, H * 0.4 - 12, [[0, '#050818'], [1, '#10305a']]); }
      for (let x = 64; x < W; x += 512) { g.strokeStyle = 'rgba(120,255,190,0.35)'; g.lineWidth = 16; g.beginPath(); for (let k = 0; k <= 244; k += 8) g.lineTo(x + 6 + k, H * 0.2 + Math.sin(k * 0.03) * 16); g.stroke(); }
      g.fillStyle = '#ffcc30';
      for (let x = 0; x < W; x += 64) g.fillRect(x, H * o.y - 20, 32, 8);
    },
    hills(g, W, H, rng, o) { PANO.ridge(g, W, H, rng, o); },
    arches(g, W, H, rng, o) {
      g.fillStyle = o.c;
      for (let i = 0; i < (o.n || 10); i++) {
        const x = (i + 0.5) / (o.n || 10) * W, y = o.y * H, h = o.h * H;
        g.fillRect(x - 30, y - h, 14, h); g.fillRect(x + 16, y - h, 14, h);
        g.beginPath(); g.arc(x, y - h, 30, Math.PI, 0); g.lineTo(x + 16, y - h); g.arc(x, y - h, 16, 0, Math.PI, true); g.closePath(); g.fill();
        if (o.statue) { g.fillRect(x - 6, y - h * 1.9, 12, h * 0.5); g.beginPath(); g.arc(x, y - h * 1.95, 9, 0, 7); g.fill(); }
      }
    }
  };

  function skyGradRect(g, x, y, w, h, stops) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    stops.forEach(([p, c]) => gr.addColorStop(p, c));
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }

  function paintPano(st) {
    const W = 2048, H = 512;
    const c = cvs(W, H), g = c.getContext('2d');
    const rng = new RNG(T.hashStr(st.id + ':pano'));
    skyGrad(g, W, H, st.sky);
    for (const layer of st.pano) {
      const fn = PANO[layer.k];
      if (fn) fn(g, W, H, rng, layer);
    }
    const fog = st.fogCss || T.css(st.fog);
    const gr = g.createLinearGradient(0, H * st.horizon - 20, 0, H);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.35, fog); gr.addColorStop(1, fog);
    g.fillStyle = gr; g.fillRect(0, H * st.horizon - 20, W, H);
    return c;
  }

  function prop(mb, rng, p, x, z, ang) {
    const col = c => typeof c === 'string' ? rgb(c) : c;
    const R = [Math.cos(ang), Math.sin(ang)];
    const P = (lx, ly, lz) => [x + R[0] * lx - R[1] * lz, ly, z + R[1] * lx + R[0] * lz];
    const AX = s => [R[0] * s, 0, R[1] * s], AZ = s => [-R[1] * s, 0, R[0] * s], AY = s => [0, s, 0];
    const box = (lx, ly, lz, sx, sy, sz, c) => mb.box(P(lx, ly, lz), AX(sx), AY(sy), AZ(sz), col(c));
    const s = (p.s || 1) * (0.85 + rng.next() * 0.3);
    switch (p.k) {
      case 'lantern':
        box(0, 0.1 * s, 0, 0.35 * s, 0.1 * s, 0.35 * s, p.c);
        box(0, 0.7 * s, 0, 0.12 * s, 0.5 * s, 0.12 * s, p.c);
        box(0, 1.35 * s, 0, 0.3 * s, 0.18 * s, 0.3 * s, p.glow || '#ffe8a0');
        box(0, 1.62 * s, 0, 0.45 * s, 0.08 * s, 0.45 * s, p.c);
        break;
      case 'pillar':
        mb.prism(P(0, 0, 0), P(0, p.h * s, 0), 0.35 * s, 0.33 * s, 8, [1, 0, 0], col(p.c));
        box(0, p.h * s, 0, 0.5 * s, 0.12 * s, 0.5 * s, p.c2 || p.c);
        break;
      case 'tree': {
        const h = (p.h || 5) * s;
        mb.prism(P(0, 0, 0), P(0, h * 0.4, 0), 0.18 * s, 0.14 * s, 6, [1, 0, 0], col(p.trunk || '#4a3220'));
        for (let k = 0; k < 3; k++) mb.prism(P(0, h * (0.3 + k * 0.22), 0), P(0, h * (0.62 + k * 0.2), 0), h * (0.32 - k * 0.08), 0.02, 7, [1, 0, 0], col(p.c));
        break;
      }
      case 'blossom': {
        const h = (p.h || 3.5) * s;
        mb.prism(P(0, 0, 0), P(0.2, h * 0.55, 0), 0.14 * s, 0.1 * s, 6, [1, 0, 0], col(p.trunk || '#3a2418'));
        for (let k = 0; k < 5; k++) mb.ellipsoid(P((rng.next() - 0.5) * 1.6 * s, h * (0.65 + rng.next() * 0.3), (rng.next() - 0.5) * 1.6 * s), T.M_ID, 0.9 * s, 0.6 * s, 0.9 * s, col(p.c), 6, 4);
        break;
      }
      case 'palm': {
        const h = (p.h || 6) * s;
        const lean = (rng.next() - 0.5) * 1.2;
        mb.prism(P(0, 0, 0), P(lean, h, 0), 0.16 * s, 0.12 * s, 6, [1, 0, 0], col(p.trunk || '#6a5030'));
        for (let k = 0; k < 7; k++) {
          const a = k / 7 * Math.PI * 2;
          mb.prism(P(lean, h, 0), P(lean + Math.cos(a) * 2 * s, h - 0.8 * s, Math.sin(a) * 2 * s), 0.25 * s, 0.03, 3, [0, 1, 0], col(p.c));
        }
        break;
      }
      case 'container': {
        const w = 2.4, l = 6, h = 2.6;
        box(0, h / 2, 0, l / 2, h / 2, w / 2, p.c);
        for (let k = -5; k <= 5; k++) box(k * 0.5, h / 2, w / 2 + 0.01, 0.04, h / 2 - 0.1, 0.02, T.shade(col(p.c), 0.75));
        if (p.stack) box(0.4, h * 1.5, 0, l / 2, h / 2, w / 2, p.c2 || p.c);
        break;
      }
      case 'crate': box(0, 0.5 * s, 0, 0.5 * s, 0.5 * s, 0.5 * s, p.c); box(0, 1.2 * s, 0.1, 0.35 * s, 0.2 * s, 0.35 * s, p.c2 || p.c); break;
      case 'barrel': mb.prism(P(0, 0, 0), P(0, 1.0 * s, 0), 0.32 * s, 0.32 * s, 8, [1, 0, 0], col(p.c)); break;
      case 'rock': mb.ellipsoid(P(0, 0.2 * s, 0), T.M_ID, (0.8 + rng.next()) * s, (0.4 + rng.next() * 0.5) * s, (0.7 + rng.next()) * s, col(p.c), 6, 4); break;
      case 'gate': {
        const h = (p.h || 4.5) * s;
        box(-1.6 * s, h / 2, 0, 0.18 * s, h / 2, 0.18 * s, p.c);
        box(1.6 * s, h / 2, 0, 0.18 * s, h / 2, 0.18 * s, p.c);
        box(0, h, 0, 2.3 * s, 0.14 * s, 0.25 * s, p.c2 || p.c);
        box(0, h * 0.82, 0, 1.9 * s, 0.1 * s, 0.14 * s, p.c);
        break;
      }
      case 'statue': {
        const h = (p.h || 3) * s;
        box(0, 0.3 * s, 0, 0.7 * s, 0.3 * s, 0.7 * s, p.c2 || '#6a6a60');
        mb.prism(P(0, 0.6 * s, 0), P(0, h * 0.7, 0), 0.4 * s, 0.32 * s, 6, [1, 0, 0], col(p.c));
        mb.ellipsoid(P(0, h * 0.8, 0), T.M_ID, 0.25 * s, 0.3 * s, 0.25 * s, col(p.c), 6, 4);
        box(0.45 * s, h * 0.55, 0, 0.12 * s, 0.35 * s, 0.12 * s, p.c);
        box(-0.45 * s, h * 0.55, 0, 0.12 * s, 0.35 * s, 0.12 * s, p.c);
        break;
      }
      case 'fence': for (let k = -3; k <= 3; k++) box(k * 0.8, 0.5, 0, 0.05, 0.5, 0.05, p.c); box(0, 0.85, 0, 2.6, 0.04, 0.03, p.c); box(0, 0.4, 0, 2.6, 0.04, 0.03, p.c); break;
      case 'neon': box(0, (p.y || 3) * s, 0, 0.8 * s, 0.35 * s, 0.05, p.c); box(0, (p.y || 3) * s - 1.5 * s, 0, 0.05, 1.5 * s, 0.05, '#222'); break;
      case 'lamp': mb.prism(P(0, 0, 0), P(0, 4.5 * s, 0), 0.08 * s, 0.06 * s, 6, [1, 0, 0], col(p.c || '#2a2a2a')); box(0.3 * s, 4.5 * s, 0, 0.4 * s, 0.08 * s, 0.15 * s, p.c || '#2a2a2a'); box(0.5 * s, 4.4 * s, 0, 0.15 * s, 0.04 * s, 0.1 * s, p.glow || '#ffd080'); break;
      case 'drum': mb.prism(P(0, 0, 0), P(0, 0.9 * s, 0), 0.5 * s, 0.5 * s, 10, [1, 0, 0], col(p.c)); box(0, 0.92 * s, 0, 0.45 * s, 0.02, 0.45 * s, p.c2 || '#e8dcc0'); break;
      case 'boat': box(0, 0.25, 0, 2.2 * s, 0.25, 0.6 * s, p.c); box(0, 0.55, 0, 0.9 * s, 0.3, 0.45 * s, p.c2 || '#8a5a30'); break;
      case 'pipe': mb.prism(P(-3, p.y || 3, 0), P(3, p.y || 3, 0), 0.25, 0.25, 8, [0, 1, 0], col(p.c)); box(-3, (p.y || 3) / 2, 0, 0.12, (p.y || 3) / 2, 0.12, p.c); box(3, (p.y || 3) / 2, 0, 0.12, (p.y || 3) / 2, 0.12, p.c); break;
      case 'console': box(0, 0.6, 0, 0.8, 0.6, 0.5, p.c); box(0, 1.25, -0.2, 0.7, 0.12, 0.3, p.c2 || '#20d080'); break;
      case 'cage': for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; mb.prism(P(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2), P(Math.cos(a) * 1.2, 2.5, Math.sin(a) * 1.2), 0.04, 0.04, 4, [1, 0, 0], col(p.c)); } mb.prism(P(0, 2.5, 0), P(0, 2.9, 0), 1.3, 0.2, 8, [1, 0, 0], col(p.c)); break;
      case 'banner': box(0, 2.5 * s, 0, 0.05, 2.5 * s, 0.05, '#3a2a1a'); box(0.02, 3.4 * s, 0.45 * s, 0.02, 1.2 * s, 0.4 * s, p.c); break;
    }
  }

  function buildProps(st) {
    const mb = new MB(40000);
    const rng = new RNG(T.hashStr(st.id + ':props'));
    for (const p of st.props || []) {
      const n = p.n || 1;
      for (let i = 0; i < n; i++) {
        let x, z;
        if (p.at) { x = p.at[0]; z = p.at[1]; }
        else {
          const a = (p.a0 === undefined ? 0 : p.a0) + (p.spread === undefined ? Math.PI * 2 : p.spread) * (i + rng.next() * (p.jit === undefined ? 0.6 : p.jit)) / n;
          const r = p.r0 + rng.next() * ((p.r1 || p.r0) - p.r0);
          x = Math.cos(a) * r; z = Math.sin(a) * r;
        }
        const face = p.faceIn ? Math.atan2(-z, -x) : rng.next() * Math.PI * 2;
        prop(mb, rng, p, x, z, face);
      }
    }
    return mb;
  }

  function buildStageGpu(gl, st) {
    if (!gl || !gl.ok()) return null;
    const out = {};
    out.floorTex = gl.texture(paintFloor(st));
    const dc = paintDecal(st);
    if (dc) out.decalTex = gl.texture(dc, true);
    out.panoTex = gl.texture(paintPano(st), 'x');
    const fl = new MB(64);
    const R = 90, tile = st.floor.tile || 4;
    fl.tquad([-R, 0, R], [R, 0, R], [R, 0, -R], [-R, 0, -R], [1, 1, 1], 1, [-R / tile, R / tile, R / tile, -R / tile]);
    out.floor = gl.staticMesh(fl);
    if (dc) {
      const d = new MB(16), r = st.decal.r || 3.2;
      d.tquad([-r, 0.006, r], [r, 0.006, r], [r, 0.006, -r], [-r, 0.006, -r], [1, 1, 1], st.decal.a || 0.85, [0, 1, 1, 0]);
      out.decal = gl.staticMesh(d);
    }
    const sky = new MB(512);
    const SR = 160, y0 = -40, y1 = -y0 * st.horizon / (1 - st.horizon), n = 32;
    const hor = st.horizon;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const p = (a, y) => [Math.cos(a) * SR, y, Math.sin(a) * SR];
      const u0 = i / n, u1 = (i + 1) / n;
      const vTop = 0, vBot = 1;
      const N = [0, 1, 0];
      sky.v(p(a0, y0), N, [1, 1, 1], 1, u0, vBot); sky.v(p(a1, y0), N, [1, 1, 1], 1, u1, vBot); sky.v(p(a1, y1), N, [1, 1, 1], 1, u1, vTop);
      sky.v(p(a0, y0), N, [1, 1, 1], 1, u0, vBot); sky.v(p(a1, y1), N, [1, 1, 1], 1, u1, vTop); sky.v(p(a0, y1), N, [1, 1, 1], 1, u0, vTop);
    }
    out.skyScale = [y0, y1, hor];
    out.sky = gl.staticMesh(sky);
    const top = new MB(200);
    const tc = rgb(st.skyTop || '#000');
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      top.v([0, y1 + 40, 0], [0, -1, 0], tc, 1); top.v([Math.cos(a1) * SR, y1 - 1, Math.sin(a1) * SR], [0, -1, 0], tc, 1); top.v([Math.cos(a0) * SR, y1 - 1, Math.sin(a0) * SR], [0, -1, 0], tc, 1);
    }
    out.top = gl.staticMesh(top);
    const props = buildProps(st);
    out.props = gl.staticMesh(props);
    return out;
  }

  function drawStage(gl, st, eye, time) {
    const g = st.gpu;
    const glx = gl.gl;
    const saveVP = gl.vp;
    const shifted = T.m4.mul(gl.vp, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, eye[0], 0, eye[2], 1]);
    glx.uniformMatrix4fv(gl.u.uVP, false, new Float32Array(shifted));
    gl.drawStatic(g.top, { unlit: true, nofog: true, depthWrite: false, cull: false });
    gl.drawStatic(g.sky, { tex: g.panoTex, unlit: true, nofog: true, depthWrite: false, cull: false });
    glx.uniformMatrix4fv(gl.u.uVP, false, new Float32Array(saveVP));
    gl.drawStatic(g.floor, { tex: g.floorTex });
    if (g.decal) gl.drawStatic(g.decal, { tex: g.decalTex, blend: true, depthWrite: false });
    gl.drawStatic(g.props, {});
  }

  function ambientTick(scene, st, cam, time) {
    const a = st.amb;
    if (!a) return;
    const want = a.n || 60;
    let count = 0;
    for (const p of scene.parts) if (p.amb) count++;
    const c = cam.at;
    for (let i = count; i < want; i++) {
      const x = c[0] + (Math.random() - 0.5) * 16, z = c[2] + (Math.random() - 0.5) * 12;
      const y = a.rise ? Math.random() * 0.5 : 3 + Math.random() * 4;
      const p = { p: [x, y, z], s: a.s || 0.04, col: a.col, a: a.alpha || 0.9, life: a.life || 400, rot: Math.random() * 6 };
      if (a.kind === 'petals') p.v = [0.004 + Math.random() * 0.006, -0.008 - Math.random() * 0.006, (Math.random() - 0.5) * 0.004];
      else if (a.kind === 'snow') p.v = [(Math.random() - 0.3) * 0.02, -0.015 - Math.random() * 0.01, (Math.random() - 0.5) * 0.01];
      else if (a.kind === 'rain') p.v = [0.01, -0.28, 0.005];
      else if (a.kind === 'embers') p.v = [(Math.random() - 0.5) * 0.006, 0.01 + Math.random() * 0.012, (Math.random() - 0.5) * 0.006];
      else if (a.kind === 'leaves') p.v = [0.006 + Math.random() * 0.01, -0.01 - Math.random() * 0.006, (Math.random() - 0.5) * 0.006];
      else if (a.kind === 'confetti') p.v = [(Math.random() - 0.5) * 0.008, -0.01 - Math.random() * 0.008, (Math.random() - 0.5) * 0.008];
      else p.v = [(Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.002, (Math.random() - 0.5) * 0.004];
      if (a.kind === 'rain') { p.p[1] = Math.random() * 7; p.s = 0.02; }
      if (a.kind === 'confetti') p.col = [[1, 0.3, 0.3], [0.3, 0.8, 1], [1, 0.9, 0.3], [0.5, 1, 0.4]][i % 4];
      scene.spawn('amb', null, p);
    }
    for (const p of scene.parts) {
      if (!p.amb) continue;
      if (a.kind === 'petals' || a.kind === 'leaves') { p.v[0] += Math.sin(time * 0.02 + p.rot) * 0.0003; p.rot += 0.03; }
      if (a.kind === 'embers' && p.p[1] > 6) p.life = 0;
      const dx = p.p[0] - c[0], dz = p.p[2] - c[2];
      if (Math.abs(dx) > 10 || Math.abs(dz) > 8) { p.p[0] = c[0] - dx * 0.9; p.p[2] = c[2] - dz * 0.9; }
      if (p.p[1] < 0.02 && !a.rise) { p.p[1] = 3 + Math.random() * 4; }
    }
  }

  function env(o) {
    return {
      light: vnorm(o.light || [0.4, 0.8, 0.45]), lightCol: o.lightCol || [0.85, 0.82, 0.75],
      sky: o.ambSky || [0.4, 0.42, 0.5], gnd: o.ambGnd || [0.2, 0.18, 0.16],
      fog: o.fog, fogR: o.fogR || [18, 70], rim: o.rim || [0.1, 0.1, 0.12], clear: o.fog
    };
  }

  const STAGES = [];
  function stage(o) {
    o.fog = typeof o.fogC === 'string' ? rgb(o.fogC) : o.fogC;
    o.env = env(Object.assign({}, o.e || {}, { fog: o.fog }));
    o.horizon = o.horizon || 0.72;
    STAGES.push(o);
    return o;
  }

  stage({
    id: 'dojo', name: 'Двор додзё, Осака', time: 'Вечер', music: 'kenta', fogC: '#c89878',
    sky: [[0, '#3a2a58'], [0.45, '#c86a50'], [0.7, '#f0b070'], [1, '#c89878']], skyTop: '#2a1e48',
    pano: [{ k: 'sun', x: 0.3, y: 0.62, r: 26, c: '#ffd8a0', glow: 'rgba(255,190,120,0.55)' }, { k: 'clouds', n: 10, y0: 0.2, y1: 0.5, c: 'rgba(255,190,160,0.35)' }, { k: 'ridge', y: 0.72, amp: 0.2, c: '#6a4a58' }, { k: 'pagodas', n: 5, y: 0.73, s: 34, c: '#3a2a30' }, { k: 'skyline', y: 0.735, w0: 14, w1: 30, h0: 0.01, h1: 0.05, c: '#3a2a30', win: '#ffd080', lit: 0.2 }],
    floor: { kind: 'wood', c1: '#8a5a3a', rows: 8, tile: 3.2 },
    decal: { kind: 'mat', c1: 'rgba(0,0,0,0)', c2: 'rgba(240,230,210,0.75)', r: 3.4 },
    props: [{ k: 'lantern', n: 6, r0: 9, r1: 12, c: '#6a6a60', s: 1.3 }, { k: 'blossom', n: 7, r0: 13, r1: 20, c: '#f0a8c0', h: 4 }, { k: 'gate', at: [0, -16], c: '#8a1a1a', c2: '#2a1a1a', s: 1.2 }],
    amb: { kind: 'petals', n: 70, col: [1, 0.72, 0.82], s: 0.035 },
    e: { light: [0.5, 0.55, 0.4], lightCol: [1.0, 0.78, 0.6], ambSky: [0.45, 0.4, 0.55], ambGnd: [0.3, 0.2, 0.16], rim: [0.25, 0.14, 0.1], fogR: [16, 60] }
  });

  stage({
    id: 'docks', name: 'Порт Бостона', time: 'Ночь', music: 'ray', fogC: '#1a2030',
    sky: [[0, '#05070e'], [0.6, '#141c30'], [0.75, '#2a3048'], [1, '#1a2030']], skyTop: '#04060c',
    pano: [{ k: 'stars', n: 160, h: 0.5 }, { k: 'sun', x: 0.7, y: 0.2, r: 18, c: '#e8ecf8', glow: 'rgba(160,180,255,0.3)', crater: true }, { k: 'cranes', n: 7, y: 0.74, h: 0.3, c: '#0a0c14' }, { k: 'skyline', y: 0.75, w0: 20, w1: 50, h0: 0.02, h1: 0.12, c: '#0c0e18', win: '#ffcc66', win2: '#88ccff', lit: 0.25 }],
    floor: { kind: 'asphalt', c1: '#3a3c42', puddles: 'rgba(120,140,190,0.35)', line: 'rgba(230,200,60,0.7)', tile: 5 },
    props: [{ k: 'container', n: 7, r0: 12, r1: 18, c: '#8a2a1a', c2: '#1a4a7a', stack: true }, { k: 'lamp', n: 5, r0: 9, r1: 10, glow: '#ffb050' }, { k: 'crate', n: 8, r0: 8, r1: 11, c: '#7a5a30' }, { k: 'barrel', n: 6, r0: 8, r1: 12, c: '#2a5a2a' }],
    amb: { kind: 'rain', n: 180, col: [0.7, 0.8, 1], alpha: 0.5 },
    e: { light: [0.3, 0.9, -0.3], lightCol: [0.9, 0.7, 0.45], ambSky: [0.22, 0.26, 0.4], ambGnd: [0.1, 0.1, 0.14], rim: [0.2, 0.25, 0.45], fogR: [14, 55] }
  });

  stage({
    id: 'garden', name: 'Сад чайной, Цзинань', time: 'День', music: 'yalan', fogC: '#b8d0c8',
    sky: [[0, '#5a90d0'], [0.6, '#a8cce0'], [1, '#b8d0c8']], skyTop: '#4a80c8',
    pano: [{ k: 'clouds', n: 14, y0: 0.15, y1: 0.5, c: 'rgba(255,255,255,0.7)' }, { k: 'ridge', y: 0.72, amp: 0.25, c: '#7a9a98' }, { k: 'ridge', y: 0.74, amp: 0.12, c: '#5a7a70' }, { k: 'pagodas', n: 3, y: 0.745, s: 30, tiers: 3, c: '#3a4a40' }, { k: 'trees', kind: 'round', n: 60, y: 0.75, h0: 0.03, h1: 0.05, c: '#3a5a3a' }],
    floor: { kind: 'stone', c1: '#8a8a80', c2: '#a09a8a', tiles: 4, moss: true, tile: 3 },
    decal: { kind: 'taiji', c1: 'rgba(60,50,40,0.55)', r: 3.3 },
    props: [{ k: 'lantern', n: 5, r0: 9, r1: 11, c: '#8a2020', glow: '#ffc060', s: 1.1 }, { k: 'tree', n: 8, r0: 14, r1: 22, c: '#3a6a3a', h: 6 }, { k: 'rock', n: 6, r0: 10, r1: 14, c: '#7a7a70' }, { k: 'pillar', n: 4, r0: 12, r1: 12, h: 4, c: '#8a1a1a', c2: '#2a2a2a' }],
    amb: { kind: 'leaves', n: 30, col: [0.6, 0.8, 0.3], s: 0.04 },
    e: { light: [0.4, 0.85, 0.3], lightCol: [1, 0.96, 0.88], ambSky: [0.5, 0.56, 0.62], ambGnd: [0.28, 0.3, 0.24], fogR: [20, 75] }
  });

  stage({
    id: 'beach', name: 'Пляж Салвадора', time: 'Закат', music: 'rafael', fogC: '#e0a070',
    sky: [[0, '#4a3a8a'], [0.4, '#e06a6a'], [0.65, '#ffb060'], [0.72, '#ffd080'], [1, '#e0a070']], skyTop: '#3a2a7a',
    pano: [{ k: 'sun', x: 0.5, y: 0.66, r: 40, c: '#fff0b0', glow: 'rgba(255,200,120,0.6)' }, { k: 'clouds', n: 9, y0: 0.25, y1: 0.55, c: 'rgba(255,170,150,0.45)' }, { k: 'water', y: 0.72, c1: '#d0806a', c2: '#e0a070', glint: 'rgba(255,230,160,0.5)' }, { k: 'boats', n: 5, y: 0.715, hull: '#3a2a3a' }, { k: 'trees', kind: 'palm', n: 14, y: 0.72, h0: 0.08, h1: 0.1, c: '#2a1a2a' }],
    floor: { kind: 'sand', c1: '#d8b888', shells: true, tile: 4 },
    props: [{ k: 'palm', n: 8, r0: 11, r1: 18, c: '#3a6a2a', h: 6.5 }, { k: 'boat', n: 3, r0: 12, r1: 14, c: '#2a6aa0', c2: '#e8e0c8' }, { k: 'drum', n: 3, r0: 8, r1: 9, c: '#8a3a1a' }, { k: 'rock', n: 4, r0: 14, r1: 18, c: '#8a7a6a' }],
    amb: { kind: 'dust', n: 20, col: [1, 0.9, 0.7], s: 0.02, alpha: 0.4 },
    e: { light: [0.2, 0.45, -0.8], lightCol: [1.05, 0.72, 0.5], ambSky: [0.5, 0.4, 0.55], ambGnd: [0.35, 0.28, 0.2], rim: [0.35, 0.2, 0.12], fogR: [18, 70] }
  });

  stage({
    id: 'factory', name: 'Завод, Екатеринбург', time: 'Метель', music: 'volkov', fogC: '#9aa0aa',
    sky: [[0, '#5a6070'], [0.6, '#8a909a'], [1, '#9aa0aa']], skyTop: '#4a505a',
    pano: [{ k: 'chimneys', n: 7, y: 0.73, h: 0.35, c: '#3a3c44', smoke: '220,220,225' }, { k: 'skyline', y: 0.74, w0: 30, w1: 80, h0: 0.02, h1: 0.09, c: '#4a4c54', win: '#ffd080', lit: 0.12 }, { k: 'clouds', n: 16, y0: 0.1, y1: 0.6, c: 'rgba(200,205,215,0.35)' }],
    floor: { kind: 'snow', c1: '#d8dce2', tile: 4 },
    props: [{ k: 'pipe', n: 2, r0: 12, r1: 14, c: '#6a4a3a', y: 3.5 }, { k: 'crate', n: 6, r0: 9, r1: 12, c: '#5a5a50' }, { k: 'barrel', n: 8, r0: 8, r1: 13, c: '#3a3a40' }, { k: 'container', n: 3, r0: 16, r1: 18, c: '#3a5a4a' }, { k: 'lamp', n: 4, r0: 9, r1: 10, glow: '#ffe0a0' }],
    amb: { kind: 'snow', n: 220, col: [1, 1, 1], s: 0.03 },
    e: { light: [0.3, 0.8, 0.4], lightCol: [0.8, 0.82, 0.88], ambSky: [0.5, 0.52, 0.58], ambGnd: [0.4, 0.42, 0.46], fogR: [10, 45] }
  });

  stage({
    id: 'seoul', name: 'Ночной Сеул', time: 'Ночь', music: 'minjun', fogC: '#1a1030',
    sky: [[0, '#08041a'], [0.6, '#241040'], [0.75, '#401a50'], [1, '#1a1030']], skyTop: '#06031a',
    pano: [{ k: 'skyline', y: 0.76, w0: 18, w1: 40, h0: 0.05, h1: 0.3, c: '#0a0818', win: '#ffe0a0', win2: '#a0e0ff', lit: 0.35, spire: true }, { k: 'neon', n: 40, y0: 0.5, y1: 0.72 }],
    floor: { kind: 'asphalt', c1: '#2a2830', puddles: 'rgba(255,80,180,0.3)', line: 'rgba(240,240,240,0.6)', tile: 5 },
    props: [{ k: 'neon', n: 8, r0: 10, r1: 13, c: '#ff2a8a', y: 3.5 }, { k: 'neon', n: 6, r0: 11, r1: 14, c: '#2af0ff', y: 4 }, { k: 'lamp', n: 5, r0: 9, r1: 10, glow: '#fff0c0' }, { k: 'crate', n: 5, r0: 9, r1: 12, c: '#4a4a52' }],
    amb: { kind: 'dust', n: 30, col: [1, 0.5, 0.9], s: 0.02, alpha: 0.5 },
    e: { light: [-0.3, 0.8, 0.5], lightCol: [0.8, 0.6, 0.9], ambSky: [0.3, 0.2, 0.45], ambGnd: [0.15, 0.1, 0.2], rim: [0.45, 0.2, 0.5], fogR: [14, 55] }
  });

  stage({
    id: 'roof', name: 'Крыша небоскрёба, Москва', time: 'Ночь', music: 'irina', fogC: '#101828',
    sky: [[0, '#02040c'], [0.5, '#0a1428'], [0.8, '#28304a'], [1, '#101828']], skyTop: '#020308',
    horizon: 0.82,
    pano: [{ k: 'stars', n: 200, h: 0.6 }, { k: 'skyline', y: 0.84, w0: 10, w1: 24, h0: 0.01, h1: 0.12, c: '#060a14', win: '#ffd890', win2: '#ff9050', lit: 0.45, spire: true }, { k: 'clouds', n: 6, y0: 0.3, y1: 0.6, c: 'rgba(120,130,170,0.18)' }],
    floor: { kind: 'metal', c1: '#4a4e56', tile: 4 },
    decal: { kind: 'heli', c1: 'rgba(240,210,60,0.8)', r: 3.6 },
    props: [{ k: 'lamp', n: 8, r0: 7, r1: 7.5, glow: '#ff4020', s: 0.4 }, { k: 'console', n: 3, r0: 10, r1: 11, c: '#3a3e46' }, { k: 'crate', n: 4, r0: 10, r1: 12, c: '#5a5e66' }],
    amb: { kind: 'dust', n: 20, col: [0.8, 0.85, 1], s: 0.015, alpha: 0.4 },
    e: { light: [0.4, 0.9, 0.2], lightCol: [0.7, 0.75, 0.95], ambSky: [0.22, 0.26, 0.4], ambGnd: [0.14, 0.14, 0.18], rim: [0.25, 0.3, 0.5], fogR: [16, 65] }
  });

  stage({
    id: 'forest', name: 'Храм в тумане', time: 'Рассвет', music: 'kagemaru', fogC: '#8a9a9a',
    sky: [[0, '#6a7a8a'], [0.6, '#a8b0b0'], [1, '#8a9a9a']], skyTop: '#5a6a7a',
    pano: [{ k: 'ridge', y: 0.7, amp: 0.28, c: '#6a7a7a' }, { k: 'trees', n: 140, y: 0.74, h0: 0.08, h1: 0.12, c: '#3a4a44' }, { k: 'clouds', n: 12, y0: 0.5, y1: 0.72, c: 'rgba(210,220,220,0.5)' }],
    floor: { kind: 'grass', c1: '#4a5a3a', path: 'rgba(110,100,80,0.4)', tile: 4 },
    props: [{ k: 'tree', n: 14, r0: 10, r1: 20, c: '#2a4030', h: 9 }, { k: 'lantern', n: 4, r0: 8, r1: 9, c: '#6a6a60' }, { k: 'gate', at: [-12, 6], c: '#8a1a1a', c2: '#1a1a1a' }, { k: 'rock', n: 6, r0: 9, r1: 14, c: '#6a6a60' }],
    amb: { kind: 'dust', n: 50, col: [0.9, 0.95, 0.95], s: 0.06, alpha: 0.25 },
    e: { light: [0.5, 0.7, 0.3], lightCol: [0.8, 0.82, 0.8], ambSky: [0.5, 0.55, 0.58], ambGnd: [0.3, 0.32, 0.28], fogR: [8, 38] }
  });

  stage({
    id: 'harbor', name: 'Гавань Коулуна', time: 'Ночь', music: 'tony', fogC: '#18202a',
    sky: [[0, '#040810'], [0.6, '#101a2a'], [0.72, '#2a2a3a'], [1, '#18202a']], skyTop: '#03060c',
    pano: [{ k: 'skyline', y: 0.72, w0: 12, w1: 30, h0: 0.06, h1: 0.3, c: '#0a0e16', win: '#ffe0a0', win2: '#ff6060', lit: 0.4, spire: true }, { k: 'water', y: 0.72, c1: '#1a2a3a', c2: '#18202a', glint: 'rgba(255,220,150,0.35)' }, { k: 'boats', n: 8, y: 0.73, hull: '#1a1010', sail: '#a03020' }],
    floor: { kind: 'wood', c1: '#5a4030', rows: 6, gap: 'rgba(0,0,0,0.7)', tile: 3.5 },
    props: [{ k: 'lamp', n: 6, r0: 9, r1: 10, glow: '#ffb060' }, { k: 'crate', n: 6, r0: 8, r1: 12, c: '#6a4a2a' }, { k: 'barrel', n: 5, r0: 8, r1: 11, c: '#5a3a2a' }, { k: 'boat', n: 3, r0: 13, r1: 15, c: '#4a2a1a', c2: '#a03020' }],
    amb: { kind: 'dust', n: 20, col: [1, 0.85, 0.6], s: 0.015, alpha: 0.4 },
    e: { light: [0.3, 0.8, 0.5], lightCol: [0.9, 0.72, 0.5], ambSky: [0.2, 0.25, 0.38], ambGnd: [0.12, 0.1, 0.1], rim: [0.3, 0.25, 0.4], fogR: [14, 55] }
  });

  stage({
    id: 'bangkok', name: 'Плавучий рынок, Бангкок', time: 'Утро', music: 'somsak', fogC: '#c8c0a0',
    sky: [[0, '#6aa0d0'], [0.6, '#c8d8d0'], [1, '#c8c0a0']], skyTop: '#5a90c8',
    pano: [{ k: 'sun', x: 0.8, y: 0.3, r: 24, c: '#fffbe0', glow: 'rgba(255,250,200,0.4)' }, { k: 'clouds', n: 10, y0: 0.2, y1: 0.5, c: 'rgba(255,255,255,0.6)' }, { k: 'pagodas', n: 4, y: 0.72, s: 26, tiers: 5, c: '#b08a3a' }, { k: 'trees', kind: 'palm', n: 30, y: 0.73, h0: 0.05, h1: 0.07, c: '#3a5a2a' }, { k: 'water', y: 0.73, c1: '#8a8a60', c2: '#c8c0a0', glint: 'rgba(255,255,220,0.4)' }, { k: 'boats', n: 12, y: 0.74, hull: '#5a3a1a' }],
    floor: { kind: 'wood', c1: '#9a7040', rows: 7, tile: 3.2 },
    decal: { kind: 'ring', c1: 'rgba(200,30,30,0.7)', c2: 'rgba(40,40,200,0.6)', r: 3.6 },
    props: [{ k: 'boat', n: 6, r0: 11, r1: 16, c: '#6a4020', c2: '#d8a040' }, { k: 'crate', n: 6, r0: 9, r1: 11, c: '#a07a40', c2: '#e8c040' }, { k: 'banner', n: 4, r0: 8, r1: 9, c: '#c01818' }, { k: 'palm', n: 5, r0: 14, r1: 18, c: '#3a6a2a' }],
    amb: { kind: 'dust', n: 25, col: [1, 1, 0.8], s: 0.02, alpha: 0.35 },
    e: { light: [0.5, 0.8, 0.2], lightCol: [1, 0.95, 0.82], ambSky: [0.5, 0.55, 0.6], ambGnd: [0.35, 0.3, 0.22], fogR: [18, 70] }
  });

  stage({
    id: 'circus', name: 'Цирк на Цветном', time: 'Представление', music: 'potapych', fogC: '#2a1010',
    sky: [[0, '#2a0a0a'], [1, '#2a1010']], skyTop: '#1a0606',
    pano: [{ k: 'tent', c1: '#a01818', c2: '#e8d8a0', y: 0.55 }],
    horizon: 0.8,
    floor: { kind: 'sawdust', c1: '#b08a50', tile: 3 },
    decal: { kind: 'ring', c1: 'rgba(200,30,30,0.95)', c2: 'rgba(240,220,120,0.9)', r: 4.2, a: 1 },
    props: [{ k: 'drum', n: 6, r0: 5.2, r1: 5.2, c: '#c01818', c2: '#e8c040', jit: 0 }, { k: 'cage', at: [-9, -8], c: '#8a8a8a' }, { k: 'crate', n: 4, r0: 8, r1: 10, c: '#2a4aa0', c2: '#e8c040' }, { k: 'pillar', n: 6, r0: 12, r1: 12, h: 8, c: '#e8d8a0', jit: 0 }],
    amb: { kind: 'confetti', n: 60, col: [1, 0.3, 0.3], s: 0.03 },
    e: { light: [0.1, 1, 0.1], lightCol: [1.1, 0.95, 0.8], ambSky: [0.4, 0.25, 0.22], ambGnd: [0.25, 0.15, 0.12], rim: [0.3, 0.15, 0.1], fogR: [12, 40] }
  });

  stage({
    id: 'mountain', name: 'Гора Удан', time: 'Полдень', music: 'liu', fogC: '#c8d8e8',
    sky: [[0, '#4a80c0'], [0.55, '#a8c8e8'], [1, '#c8d8e8']], skyTop: '#3a70b8',
    horizon: 0.78,
    pano: [{ k: 'ridge', y: 0.78, amp: 0.4, c: '#8aa0b8' }, { k: 'ridge', y: 0.8, amp: 0.2, c: '#6a8098' }, { k: 'clouds', n: 18, y0: 0.62, y1: 0.8, c: 'rgba(255,255,255,0.75)' }, { k: 'pagodas', n: 2, y: 0.62, s: 22, tiers: 3, c: '#3a4050' }],
    floor: { kind: 'stone', c1: '#9a9a90', c2: '#b0aaa0', tiles: 3, tile: 3.6 },
    decal: { kind: 'taiji', c1: 'rgba(40,40,40,0.5)', r: 3.4 },
    props: [{ k: 'tree', n: 7, r0: 12, r1: 18, c: '#2a4a3a', h: 5 }, { k: 'rock', n: 8, r0: 10, r1: 16, c: '#8a8a88' }, { k: 'lantern', n: 4, r0: 9, r1: 10, c: '#5a5a58' }, { k: 'statue', n: 2, r0: 11, r1: 11, c: '#7a7a70' }],
    amb: { kind: 'leaves', n: 20, col: [0.9, 0.9, 1], s: 0.05, alpha: 0.35 },
    e: { light: [0.3, 0.9, 0.3], lightCol: [1, 0.98, 0.92], ambSky: [0.55, 0.6, 0.7], ambGnd: [0.35, 0.35, 0.32], fogR: [20, 80] }
  });

  stage({
    id: 'lab', name: 'НИИ «Полюс», Арктика', time: 'Полярная ночь', music: 'strazh', fogC: '#1a2a34',
    sky: [[0, '#1a2a34'], [1, '#1a2a34']], skyTop: '#1a2830',
    horizon: 0.8,
    pano: [{ k: 'hangar', c1: '#2a3640', c2: '#3a4a54', y: 0.78 }],
    floor: { kind: 'metal', c1: '#50585e', stripe: 'rgba(230,190,40,0.5)', tile: 4 },
    props: [{ k: 'console', n: 6, r0: 9, r1: 11, c: '#3a4a50', c2: '#30ff90' }, { k: 'pipe', n: 3, r0: 12, r1: 14, c: '#5a6a70', y: 4 }, { k: 'crate', n: 6, r0: 9, r1: 13, c: '#4a5a4a' }, { k: 'barrel', n: 4, r0: 8, r1: 10, c: '#c0a030' }],
    amb: { kind: 'snow', n: 60, col: [0.8, 0.95, 1], s: 0.015, alpha: 0.4 },
    e: { light: [0.2, 1, 0.1], lightCol: [0.7, 0.85, 0.95], ambSky: [0.25, 0.35, 0.4], ambGnd: [0.12, 0.15, 0.16], rim: [0.1, 0.35, 0.3], fogR: [14, 50] }
  });

  stage({
    id: 'castle', name: 'Замок Курогане', time: 'Гроза', music: 'genzo', fogC: '#1a1a22', storm: true,
    sky: [[0, '#08080e'], [0.6, '#1a1a28'], [1, '#1a1a22']], skyTop: '#06060a',
    pano: [{ k: 'clouds', n: 20, y0: 0.05, y1: 0.55, c: 'rgba(60,60,80,0.6)' }, { k: 'ridge', y: 0.73, amp: 0.2, c: '#12121a' }, { k: 'pagodas', n: 2, y: 0.735, s: 50, tiers: 5, c: '#0a0a10' }],
    floor: { kind: 'stone', c1: '#4a4a50', c2: '#5a5a60', tiles: 4, tile: 3 },
    props: [{ k: 'lantern', n: 6, r0: 9, r1: 10, c: '#3a3a40', glow: '#ff6030', s: 1.4 }, { k: 'banner', n: 6, r0: 11, r1: 12, c: '#6a1010' }, { k: 'statue', n: 2, r0: 13, r1: 13, c: '#3a3a40', h: 4 }, { k: 'pillar', n: 4, r0: 15, r1: 15, h: 6, c: '#2a2a30' }],
    amb: { kind: 'rain', n: 220, col: [0.7, 0.75, 0.9], alpha: 0.45 },
    e: { light: [0.3, 0.8, 0.5], lightCol: [0.6, 0.6, 0.75], ambSky: [0.2, 0.2, 0.3], ambGnd: [0.1, 0.1, 0.12], rim: [0.2, 0.2, 0.35], fogR: [12, 50] }
  });

  stage({
    id: 'temple', name: 'Затонувший храм', time: 'Вне времени', music: 'colossus', fogC: '#0e1a1e',
    sky: [[0, '#040a0c'], [0.6, '#0a181c'], [1, '#0e1a1e']], skyTop: '#03080a',
    pano: [{ k: 'arches', n: 12, y: 0.74, h: 0.2, c: '#08121a', statue: true }, { k: 'clouds', n: 8, y0: 0.4, y1: 0.7, c: 'rgba(40,90,100,0.25)' }],
    floor: { kind: 'stone', c1: '#3a4a48', c2: '#4a5a58', tiles: 3, moss: true, tile: 3.4 },
    decal: { kind: 'glyph', c1: 'rgba(60,220,240,0.55)', r: 3.8 },
    props: [{ k: 'statue', n: 6, r0: 10, r1: 10, c: '#8a6a30', h: 4, jit: 0 }, { k: 'pillar', n: 8, r0: 14, r1: 14, h: 7, c: '#3a4a48', jit: 0 }, { k: 'rock', n: 6, r0: 16, r1: 20, c: '#2a3a38' }],
    amb: { kind: 'dust', n: 50, col: [0.3, 0.9, 1], s: 0.02, alpha: 0.6 },
    e: { light: [0.2, 1, 0.3], lightCol: [0.55, 0.75, 0.8], ambSky: [0.18, 0.3, 0.32], ambGnd: [0.1, 0.14, 0.14], rim: [0.15, 0.45, 0.5], fogR: [12, 45] }
  });

  stage({
    id: 'temple2', name: 'Сердце храма', time: 'Пламя', music: 'colossus2', fogC: '#2a0a04',
    sky: [[0, '#0a0202'], [0.6, '#3a0a04'], [1, '#2a0a04']], skyTop: '#060101',
    pano: [{ k: 'arches', n: 10, y: 0.74, h: 0.24, c: '#120404', statue: true }, { k: 'clouds', n: 10, y0: 0.3, y1: 0.7, c: 'rgba(255,90,20,0.2)' }],
    floor: { kind: 'lava', c1: '#1e1614', tile: 4 },
    decal: { kind: 'glyph', c1: 'rgba(255,150,40,0.7)', r: 3.8 },
    props: [{ k: 'statue', n: 6, r0: 10, r1: 10, c: '#3a2010', h: 4, jit: 0 }, { k: 'pillar', n: 8, r0: 14, r1: 14, h: 7, c: '#2a1410', jit: 0 }],
    amb: { kind: 'embers', n: 90, col: [1, 0.55, 0.15], s: 0.025, rise: true },
    e: { light: [0.2, 0.6, 0.3], lightCol: [1, 0.55, 0.3], ambSky: [0.35, 0.14, 0.08], ambGnd: [0.45, 0.16, 0.05], rim: [0.6, 0.25, 0.05], fogR: [12, 45] }
  });

  stage({
    id: 'training', name: 'Тренировочный зал', time: '—', music: 'practice', fogC: '#101418',
    sky: [[0, '#101418'], [1, '#101418']], skyTop: '#0c1014', horizon: 0.8,
    pano: [{ k: 'hangar', c1: '#161c22', c2: '#20282e', y: 0.78 }],
    floor: { kind: 'grid', c1: '#1e2630', c2: 'rgba(80,200,255,0.5)', tile: 2 },
    props: [],
    e: { light: [0.35, 0.85, 0.5], lightCol: [1.0, 0.98, 0.95], ambSky: [0.55, 0.58, 0.68], ambGnd: [0.25, 0.25, 0.3], rim: [0.25, 0.3, 0.4], fogR: [20, 60] }
  });

  const byId = {};
  STAGES.forEach(s => byId[s.id] = s);
  const SELECTABLE = STAGES.filter(s => s.id !== 'temple2' && s.id !== 'training');

  function corridorProps(st, len) {
    const mb = new MB(40000);
    const rng = new RNG(T.hashStr(st.id + ':corr'));
    const kinds = (st.props || []).filter(p => p.k !== 'gate' && p.k !== 'cage');
    if (!kinds.length) return mb;
    for (let x = -6; x < len + 12; x += 3.2) {
      if (rng.chance(0.2)) continue;
      const p = rng.pick(kinds);
      prop(mb, rng, p, x + rng.next() * 2, -(4.2 + rng.next() * 3.5), rng.next() * Math.PI * 2);
    }
    return mb;
  }

  Object.assign(T, { STAGES, STAGE: byId, SELECTABLE_STAGES: SELECTABLE, buildStageGpu, drawStage, ambientTick, paintFloor, paintPano, paintDecal, corridorProps, stageProp: prop });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
