(() => {
  const BASE_W = 1024;
  const BASE_H = 768;
  const cache = new Map();
  const images = {};

  const makeRng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const noise = (x, y, s) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy, s);
    const b = hash(ix + 1, iy, s);
    const c = hash(ix, iy + 1, s);
    const d = hash(ix + 1, iy + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };

  const fbm = (x, y, octaves, s) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += noise(x, y, s + i * 31) * amp;
      norm += amp;
      amp *= 0.5;
      x *= 2.03;
      y *= 2.03;
    }
    return sum / norm;
  };

  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (a, b, v) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const mixRgb = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const ramp = (stops, t) => {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [t0, c0] = stops[i - 1];
        const [t1, c1] = stops[i];
        return mixRgb(c0, c1, (t - t0) / (t1 - t0));
      }
    }
    return stops[stops.length - 1][1];
  };
  const rgb = (c, a = 1) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`;
  const scaleRgb = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  const pixels = (ctx, res, fn, box = [0, 0, BASE_W, BASE_H]) => {
    const scale = ctx.canvas.width / BASE_W;
    const [bx, by, bw, bh] = box;
    const w = Math.max(1, Math.round(bw * scale * res));
    const h = Math.max(1, Math.round(bh * scale * res));
    const layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    const lctx = layer.getContext('2d');
    const img = lctx.createImageData(w, h);
    const data = img.data;
    const out = [0, 0, 0, 255];
    const sx = bw / w;
    const sy = bh / h;
    for (let y = 0, i = 0; y < h; y++) {
      const v = by + (y + 0.5) * sy;
      for (let x = 0; x < w; x++, i += 4) {
        out[3] = 255;
        fn(bx + (x + 0.5) * sx, v, out);
        data[i] = out[0];
        data[i + 1] = out[1];
        data[i + 2] = out[2];
        data[i + 3] = out[3];
      }
    }
    lctx.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layer, bx, by, bw, bh);
    ctx.restore();
  };

  const glow = (ctx, x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgb(color, alpha));
    g.addColorStop(1, rgb(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  const scanlines = (ctx, alpha, step = 3) => {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    for (let y = 0; y < BASE_H; y += step) ctx.fillRect(0, y, BASE_W, 1);
  };

  const vignette = (ctx, alpha) => {
    const g = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, BASE_H * 0.35, BASE_W / 2, BASE_H / 2, BASE_W * 0.72);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  };

  const paintCumulus = (ctx, rnd, specs, colors) => {
    const k = ctx.canvas.width / BASE_W;
    const layer = document.createElement('canvas');
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
    const lc = layer.getContext('2d');
    const single = document.createElement('canvas');
    single.width = layer.width;
    single.height = layer.height;
    const sc = single.getContext('2d');
    specs.forEach(([cx, base, width, height]) => {
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(0, 0, single.width, single.height);
      sc.setTransform(k, 0, 0, k, 0, 0);
      const puffs = [];
      const count = Math.round(24 + width / 5);
      for (let i = 0; i < count; i++) {
        const fx = rnd() * 2 - 1;
        const dome = Math.pow(Math.max(0, 1 - fx * fx), 0.7);
        const rise = Math.pow(rnd(), 0.8) * dome;
        const r = height * (0.14 + rnd() * 0.16) * (0.6 + dome * 0.6);
        puffs.push({ x: cx + fx * width * 0.5, y: base - rise * (height - r) - r * 0.35, r, rise });
      }
      puffs.sort((p, q) => p.y - q.y);
      sc.save();
      sc.beginPath();
      sc.rect(cx - width, base - height * 2, width * 2, height * 2);
      sc.clip();
      puffs.forEach(p => {
        const lift = clamp01(p.rise);
        const g = sc.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.45, p.r * 0.1, p.x, p.y, p.r * 1.05);
        g.addColorStop(0, rgb(mixRgb(colors.mid, colors.lit, 0.4 + lift * 0.6)));
        g.addColorStop(0.55, rgb(mixRgb(colors.shade, colors.mid, 0.45 + lift * 0.55)));
        g.addColorStop(1, rgb(mixRgb(colors.shade, colors.mid, 0.15 + lift * 0.35)));
        sc.fillStyle = g;
        sc.beginPath();
        sc.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sc.fill();
      });
      sc.globalCompositeOperation = 'source-atop';
      const under = sc.createLinearGradient(0, base - height * 0.5, 0, base);
      under.addColorStop(0, rgb(colors.dark, 0));
      under.addColorStop(1, rgb(colors.dark, 0.6));
      sc.fillStyle = under;
      sc.fillRect(cx - width, base - height * 0.5, width * 2, height * 0.5);
      sc.restore();
      lc.drawImage(single, 0, 0);
    });
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${Math.max(0.6, 2.2 * k)}px)`;
    ctx.globalAlpha = colors.alpha || 1;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  };

  const painters = {
    clouds(ctx, rnd) {
      const sky = [[0, [22, 78, 166]], [0.5, [62, 132, 210]], [1, [150, 196, 236]]];
      pixels(ctx, 0.25, (u, v, out) => {
        const s = ramp(sky, v / BASE_H);
        const haze = (fbm(u / 400, v / 220, 3, 3) - 0.5) * 18;
        out[0] = s[0] + haze * 0.4;
        out[1] = s[1] + haze * 0.6;
        out[2] = s[2] + haze;
      });
      const sun = ctx.createRadialGradient(80, 40, 0, 80, 40, 420);
      sun.addColorStop(0, 'rgba(255, 252, 230, 0.35)');
      sun.addColorStop(1, 'rgba(255, 252, 230, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      paintCumulus(ctx, rnd, [
        [120, 170, 110, 45], [770, 230, 150, 60], [330, 330, 170, 72], [620, 420, 130, 52],
        [890, 520, 270, 130], [200, 600, 310, 150], [990, 750, 240, 115], [560, 700, 430, 210]
      ], { lit: [255, 255, 255], mid: [240, 244, 250], shade: [194, 206, 228], dark: [124, 146, 186] });
    },

    setup(ctx, rnd) {
      const bg = ctx.createLinearGradient(0, 0, 0, BASE_H);
      bg.addColorStop(0, '#00003c');
      bg.addColorStop(0.45, '#062e8c');
      bg.addColorStop(0.8, '#1a6cc0');
      bg.addColorStop(1, '#4aa0dc');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, BASE_W, BASE_H);

      paintCumulus(ctx, rnd, [
        [300, 770, 220, 90], [700, 760, 220, 85], [120, 800, 380, 200], [850, 800, 400, 210], [480, 810, 440, 230]
      ], { lit: [228, 238, 255], mid: [182, 206, 246], shade: [112, 152, 216], dark: [52, 92, 172], alpha: 0.96 });

      glow(ctx, 300, 330, 330, [120, 170, 255], 0.35);
      drawFlag(ctx, 180, 230, 250, 200);

      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(0, 0, 40, 0.55)';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText('Microslop', 503, 293);
      ctx.font = 'bold italic 116px "Arial Black", Arial, sans-serif';
      ctx.fillText('Win', 499, 403);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText('Microslop', 500, 290);
      ctx.font = 'bold italic 116px "Arial Black", Arial, sans-serif';
      ctx.fillText('Win', 496, 400);
      const winW = ctx.measureText('Win').width;
      ctx.font = 'bold italic 76px "Arial Black", Arial, sans-serif';
      const g98 = ctx.createLinearGradient(0, 330, 0, 400);
      g98.addColorStop(0, '#fff6c0');
      g98.addColorStop(1, '#ffb400');
      ctx.fillStyle = 'rgba(0, 0, 40, 0.55)';
      ctx.fillText('98', 515 + winW, 403);
      ctx.fillStyle = g98;
      ctx.fillText('98', 512 + winW, 400);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(500, 428, 420, 2);
      ctx.font = '22px Arial, sans-serif';
      ctx.fillStyle = '#d8e6ff';
      ctx.fillText('Программа установки', 500, 466);
    },

    spacecadet(ctx, rnd) {
      pixels(ctx, 0.5, (u, v, out) => {
        const q = fbm(u / 260, v / 260, 4, 11);
        const r = fbm(u / 170 + q * 3, v / 170 - q * 2, 5, 12);
        const dust = fbm(u / 95 + 7, v / 95, 4, 13);
        const focus = 1 - Math.hypot((u - 650) / 640, (v - 300) / 420);
        let neb = smooth(0.36, 0.86, r) * (0.35 + 0.65 * smooth(-0.1, 0.8, focus));
        neb *= 1 - 0.75 * smooth(0.55, 0.78, dust);
        const c = ramp([[0, [3, 2, 12]], [0.3, [46, 12, 86]], [0.55, [128, 34, 160]], [0.78, [222, 84, 186]], [1, [255, 214, 240]]], neb);
        const blue = smooth(0.45, 0.85, q) * 0.5 * (1 - neb);
        out[0] = c[0] + 8 * blue;
        out[1] = c[1] + 34 * blue;
        out[2] = c[2] + 110 * blue;
      });

      for (let i = 0; i < 1300; i++) {
        const x = rnd() * BASE_W;
        const y = rnd() * BASE_H;
        const b = 0.25 + rnd() * 0.75;
        const tint = rnd();
        ctx.fillStyle = tint < 0.2 ? `rgba(180, 200, 255, ${b})` : tint < 0.3 ? `rgba(255, 220, 190, ${b})` : `rgba(255, 255, 255, ${b})`;
        const s = rnd() < 0.9 ? 1 : 1.8;
        ctx.fillRect(x, y, s, s);
      }
      for (let i = 0; i < 70; i++) {
        const x = rnd() * BASE_W;
        const y = rnd() * BASE_H;
        glow(ctx, x, y, 3 + rnd() * 6, rnd() < 0.5 ? [200, 210, 255] : [255, 230, 255], 0.8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
      for (let i = 0; i < 8; i++) {
        const x = 300 + rnd() * 720;
        const y = rnd() * 520;
        const len = 14 + rnd() * 26;
        starFlare(ctx, x, y, len);
      }

      const cx = 200;
      const cy = 655;
      const R = 235;
      pixels(ctx, 1, (u, v, out) => {
        const dx = (u - cx) / R;
        const dy = (v - cy) / R;
        const d = Math.hypot(dx, dy);
        if (d > 1.12) {
          out[3] = 0;
          return;
        }
        const rimLight = clamp01(0.35 + dx * 0.55 - dy * 0.55);
        if (d > 1) {
          const halo = smooth(1.12, 1.0, d) * rimLight;
          out[0] = 170;
          out[1] = 120;
          out[2] = 255;
          out[3] = halo * 170;
          return;
        }
        const nz = Math.sqrt(1 - d * d);
        const lam = clamp01(dx * 0.62 - dy * 0.5 + nz * 0.6);
        const lat = dy / Math.max(0.2, nz * 0.6 + 0.4);
        const band = fbm(dx * 2.5 + 3, lat * 9, 4, 21);
        const swirl = Math.sin(lat * 14 + band * 7);
        const base = ramp([[0, [70, 30, 100]], [0.35, [150, 72, 140]], [0.6, [226, 150, 150]], [0.8, [255, 210, 170]], [1, [120, 54, 120]]], clamp01(0.5 + swirl * 0.3 + (band - 0.5) * 0.9));
        const k = 0.05 + 0.95 * Math.pow(lam, 0.9);
        const edge = clamp01((1 - d) * R + 0.5);
        const atmo = Math.pow(1 - nz, 3) * rimLight;
        out[0] = base[0] * k + 120 * atmo;
        out[1] = base[1] * k + 90 * atmo;
        out[2] = base[2] * k + 200 * atmo;
        out[3] = 255 * Math.max(edge, smooth(1.12, 1.0, d) * rimLight * 0.67);
      }, [cx - R * 1.12, cy - R * 1.12, R * 2.24, R * 2.24]);

      const mx = 520;
      const my = 520;
      const mr = 30;
      const moon = ctx.createRadialGradient(mx + mr * 0.4, my - mr * 0.4, mr * 0.1, mx, my, mr);
      moon.addColorStop(0, '#e8dcf0');
      moon.addColorStop(0.6, '#8a7aa0');
      moon.addColorStop(1, '#1a1024');
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40, 20, 60, 0.35)';
      [[8, -6, 6], [-6, 10, 4], [12, 12, 3]].forEach(([ox, oy, cr]) => {
        ctx.beginPath();
        ctx.arc(mx + ox, my + oy, cr, 0, Math.PI * 2);
        ctx.fill();
      });

      const tail = ctx.createLinearGradient(900, 90, 700, 230);
      tail.addColorStop(0, 'rgba(220, 240, 255, 0.9)');
      tail.addColorStop(1, 'rgba(160, 120, 255, 0)');
      ctx.strokeStyle = tail;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(900, 90);
      ctx.lineTo(700, 230);
      ctx.stroke();
      ctx.lineWidth = 9;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1;
      glow(ctx, 900, 90, 18, [230, 245, 255], 0.9);
    },

    pipes(ctx, rnd) {
      const bg = ctx.createLinearGradient(0, 0, 0, BASE_H);
      bg.addColorStop(0, '#000005');
      bg.addColorStop(1, '#03081a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, BASE_W, BASE_H);

      const NX = 16;
      const NY = 12;
      const NZ = 10;
      const F = 820;
      const D = 11;
      const radius = 0.27;
      const project = (x, y, z) => {
        const s = F / (z + D);
        return [512 + (x - (NX - 1) / 2) * s, 384 + (y - (NY - 1) / 2) * s, s];
      };
      const used = new Set();
      const key = (x, y, z) => `${x},${y},${z}`;
      const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < NX && y < NY && z < NZ;
      const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      const colors = [[214, 36, 28], [36, 176, 60], [40, 90, 232], [232, 196, 36], [36, 196, 206], [200, 56, 200], [196, 196, 204], [236, 120, 30]];
      const items = [];

      colors.forEach(color => {
        let p = null;
        for (let tries = 0; tries < 50 && !p; tries++) {
          const c = [Math.floor(rnd() * NX), Math.floor(rnd() * NY), Math.floor(rnd() * NZ)];
          if (!used.has(key(...c))) p = c;
        }
        if (!p) return;
        used.add(key(...p));
        items.push({ kind: 'ball', p, color, scale: 1.25 });
        let dir = dirs[Math.floor(rnd() * 6)];
        const steps = 40 + Math.floor(rnd() * 50);
        for (let i = 0; i < steps; i++) {
          let options = dirs.filter(d => {
            const n = [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
            return inside(...n) && !used.has(key(...n)) && !(d[0] === -dir[0] && d[1] === -dir[1] && d[2] === -dir[2]);
          });
          if (!options.length) break;
          let next = dir;
          const straight = options.includes(dir);
          if (!straight || rnd() < 0.24) {
            const turns = options.filter(d => d !== dir);
            next = turns.length ? turns[Math.floor(rnd() * turns.length)] : dir;
          }
          if (next !== dir) items.push({ kind: 'ball', p: p.slice(), color, scale: 1.3 });
          const q = [p[0] + next[0], p[1] + next[1], p[2] + next[2]];
          items.push({ kind: 'seg', a: p.slice(), b: q, color });
          used.add(key(...q));
          p = q;
          dir = next;
        }
        items.push({ kind: 'ball', p, color, scale: 1.25 });
      });

      const depth = it => (it.kind === 'ball' ? it.p[2] : (it.a[2] + it.b[2]) / 2 + 0.01);
      items.sort((a, b) => depth(b) - depth(a));

      const shades = (c, a, b) => {
        const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        g.addColorStop(0, rgb(scaleRgb(c, 0.12)));
        g.addColorStop(0.3, rgb(scaleRgb(c, 0.5)));
        g.addColorStop(0.62, rgb(c));
        g.addColorStop(0.8, rgb(mixRgb(c, [255, 255, 255], 0.78)));
        g.addColorStop(0.9, rgb(scaleRgb(c, 0.95)));
        g.addColorStop(1, rgb(scaleRgb(c, 0.35)));
        return g;
      };

      items.forEach(it => {
        const fog = 1 - clamp01((depth(it) - 1) / NZ) * 0.55;
        const c = scaleRgb(it.color, fog);
        if (it.kind === 'ball') {
          const [x, y, s] = project(...it.p);
          const r = radius * s * it.scale;
          const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
          g.addColorStop(0, rgb(mixRgb(c, [255, 255, 255], 0.85)));
          g.addColorStop(0.3, rgb(c));
          g.addColorStop(0.85, rgb(scaleRgb(c, 0.3)));
          g.addColorStop(1, rgb(scaleRgb(c, 0.12)));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        let [x1, y1, s1] = project(...it.a);
        let [x2, y2, s2] = project(...it.b);
        const r1 = radius * s1;
        const r2 = radius * s2;
        let dx = x2 - x1;
        let dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 0.5) return;
        dx /= len;
        dy /= len;
        x1 -= dx;
        y1 -= dy;
        x2 += dx;
        y2 += dy;
        let nx = -dy;
        let ny = dx;
        if (ny > 0.05 || (Math.abs(ny) <= 0.05 && nx > 0)) {
          nx = -nx;
          ny = -ny;
        }
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const rm = (r1 + r2) / 2;
        ctx.fillStyle = shades(c, [mx - nx * rm, my - ny * rm], [mx + nx * rm, my + ny * rm]);
        ctx.beginPath();
        ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
        ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
        ctx.lineTo(x2 - nx * r2, y2 - ny * r2);
        ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
        ctx.closePath();
        ctx.fill();
      });
      vignette(ctx, 0.45);
    },

    cyberpunk(ctx, rnd) {
      const horizon = 478;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#05001a');
      sky.addColorStop(0.45, '#2a0a52');
      sky.addColorStop(0.8, '#a0187a');
      sky.addColorStop(1, '#ff5a8c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, BASE_W, horizon);
      for (let i = 0; i < 260; i++) {
        const y = rnd() * horizon * 0.7;
        ctx.fillStyle = `rgba(255, 230, 255, ${(0.2 + rnd() * 0.8) * (1 - y / (horizon * 0.7))})`;
        const s = rnd() < 0.85 ? 1 : 2;
        ctx.fillRect(rnd() * BASE_W, y, s, s);
      }

      const sx = 512;
      const sy = 330;
      const sr = 160;
      glow(ctx, sx, sy, sr * 2.2, [255, 60, 150], 0.45);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, BASE_W, sy);
      let y = sy;
      let gap = 3;
      while (y < sy + sr) {
        const band = Math.max(4, 22 - gap * 1.5);
        y += gap;
        ctx.rect(0, y, BASE_W, band);
        y += band;
        gap += 2.2;
      }
      ctx.clip();
      const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
      sun.addColorStop(0, '#fff25a');
      sun.addColorStop(0.45, '#ff9a2a');
      sun.addColorStop(1, '#ff1a8c');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const ridge = (seed, base, amp, rough) => {
        const r = makeRng(seed);
        const n = 129;
        const h = new Array(n).fill(0);
        let step = n - 1;
        let a = amp;
        h[0] = r() * amp;
        h[n - 1] = r() * amp;
        while (step > 1) {
          const half = step / 2;
          for (let i = half; i < n; i += step) h[i] = (h[i - half] + h[i + half]) / 2 + (r() - 0.5) * a;
          a *= rough;
          step = half;
        }
        return h.map((v, i) => [(i / (n - 1)) * BASE_W, base - Math.abs(v) * (0.35 + 0.65 * Math.abs(i / (n - 1) - 0.5) * 2)]);
      };
      const drawRidge = (pts, fill, rim) => {
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        pts.forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.lineTo(BASE_W, horizon);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, horizon - 200, 0, horizon);
        g.addColorStop(0, fill[0]);
        g.addColorStop(1, fill[1]);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.strokeStyle = rim;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1;
        ctx.stroke();
      };
      drawRidge(ridge(5, horizon - 10, 260, 0.55), ['#3a0c62', '#1a0436'], '#ff4fc0');
      drawRidge(ridge(9, horizon + 2, 150, 0.58), ['#1c0438', '#0b0120'], '#30e8ff');

      let bx = -10;
      while (bx < BASE_W) {
        const w = 18 + rnd() * 34;
        const centre = Math.abs(bx + w / 2 - 512) / 512;
        const h = (14 + rnd() * 70) * (0.3 + centre * 1.1);
        ctx.fillStyle = '#0d0122';
        ctx.fillRect(bx, horizon - h, w, h);
        for (let wy = horizon - h + 5; wy < horizon - 4; wy += 6) {
          for (let wx = bx + 3; wx < bx + w - 3; wx += 5) {
            if (rnd() < 0.3) {
              const t = rnd();
              ctx.fillStyle = t < 0.4 ? 'rgba(80, 240, 255, 0.85)' : t < 0.75 ? 'rgba(255, 90, 200, 0.8)' : 'rgba(255, 220, 120, 0.8)';
              ctx.fillRect(wx, wy, 2, 2);
            }
          }
        }
        bx += w + rnd() * 6;
      }

      const ground = ctx.createLinearGradient(0, horizon, 0, BASE_H);
      ground.addColorStop(0, '#2c0042');
      ground.addColorStop(0.3, '#12002a');
      ground.addColorStop(1, '#05000f');
      ctx.fillStyle = ground;
      ctx.fillRect(0, horizon, BASE_W, BASE_H - horizon);
      const reflect = ctx.createRadialGradient(sx, horizon, 0, sx, horizon, 260);
      reflect.addColorStop(0, 'rgba(255, 80, 170, 0.45)');
      reflect.addColorStop(1, 'rgba(255, 80, 170, 0)');
      ctx.fillStyle = reflect;
      ctx.fillRect(0, horizon, BASE_W, 260);

      const gridLines = [];
      for (let i = -24; i <= 24; i++) {
        const bottomX = 512 + i * 92;
        gridLines.push([512 + i * 4, horizon, bottomX, BASE_H]);
      }
      for (let z = 1; z < 40; z++) {
        const gy = horizon + (BASE_H - horizon) * 1.6 / (z * 0.55 + 0.6);
        if (gy > BASE_H || gy < horizon + 1) continue;
        gridLines.push([0, gy, BASE_W, gy]);
      }
      [[6, 0.18, '#ff2fb4'], [2.5, 0.55, '#ff4fd0'], [1, 1, '#ffd0f4']].forEach(([lw, a, col]) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.globalAlpha = a;
        ctx.beginPath();
        gridLines.forEach(([x1, y1, x2, y2]) => {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        });
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      const fade = ctx.createLinearGradient(0, horizon, 0, horizon + 90);
      fade.addColorStop(0, 'rgba(40, 0, 60, 0.95)');
      fade.addColorStop(1, 'rgba(40, 0, 60, 0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, horizon, BASE_W, 90);
      ctx.fillStyle = '#ff9ad8';
      ctx.fillRect(0, horizon - 1, BASE_W, 2);
      glow(ctx, sx, horizon, 380, [255, 120, 210], 0.25);
      scanlines(ctx, 0.12);
    },

    redalert(ctx, rnd) {
      const levels = 13;
      pixels(ctx, 1, (u, v, out) => {
        const h = fbm(u / 360 + 4, v / 360 + 2, 5, 51);
        const t = h * levels;
        const level = Math.floor(t);
        const frac = t - level;
        let c;
        if (h < 0.44) {
          const deep = smooth(0.44, 0.25, h);
          c = [26 - deep * 14, 3, 6 + deep * 4];
          if (((u + v) | 0) % 9 === 0) c = [c[0] + 10, c[1] + 2, c[2] + 2];
        } else {
          const k = (level - 5) / (levels - 5);
          c = [44 + k * 70, 8 + k * 10, 6 + k * 4];
          if (frac < 0.07) c = [c[0] + 70, c[1] + 16, c[2] + 10];
        }
        if (Math.abs(h - 0.44) < 0.0035) c = [230, 70, 50];
        out[0] = c[0];
        out[1] = c[1];
        out[2] = c[2];
      });

      ctx.strokeStyle = 'rgba(255, 70, 50, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 64; x < BASE_W; x += 64) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, BASE_H);
      }
      for (let y = 64; y < BASE_H; y += 64) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(BASE_W, y + 0.5);
      }
      ctx.stroke();
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 110, 90, 0.75)';
      for (let i = 0; i < 16; i++) ctx.fillText(String.fromCharCode(65 + i), i * 64 + 28, 13);
      for (let j = 1; j < 12; j++) ctx.fillText(String(j), 4, j * 64 + 14);

      const cx = 600;
      const cy = 400;
      const R = 300;
      ctx.fillStyle = 'rgba(30, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      const sweepAt = -0.75;
      for (let i = 0; i < 70; i++) {
        const a0 = sweepAt - (i + 1) * 0.022;
        const a1 = sweepAt - i * 0.022;
        ctx.fillStyle = `rgba(255, 40, 30, ${0.32 * Math.pow(1 - i / 70, 2)})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(255, 60, 40, 0.65)';
      ctx.lineWidth = 1.5;
      [0.25, 0.5, 0.75, 1].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - R - 20, cy);
      ctx.lineTo(cx + R + 20, cy);
      ctx.moveTo(cx, cy - R - 20);
      ctx.lineTo(cx, cy + R + 20);
      ctx.stroke();
      for (let deg = 0; deg < 360; deg += 5) {
        const a = (deg - 90) * Math.PI / 180;
        const inner = R - (deg % 30 === 0 ? 16 : deg % 10 === 0 ? 9 : 5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
        if (deg % 30 === 0) {
          ctx.fillStyle = 'rgba(255, 120, 100, 0.9)';
          ctx.textAlign = 'center';
          ctx.fillText(String(deg).padStart(3, '0'), cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16) + 4);
        }
      }
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(255, 210, 190, 0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAt) * R, cy + Math.sin(sweepAt) * R);
      ctx.stroke();
      glow(ctx, cx, cy, 30, [255, 80, 60], 0.7);

      const blips = [
        [-0.95, 0.78, 'HOSTILE 03', 'tri'], [-1.2, 0.55, 'HOSTILE 07', 'tri'], [-0.85, 0.42, 'HOSTILE 11', 'tri'],
        [-1.5, 0.9, 'MIG FLIGHT', 'tri'], [2.4, 0.6, 'ALLIED HQ', 'hq'], [1.1, 0.35, 'PATROL 2', 'sq'],
        [0.4, 0.82, 'PATROL 5', 'sq'], [-2.8, 0.7, 'CONVOY', 'sq']
      ];
      blips.forEach(([ang, dist, label, kind]) => {
        const bxp = cx + Math.cos(ang) * R * dist;
        const byp = cy + Math.sin(ang) * R * dist;
        let lag = sweepAt - ang;
        while (lag < 0) lag += Math.PI * 2;
        const fresh = 1 - Math.min(1, lag / (Math.PI * 2));
        const a = 0.35 + 0.65 * fresh;
        glow(ctx, bxp, byp, 16, [255, 70, 50], 0.6 * a);
        ctx.fillStyle = kind === 'tri' ? `rgba(255, 90, 60, ${a})` : `rgba(255, 200, 150, ${a})`;
        ctx.beginPath();
        if (kind === 'tri') {
          ctx.moveTo(bxp, byp - 7);
          ctx.lineTo(bxp + 6, byp + 5);
          ctx.lineTo(bxp - 6, byp + 5);
        } else if (kind === 'hq') {
          ctx.moveTo(bxp, byp - 8);
          ctx.lineTo(bxp + 8, byp);
          ctx.lineTo(bxp, byp + 8);
          ctx.lineTo(bxp - 8, byp);
        } else {
          ctx.rect(bxp - 4, byp - 4, 8, 8);
        }
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillText(label, bxp + 10, byp - 6);
      });

      const tx = cx + Math.cos(-0.95) * R * 0.78;
      const ty = cy + Math.sin(-0.95) * R * 0.78;
      ctx.strokeStyle = 'rgba(255, 230, 200, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx - 16, ty - 16, 32, 32);
      ctx.beginPath();
      ctx.moveTo(tx - 24, ty);
      ctx.lineTo(tx - 12, ty);
      ctx.moveTo(tx + 12, ty);
      ctx.lineTo(tx + 24, ty);
      ctx.moveTo(tx, ty - 24);
      ctx.lineTo(tx, ty - 12);
      ctx.moveTo(tx, ty + 12);
      ctx.lineTo(tx, ty + 24);
      ctx.stroke();

      ctx.fillStyle = 'rgba(20, 0, 0, 0.75)';
      ctx.fillRect(24, 30, 250, 150);
      ctx.strokeStyle = 'rgba(255, 60, 40, 0.8)';
      ctx.strokeRect(24.5, 30.5, 250, 150);
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillStyle = '#ff5040';
      ctx.fillText('DEFCON 2', 36, 52);
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 150, 130, 0.95)';
      ['POWER', 'SHIELDS', 'RADAR', 'AMMO'].forEach((name, i) => {
        const yy = 76 + i * 24;
        ctx.fillText(name, 36, yy);
        const fill = [0.82, 0.46, 1, 0.64][i];
        ctx.strokeStyle = 'rgba(255, 80, 60, 0.7)';
        ctx.strokeRect(110.5, yy - 9.5, 150, 10);
        for (let s = 0; s < Math.round(fill * 15); s++) {
          ctx.fillStyle = i === 1 ? 'rgba(255, 220, 90, 0.9)' : 'rgba(255, 70, 50, 0.9)';
          ctx.fillRect(112 + s * 10, yy - 8, 8, 7);
        }
        ctx.fillStyle = 'rgba(255, 150, 130, 0.95)';
      });

      ctx.fillStyle = 'rgba(20, 0, 0, 0.8)';
      ctx.fillRect(316, 32, 400, 26);
      ctx.fillRect(366, 730, 248, 26);
      ctx.strokeStyle = 'rgba(255, 60, 40, 0.8)';
      ctx.strokeRect(316.5, 32.5, 400, 26);
      ctx.strokeRect(366.5, 730.5, 248, 26);
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#ff3a2a';
      ctx.fillText('TACTICAL DEFENSE RADAR // LEVEL 4 ALERT', 330, 50);
      ctx.fillText('TARGET LOCK: SECTOR 7-G', 380, 748);
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 140, 120, 0.85)';
      ['GRID REF 47.3N 33.9E', 'SCAN 0.66 RPM', 'CONTACTS 08', 'UPLINK OK'].forEach((s, i) => ctx.fillText(s, 860, 640 + i * 16));
      scanlines(ctx, 0.18);
      vignette(ctx, 0.6);
    },

    gold(ctx) {
      const W = ctx.canvas.width;
      const H = ctx.canvas.height;
      const step = BASE_W / W;
      const field = new Float32Array(W * H);
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const x = ((i + 0.5) * step) / BASE_W;
          const y = ((j + 0.5) * step) / BASE_W;
          const w = fbm(x * 1.6, y * 1.6, 3, 41) * 2.4 + fbm(x * 4, y * 4, 2, 43) * 0.45;
          const across = x * 0.62 - y * 0.78;
          field[j * W + i] = Math.sin(across * 55 + w * 6) * 0.5
            + Math.sin(across * 120 + w * 9 + 1.1) * 0.16
            + Math.sin((x * 0.78 + y * 0.62) * 22 + w * 3) * 0.2;
        }
      }
      const at = (i, j) => field[Math.min(H - 1, Math.max(0, j)) * W + Math.min(W - 1, Math.max(0, i))];
      const L = [-0.42, -0.68, 0.6];
      const Ln = Math.hypot(...L);
      const lx = L[0] / Ln;
      const ly = L[1] / Ln;
      const lz = L[2] / Ln;
      const hx0 = lx;
      const hy0 = ly;
      const hz0 = lz + 1;
      const hn = Math.hypot(hx0, hy0, hz0);
      const hx = hx0 / hn;
      const hy = hy0 / hn;
      const hz = hz0 / hn;
      const S = 45;
      pixels(ctx, 1, (u, v, out) => {
        const i = Math.floor(u / step);
        const j = Math.floor(v / step);
        const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * step) * S;
        const gy = (at(i, j + 1) - at(i, j - 1)) / (2 * step) * S;
        const nl = Math.hypot(gx, gy, 1);
        const nx = -gx / nl;
        const ny = -gy / nl;
        const nz = 1 / nl;
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 36);
        const edge = Math.hypot((u - 512) / 620, (v - 384) / 470);
        const tone = clamp01((0.14 + diff * diff * 0.8 + spec * 0.6) * (1 - smooth(0.6, 1.25, edge) * 0.55));
        const c = ramp([[0, [26, 13, 2]], [0.32, [104, 60, 8]], [0.56, [196, 136, 28]], [0.78, [240, 192, 76]], [1, [255, 246, 204]]], tone);
        out[0] = c[0];
        out[1] = c[1];
        out[2] = c[2];
      });

      const emboss = (text, x, y, font) => {
        ctx.font = font;
        ctx.fillStyle = 'rgba(40, 20, 0, 0.55)';
        ctx.fillText(text, x + 2, y + 2);
        ctx.fillStyle = 'rgba(255, 244, 196, 0.55)';
        ctx.fillText(text, x - 1, y - 1);
        ctx.fillStyle = 'rgba(176, 120, 24, 0.85)';
        ctx.fillText(text, x, y);
      };
      ctx.textAlign = 'right';
      emboss('MILLENNIUM', 984, 700, 'italic bold 44px "Times New Roman", serif');
      emboss('— 98 —', 984, 736, 'italic 26px "Times New Roman", serif');
      ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(255, 230, 160, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16.5, 16.5, BASE_W - 33, BASE_H - 33);
      ctx.strokeStyle = 'rgba(60, 30, 0, 0.5)';
      ctx.strokeRect(20.5, 20.5, BASE_W - 41, BASE_H - 41);
    },

    dejiko(ctx, rnd) {
      const dejiko = loadImage('dejiko', 'content/digi/pic/profile_dejiko.png');
      const puchiko = loadImage('puchiko', 'content/digi/pic/profile_puchiko.png');

      const sky = ctx.createLinearGradient(0, 0, 0, BASE_H);
      sky.addColorStop(0, '#1e0b3c');
      sky.addColorStop(0.45, '#5a2a86');
      sky.addColorStop(0.75, '#b03a8a');
      sky.addColorStop(1, '#ff7aa8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(255, 240, 255, ${0.3 + rnd() * 0.6})`;
        ctx.fillRect(rnd() * BASE_W, rnd() * 260, 1.5, 1.5);
      }

      const signs = [
        ['ゲーム', '#ffe14a', '#c4002a'], ['アニメ', '#ffffff', '#1a3cc8'], ['電気街', '#ff3a6a', '#fff4d8'],
        ['コミック', '#2a1a00', '#ffd23a'], ['ＣＤ', '#ffffff', '#d4268a'], ['秋葉原', '#ffe14a', '#2a7a2a']
      ];
      let x = -20;
      let n = 0;
      while (x < BASE_W) {
        const w = 90 + rnd() * 90;
        const top = 120 + rnd() * 200;
        const g = ctx.createLinearGradient(0, top, 0, BASE_H);
        g.addColorStop(0, '#2a1446');
        g.addColorStop(1, '#140826');
        ctx.fillStyle = g;
        ctx.fillRect(x, top, w, BASE_H - top);
        for (let wy = top + 14; wy < 640; wy += 22) {
          for (let wx = x + 8; wx < x + w - 14; wx += 18) {
            if (rnd() < 0.55) {
              ctx.fillStyle = rnd() < 0.7 ? 'rgba(255, 230, 160, 0.75)' : 'rgba(150, 220, 255, 0.7)';
              ctx.fillRect(wx, wy, 10, 12);
            }
          }
        }
        const [text, fg, bgc] = signs[n % signs.length];
        const sw = 38;
        const sh = text.length * 34 + 16;
        const sxp = x + w - sw - 6;
        const syp = top + 30;
        glow(ctx, sxp + sw / 2, syp + sh / 2, sh * 0.8, [255, 120, 200], 0.35);
        ctx.fillStyle = bgc;
        ctx.fillRect(sxp, syp, sw, sh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sxp, syp, sw, sh);
        ctx.fillStyle = fg;
        ctx.font = 'bold 28px "MS Gothic", "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        [...text].forEach((ch, i) => ctx.fillText(ch, sxp + sw / 2, syp + 38 + i * 34));
        ctx.textAlign = 'left';
        x += w + 4;
        n++;
      }

      const bx = 560;
      const by = 34;
      const bw = 420;
      const bh = 82;
      glow(ctx, bx + bw / 2, by + bh / 2, 300, [255, 200, 80], 0.35);
      ctx.fillStyle = '#d0102c';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#ffe14a';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
      ctx.font = 'bold italic 58px "Arial Black", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5a0010';
      ctx.fillText('GAMERS', bx + bw / 2 + 3, by + 63);
      ctx.fillStyle = '#ffe14a';
      ctx.fillText('GAMERS', bx + bw / 2, by + 60);
      ctx.textAlign = 'left';

      const street = ctx.createLinearGradient(0, 640, 0, BASE_H);
      street.addColorStop(0, '#3a1a52');
      street.addColorStop(1, '#14061e');
      ctx.fillStyle = street;
      ctx.fillRect(0, 640, BASE_W, BASE_H - 640);
      for (let i = 0; i < 14; i++) glow(ctx, rnd() * BASE_W, 650 + rnd() * 110, 30 + rnd() * 40, rnd() < 0.5 ? [255, 120, 200] : [255, 220, 120], 0.25);

      for (let i = 0; i < 26; i++) sparkle(ctx, rnd() * BASE_W, rnd() * BASE_H, 4 + rnd() * 9, rnd() < 0.5 ? '#fff4ff' : '#ffd2ec');

      const k = ctx.canvas.width / BASE_W;
      const placeCharacter = (img, height, right, bottom) => {
        if (!imageReady(img)) return false;
        const w = img.naturalWidth * height / img.naturalHeight;
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 14 * k;
        ctx.drawImage(img, right - w, bottom - height, w, height);
        ctx.restore();
        ctx.drawImage(img, right - w, bottom - height, w, height);
        return true;
      };
      ctx.fillStyle = 'rgba(20, 0, 30, 0.45)';
      ctx.beginPath();
      ctx.ellipse(250, 752, 170, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(770, 756, 230, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      const puchikoDone = placeCharacter(puchiko, 500, 440, 790);
      const dejikoDone = placeCharacter(dejiko, 650, 1010, 790);

      const title = (text, xx, yy, size, fill) => {
        ctx.font = `bold italic ${size}px "Comic Sans MS", "Arial Rounded MT Bold", Arial, sans-serif`;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.22;
        ctx.strokeText(text, xx, yy);
        ctx.strokeStyle = '#7a1a6a';
        ctx.lineWidth = size * 0.08;
        ctx.strokeText(text, xx, yy);
        ctx.fillStyle = fill;
        ctx.fillText(text, xx, yy);
      };
      const titleFill = ctx.createLinearGradient(0, 30, 0, 100);
      titleFill.addColorStop(0, '#ffb6e0');
      titleFill.addColorStop(1, '#ff2a9a');
      title('Di Gi Charat', 34, 92, 64, titleFill);
      title('Akihabara 1999 — nyo!', 40, 140, 26, '#7ee05a');
      return puchikoDone && dejikoDone;
    }
  };

  function starFlare(ctx, x, y, len) {
    glow(ctx, x, y, len * 0.6, [220, 220, 255], 0.7);
    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
      const g = ctx.createLinearGradient(x - dx * len, y - dy * len, x + dx * len, y + dy * len);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - dx * len, y - dy * len);
      ctx.lineTo(x + dx * len, y + dy * len);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function sparkle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }

  function drawFlag(ctx, x, y, w, h) {
    const amp = h * 0.11;
    const point = (s, t) => [
      x + s * w,
      y + h * 0.5 + (t - 0.5) * h * (1 - 0.14 * s) + amp * Math.sin(s * Math.PI * 1.35 + 0.35) * (0.7 + 0.3 * t)
    ];
    const fold = s => 0.82 + 0.3 * Math.cos(s * Math.PI * 1.35 + 0.35);
    const gap = 0.045;
    const panes = [
      [0, 0.5 - gap / 2, 0, 0.5 - gap / 2, [232, 60, 30]],
      [0.5 + gap / 2, 1, 0, 0.5 - gap / 2, [64, 168, 44]],
      [0, 0.5 - gap / 2, 0.5 + gap / 2, 1, [30, 92, 214]],
      [0.5 + gap / 2, 1, 0.5 + gap / 2, 1, [250, 196, 20]]
    ];
    const outline = (s0, s1, t0, t1) => {
      const pts = [];
      const N = 16;
      for (let i = 0; i <= N; i++) pts.push(point(s0 + (s1 - s0) * i / N, t0));
      for (let i = 0; i <= N; i++) pts.push(point(s1 - (s1 - s0) * i / N, t1));
      return pts;
    };

    for (let c = 1; c <= 6; c++) {
      const s = -c * 0.085;
      const size = Math.max(3, 15 - c * 2);
      const alpha = 1 - c * 0.14;
      [[0.12, [232, 60, 30]], [0.36, [64, 168, 44]], [0.64, [30, 92, 214]], [0.88, [250, 196, 20]]].forEach(([t, col], row) => {
        if ((c + row) % 2 === 0 && c > 2) return;
        const [px, py] = point(s, t);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(px - size / 2 - 1.5, py - size / 2 - 1.5, size + 3, size + 3);
        ctx.fillStyle = rgb(col, alpha);
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      });
    }

    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9;
    panes.forEach(([s0, s1, t0, t1]) => {
      const pts = outline(s0, s1, t0, t1);
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    panes.forEach(([s0, s1, t0, t1, col]) => {
      const N = 18;
      const M = 4;
      for (let i = 0; i < N; i++) {
        const sa = s0 + (s1 - s0) * i / N;
        const sb = s0 + (s1 - s0) * (i + 1) / N;
        for (let j = 0; j < M; j++) {
          const ta = t0 + (t1 - t0) * j / M;
          const tb = t0 + (t1 - t0) * (j + 1) / M;
          const shade = fold((sa + sb) / 2) * (1.08 - 0.16 * ((ta + tb) / 2));
          const c = mixRgb(scaleRgb(col, Math.min(shade, 1)), [255, 255, 255], Math.max(0, shade - 1) * 0.9);
          ctx.fillStyle = rgb(c);
          ctx.strokeStyle = rgb(c);
          ctx.lineWidth = 0.8;
          const a = point(sa, ta);
          const b = point(sb, ta);
          const d = point(sb, tb);
          const e = point(sa, tb);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.lineTo(d[0], d[1]);
          ctx.lineTo(e[0], e[1]);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    });
  }

  const imageReady = img => !!img && img.complete && img.naturalWidth > 0;

  function loadImage(name, src) {
    if (!images[name]) {
      const img = new Image();
      img.onload = () => refresh('dejiko');
      img.src = src;
      images[name] = img;
    }
    return images[name];
  }

  function refresh(id) {
    [...cache.keys()].filter(k => k.startsWith(`${id}:`)).forEach(k => cache.delete(k));
    if (typeof document === 'undefined') return;
    document.querySelectorAll(`[data-wall-art="${id}"]`).forEach(el => {
      const data = api.url(id, Number(el.dataset.wallW) || BASE_W, Number(el.dataset.wallH) || BASE_H);
      if (data) el.style.backgroundImage = `url("${data}")`;
    });
    const dialogs = window.appDialogs;
    const desktop = document.getElementById('desktop');
    if (dialogs && desktop && typeof dialogs.getDisplaySettings === 'function') {
      const s = dialogs.getDisplaySettings();
      if (s.wallpaper === id) dialogs.applyWallpaperMode(desktop, s.wallpaperMode, s.wallpaper);
    }
  }

  const seeds = { clouds: 98, setup: 1998, spacecadet: 3, pipes: 42, cyberpunk: 1984, redalert: 7, gold: 2000, dejiko: 1999 };

  const api = {
    has(id) {
      return Object.prototype.hasOwnProperty.call(painters, id);
    },
    url(id, w = BASE_W, h = BASE_H) {
      if (!api.has(id) || typeof document === 'undefined') return '';
      const key = `${id}:${w}x${h}`;
      if (cache.has(key)) return cache.get(key);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(w / BASE_W, 0, 0, h / BASE_H, 0, 0);
        const complete = painters[id](ctx, makeRng(seeds[id] || 1)) !== false;
        const data = canvas.toDataURL('image/jpeg', 0.9);
        if (complete) cache.set(key, data);
        return data;
      } catch (e) {
        return '';
      }
    }
  };

  window.wallpaperArt = api;
})();
