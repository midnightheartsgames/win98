(function (P) {
  'use strict';
  const { rng, hash } = P;
  const TAU = Math.PI * 2;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  function hexRgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function rgbHex(r, g, b) {
    const c = x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }

  function shade(hex, k) {
    const [r, g, b] = hexRgb(hex);
    if (k >= 0) return rgbHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
    return rgbHex(r * (1 + k), g * (1 + k), b * (1 + k));
  }

  function mix(a, b, t) {
    const x = hexRgb(a), y = hexRgb(b);
    return rgbHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }

  const PALETTES = {
    atlas: ['#e0306a', '#ffd23f', '#2f9e5a', '#2b3d9a', '#f7f0e0', '#8a2be2'],
    chapan: ['#233a8c', '#2e8f7a', '#7a2a6e', '#e8c860', '#f4ecd8'],
    madder: ['#b3262e', '#e8b64a', '#1f4f8f', '#3d7a3a', '#f3e6c8', '#6b2a1a'],
    rishtan: ['#1b3f8f', '#2a9aa8', '#f6f1e4', '#d8a040', '#0e2458'],
    palas: ['#8e2a2a', '#d88a3a', '#2a4a7a', '#f0dcb0', '#4a2a1a']
  };

  function valueNoise1(seed) {
    const r = rng(seed);
    const pts = Array.from({ length: 64 }, () => r());
    return x => {
      const i = Math.floor(x), f = x - i;
      const a = pts[((i % 64) + 64) % 64], b = pts[(((i + 1) % 64) + 64) % 64];
      const t = f * f * (3 - 2 * f);
      return a + (b - a) * t;
    };
  }

  function ikatMotif(kind) {
    if (kind === 'amulet') {
      return (u, v) => {
        const du = Math.abs(u - 0.5) * 2, dv = Math.abs(v - 0.5) * 2;
        const d = du + dv;
        if (d < 0.28) return 0;
        if (d < 0.5) return 1;
        if (d < 0.66) return 2;
        if (d < 0.8 && Math.floor(v * 12) % 2 === 0) return 3;
        if (du > 0.86) return Math.floor(v * 6) % 2 ? 4 : -1;
        return -1;
      };
    }
    if (kind === 'comb') {
      return (u, v) => {
        const w = Math.abs(Math.sin(v * Math.PI * 2)) * 0.36 + 0.1;
        const du = Math.abs(u - 0.5);
        if (du < w * 0.4) return 0;
        if (du < w) return 1;
        if (du < w + 0.08 && Math.floor(v * 16) % 2 === 0) return 2;
        if (du > 0.44) return 3;
        return -1;
      };
    }
    if (kind === 'flame') {
      return (u, v) => {
        const k = Math.floor(v * 2);
        const vv = (v * 2) % 1;
        const w = 0.46 * (1 - vv) + 0.04;
        const du = Math.abs(u - 0.5);
        if (du < w * 0.45) return (k % 2) ? 0 : 2;
        if (du < w) return (k % 2) ? 1 : 3;
        return -1;
      };
    }
    return (u, v) => {
      const s = Math.floor(u * 5);
      if (Math.abs(((v * 3) % 1) - 0.5) < 0.18 && s % 2 === 0) return 2;
      return s % 4;
    };
  }

  function ikat(seed, w, h, palette, opts = {}) {
    const c = canvas(w, h);
    const ctx = c.getContext('2d');
    const r = rng(seed);
    const pal = palette.slice();
    for (let i = pal.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pal[i], pal[j]] = [pal[j], pal[i]]; }
    const bg = opts.bg || pal[pal.length - 1];
    const cols = pal.slice(0, 5);
    const kind = opts.kind || ['amulet', 'comb', 'flame', 'stripe'][Math.floor(r() * 4)];
    const motif = ikatMotif(kind);
    const tw = opts.thread || 1;
    const feather = opts.feather === undefined ? 0.07 : opts.feather;
    const nz = valueNoise1(seed ^ 0x5bd1e995);
    const tileW = opts.tileW || w, tileH = opts.tileH || h;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += tw) {
      const off = (nz(x / tw * 0.9) - 0.5) * feather + (r() - 0.5) * feather * 0.35;
      let run = -2, y0 = 0;
      for (let y = 0; y <= h; y++) {
        const u = ((x + tw / 2) % tileW) / tileW;
        const v = (((y / tileH + off) % 1) + 1) % 1;
        const k = y < h ? motif(u, v) : -3;
        if (k !== run) {
          if (run >= 0) { ctx.fillStyle = cols[run % cols.length]; ctx.fillRect(x, y0, tw, y - y0); }
          run = k; y0 = y;
        }
      }
    }
    return c;
  }

  function petal(ctx, len, wid) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.8, -len * 0.8, 0, -len);
    ctx.bezierCurveTo(-wid * 0.8, -len * 0.8, -wid, -len * 0.3, 0, 0);
    ctx.closePath();
  }

  function suzani(ctx, cx, cy, R, seed, pal) {
    const r = rng(seed);
    const P2 = pal || PALETTES.madder;
    const n = [6, 8, 10, 12][Math.floor(r() * 4)];
    const main = P2[0], second = P2[2], third = P2[1], leaf = P2[3], ground = P2[4], dark = P2[5] || '#3a1a10';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(0.6, R * 0.018);
    ctx.strokeStyle = dark;
    const vineN = n * 2;
    for (let i = 0; i < vineN; i++) {
      const a = i / vineN * TAU;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.62);
      ctx.quadraticCurveTo(R * 0.2, -R * 0.82, 0, -R * 0.98);
      ctx.strokeStyle = leaf;
      ctx.lineWidth = Math.max(0.6, R * 0.03);
      ctx.stroke();
      ctx.translate(R * 0.09, -R * 0.84);
      ctx.rotate(0.6);
      petal(ctx, R * 0.16, R * 0.07);
      ctx.fillStyle = i % 2 ? leaf : shade(leaf, -0.2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, TAU); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = Math.max(0.6, R * 0.02); ctx.stroke();
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate(i / n * TAU);
      petal(ctx, R * 0.58, R * 0.2);
      ctx.fillStyle = i % 2 ? second : third;
      ctx.fill();
      ctx.stroke();
      petal(ctx, R * 0.38, R * 0.1);
      ctx.fillStyle = ground;
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = ground;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.26, 0, TAU); ctx.fill(); ctx.stroke();
    const dots = n * 2;
    for (let i = 0; i < dots; i++) {
      const a = (i + 0.5) / dots * TAU;
      ctx.fillStyle = i % 2 ? main : dark;
      ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.19, Math.sin(a) * R * 0.19, R * 0.03, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.1, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function rishtan(ctx, cx, cy, R, seed, opts = {}) {
    const r = rng(seed);
    const pal = PALETTES.rishtan;
    const cobalt = opts.cobalt || pal[0], turq = pal[1], white = pal[2], ochre = pal[3], deep = pal[4];
    const blueGround = r() < 0.45;
    const ground = blueGround ? turq : white;
    const ink = blueGround ? white : cobalt;
    const accent = blueGround ? cobalt : turq;
    const n = [8, 10, 12, 16][Math.floor(r() * 4)];
    const m = [6, 8, 10][Math.floor(r() * 3)];
    const lw = Math.max(0.4, R * 0.018);
    const circle = (rad) => { ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); };
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = ground;
    circle(R); ctx.fill();
    const glazeLight = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.05, 0, 0, R);
    glazeLight.addColorStop(0, 'rgba(255,255,255,0.28)'); glazeLight.addColorStop(1, 'rgba(0,0,40,0.1)');
    ctx.fillStyle = glazeLight;
    circle(R); ctx.fill();
    ctx.fillStyle = cobalt;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.arc(0, 0, R * 0.86, 0, TAU, true); ctx.fill();
    const band = Math.floor(r() * 3);
    for (let i = 0; i < n * 2; i++) {
      ctx.save();
      ctx.rotate(i / (n * 2) * TAU);
      if (band === 0) { ctx.fillStyle = white; ctx.beginPath(); ctx.arc(0, -R * 0.93, R * 0.035, 0, TAU); ctx.fill(); }
      else if (band === 1) { ctx.fillStyle = turq; ctx.fillRect(-R * 0.03, -R * 0.99, R * 0.06, R * 0.12); }
      else { ctx.strokeStyle = white; ctx.lineWidth = R * 0.02; ctx.beginPath(); ctx.moveTo(-R * 0.08, -R * 0.9); ctx.lineTo(0, -R * 0.97); ctx.lineTo(R * 0.08, -R * 0.9); ctx.stroke(); }
      ctx.restore();
    }
    if (R < 14) {
      ctx.fillStyle = accent;
      circle(R * 0.3); ctx.fill();
      ctx.fillStyle = ochre;
      circle(R * 0.12); ctx.fill();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = accent; ctx.lineWidth = lw * 1.6;
    circle(R * 0.82); ctx.stroke();
    ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.3;
    ctx.beginPath();
    for (let k = 0; k <= 240; k++) {
      const a = k / 240 * TAU;
      const rr = R * (0.63 + Math.sin(a * n) * 0.1);
      const x = Math.sin(a) * rr, y = -Math.cos(a) * rr;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const crest = (i + 0.25) / n * TAU, trough = (i + 0.75) / n * TAU;
      ctx.save();
      ctx.rotate(crest);
      ctx.translate(0, -R * 0.72);
      petal(ctx, R * 0.13, R * 0.06);
      ctx.fillStyle = accent; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = ochre;
      ctx.beginPath(); ctx.arc(0, -R * 0.05, R * 0.022, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate(trough);
      ctx.fillStyle = ink;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(k * R * 0.04, -R * 0.62 - Math.abs(k) * R * 0.02, R * 0.022, 0, TAU); ctx.fill(); }
      ctx.translate(0, -R * 0.5);
      petal(ctx, R * 0.08, R * 0.035);
      ctx.fillStyle = ink; ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.2;
    circle(R * 0.44); ctx.stroke();
    circle(R * 0.41); ctx.stroke();
    ctx.fillStyle = blueGround ? shade(turq, 0.25) : shade(white, -0.04);
    circle(R * 0.4); ctx.fill();
    for (let i = 0; i < m; i++) {
      ctx.save();
      ctx.rotate(i / m * TAU);
      petal(ctx, R * 0.37, R * 0.13);
      ctx.fillStyle = ink; ctx.fill();
      petal(ctx, R * 0.24, R * 0.06);
      ctx.fillStyle = accent; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate((i + 0.5) / m * TAU);
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(0, -R * 0.3, R * 0.03, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = ochre;
    circle(R * 0.1); ctx.fill();
    ctx.strokeStyle = deep; ctx.lineWidth = lw;
    circle(R * 0.1); ctx.stroke();
    ctx.fillStyle = accent;
    circle(R * 0.045); ctx.fill();
    ctx.restore();
  }

  function star8(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.62 : r;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function girih(ctx, x, y, w, h, seed, pal) {
    const r = rng(seed);
    const P2 = pal || ['#1f5fa8', '#2aa0a8', '#f4e6c8', '#c8643c', '#123a6a'];
    const cell = h;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = P2[0];
    ctx.fillRect(x, y, w, h);
    const alt = r() < 0.5;
    for (let i = 0, cx = x + cell / 2; cx < x + w + cell; i++, cx += cell) {
      ctx.fillStyle = (i % 2 && alt) ? P2[3] : P2[1];
      star8(ctx, cx, y + h / 2, cell * 0.44);
      ctx.fill();
      ctx.strokeStyle = P2[2];
      ctx.lineWidth = Math.max(0.6, cell * 0.06);
      ctx.stroke();
      ctx.fillStyle = P2[2];
      ctx.beginPath(); ctx.arc(cx, y + h / 2, cell * 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = P2[4];
      ctx.beginPath(); ctx.moveTo(cx + cell / 2, y); ctx.lineTo(cx + cell / 2 + cell * 0.16, y + h / 2); ctx.lineTo(cx + cell / 2, y + h); ctx.lineTo(cx + cell / 2 - cell * 0.16, y + h / 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function pakhta(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = col || '#2d5fb8';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i / 4 * TAU + Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.34, s * 0.22, s * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.16, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function chust(ctx, x, y, w, h, seed) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#16161a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#f4f0e6';
    ctx.lineWidth = Math.max(0.5, h * 0.1);
    const n = Math.max(2, Math.round(w / (h * 1.4)));
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * w / n, cy = y + h * 0.55;
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.1, cy + h * 0.3);
      ctx.quadraticCurveTo(cx - h * 0.5, cy - h * 0.1, cx, cy - h * 0.35);
      ctx.quadraticCurveTo(cx + h * 0.5, cy - h * 0.1, cx + h * 0.1, cy + h * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function basketweave(ctx, x0, y0, w, h, seed, opts = {}) {
    const r = rng(seed);
    const B = opts.brick || 12;
    const base = opts.colors || ['#c98a5a', '#b9774a', '#d49a66', '#c07a4e', '#a86a42'];
    const mortar = opts.mortar || '#8a5a3a';
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    ctx.fillStyle = mortar;
    ctx.fillRect(x0, y0, w, h);
    const g = opts.gap || 1;
    for (let cy = 0; cy * B * 2 < h + B * 2; cy++) {
      for (let cx = 0; cx * B * 2 < w + B * 2; cx++) {
        const X = x0 + cx * B * 2, Y = y0 + cy * B * 2;
        const vert = (cx + cy) % 2 === 0;
        for (let k = 0; k < 2; k++) {
          const col = base[Math.floor(r() * base.length)];
          const j = (r() - 0.5) * 0.12;
          ctx.fillStyle = shade(col, j);
          if (vert) ctx.fillRect(X + k * B + g / 2, Y + g / 2, B - g, B * 2 - g);
          else ctx.fillRect(X + g / 2, Y + k * B + g / 2, B * 2 - g, B - g);
          if (r() < 0.18) {
            ctx.fillStyle = 'rgba(60,30,10,0.12)';
            const sx = X + (vert ? k * B : 0) + r() * B, sy = Y + (vert ? 0 : k * B) + r() * B;
            ctx.beginPath(); ctx.arc(sx, sy, 0.5 + r() * B * 0.2, 0, TAU); ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,240,210,0.12)';
          if (vert) ctx.fillRect(X + k * B + g / 2, Y + g / 2, B - g, 1);
          else ctx.fillRect(X + g / 2, Y + k * B + g / 2, B * 2 - g, 1);
        }
      }
    }
    ctx.restore();
  }

  function leafShadows(ctx, x0, y0, w, h, seed, alpha) {
    const r = rng(seed);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    const n = Math.round(w * h / 900);
    for (let i = 0; i < n; i++) {
      const fy = Math.pow(r(), 1.6);
      const x = x0 + r() * w, y = y0 + fy * h;
      const s = 6 + r() * 12;
      const a = alpha * (1 - fy * 0.8) * (0.5 + r() * 0.5);
      ctx.fillStyle = 'rgba(40,24,10,' + a.toFixed(3) + ')';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * TAU);
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const ang = k / 5 * TAU;
        ctx.ellipse(Math.cos(ang) * s * 0.35, Math.sin(ang) * s * 0.35, s * 0.42, s * 0.3, ang, 0, TAU);
      }
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function patternOf(ctx, src) {
    try { return ctx.createPattern(src, 'repeat'); } catch (e) { return '#888'; }
  }

  P.Orn = { canvas, shade, mix, hexRgb, rgbHex, PALETTES, ikat, suzani, rishtan, girih, star8, pakhta, chust, basketweave, leafShadows, petal, patternOf, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
