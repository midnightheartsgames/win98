(function (X) {
  'use strict';
  const INK = '#24160e';

  function rgb(c) { return typeof c === 'string' ? c : `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`; }
  function hex2(c) {
    if (Array.isArray(c)) return c;
    const m = /^rgba?\(([^)]+)\)/.exec(c);
    if (m) { const v = m[1].split(',').map(Number); return [v[0] / 255, v[1] / 255, v[2] / 255]; }
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function shade(c, k) { const a = hex2(c); return rgb([Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)]); }
  function mix(a, b, t) { const p = hex2(a), q = hex2(b); return rgb([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]); }

  function canvas(w, h) {
    if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
    return null;
  }

  function ink(ctx, pts, w, color, alpha, rng, jitter) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.strokeStyle = color || INK;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.beginPath();
    const j = jitter || 0;
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i][0] + (rng ? (rng() - 0.5) * j : 0), y = pts[i][1] + (rng ? (rng() - 0.5) * j : 0);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  function wobbleLine(ctx, x0, y0, x1, y1, w, color, alpha, rng, amp, seg) {
    const n = seg || 8, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t + (rng() - 0.5) * amp, y0 + (y1 - y0) * t + (rng() - 0.5) * amp]);
    }
    ink(ctx, pts, w, color, alpha);
  }
  function stipple(ctx, S, n, color, alpha, rng, r) {
    ctx.save();
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) { const s = (r || 1) * (0.5 + rng()); ctx.fillRect(rng() * S, rng() * S, s, s); }
    ctx.restore();
  }
  function hatch(ctx, x, y, w, h, ang, gap, color, alpha, lw, rng) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = lw || 1;
    const c = Math.cos(ang), s = Math.sin(ang), L = w + h;
    ctx.beginPath();
    for (let d = -L; d < L; d += gap * (0.8 + (rng ? rng() * 0.4 : 0.2))) {
      const cx = x + w / 2 + (-s) * d, cy = y + h / 2 + c * d;
      ctx.moveTo(cx - c * L, cy - s * L);
      ctx.lineTo(cx + c * L, cy + s * L);
    }
    ctx.stroke();
    ctx.restore();
  }
  function blotch(ctx, S, n, color, alpha, rng, rmin, rmax) {
    ctx.save();
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const x = rng() * S, y = rng() * S, r = rmin + rng() * (rmax - rmin);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        ctx.beginPath(); ctx.ellipse(x + ox, y + oy, r, r * (0.5 + rng() * 0.6), rng() * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function boards(ctx, S, rng, o) {
    const n = o.n || 6, base = o.color;
    const bh = S / n;
    for (let i = 0; i < n; i++) {
      const y = i * bh;
      const k = 0.86 + rng() * 0.26;
      ctx.fillStyle = shade(base, k);
      ctx.fillRect(0, y, S, bh);
      const g = o.grain === undefined ? 5 : o.grain;
      for (let j = 0; j < g; j++) {
        const yy = y + 2 + rng() * (bh - 4);
        const pts = [];
        for (let x = -4; x <= S + 4; x += S / 10) pts.push([x, yy + Math.sin(x * 0.05 + rng() * 6) * (1 + rng() * 1.2)]);
        ink(ctx, pts, 0.8, shade(base, 0.55), 0.35 + rng() * 0.2);
      }
      if (o.knots && rng() < 0.5) {
        const kx = rng() * S, ky = y + bh * (0.3 + rng() * 0.4);
        ctx.save(); ctx.strokeStyle = shade(base, 0.45); ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(kx, ky, 4 + rng() * 3, 1.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = shade(base, 1.18); ctx.globalAlpha = 0.35; ctx.fillRect(0, y + 1, S, 1.2); ctx.globalAlpha = 1;
      wobbleLine(ctx, 0, y + 0.5, S, y + 0.5, o.gap || 2.2, INK, 0.9, rng, 0.8, 6);
      if (o.joints !== false) {
        const jx = (i * 97 + 31) % S;
        wobbleLine(ctx, jx, y, jx, y + bh, 1.6, INK, 0.85, rng, 0.6, 2);
        if (o.nails) {
          ctx.fillStyle = INK; ctx.globalAlpha = 0.8;
          ctx.fillRect(jx - 5, y + bh * 0.25, 2, 2); ctx.fillRect(jx - 5, y + bh * 0.7, 2, 2);
          ctx.fillRect(jx + 3, y + bh * 0.25, 2, 2); ctx.fillRect(jx + 3, y + bh * 0.7, 2, 2);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function siding(ctx, S, rng, color, rows) {
    const n = rows || 10, rh = S / n;
    for (let i = 0; i < n; i++) {
      const y = i * rh;
      const g = ctx.createLinearGradient(0, y, 0, y + rh);
      g.addColorStop(0, shade(color, 0.78)); g.addColorStop(0.25, shade(color, 1.02)); g.addColorStop(1, shade(color, 0.94 + rng() * 0.06));
      ctx.fillStyle = g; ctx.fillRect(0, y, S, rh);
      wobbleLine(ctx, 0, y + rh - 0.6, S, y + rh - 0.6, 1.8, INK, 0.8, rng, 0.7, 6);
      for (let j = 0; j < 3; j++) {
        const yy = y + 3 + rng() * (rh - 5);
        wobbleLine(ctx, rng() * S * 0.5, yy, S * (0.5 + rng() * 0.5), yy, 0.6, shade(color, 0.6), 0.25, rng, 0.8, 5);
      }
    }
    stipple(ctx, S, 300, shade(color, 0.6), 0.18, rng, 1);
  }

  function bricks(ctx, S, rng, o) {
    const rows = o.rows || 8, cols = o.cols || 4, rh = S / rows, cw = S / cols;
    ctx.fillStyle = o.mortar; ctx.fillRect(0, 0, S, S);
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * cw / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + off, y = r * rh;
        ctx.fillStyle = shade(o.color, 0.8 + rng() * 0.35);
        ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
        if (rng() < 0.4) hatch(ctx, x + 2, y + 2, cw - 4, rh - 4, 0.8, 4, INK, 0.12, 0.8, rng);
        ink(ctx, [[x + 2, y + rh - 2], [x + cw - 2, y + rh - 2], [x + cw - 2, y + 2]], 1.2, INK, 0.55, rng, 0.8);
      }
    }
  }

  function tiles(ctx, S, rng, o) {
    const n = o.n || 4, s = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const c = o.checker && (i + j) % 2 ? o.color2 : o.color;
      ctx.fillStyle = shade(c, 0.93 + rng() * 0.1);
      ctx.fillRect(i * s, j * s, s, s);
      if (o.veins) for (let k = 0; k < 2; k++) {
        const pts = []; let x = i * s + rng() * s, y = j * s;
        for (let t = 0; t < 6; t++) { pts.push([x, y]); x += (rng() - 0.5) * s * 0.5; y += s / 5; }
        ink(ctx, pts, 0.8, shade(c, 0.7), 0.4);
      }
    }
    for (let i = 0; i <= n; i++) {
      wobbleLine(ctx, i * s, 0, i * s, S, o.grout || 2, o.groutColor || INK, 0.7, rng, 0.5, 4);
      wobbleLine(ctx, 0, i * s, S, i * s, o.grout || 2, o.groutColor || INK, 0.7, rng, 0.5, 4);
    }
  }

  function speckle(ctx, S, rng, o) {
    ctx.fillStyle = o.color; ctx.fillRect(0, 0, S, S);
    if (o.blotch) blotch(ctx, S, o.blotch, o.blotchColor || shade(o.color, 0.88), 0.35, rng, S * 0.04, S * 0.14);
    stipple(ctx, S, o.dots || 900, o.dark || shade(o.color, 0.6), o.alpha || 0.35, rng, o.r || 1);
    if (o.light) stipple(ctx, S, (o.dots || 900) / 2, o.light, 0.35, rng, o.r || 1);
    if (o.cracks) for (let i = 0; i < o.cracks; i++) {
      let x = rng() * S, y = rng() * S; const pts = [[x, y]];
      for (let k = 0; k < 5; k++) { x += (rng() - 0.5) * 30; y += (rng() - 0.5) * 30; pts.push([x, y]); }
      ink(ctx, pts, 1, INK, 0.45);
    }
  }

  function metal(ctx, S, rng, color, o) {
    o = o || {};
    ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(0.5, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    stipple(ctx, S, 400, shade(color, 0.6), 0.2, rng, 1);
    if (o.rust) blotch(ctx, S, o.rust, '#8a4a20', 0.35, rng, 4, 16);
    if (o.panels) {
      const n = o.panels;
      for (let i = 0; i <= n; i++) { wobbleLine(ctx, i * S / n, 0, i * S / n, S, 1.6, INK, 0.7, rng, 0.4, 3); }
      for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = INK; ctx.globalAlpha = 0.5; ctx.fillRect(i * S / n + 5, j * S / 4 + 8, 2, 2); ctx.fillRect((i + 1) * S / n - 7, j * S / 4 + 8, 2, 2); ctx.globalAlpha = 1; }
    }
    if (o.edge !== false) { ctx.strokeStyle = INK; ctx.globalAlpha = 0.25; ctx.lineWidth = 2; ctx.strokeRect(1, 1, S - 2, S - 2); ctx.globalAlpha = 1; }
  }

  function corrugated(ctx, S, rng, color, n) {
    const k = n || 16, w = S / k;
    for (let i = 0; i < k; i++) {
      const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      g.addColorStop(0, shade(color, 0.7)); g.addColorStop(0.45, shade(color, 1.12)); g.addColorStop(1, shade(color, 0.78));
      ctx.fillStyle = g; ctx.fillRect(i * w, 0, w, S);
      wobbleLine(ctx, i * w, 0, i * w, S, 1, INK, 0.45, rng, 0.4, 4);
    }
    stipple(ctx, S, 300, shade(color, 0.5), 0.2, rng, 1);
  }

  function stripes(ctx, S, rng, a, b, n, vertical) {
    const k = n || 6;
    for (let i = 0; i < k; i++) {
      ctx.fillStyle = i % 2 ? b : a;
      if (vertical) ctx.fillRect(i * S / k, 0, S / k, S); else ctx.fillRect(0, i * S / k, S, S / k);
    }
    stipple(ctx, S, 200, '#000', 0.08, rng, 1);
    for (let i = 0; i <= k; i++) {
      if (vertical) wobbleLine(ctx, i * S / k, 0, i * S / k, S, 1, INK, 0.4, rng, 0.5, 4);
      else wobbleLine(ctx, 0, i * S / k, S, i * S / k, 1, INK, 0.4, rng, 0.5, 4);
    }
  }

  function plain(ctx, S, rng, color, o) {
    o = o || {};
    ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
    stipple(ctx, S, o.dots || 250, shade(color, 0.75), 0.15, rng, 1);
    if (o.hatch) hatch(ctx, 0, 0, S, S, 0.7, o.hatch, INK, 0.08, 0.8, rng);
  }

  function panelWall(ctx, S, rng, color, trim) {
    ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
    stipple(ctx, S, 300, shade(color, 0.8), 0.15, rng, 1);
    ctx.fillStyle = trim || shade(color, 0.7);
    ctx.fillRect(0, S - 18, S, 18);
    wobbleLine(ctx, 0, S - 18, S, S - 18, 1.6, INK, 0.8, rng, 0.4, 5);
    hatch(ctx, 0, 0, S, S * 0.3, 1.2, 9, INK, 0.05, 0.8, rng);
  }

  const M = {};
  X.MATS = M;
  function def(name, uv, gen, o) { M[name] = Object.assign({ uv, gen }, o || {}); }

  def('planks', 2.4, (c, S, r) => boards(c, S, r, { n: 6, color: '#94643a', knots: true, nails: true }));
  def('planks_x', 1.2, (c, S, r) => boards(c, S, r, { n: 4, color: '#8a5c34', knots: true }));
  def('planks_z', 2.4, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 6, color: '#94643a', knots: true, nails: true }); });
  def('planks_v', 2.0, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 7, color: '#7a5030', knots: true }); });
  def('wood', 1.6, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 3, color: '#7c4c2a', grain: 9, joints: false, gap: 0.8 }); });
  def('wood_dark', 1.6, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 3, color: '#4e3020', grain: 8, joints: false, gap: 0.8 }); });
  def('wood_light', 1.6, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 3, color: '#b88a58', grain: 8, joints: false, gap: 0.8 }); });
  def('wood_white', 1.6, (c, S, r) => { plain(c, S, r, '#e8e2d2', { dots: 400 }); blotch(c, S, 8, '#b0a488', 0.18, r, 3, 10); for (let i = 0; i < 6; i++) wobbleLine(c, r() * S, 0, r() * S, S, 0.6, '#8a7a60', 0.25, r, 1.5, 6); });
  def('wood_green', 1.6, (c, S, r) => { siding(c, S, r, '#3e6a44', 4); });
  def('wood_floor', 1.6, (c, S, r) => boards(c, S, r, { n: 8, color: '#8a5a30', grain: 3 }));
  def('wood_panel', 2.0, (c, S, r) => {
    c.fillStyle = '#5a3620'; c.fillRect(0, 0, S, S);
    for (const [x, y, w, h] of [[16, 16, S / 2 - 24, S / 2 - 24], [S / 2 + 8, 16, S / 2 - 24, S / 2 - 24], [16, S / 2 + 8, S / 2 - 24, S / 2 - 24], [S / 2 + 8, S / 2 + 8, S / 2 - 24, S / 2 - 24]]) {
      c.fillStyle = '#6e4428'; c.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) wobbleLine(c, x + r() * w, y, x + r() * w, y + h, 0.7, '#3a2012', 0.35, r, 1, 5);
      ink(c, [[x, y + h], [x, y], [x + w, y]], 2, '#f0c890', 0.25);
      ink(c, [[x + w, y], [x + w, y + h], [x, y + h]], 2.2, INK, 0.7);
    }
  });
  def('beam', 1.2, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 2, color: '#5c3a22', grain: 10, joints: false, gap: 2 }); });
  def('crate', 1.0, (c, S, r) => {
    boards(c, S, r, { n: 5, color: '#a47a48', grain: 3, joints: false });
    c.fillStyle = '#8a6036'; c.fillRect(0, 0, S, 22); c.fillRect(0, S - 22, S, 22); c.fillRect(0, 0, 22, S); c.fillRect(S - 22, 0, 22, S);
    c.save(); c.translate(S / 2, S / 2); c.rotate(Math.PI / 4); c.fillRect(-S * 0.72, -11, S * 1.44, 22); c.restore();
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(1.5, 1.5, S - 3, S - 3); c.lineWidth = 1.6; c.strokeRect(22, 22, S - 44, S - 44);
    c.fillStyle = '#2a1a10'; c.globalAlpha = 0.55; c.font = 'bold 26px Impact, sans-serif'; c.textAlign = 'center'; c.fillText('FRAGILE', S / 2, S * 0.72); c.globalAlpha = 1;
  });
  def('bark', 1.5, (c, S, r) => { c.fillStyle = '#4a3222'; c.fillRect(0, 0, S, S); for (let i = 0; i < 30; i++) { const x = r() * S; wobbleLine(c, x, 0, x + (r() - 0.5) * 20, S, 1 + r() * 2, INK, 0.5, r, 4, 8); } stipple(c, S, 300, '#7a5a40', 0.3, r, 1.5); });
  def('formica', 1.0, (c, S, r) => { plain(c, S, r, '#d84c3c', { dots: 200 }); c.fillStyle = '#e8e0d0'; c.fillRect(0, S - 20, S, 20); wobbleLine(c, 0, S - 20, S, S - 20, 2, INK, 0.7, r, 0.4, 4); });
  def('siding', 2.4, (c, S, r) => siding(c, S, r, '#c9a878'));
  def('siding_white', 2.4, (c, S, r) => siding(c, S, r, '#e4dccb'));
  def('siding_blue', 2.4, (c, S, r) => siding(c, S, r, '#7b9cb0'));
  def('siding_yellow', 2.4, (c, S, r) => siding(c, S, r, '#dcb86a'));
  def('siding_red', 2.4, (c, S, r) => siding(c, S, r, '#b8574a'));
  def('siding_green', 2.4, (c, S, r) => siding(c, S, r, '#7fa07a'));
  def('shingles', 2.0, (c, S, r) => {
    c.fillStyle = '#5a4a44'; c.fillRect(0, 0, S, S);
    const rows = 8, rh = S / rows;
    for (let i = 0; i < rows; i++) for (let j = -1; j < 7; j++) {
      const x = j * S / 6 + (i % 2) * S / 12, y = i * rh;
      c.fillStyle = shade('#6a5650', 0.8 + r() * 0.35); c.fillRect(x + 1, y, S / 6 - 2, rh);
      ink(c, [[x + 1, y], [x + 1, y + rh], [x + S / 6 - 1, y + rh]], 1.4, INK, 0.7, r, 0.6);
    }
  });
  def('roof_red', 2.0, (c, S, r) => { c.fillStyle = '#a8402c'; c.fillRect(0, 0, S, S); for (let i = 0; i < 8; i++) { const y = i * S / 8; c.fillStyle = shade('#b8503a', 0.85 + r() * 0.2); c.fillRect(0, y, S, S / 8 - 3); wobbleLine(c, 0, y + S / 8 - 1, S, y + S / 8 - 1, 2, INK, 0.8, r, 0.6, 6); } for (let j = 0; j < 8; j++) wobbleLine(c, j * S / 8, 0, j * S / 8, S, 1, INK, 0.35, r, 0.6, 6); });
  def('roof_tar', 3.0, (c, S, r) => speckle(c, S, r, { color: '#4c4644', dots: 1400, dark: '#1c1818', light: '#8a8278', alpha: 0.4 }));
  def('roof_shingle_under', 2.0, (c, S, r) => boards(c, S, r, { n: 8, color: '#d8d0c0', grain: 1 }));
  def('ceiling_wood', 2.0, (c, S, r) => boards(c, S, r, { n: 8, color: '#b89868', grain: 2 }));

  def('concrete', 3.0, (c, S, r) => speckle(c, S, r, { color: '#a49c90', dots: 900, blotch: 10, cracks: 2 }));
  def('concrete_dark', 3.0, (c, S, r) => speckle(c, S, r, { color: '#6e6a64', dots: 900, blotch: 10, cracks: 2 }));
  def('plaster', 2.5, (c, S, r) => panelWall(c, S, r, '#d8cdb4', '#8a7658'));
  def('plaster_green', 2.5, (c, S, r) => panelWall(c, S, r, '#9fb49a', '#4e644a'));
  def('plaster_blue', 2.5, (c, S, r) => panelWall(c, S, r, '#9eb0c0', '#4e5e70'));
  def('office_wall', 2.5, (c, S, r) => panelWall(c, S, r, '#cfc9b6', '#5c5048'));
  def('bunker', 3.0, (c, S, r) => { speckle(c, S, r, { color: '#8c8a7c', dots: 900, blotch: 14, cracks: 3 }); c.fillStyle = '#5a5a4a'; c.fillRect(0, S * 0.62, S, S * 0.38); wobbleLine(c, 0, S * 0.62, S, S * 0.62, 2, INK, 0.7, r, 0.4, 6); for (let i = 0; i < 5; i++) wobbleLine(c, r() * S, S * 0.62, r() * S, S, 1.5, '#3a3228', 0.3, r, 3, 6); });
  def('brick', 2.0, (c, S, r) => bricks(c, S, r, { color: '#9a4a36', mortar: '#b8a890' }));
  def('brick_dark', 2.0, (c, S, r) => bricks(c, S, r, { color: '#5e3a30', mortar: '#7a7064' }));
  def('stone', 2.4, (c, S, r) => bricks(c, S, r, { color: '#a8a090', mortar: '#6a6458', rows: 4, cols: 2 }));
  def('marble', 2.0, (c, S, r) => tiles(c, S, r, { n: 2, color: '#e8e2d6', veins: true, grout: 1.5 }));
  def('marble_floor', 2.0, (c, S, r) => tiles(c, S, r, { n: 4, color: '#e6ddc8', color2: '#3c3430', checker: true, grout: 1.2 }));
  def('tiles', 1.2, (c, S, r) => tiles(c, S, r, { n: 6, color: '#e8ecea', groutColor: '#7a8a88', grout: 1.5 }));
  def('tiles_green', 1.4, (c, S, r) => tiles(c, S, r, { n: 6, color: '#8aa890', groutColor: '#3a4a40', grout: 1.5 }));
  def('asphalt', 4.0, (c, S, r) => speckle(c, S, r, { color: '#4e4c4a', dots: 2200, dark: '#1e1c1c', light: '#7a7672', alpha: 0.45, cracks: 2 }));
  def('road_line', 2.0, (c, S, r) => plain(c, S, r, '#e8c040', { dots: 200 }));
  def('sidewalk', 2.0, (c, S, r) => tiles(c, S, r, { n: 2, color: '#b4ac9c', groutColor: '#5a544a', grout: 2 }));
  def('cobble', 1.6, (c, S, r) => { c.fillStyle = '#4a4440'; c.fillRect(0, 0, S, S); for (let i = 0; i < 40; i++) { const x = r() * S, y = r() * S; c.fillStyle = shade('#8a8278', 0.8 + r() * 0.3); c.beginPath(); c.ellipse(x, y, 14, 10, r(), 0, 7); c.fill(); c.strokeStyle = INK; c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1; } });
  def('gravel', 2.0, (c, S, r) => speckle(c, S, r, { color: '#8e8676', dots: 2600, dark: '#3a342c', light: '#d0c8b8', alpha: 0.55, r: 2 }));

  def('sand', 5.0, (c, S, r) => {
    speckle(c, S, r, { color: '#d2b07c', dots: 1800, dark: '#8a6a3e', light: '#f2dcae', alpha: 0.42, blotch: 10, blotchColor: '#c4a06a' });
    for (let i = 0; i < 9; i++) { const y = r() * S; const pts = []; for (let x = -10; x < S + 10; x += 16) pts.push([x, y + Math.sin(x * 0.04 + i) * 5]); ink(c, pts, 0.9, '#8a6a3c', 0.25); }
  });
  def('sand_wet', 5.0, (c, S, r) => { speckle(c, S, r, { color: '#a88c62', dots: 1200, dark: '#6a5234', light: '#d8c8a0', alpha: 0.35 }); for (let i = 0; i < 6; i++) { const y = r() * S; wobbleLine(c, 0, y, S, y, 1.4, '#f0ead8', 0.3, r, 3, 8); } });
  def('grass', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#6a8a44', dots: 1400, dark: '#34501e', light: '#a8c070', alpha: 0.45, blotch: 10, blotchColor: '#5a7a38' }); for (let i = 0; i < 220; i++) { const x = r() * S, y = r() * S; ink(c, [[x, y], [x + (r() - 0.5) * 3, y - 4 - r() * 4]], 1, '#2a4418', 0.5); } });
  def('dirt', 4.0, (c, S, r) => speckle(c, S, r, { color: '#86684a', dots: 1600, dark: '#4a3622', light: '#b09070', alpha: 0.45, blotch: 12, cracks: 1 }));
  def('rock', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#8a8478', dots: 1000, dark: '#3e3a34', alpha: 0.4, blotch: 16, blotchColor: '#766e62', cracks: 7 }); hatch(c, 0, S / 2, S, S / 2, 0.9, 7, INK, 0.12, 1, r); });
  def('snow', 6.0, (c, S, r) => { speckle(c, S, r, { color: '#eef2f6', dots: 700, dark: '#a8b8cc', alpha: 0.4, blotch: 10, blotchColor: '#dbe4ee' }); for (let i = 0; i < 10; i++) { const y = r() * S, x = r() * S; wobbleLine(c, x, y, x + 40 + r() * 60, y + (r() - 0.5) * 12, 1, '#8aa0bc', 0.3, r, 2, 5); } });
  def('ice', 4.0, (c, S, r) => { plain(c, S, r, '#bcd6e4', { dots: 200 }); for (let i = 0; i < 8; i++) wobbleLine(c, r() * S, r() * S, r() * S, r() * S, 1, '#ffffff', 0.5, r, 4, 4); });
  def('forest', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#5e4a30', dots: 1200, dark: '#2a2014', light: '#8a7040', alpha: 0.45, blotch: 14, blotchColor: '#4e5a2a' }); for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S, a = r() * 3; ink(c, [[x, y], [x + Math.cos(a) * 5, y + Math.sin(a) * 5]], 1, '#8a6a3a', 0.6); } });
  def('autumn', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#7a6034', dots: 900, dark: '#3a2a14', alpha: 0.4 }); blotch(c, S, 60, '#c8641e', 0.55, r, 2, 5); blotch(c, S, 40, '#e0a030', 0.5, r, 2, 4); blotch(c, S, 30, '#9a2a14', 0.45, r, 2, 4); });
  def('leaves', 1.5, (c, S, r) => { speckle(c, S, r, { color: '#4a6a2c', dots: 900, dark: '#1e3010', light: '#8aa850', alpha: 0.5, blotch: 20, blotchColor: '#5a7a34' }); });
  def('leaves_orange', 1.5, (c, S, r) => { speckle(c, S, r, { color: '#c8661c', dots: 900, dark: '#6a2c0c', light: '#f0b040', alpha: 0.5, blotch: 20, blotchColor: '#d88a24' }); });
  def('pine', 2.0, (c, S, r) => { speckle(c, S, r, { color: '#2e4a32', dots: 900, dark: '#10200e', light: '#5a7a4a', alpha: 0.5 }); for (let i = 0; i < 26; i++) { const y = r() * S; hatch(c, 0, y, S, 10, 0.5, 5, '#0c160a', 0.35, 1, r); } });
  def('pine_dark', 2.0, (c, S, r) => { speckle(c, S, r, { color: '#22382a', dots: 900, dark: '#0a140a', light: '#40584a', alpha: 0.5 }); for (let i = 0; i < 26; i++) { const y = r() * S; hatch(c, 0, y, S, 10, 0.5, 5, '#060e06', 0.35, 1, r); } });
  def('leaves_yellow', 1.5, (c, S, r) => { speckle(c, S, r, { color: '#d8b030', dots: 900, dark: '#7a5a10', light: '#f8e070', alpha: 0.5, blotch: 20, blotchColor: '#e8c040' }); });
  def('stone_white', 2.0, (c, S, r) => { speckle(c, S, r, { color: '#ddd3c0', dots: 700, dark: '#9a8e78', alpha: 0.3, blotch: 8, blotchColor: '#cfc2aa' }); for (let i = 0; i < 6; i++) wobbleLine(c, i * S / 6, 0, i * S / 6, S, 1.2, '#8a7e68', 0.35, r, 1, 4); });
  def('facade', 3.0, (c, S, r) => { bricks(c, S, r, { color: '#cdbf9e', mortar: '#8e8068', rows: 5, cols: 2 }); });
  def('facade_dark', 3.0, (c, S, r) => { bricks(c, S, r, { color: '#8e7a66', mortar: '#4e443a', rows: 5, cols: 2 }); });
  def('brass', 1.0, (c, S, r) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#d8c080'); g.addColorStop(0.5, '#a07a30'); g.addColorStop(1, '#6a4a18'); c.fillStyle = g; c.fillRect(0, 0, S, S); });
  def('velvet', 1.0, (c, S, r) => plain(c, S, r, '#8a1418', { dots: 200 }));
  def('clock_face', 1.0, (c, S, r) => { c.fillStyle = '#f2ead4'; c.fillRect(0, 0, S, S); c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.arc(S / 2, S / 2, S * 0.45, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(S / 2 + Math.cos(a) * S * 0.36, S / 2 + Math.sin(a) * S * 0.36); c.lineTo(S / 2 + Math.cos(a) * S * 0.42, S / 2 + Math.sin(a) * S * 0.42); c.stroke(); } c.lineWidth = 8; c.beginPath(); c.moveTo(S / 2, S / 2); c.lineTo(S / 2, S * 0.2); c.stroke(); c.beginPath(); c.moveTo(S / 2, S / 2); c.lineTo(S * 0.7, S / 2); c.stroke(); });
  def('deposit', 1.2, (c, S, r) => { c.fillStyle = '#6a6c70'; c.fillRect(0, 0, S, S); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * S / 4, y = j * S / 4; c.fillStyle = shade('#9a9ea4', 0.9 + r() * 0.2); c.fillRect(x + 3, y + 3, S / 4 - 6, S / 4 - 6); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, S / 4 - 6, S / 4 - 6); c.fillStyle = '#2a2a2a'; c.fillRect(x + S / 8 - 3, y + S / 8 - 2, 6, 4); c.fillStyle = '#e8d8a0'; c.fillRect(x + 8, y + 8, 12, 5); } });
  def('vault_steel', 1.5, (c, S, r) => { metal(c, S, r, '#9aa0a8'); c.strokeStyle = INK; c.lineWidth = 4; for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(S / 2, S / 2, S * 0.12 * i, 0, 7); c.stroke(); } });
  def('vent', 1.0, (c, S, r) => { c.fillStyle = '#5a5e62'; c.fillRect(0, 0, S, S); for (let i = 0; i < 10; i++) { c.fillStyle = '#2a2c2e'; c.fillRect(0, i * S / 10 + 2, S, S / 20); } });
  def('barrel_wood', 2.0, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); boards(c, S, r, { n: 8, color: '#8a6038', grain: 2, joints: false }); c.fillStyle = '#3a3a3a'; c.fillRect(0, S * 0.2, S, 6); c.fillRect(0, S * 0.75, S, 6); });
  def('grate', 1.0, (c, S, r) => { c.fillStyle = '#2e3032'; c.fillRect(0, 0, S, S); c.strokeStyle = '#6a6e72'; c.lineWidth = 3; for (let i = 0; i < S; i += 12) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, S); c.stroke(); } }, { alpha: false });
  def('car_police', 4.0, (c, S, r) => { plain(c, S, r, '#1c2a4a', { dots: 100 }); c.fillStyle = '#f0f0f0'; c.fillRect(0, S * 0.45, S, S * 0.2); c.fillStyle = '#1c2a4a'; c.font = 'bold 40px Impact, sans-serif'; c.fillText('POLICE', S * 0.2, S * 0.62); });
  def('siren_bar', 1.0, (c, S, r) => { c.fillStyle = '#e02010'; c.fillRect(0, 0, S / 2, S); c.fillStyle = '#2050e0'; c.fillRect(S / 2, 0, S / 2, S); }, { emit: true });
  def('mirror', 1.0, (c, S, r) => { const g = c.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#3a4650'); g.addColorStop(0.5, '#5a6a76'); g.addColorStop(1, '#2a323a'); c.fillStyle = g; c.fillRect(0, 0, S, S); for (let i = 0; i < 3; i++) wobbleLine(c, r() * S, 0, r() * S - 60, S, 5, '#9ab0c0', 0.35, r, 2, 3); });
  def('cubicle', 1.4, (c, S, r) => { plain(c, S, r, '#7a8290', { dots: 900 }); hatch(c, 0, 0, S, S, 0.8, 5, '#3a3a44', 0.12, 1, r); c.fillStyle = '#4a4e58'; c.fillRect(0, 0, S, 10); });
  def('fbi_wall', 2.5, (c, S, r) => panelWall(c, S, r, '#b8b6a8', '#3a3e48'));
  def('elevator', 2.2, (c, S, r) => { metal(c, S, r, '#8a8e94', { panels: 2 }); c.fillStyle = '#f0e0a0'; c.font = 'bold 20px sans-serif'; c.textAlign = 'center'; c.fillText('OUT OF ORDER', S / 2, S * 0.35); });
  def('car_grey', 4.0, (c, S, r) => { plain(c, S, r, '#6a6e74', { dots: 100 }); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, S * 0.15, S, S * 0.08); });
  def('corrugated_roof', 2.0, (c, S, r) => { c.translate(S, 0); c.rotate(Math.PI / 2); corrugated(c, S, r, '#6a6e70', 12); blotch(c, S, 8, '#7a4a28', 0.25, r, 6, 16); });
  def('snow_roof', 2.0, (c, S, r) => { speckle(c, S, r, { color: '#e8eef4', dots: 500, dark: '#a8b8cc', alpha: 0.35 }); for (let i = 0; i < 6; i++) { const y = r() * S; wobbleLine(c, 0, y, S, y + (r() - 0.5) * 20, 1.2, '#8aa0bc', 0.35, r, 3, 6); } });
  def('rock_snow', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#7a7a80', dots: 1000, dark: '#34343a', alpha: 0.4, blotch: 14, blotchColor: '#6a6a72', cracks: 6 }); blotch(c, S, 18, '#eef2f6', 0.8, r, 6, 20); });
  def('metal_yellow', 2.0, (c, S, r) => metal(c, S, r, '#d8a830', { rust: 6 }));
  def('quay', 4.0, (c, S, r) => { speckle(c, S, r, { color: '#5c5a58', dots: 1800, dark: '#2a2826', light: '#7a7672', alpha: 0.45, cracks: 3, blotch: 10, blotchColor: '#4c4a48' }); c.fillStyle = '#c8a030'; c.globalAlpha = 0.5; c.fillRect(0, S * 0.48, S, S * 0.04); c.globalAlpha = 1; });
  def('fur', 1.0, (c, S, r) => { plain(c, S, r, '#6a4a2c', { dots: 300 }); for (let i = 0; i < 200; i++) { const x = r() * S, y = r() * S; ink(c, [[x, y], [x + 2, y + 6]], 1, INK, 0.3); } });

  def('metal', 2.0, (c, S, r) => metal(c, S, r, '#8a8c8e'));
  def('metal_dark', 2.0, (c, S, r) => metal(c, S, r, '#3c3e40', { edge: false }));
  def('metal_grey', 2.0, (c, S, r) => metal(c, S, r, '#7c8084'));
  def('metal_green', 2.0, (c, S, r) => metal(c, S, r, '#4c5e40', { rust: 4 }));
  def('metal_blue', 2.0, (c, S, r) => metal(c, S, r, '#3c5a86'));
  def('metal_red', 2.0, (c, S, r) => metal(c, S, r, '#b03a2a'));
  def('metal_rust', 2.0, (c, S, r) => metal(c, S, r, '#7a4e30', { rust: 20 }));
  def('metal_plate', 2.0, (c, S, r) => metal(c, S, r, '#6e7270', { panels: 2 }));
  def('corrugated', 2.0, (c, S, r) => corrugated(c, S, r, '#8a8e8c'));
  def('container_red', 2.6, (c, S, r) => { corrugated(c, S, r, '#a2402e', 14); blotch(c, S, 6, '#6a3018', 0.25, r, 4, 12); });
  def('container_blue', 2.6, (c, S, r) => { corrugated(c, S, r, '#2e5a8a', 14); blotch(c, S, 6, '#6a4a30', 0.2, r, 4, 12); });
  def('container_green', 2.6, (c, S, r) => { corrugated(c, S, r, '#3e6a3a', 14); blotch(c, S, 6, '#6a4a30', 0.2, r, 4, 12); });
  def('container_orange', 2.6, (c, S, r) => { corrugated(c, S, r, '#c8762a', 14); blotch(c, S, 6, '#6a3a18', 0.2, r, 4, 12); });
  def('container_top', 2.6, (c, S, r) => metal(c, S, r, '#6a6660', { rust: 10 }));
  def('container_door', 2.6, (c, S, r) => { metal(c, S, r, '#8a3a2a', { panels: 2 }); for (const x of [0.3, 0.7]) { c.fillStyle = '#2a2a2a'; c.fillRect(S * x - 3, 0, 6, S); } });
  def('barrel_red', 1.0, (c, S, r) => { metal(c, S, r, '#b02a1e', { rust: 5 }); for (const y of [0.2, 0.5, 0.8]) wobbleLine(c, 0, S * y, S, S * y, 3, INK, 0.7, r, 0.5, 4); c.fillStyle = '#f0d020'; c.fillRect(S * 0.35, S * 0.3, S * 0.3, S * 0.14); });
  def('barrel_blue', 1.0, (c, S, r) => { metal(c, S, r, '#2e4a7a', { rust: 5 }); for (const y of [0.2, 0.5, 0.8]) wobbleLine(c, 0, S * y, S, S * y, 3, INK, 0.7, r, 0.5, 4); });
  def('chrome', 1.0, (c, S, r) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#f4f4f4'); g.addColorStop(0.5, '#7a7e84'); g.addColorStop(0.55, '#d8dce0'); g.addColorStop(1, '#5a5e64'); c.fillStyle = g; c.fillRect(0, 0, S, S); });
  def('car_red', 4.0, (c, S, r) => { plain(c, S, r, '#b0281e', { dots: 100 }); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, S * 0.15, S, S * 0.08); });
  def('car_blue', 4.0, (c, S, r) => { plain(c, S, r, '#2a4a86', { dots: 100 }); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, S * 0.15, S, S * 0.08); });
  def('car_white', 4.0, (c, S, r) => { plain(c, S, r, '#dcd8d0', { dots: 100 }); c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(0, S * 0.5, S, S * 0.05); });
  def('car_black', 4.0, (c, S, r) => { plain(c, S, r, '#1e1e22', { dots: 100 }); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, S * 0.15, S, S * 0.08); });
  def('car_glass', 1.0, (c, S, r) => { plain(c, S, r, '#3a4e5c', { dots: 60 }); for (let i = 0; i < 3; i++) wobbleLine(c, r() * S, 0, r() * S - 40, S, 3, '#c8dce8', 0.5, r, 2, 3); });
  def('tire', 1.0, (c, S, r) => plain(c, S, r, '#1c1a1a', { dots: 200 }));
  def('headlight', 1.0, (c, S, r) => plain(c, S, r, '#fff4c8', { dots: 20 }), { emit: true });
  def('hazard', 1.0, (c, S, r) => { c.fillStyle = '#e8c020'; c.fillRect(0, 0, S, S); c.fillStyle = '#1a1a1a'; for (let i = -S; i < S * 2; i += S / 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + S / 8, 0); c.lineTo(i + S / 8 - S, S); c.lineTo(i - S, S); c.fill(); } });
  def('bars', 1.0, (c, S, r) => metal(c, S, r, '#4a4c50', { edge: false }));
  def('locker', 1.9, (c, S, r) => { metal(c, S, r, '#5a7086'); c.fillStyle = '#2a3440'; for (let i = 0; i < 5; i++) c.fillRect(S * 0.3, S * 0.1 + i * 7, S * 0.4, 3); c.fillStyle = '#c8c8c8'; c.fillRect(S * 0.78, S * 0.45, 6, 16); });
  def('filing', 1.3, (c, S, r) => { metal(c, S, r, '#7a7a70'); for (let i = 1; i < 4; i++) wobbleLine(c, 0, S * i / 4, S, S * i / 4, 2, INK, 0.7, r, 0.4, 4); c.fillStyle = '#d0d0d0'; for (let i = 0; i < 4; i++) c.fillRect(S * 0.42, S * (i / 4 + 0.1), S * 0.16, 5); });
  def('plastic', 1.0, (c, S, r) => plain(c, S, r, '#d8d2c0', { dots: 100 }));
  def('helipad', 14, (c, S, r) => { c.fillStyle = '#4a4a48'; c.fillRect(0, 0, S, S); c.strokeStyle = '#e8e0c0'; c.lineWidth = 10; c.beginPath(); c.arc(S / 2, S / 2, S * 0.42, 0, 7); c.stroke(); c.fillStyle = '#e8e0c0'; c.font = `bold ${S * 0.5}px Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', S / 2, S / 2 + 4); });
  def('sandbag', 0.8, (c, S, r) => { c.fillStyle = '#9a8a60'; c.fillRect(0, 0, S, S); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { c.fillStyle = shade('#b0a070', 0.85 + r() * 0.2); c.beginPath(); c.ellipse(j * S / 2 + S / 4 + (i % 2) * S / 4, i * S / 4 + S / 8, S / 4 - 2, S / 8 - 2, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1; } });
  def('canvas_green', 2.0, (c, S, r) => { plain(c, S, r, '#5a6a3c', { dots: 500 }); hatch(c, 0, 0, S, S, 0.2, 5, INK, 0.08, 0.8, r); });
  def('boat_white', 3.0, (c, S, r) => { plain(c, S, r, '#e8e6de', { dots: 200 }); c.fillStyle = '#1e3a6a'; c.fillRect(0, S * 0.2, S, S * 0.08); });
  def('door', 1.2, (c, S, r) => {
    c.fillStyle = '#6a4228'; c.fillRect(0, 0, S, S);
    for (const [x, y, w, h] of [[S * 0.12, S * 0.06, S * 0.76, S * 0.36], [S * 0.12, S * 0.52, S * 0.76, S * 0.42]]) { c.fillStyle = '#7a4e30'; c.fillRect(x, y, w, h); ink(c, [[x + w, y], [x + w, y + h], [x, y + h]], 2, INK, 0.8); ink(c, [[x, y + h], [x, y], [x + w, y]], 1.5, '#c89868', 0.4); }
    c.fillStyle = '#d8b040'; c.beginPath(); c.arc(S * 0.84, S * 0.5, 5, 0, 7); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(1, 1, S - 2, S - 2);
  });
  def('door_metal', 1.2, (c, S, r) => { metal(c, S, r, '#5e6a70', { panels: 1 }); c.fillStyle = '#c0c0c0'; c.fillRect(S * 0.8, S * 0.48, 12, 6); });
  def('shutter', 1.5, (c, S, r) => { corrugated(c, S, r, '#9a9a94', 1); for (let i = 0; i < 16; i++) wobbleLine(c, 0, i * S / 16, S, i * S / 16, 1.4, INK, 0.6, r, 0.4, 4); });
  def('shutter_green', 1.5, (c, S, r) => { c.fillStyle = '#3e6848'; c.fillRect(0, 0, S, S); for (let i = 0; i < 12; i++) { wobbleLine(c, 0, i * S / 12, S, i * S / 12 + 4, 2, INK, 0.7, r, 0.5, 4); } });
  def('awning', 1.6, (c, S, r) => stripes(c, S, r, '#c83c2c', '#f0e6d0', 8, true));
  def('stripes', 1.4, (c, S, r) => stripes(c, S, r, '#d8402c', '#f4ecd8', 6, true));
  def('stripes_blue', 1.4, (c, S, r) => stripes(c, S, r, '#2c5a9a', '#f4ecd8', 6, true));
  def('buoy', 0.8, (c, S, r) => stripes(c, S, r, '#e02c1c', '#f4f0e8', 8, true));
  def('lighthouse', 6.0, (c, S, r) => { stripes(c, S, r, '#f0ece0', '#c02c20', 4, false); });
  def('lamp_glass', 1.0, (c, S, r) => plain(c, S, r, '#fff0b0', { dots: 30 }), { emit: true });
  def('bulb', 1.0, (c, S, r) => plain(c, S, r, '#ffffff', { dots: 0 }), { emit: true });
  def('window_lit', 2.0, (c, S, r) => { plain(c, S, r, '#f6d078', { dots: 60 }); c.fillStyle = '#2a1a10'; c.fillRect(S / 2 - 3, 0, 6, S); c.fillRect(0, S / 2 - 3, S, 6); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(0, 0, S, S); }, { emit: true });
  def('window_dark', 2.0, (c, S, r) => { plain(c, S, r, '#2e3a44', { dots: 60 }); for (let i = 0; i < 3; i++) wobbleLine(c, r() * S, 0, r() * S - 50, S, 4, '#7a90a0', 0.4, r, 3, 3); c.fillStyle = '#e0dccc'; c.fillRect(S / 2 - 3, 0, 6, S); c.fillRect(0, S / 2 - 3, S, 6); c.strokeStyle = '#e0dccc'; c.lineWidth = 8; c.strokeRect(0, 0, S, S); });
  def('screen', 0.4, (c, S, r) => { plain(c, S, r, '#2a6a4a', { dots: 20 }); c.fillStyle = '#8af0b0'; for (let i = 0; i < 8; i++) c.fillRect(S * 0.1, S * 0.1 + i * S * 0.1, S * (0.2 + r() * 0.6), S * 0.04); }, { emit: true });
  def('light_panel', 1.2, (c, S, r) => { plain(c, S, r, '#f8f8f0', { dots: 10 }); c.strokeStyle = '#9a9a9a'; c.lineWidth = 6; c.strokeRect(0, 0, S, S); }, { emit: true });
  def('carpet', 3.0, (c, S, r) => speckle(c, S, r, { color: '#4a5a70', dots: 2500, dark: '#2a3444', light: '#6a7a90', alpha: 0.4 }));
  def('carpet_red', 3.0, (c, S, r) => { speckle(c, S, r, { color: '#6e2420', dots: 2500, dark: '#3a1010', light: '#8a3a30', alpha: 0.4 }); c.strokeStyle = '#c8a050'; c.globalAlpha = 0.5; c.lineWidth = 3; c.strokeRect(10, 10, S - 20, S - 20); c.globalAlpha = 1; });
  def('ceiling', 3.0, (c, S, r) => plain(c, S, r, '#dcd6c8', { dots: 300 }));
  def('ceiling_tiles', 2.4, (c, S, r) => { tiles(c, S, r, { n: 4, color: '#e0dcd0', groutColor: '#8a8478', grout: 2 }); stipple(c, S, 900, '#9a9488', 0.3, r, 1); });
  def('wallpaper', 2.0, (c, S, r) => { plain(c, S, r, '#b89a6a', { dots: 200 }); for (let x = 0; x < S; x += S / 8) { wobbleLine(c, x, 0, x, S, 2, '#8a6a40', 0.5, r, 0.5, 6); for (let y = 10; y < S; y += 32) { c.fillStyle = '#6a4a2a'; c.globalAlpha = 0.4; c.beginPath(); c.arc(x + S / 16, y, 4, 0, 7); c.fill(); c.globalAlpha = 1; } } });
  def('books', 0.9, (c, S, r) => { let x = 0; while (x < S) { const w = 8 + r() * 14; c.fillStyle = ['#7a2a20', '#2a4a6a', '#3a5a2a', '#8a6a2a', '#4a2a4a', '#6a5a4a'][Math.floor(r() * 6)]; c.fillRect(x, S * (0.05 + r() * 0.15), w - 1, S); c.fillStyle = '#e8d8a0'; c.globalAlpha = 0.6; c.fillRect(x + 2, S * 0.4, w - 5, 3); c.globalAlpha = 1; ink(c, [[x + w - 1, 0], [x + w - 1, S]], 1.2, INK, 0.7); x += w; } });
  def('tackle', 0.9, (c, S, r) => { for (let i = 0; i < 18; i++) { c.fillStyle = ['#c83c2c', '#e8c040', '#3c6a9a', '#4a8a4a', '#e8e0d0'][Math.floor(r() * 5)]; const x = r() * S, y = r() * S; c.fillRect(x, y, 10 + r() * 20, 14 + r() * 20); c.strokeStyle = INK; c.strokeRect(x, y, 10 + r() * 20, 14 + r() * 20); } });
  def('fabric', 1.0, (c, S, r) => { plain(c, S, r, '#7a8a9a', { dots: 300 }); hatch(c, 0, 0, S, S, 0.8, 6, INK, 0.08, 0.8, r); });
  def('fabric_red', 1.0, (c, S, r) => { plain(c, S, r, '#8a2a24', { dots: 300 }); hatch(c, 0, 0, S, S, 0.8, 6, INK, 0.08, 0.8, r); });
  def('leather', 1.0, (c, S, r) => { plain(c, S, r, '#5a3420', { dots: 300 }); blotch(c, S, 10, '#7a4a2e', 0.3, r, 8, 20); });
  def('leather_red', 1.0, (c, S, r) => { plain(c, S, r, '#a2281e', { dots: 300 }); blotch(c, S, 10, '#c84030', 0.3, r, 8, 20); });
  def('paper', 0.5, (c, S, r) => { plain(c, S, r, '#f0ead8', { dots: 50 }); for (let i = 0; i < 10; i++) wobbleLine(c, S * 0.1, S * (0.1 + i * 0.08), S * (0.5 + r() * 0.4), S * (0.1 + i * 0.08), 1, '#5a5a6a', 0.5, r, 0.5, 4); });
  def('newspapers', 0.8, (c, S, r) => { plain(c, S, r, '#e4dcc8', { dots: 100 }); c.fillStyle = '#2a2a2a'; c.font = 'bold 20px serif'; c.fillText('DAILY', 10, 30); for (let i = 0; i < 12; i++) c.fillRect(10 + (i % 3) * 80, 44 + Math.floor(i / 3) * 40, 70, 3); });
  def('menu_board', 2.0, (c, S, r) => { plain(c, S, r, '#2a3a2c', { dots: 100 }); c.fillStyle = '#f0ead0'; for (let i = 0; i < 8; i++) c.fillRect(20, 20 + i * 28, 80 + r() * 100, 4); });
  def('porcelain', 1.0, (c, S, r) => plain(c, S, r, '#f0f0ea', { dots: 60 }));
  def('terracotta', 1.0, (c, S, r) => plain(c, S, r, '#b4643c', { dots: 200 }));
  def('water_bottle', 1.0, (c, S, r) => plain(c, S, r, '#9ac4e0', { dots: 30 }));
  def('soot', 1.0, (c, S, r) => plain(c, S, r, '#1c1410', { dots: 100 }));
  def('bone', 1.0, (c, S, r) => plain(c, S, r, '#e8dcc0', { dots: 100 }));
  def('alarm_red', 0.5, (c, S, r) => { plain(c, S, r, '#c81e14', { dots: 50 }); c.fillStyle = '#f0f0f0'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('ALARM', S / 2, S / 2 + 14); }, { emit: true });
  def('white', 1.0, (c, S, r) => plain(c, S, r, '#ecebe4', { dots: 40 }));
  def('black', 1.0, (c, S, r) => plain(c, S, r, '#1c1a18', { dots: 40 }));
  def('red_paint', 1.0, (c, S, r) => plain(c, S, r, '#b8281c', { dots: 150 }));
  def('yellow_paint', 1.0, (c, S, r) => plain(c, S, r, '#e0b830', { dots: 150 }));
  def('rope', 0.5, (c, S, r) => { plain(c, S, r, '#b89a60', { dots: 50 }); hatch(c, 0, 0, S, S, 0.9, 10, INK, 0.4, 2, r); });
  def('water', 8.0, (c, S, r) => plain(c, S, r, '#4a7a8a', { dots: 100 }));
  def('glass', 1.0, (c, S, r) => { c.fillStyle = 'rgba(160,200,220,0.35)'; c.fillRect(0, 0, S, S); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(S * (0.2 + i * 0.2), S * 0.1); c.lineTo(S * (0.05 + i * 0.2), S * 0.4); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(0, 0, S, S); }, { alpha: true, blend: true });
  def('chainlink', 1.2, (c, S, r) => { c.clearRect(0, 0, S, S); c.strokeStyle = '#8a9096'; c.lineWidth = 2.2; const n = 10; for (let i = -n; i < n * 2; i++) { c.beginPath(); c.moveTo(i * S / n, 0); c.lineTo(i * S / n + S, S); c.stroke(); c.beginPath(); c.moveTo(i * S / n, S); c.lineTo(i * S / n + S, 0); c.stroke(); } c.fillStyle = '#5a6066'; c.fillRect(0, 0, S, 5); }, { alpha: true });
  def('lamp_bulb', 1.0, (c, S, r) => plain(c, S, r, '#fff6d0', { dots: 0 }), { emit: true });

  const cache = {};
  X.Tex = {
    INK,
    mix, shade, hex2, rgb, ink, wobbleLine, stipple, hatch, blotch,
    has(name) { return !!M[name]; },
    info(name) { return M[name] || M.concrete; },
    make(name, size) {
      const key = name + ':' + (size || 0);
      if (cache[key]) return cache[key];
      const m = M[name] || M.concrete;
      const S = size || m.size || 256;
      const c = canvas(S, S);
      if (!c) return null;
      const ctx = c.getContext('2d');
      const r = X.rng(X.hash('tex:' + name));
      ctx.save();
      m.gen(ctx, S, r);
      ctx.restore();
      cache[key] = c;
      return c;
    },
    paper(S) {
      const c = canvas(S, S);
      const ctx = c.getContext('2d');
      const r = X.rng(99);
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, S, S);
      stipple(ctx, S, S * S / 6, '#000000', 0.07, r, 1);
      stipple(ctx, S, S * S / 6, '#ffffff', 0.07, r, 1);
      for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, a = r() * 3; ink(ctx, [[x, y], [x + Math.cos(a) * 14, y + Math.sin(a) * 14]], 0.7, r() < 0.5 ? '#000' : '#fff', 0.09); }
      return c;
    }
  };
})(globalThis.XIII = globalThis.XIII || {});
