(function () {
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const W = 640;
  const H = 360;
  const JP = '"Yu Gothic", "YuGothic", "Meiryo", "MS Gothic", sans-serif';
  const HAND = '"Ink Free", "Segoe Print", "Comic Sans MS", cursive';
  const HEAVY = '"Arial Black", "Segoe UI Black", Impact, sans-serif';

  function rng(seed) {
    let s = (Math.floor(seed * 9973) ^ 0x5bd1e995) >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const scratch = { a: null, b: null };

  function canvasOf(key, w, h) {
    let c = scratch[key];
    if (!c) {
      c = document.createElement('canvas');
      scratch[key] = c;
    }
    if (c.width < w) c.width = w;
    if (c.height < h) c.height = h;
    return c;
  }

  function wobPath(ctx, pts, amp, g, close) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p[0] + (g() - 0.5) * amp, y = p[1] + (g() - 0.5) * amp;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (close) ctx.closePath();
  }

  function stroke(ctx, pts, o) {
    const g = rng(o.seed || 1);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.color || '#ffffff';
    ctx.lineWidth = o.width || 3;
    const passes = o.passes || 1;
    for (let k = 0; k < passes; k++) {
      wobPath(ctx, pts, o.amp === undefined ? 2 : o.amp, g, o.close);
      ctx.stroke();
    }
    ctx.restore();
  }

  function partial(pts, k) {
    if (k >= 1) return pts;
    const n = Math.max(2, Math.floor(pts.length * Math.max(0, k)));
    return pts.slice(0, n);
  }

  function heartPts(x, y, s, n) {
    const out = [];
    const N = n || 28;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * PI * 2;
      const hx = 16 * Math.pow(S(t), 3);
      const hy = 13 * C(t) - 5 * C(2 * t) - 2 * C(3 * t) - C(4 * t);
      out.push([x + (hx / 17) * s, y - (hy / 17) * s]);
    }
    return out;
  }

  function heart(ctx, x, y, s, o) {
    const opt = o || {};
    const pts = heartPts(x, y, s);
    if (opt.fill) {
      ctx.save();
      ctx.fillStyle = opt.fill;
      wobPath(ctx, pts, opt.amp || 1, rng(opt.seed || 3), true);
      ctx.fill();
      if (opt.dots) {
        ctx.clip();
        ctx.fillStyle = opt.dots;
        for (let yy = y - s; yy < y + s; yy += s * 0.22) {
          for (let xx = x - s; xx < x + s; xx += s * 0.22) {
            ctx.beginPath();
            ctx.arc(xx + ((yy / (s * 0.22)) % 2) * s * 0.11, yy, s * 0.05, 0, PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
    if (opt.color) stroke(ctx, partial(pts, opt.k === undefined ? 1 : opt.k), { color: opt.color, width: opt.width || 3, seed: opt.seed || 3, amp: opt.amp === undefined ? 2 : opt.amp, close: opt.k === undefined || opt.k >= 1 });
  }

  function starPts(x, y, s, rot) {
    const out = [];
    for (let i = 0; i <= 10; i++) {
      const a = -PI / 2 + (i * PI) / 5 + (rot || 0);
      const q = i % 2 ? s * 0.45 : s;
      out.push([x + C(a) * q, y + S(a) * q]);
    }
    return out;
  }

  function star(ctx, x, y, s, o) {
    const opt = o || {};
    const pts = starPts(x, y, s, opt.rot);
    if (opt.fill) {
      ctx.save();
      ctx.fillStyle = opt.fill;
      wobPath(ctx, pts, 1, rng(opt.seed || 5), true);
      ctx.fill();
      ctx.restore();
    }
    if (opt.color) stroke(ctx, pts, { color: opt.color, width: opt.width || 2.5, seed: opt.seed || 5, amp: opt.amp === undefined ? 1.5 : opt.amp, close: true });
  }

  function sparkle(ctx, x, y, s, o) {
    const opt = o || {};
    ctx.save();
    ctx.fillStyle = opt.color || '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * PI) / 4 + (opt.rot || 0);
      const q = i % 2 ? s * 0.22 : s;
      ctx.lineTo(x + C(a) * q, y + S(a) * q);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function burst(ctx, x, y, r0, r1, n, o) {
    const opt = o || {};
    const g = rng(opt.seed || 7);
    ctx.save();
    ctx.strokeStyle = opt.color || '#ffffff';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + (opt.rot || 0) + (g() - 0.5) * (opt.jit || 0.15);
      const a0 = r0 * (0.8 + g() * 0.4), a1 = r1 * (0.7 + g() * 0.5);
      ctx.lineWidth = (opt.width || 2) * (0.6 + g() * 0.8);
      ctx.beginPath();
      ctx.moveTo(x + C(a) * a0, y + S(a) * a0);
      ctx.lineTo(x + C(a) * a1, y + S(a) * a1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function scrawl(ctx, x, y, w, h, o) {
    const opt = o || {};
    const g = rng(opt.seed || 11);
    ctx.save();
    ctx.strokeStyle = opt.color || '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = opt.width || 2;
    const n = opt.n || 4;
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      let px = x + g() * w, py = y + g() * h;
      ctx.moveTo(px, py);
      const steps = opt.steps || 12;
      for (let i = 0; i < steps; i++) {
        px = Math.max(x, Math.min(x + w, px + (g() - 0.5) * w * 0.6));
        py = Math.max(y, Math.min(y + h, py + (g() - 0.5) * h * 0.6));
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function loops(ctx, x, y, w, h, o) {
    const opt = o || {};
    const g = rng(opt.seed || 13);
    ctx.save();
    ctx.strokeStyle = opt.color || '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = opt.width || 2;
    ctx.beginPath();
    const n = opt.n || 30;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * PI * 2 * (opt.turns || 3);
      const px = x + w / 2 + C(t) * w * (0.35 + g() * 0.15) + (i / n - 0.5) * w * (opt.drift || 0);
      const py = y + h / 2 + S(t) * h * (0.35 + g() * 0.15);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function zigzag(ctx, x0, y0, x1, y1, amp, n, o) {
    const pts = [];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    for (let i = 0; i <= n; i++) {
      const k = i / n, s = i % 2 ? amp : -amp;
      pts.push([x0 + dx * k + nx * s, y0 + dy * k + ny * s]);
    }
    stroke(ctx, pts, Object.assign({ amp: 1 }, o));
  }

  function wave(ctx, x0, y0, x1, y1, amp, n, o) {
    const pts = [];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const N = n * 8;
    for (let i = 0; i <= N; i++) {
      const k = i / N, s = S(k * n * PI * 2 + ((o && o.phase) || 0)) * amp;
      pts.push([x0 + dx * k + nx * s, y0 + dy * k + ny * s]);
    }
    stroke(ctx, pts, Object.assign({ amp: 0.6 }, o));
  }

  function bolt(ctx, x, y, s, rot, o) {
    const pts = [[0, -1], [0.35, -0.15], [0.05, -0.1], [0.4, 1], [-0.25, 0.05], [0.05, 0.02], [-0.3, -1]].map(([px, py]) => {
      const a = rot || 0;
      return [x + (px * C(a) - py * S(a)) * s, y + (px * S(a) + py * C(a)) * s];
    });
    const opt = o || {};
    if (opt.fill) {
      ctx.save();
      ctx.fillStyle = opt.fill;
      wobPath(ctx, pts, 1, rng(opt.seed || 17), true);
      ctx.fill();
      ctx.restore();
    }
    stroke(ctx, pts, { color: opt.color || '#ffffff', width: opt.width || 3, seed: opt.seed || 17, close: true, amp: 1.5 });
  }

  function spiral(ctx, x, y, r, turns, o) {
    const pts = [];
    const N = Math.floor(turns * 24);
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * turns * PI * 2;
      const q = (i / N) * r;
      pts.push([x + C(t) * q, y + S(t) * q]);
    }
    stroke(ctx, pts, Object.assign({ amp: 0.8 }, o));
  }

  function hatch(ctx, x, y, w, h, o) {
    const opt = o || {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = opt.color || '#ffffff';
    ctx.lineWidth = opt.width || 2;
    const gap = opt.gap || 8;
    const a = opt.angle === undefined ? 0.8 : opt.angle;
    const d = Math.hypot(w, h);
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(a);
    for (let k = -d; k < d; k += gap) {
      ctx.beginPath();
      ctx.moveTo(k, -d);
      ctx.lineTo(k, d);
      ctx.stroke();
    }
    ctx.restore();
  }

  function checker(ctx, x, y, w, h, cell, color, keep) {
    ctx.save();
    ctx.fillStyle = color;
    const g = rng(Math.floor(x + y * 7));
    for (let yy = 0; yy < h; yy += cell) {
      for (let xx = 0; xx < w; xx += cell) {
        if (((xx / cell + yy / cell) % 2 === 0) && g() < (keep === undefined ? 1 : keep)) ctx.fillRect(x + xx, y + yy, cell, cell);
      }
    }
    ctx.restore();
  }

  function dots(ctx, x, y, w, h, gap, rad, color) {
    ctx.save();
    ctx.fillStyle = color;
    let row = 0;
    for (let yy = y; yy < y + h; yy += gap) {
      for (let xx = x + (row % 2) * gap * 0.5; xx < x + w; xx += gap) {
        ctx.beginPath();
        ctx.arc(xx, yy, rad, 0, PI * 2);
        ctx.fill();
      }
      row++;
    }
    ctx.restore();
  }

  function blobs(ctx, list, color, seed) {
    const g = rng(seed || 19);
    ctx.save();
    ctx.fillStyle = color;
    list.forEach(([x, y, r]) => {
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * PI * 2;
        const q = r * (0.75 + g() * 0.5);
        ctx.lineTo(x + C(a) * q, y + S(a) * q * 0.85);
      }
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  function confetti(ctx, n, color, seed, area) {
    const g = rng(seed || 23);
    const [ax, ay, aw, ah] = area || [0, 0, W, H];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const x = ax + g() * aw, y = ay + g() * ah, s = 4 + g() * 7, a = g() * PI * 2;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) ctx.lineTo(x + C(a + (k * PI * 2) / 3) * s, y + S(a + (k * PI * 2) / 3) * s);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function ecg(ctx, x0, x1, y, amp, color, width) {
    const pts = [];
    const span = x1 - x0;
    const beat = [[0, 0], [0.38, 0], [0.42, -0.3], [0.46, 0.25], [0.5, -1], [0.55, 0.9], [0.6, 0], [1, 0]];
    for (let rep = 0; rep < 2; rep++) {
      beat.forEach(([k, v]) => pts.push([x0 + (rep * 0.5 + k * 0.5) * span, y + v * amp]));
    }
    stroke(ctx, pts, { color, width: width || 3, amp: 0.5 });
  }

  function devilHeart(ctx, x, y, s, color, seed) {
    heart(ctx, x, y, s, { color, width: 2.5, seed });
    hatch(ctx, x - s * 0.6, y - s * 0.4, s * 1.2, s * 1.2, { color, gap: 5, width: 1.5, angle: 0.9 });
    stroke(ctx, [[x - s * 0.5, y - s * 0.6], [x - s * 0.7, y - s * 1.2], [x - s * 0.25, y - s * 0.75]], { color, width: 2.5, seed: seed + 1 });
    stroke(ctx, [[x + s * 0.5, y - s * 0.6], [x + s * 0.7, y - s * 1.2], [x + s * 0.25, y - s * 0.75]], { color, width: 2.5, seed: seed + 2 });
    const tail = [];
    for (let i = 0; i <= 16; i++) {
      const k = i / 16;
      tail.push([x + s * 0.2 + S(k * PI * 1.6) * s * 0.4, y + s * 0.9 + k * s * 1.6]);
    }
    stroke(ctx, tail, { color, width: 2.5, seed: seed + 3 });
    ctx.save();
    ctx.fillStyle = color;
    const tp = tail[tail.length - 1];
    ctx.beginPath();
    ctx.moveTo(tp[0], tp[1] + s * 0.3);
    ctx.lineTo(tp[0] - s * 0.22, tp[1] - s * 0.05);
    ctx.lineTo(tp[0] + s * 0.22, tp[1] - s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function wing(ctx, x, y, s, flip, color, seed) {
    const f = flip ? -1 : 1;
    const pts = [[0, 0], [f * 0.5, -0.6], [f * 1.1, -0.75], [f * 1.25, -0.2], [f * 1.0, -0.05], [f * 0.85, 0.25], [f * 0.6, 0.1], [f * 0.45, 0.4], [f * 0.25, 0.15], [0, 0]].map(([px, py]) => [x + px * s, y + py * s]);
    stroke(ctx, pts, { color, width: 2.5, seed, close: true });
    [[0.5, -0.6], [1.1, -0.75], [1.25, -0.2]].forEach(([px, py], i) => stroke(ctx, [[x, y], [x + f * px * s * 0.95, y + py * s * 0.95]], { color, width: 1.5, seed: seed + i + 1 }));
  }

  function crown(ctx, x, y, s, color, seed) {
    const pts = [[-1, 0.5], [-1, -0.4], [-0.5, 0.05], [0, -0.6], [0.5, 0.05], [1, -0.4], [1, 0.5]].map(([px, py]) => [x + px * s, y + py * s]);
    ctx.save();
    ctx.fillStyle = color;
    wobPath(ctx, pts, 1.5, rng(seed || 29), true);
    ctx.fill();
    ctx.restore();
  }

  function catFace(ctx, x, y, s, color, seed) {
    const g = seed || 31;
    stroke(ctx, [[x - s, y - s * 0.2], [x - s * 0.8, y - s], [x - s * 0.3, y - s * 0.6], [x + s * 0.3, y - s * 0.6], [x + s * 0.8, y - s], [x + s, y - s * 0.2], [x + s * 0.8, y + s * 0.6], [x, y + s * 0.85], [x - s * 0.8, y + s * 0.6], [x - s, y - s * 0.2]], { color, width: 2.5, seed: g });
    stroke(ctx, [[x - s * 0.5, y - s * 0.05], [x - s * 0.25, y - s * 0.15], [x - s * 0.05, y - s * 0.05]], { color, width: 2, seed: g + 1 });
    stroke(ctx, [[x + s * 0.05, y - s * 0.05], [x + s * 0.25, y - s * 0.15], [x + s * 0.5, y - s * 0.05]], { color, width: 2, seed: g + 2 });
    stroke(ctx, [[x - s * 0.2, y + s * 0.3], [x, y + s * 0.42], [x + s * 0.2, y + s * 0.3]], { color, width: 2, seed: g + 3 });
  }

  function mouseFace(ctx, x, y, s, color, seed) {
    [[-0.8, -0.7], [0.8, -0.7]].forEach(([dx, dy], i) => {
      const pts = [];
      for (let k = 0; k <= 16; k++) pts.push([x + dx * s + C((k / 16) * PI * 2) * s * 0.45, y + dy * s + S((k / 16) * PI * 2) * s * 0.45]);
      stroke(ctx, pts, { color, width: 2, seed: (seed || 37) + i });
    });
    const head = [];
    for (let k = 0; k <= 20; k++) head.push([x + C((k / 20) * PI * 2) * s * 0.8, y + S((k / 20) * PI * 2) * s * 0.65]);
    stroke(ctx, head, { color, width: 2, seed: (seed || 37) + 5 });
    stroke(ctx, [[x - s * 1.2, y + s * 0.1], [x - s * 0.5, y + s * 0.15]], { color, width: 1.5, seed: (seed || 37) + 6 });
    stroke(ctx, [[x + s * 1.2, y + s * 0.1], [x + s * 0.5, y + s * 0.15]], { color, width: 1.5, seed: (seed || 37) + 7 });
  }

  function textMask(text, font, size, o) {
    const pad = Math.ceil(size * 0.4);
    const ctx0 = canvasOf('a', 8, 8).getContext('2d');
    ctx0.font = `${o.fw || 900} ${size}px ${font}`;
    const lines = String(text).split('\n');
    const lh = size * (o.lh || 1.12);
    const tw = Math.ceil(Math.max(...lines.map(l => ctx0.measureText(l).width + (o.track || 0) * l.length)));
    const w = tw + pad * 2, h = Math.ceil(lh * lines.length + pad * 2);
    const c = canvasOf('b', w, h);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = `${o.fw || 900} ${size}px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineJoin = 'round';
    lines.forEach((l, i) => {
      const lw = ctx.measureText(l).width + (o.track || 0) * l.length;
      let x = pad + (o.align === 'left' ? 0 : (tw - lw) / 2);
      const y = pad + lh * (i + 0.5);
      if (o.track) {
        for (const ch of l) {
          if (o.thick) { ctx.lineWidth = o.thick; ctx.strokeText(ch, x, y); }
          ctx.fillText(ch, x, y);
          x += ctx.measureText(ch).width + o.track;
        }
      } else {
        if (o.thick) { ctx.lineWidth = o.thick; ctx.strokeText(l, x, y); }
        ctx.fillText(l, x, y);
      }
    });
    return { c, w, h, pad };
  }

  function brush(ctx, text, x, y, size, color, o) {
    const opt = o || {};
    const g = rng(opt.seed || 41);
    const m = textMask(text, opt.font || JP, size, { thick: size * (opt.weight === undefined ? 0.02 : opt.weight), lh: opt.lh, track: opt.track, fw: opt.fw || 700 });
    const mc = m.c.getContext('2d');
    mc.save();
    mc.globalCompositeOperation = 'destination-out';
    mc.strokeStyle = 'rgba(0,0,0,1)';
    mc.lineCap = 'round';
    const streaks = Math.floor((m.w * m.h) / (size * 5) * (opt.dry === undefined ? 1 : opt.dry));
    for (let i = 0; i < streaks; i++) {
      const sx = g() * m.w, sy = g() * m.h, len = size * (0.2 + g() * 0.6), a = (opt.slant === undefined ? -0.5 : opt.slant) + (g() - 0.5) * 0.4;
      mc.lineWidth = 0.5 + g() * size * 0.018;
      mc.beginPath();
      mc.moveTo(sx, sy);
      mc.lineTo(sx + C(a) * len, sy + S(a) * len);
      mc.stroke();
    }
    mc.globalCompositeOperation = 'source-in';
    mc.fillStyle = color;
    mc.fillRect(0, 0, m.w, m.h);
    mc.restore();
    ctx.save();
    ctx.translate(x, y);
    if (opt.rot) ctx.rotate(opt.rot);
    const sx = opt.sx || 1, sy = opt.sy || 1;
    ctx.scale(sx, sy);
    const jx = (g() - 0.5) * (opt.jitter === undefined ? 2 : opt.jitter), jy = (g() - 0.5) * (opt.jitter === undefined ? 2 : opt.jitter);
    if (opt.reveal !== undefined && opt.reveal < 1) {
      ctx.beginPath();
      ctx.rect(-m.w / 2, -m.h / 2, m.w * Math.max(0, opt.reveal), m.h);
      ctx.clip();
    }
    if (opt.shadow) {
      ctx.globalAlpha = 1;
      ctx.drawImage(m.c, 0, 0, m.w, m.h, -m.w / 2 + opt.shadow[0], -m.h / 2 + opt.shadow[1], m.w, m.h);
    }
    ctx.drawImage(m.c, 0, 0, m.w, m.h, -m.w / 2 + jx, -m.h / 2 + jy, m.w, m.h);
    ctx.restore();
  }

  function solid(ctx, text, x, y, size, color, o) {
    const opt = o || {};
    ctx.save();
    ctx.translate(x, y);
    if (opt.rot) ctx.rotate(opt.rot);
    if (opt.skew) ctx.transform(1, 0, opt.skew, 1, 0, 0);
    ctx.scale(opt.sx || 1, opt.sy || 1);
    ctx.font = `${opt.weight || 900} ${size}px ${opt.font || HEAVY}`;
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = 'middle';
    if (opt.track) ctx.letterSpacing = opt.track + 'px';
    if (opt.outline) {
      ctx.strokeStyle = opt.outline;
      ctx.lineWidth = opt.outlineW || size * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, 0, 0);
    }
    if (opt.ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = opt.ghost;
      ctx.strokeText(text, 0, 0);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  }

  function hand(ctx, text, x, y, size, color, o) {
    const opt = o || {};
    const g = rng(opt.seed || 43);
    ctx.save();
    ctx.translate(x, y);
    if (opt.rot) ctx.rotate(opt.rot);
    ctx.font = `${opt.weight || 700} ${size}px ${opt.font || HAND}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const k = opt.k === undefined ? 1 : opt.k;
    const chars = [...text];
    const total = ctx.measureText(text).width;
    let cx = opt.align === 'left' ? 0 : -total / 2;
    const shown = Math.ceil(chars.length * k);
    chars.slice(0, shown).forEach((ch) => {
      const dy = (g() - 0.5) * size * (opt.bounce || 0.12);
      const rr = (g() - 0.5) * (opt.wiggle || 0.15);
      ctx.save();
      ctx.translate(cx, dy);
      ctx.rotate(rr);
      if (opt.outline) {
        ctx.strokeStyle = opt.outline;
        ctx.lineWidth = opt.outlineW || size * 0.14;
        ctx.lineJoin = 'round';
        ctx.strokeText(ch, 0, 0);
      }
      if (opt.ghost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = opt.ghost;
        ctx.strokeText(ch, 0, 0);
      } else {
        ctx.fillStyle = color;
        ctx.fillText(ch, 0, 0);
      }
      ctx.restore();
      cx += ctx.measureText(ch).width * (opt.spacing || 1);
    });
    ctx.restore();
  }

  function sfx(ctx, text, x, y, size, color, o) {
    const opt = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(opt.rot || 0);
    ctx.font = `900 ${size}px ${JP}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const g = rng(opt.seed || 47);
    const vertical = opt.vertical;
    const chars = [...text];
    chars.forEach((ch, i) => {
      const ox = vertical ? (g() - 0.5) * size * 0.15 : (i - (chars.length - 1) / 2) * size * (opt.spacing || 0.92);
      const oy = vertical ? (i - (chars.length - 1) / 2) * size * (opt.spacing || 0.92) : (g() - 0.5) * size * 0.15;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate((g() - 0.5) * 0.25);
      if (opt.outline) {
        ctx.strokeStyle = opt.outline;
        ctx.lineWidth = opt.outlineW || size * 0.16;
        ctx.lineJoin = 'round';
        ctx.strokeText(ch, 0, 0);
      }
      if (opt.ghost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = opt.ghost;
        ctx.strokeText(ch, 0, 0);
      } else {
        ctx.fillStyle = color;
        ctx.fillText(ch, 0, 0);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function tag(ctx, x, y, role, o) {
    const opt = o || {};
    const g = rng(opt.seed || 53);
    const ink = opt.ink || '#d0206a';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(opt.rot || (g() - 0.5) * 0.06);
    const rows = [];
    if (role) rows.push({ text: role, small: true });
    (opt.names || []).forEach(n => rows.push({ text: n, name: true }));
    if (opt.lines) opt.lines.forEach(t => rows.push({ text: t }));
    let yy = 0;
    rows.forEach((row, ri) => {
      const small = row.small;
      const fs = small ? 12 : 15;
      ctx.font = `700 ${fs}px ${JP}`;
      const w = ctx.measureText(row.text).width + 16;
      const h = small ? 17 : 23;
      const bx = small ? 8 : 0;
      ctx.fillStyle = opt.paper || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(bx, yy);
      for (let k = 0; k <= 6; k++) ctx.lineTo(bx + (w * k) / 6, yy + (g() - 0.5) * 2);
      for (let k = 0; k <= 4; k++) ctx.lineTo(bx + w + (g() - 0.5) * 3, yy + (h * k) / 4);
      for (let k = 6; k >= 0; k--) ctx.lineTo(bx + (w * k) / 6, yy + h + (g() - 0.5) * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,170,190,0.55)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(bx + 3, yy + h * 0.72);
      ctx.lineTo(bx + w - 3, yy + h * 0.72);
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.textBaseline = 'middle';
      ctx.fillText(row.text, bx + 7, yy + h / 2 + 0.5);
      yy += h + (ri === 0 && role ? 3 : 4);
    });
    ctx.restore();
  }

  function logo(ctx, w, h, o) {
    const opt = o || {};
    const ink = opt.ink || '#5a86c8';
    const hi = opt.hi || '#f4f8ff';
    const sh = opt.shadow || '#2a4a8a';
    const cx = w / 2;
    [['イジらないで、', cx + 6, h * 0.36, 58], ['長瀞さん', cx - 6, h * 0.56, 66]].forEach(([t, x, y, s], i) => {
      solid(ctx, t, x + 4, y + 5, s, sh, { font: JP, weight: 900, skew: -0.08 });
      solid(ctx, t, x, y, s, ink, { font: JP, weight: 900, skew: -0.08, outline: hi, outlineW: 6 });
      solid(ctx, t, x, y, s, ink, { font: JP, weight: 900, skew: -0.08 });
      ctx.save();
      ctx.globalAlpha = 0.5;
      hatch(ctx, x - s * 3, y - s * 0.5, s * 6, s * 0.3, { color: hi, gap: 4, width: 1, angle: 1.2 });
      ctx.restore();
      if (i === 1) {
        solid(ctx, 'なが', x - s * 1.05, y - s * 0.62, 13, ink, { font: JP, weight: 900, outline: hi, outlineW: 3 });
        solid(ctx, 'とろ', x + s * 0.08, y - s * 0.62, 13, ink, { font: JP, weight: 900, outline: hi, outlineW: 3 });
      }
    });
    solid(ctx, 'IJIRANAIDE, NAGATORO SAN', cx, h * 0.72, 12, ink, { font: '"Arial", sans-serif', weight: 700, track: 2 });
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 120, h * 0.68);
    ctx.lineTo(cx + 120, h * 0.68);
    ctx.stroke();
    ctx.restore();
  }

  function magazine(ctx, x, y, w, h, o) {
    const opt = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(opt.rot || -0.04);
    ctx.fillStyle = opt.paper || '#36d0b4';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#f06aa0';
    ctx.fillRect(-w / 2, h * 0.08, w, h * 0.42);
    solid(ctx, 'SUMIRE', 0, -h * 0.38, w * 0.22, '#f0207a', { font: HEAVY, outline: '#ffffff', outlineW: 4, sx: 1.05 });
    solid(ctx, '04', -w * 0.34, -h * 0.18, w * 0.09, '#ffffff', { font: HEAVY });
    solid(ctx, 'APRIL', -w * 0.34, -h * 0.11, w * 0.035, '#ffffff', { font: '"Arial", sans-serif', weight: 700 });
    ctx.fillStyle = '#f8d2b8';
    ctx.beginPath();
    ctx.ellipse(w * 0.05, -h * 0.12, w * 0.12, h * 0.1, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0306a';
    ctx.beginPath();
    ctx.ellipse(w * 0.05, -h * 0.18, w * 0.16, h * 0.09, 0, PI, PI * 2);
    ctx.fill();
    ctx.fillRect(-w * 0.11, -h * 0.18, w * 0.05, h * 0.3);
    ctx.fillRect(w * 0.16, -h * 0.18, w * 0.05, h * 0.3);
    ctx.fillStyle = '#2a2a3a';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.ellipse(w * 0.05 + s * w * 0.045, -h * 0.12, w * 0.018, h * 0.024, 0, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#5a6ad8';
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, h * 0.02);
    ctx.lineTo(w * 0.22, h * 0.02);
    ctx.lineTo(w * 0.3, h * 0.36);
    ctx.lineTo(-w * 0.2, h * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4e04a';
    ctx.fillRect(-w * 0.02, h * 0.06, w * 0.14, h * 0.05);
    solid(ctx, '今どき女子の', 0, h * 0.4, w * 0.11, '#ffffff', { font: JP, outline: '#e0206a', outlineW: 4 });
    solid(ctx, '恋愛事情!?', w * 0.08, h * 0.47, w * 0.075, '#f4e04a', { font: JP, outline: '#e0206a', outlineW: 3 });
    ctx.restore();
  }

  function endCard(ctx, w, h, k) {
    const a = Math.max(0, Math.min(1, k));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(w * 0.073, h * 0.11, w * 0.355, h * 0.83);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(w * 0.073, h * 0.11, w * 0.355, h * 0.83);
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.28, h * 0.16, 0, PI * 2);
    ctx.stroke();
    ctx.strokeRect(w * 0.663, h * 0.555, w * 0.18, h * 0.38);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(h * 0.06)}px "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Watch More', w * 0.25, h * 0.08);
    ctx.fillText('Subscribe', w * 0.75, h * 0.08);
    ctx.fillText('Watch on CR!', w * 0.75, h * 0.51);
    ctx.restore();
  }

  window.NagArt = {
    W, H, JP, HAND, HEAVY, rng, stroke, heart, heartPts, star, sparkle, burst, scrawl, loops, zigzag, wave, bolt, spiral, hatch, checker, dots, blobs,
    confetti, ecg, devilHeart, wing, crown, catFace, mouseFace, brush, solid, hand, sfx, tag, logo, magazine, endCard
  };
})();
