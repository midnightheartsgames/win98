(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, A = H.Ults.Art;
  const { W, HGT } = H.UI_CONST;
  const { LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const SIGN = 1.3, CX = 204, CY = 232, FLOOR = LH - BAR, MX = 160, MY = 96, EMB = 84;
  const RAR = { 3: '#5aa8ff', 4: '#c47cff', 5: '#ffcc50' };
  const TICKET = { ev: ['#d23a48', '#7a1622', '#f0c868'], std: ['#c4e4ec', '#5a8a9c', '#f2f8fa'] };
  const WAIST = { m: 42, tall: 41, slim: 41, lean: 41, petite: 45, f: 40.5, tallf: 39.5, small: 57.5 };
  const HANDS = { m: [12.4, 49], tall: [13, 48.5], slim: [10.4, 48.5], lean: [11.4, 48.5], petite: [7.8, 48], f: [8.8, 43.5], tallf: [8.8, 42.5], small: [8, 60] };
  const buf = { cv: null };

  function zoom(g, fx, fy, z, fn) { g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy); fn(); g.restore(); }
  function clip(g, x, y, w, h, fn) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }
  function cuts(g, t, list) { for (const c of list) if (t >= c && t < c + 0.1) flash(g, '#ffffff', 0.45 * (1 - (t - c) / 0.1)); }
  function stand(g, col, w) { lighter(g, () => glow(g, CX, CY - 96, 92, col, 0.16)); ell(g, 'rgba(0,0,0,0.42)', CX, CY, w || 26, (w || 26) * 0.2); }
  function hand(P, side) { const h = HANDS[P.look.body] || HANDS.m; return { x: CX + side * (h[0] - 0.5) * 2, y: CY - (G.FIG_FOOT - h[1]) * 2 }; }
  function bustTop(y, size) { return y - size; }

  function star4(g, x, y, r, col) { poly(g, col, [x, y - r, x + r * 0.25, y - r * 0.25, x + r, y, x + r * 0.25, y + r * 0.25, x, y + r, x - r * 0.25, y + r * 0.25, x - r, y, x - r * 0.25, y - r * 0.25]); }
  function twinkle(g, x, y, r, a) { if (a <= 0) return; lighter(g, () => { star4(g, x, y, r, rgba('#ffffff', a)); glow(g, x, y, r * 1.6, '#fff4d0', a * 0.5); }); }

  function ticket(g, x, y, o = {}) {
    const a = o.a == null ? 1 : o.a;
    if (a <= 0) return;
    const s = o.s || 1, w = 14 * s, h = 8 * s, f = Math.cos(o.spin || 0), pal = TICKET[o.std ? 'std' : 'ev'];
    if (o.glow !== 0) lighter(g, () => glow(g, x, y, 9 * s + 6, pal[2], 0.5 * a * (o.glow || 1)));
    g.save();
    g.globalAlpha *= a;
    g.translate(x, y); g.rotate(o.rot || 0); g.scale(Math.max(0.12, Math.abs(f)), 1);
    rect(g, pal[2], -w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
    rect(g, f < 0 ? pal[1] : pal[0], -w / 2, -h / 2, w, h);
    if (f >= 0) {
      star4(g, -w / 2 + h * 0.5, 0, h * 0.36, pal[2]);
      rect(g, pal[2], -w / 2 + h, -h * 0.22, w * 0.42, Math.max(1, s * 0.7));
      rect(g, pal[2], -w / 2 + h, h * 0.12, w * 0.28, Math.max(1, s * 0.5));
    } else star4(g, 0, 0, h * 0.3, pal[2]);
    g.restore();
  }

  function along(t, t0, t1, x0, y0, x1, y1, lift, ease) {
    const k = (ease || sm)(seg(t, t0, t1));
    return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) - Math.sin(Math.PI * k) * (lift || 0), k };
  }

  function sparkTrail(g, pos, n, col) {
    lighter(g, () => {
      for (let i = 1; i <= n; i++) {
        const p = pos(i * 0.035);
        if (p) rect(g, rgba(col, 0.85 * (1 - i / (n + 1))), Math.round(p.x + (hx(i, 1, 77) - 0.5) * 4), Math.round(p.y + (hx(i, 2, 77) - 0.5) * 4), 1, 1);
      }
    });
  }

  function fly(S, P, t, t0, t1, from, to, o = {}) {
    if (t < t0) return null;
    const at = tt => along(tt, t0, t1, from[0], from[1], to[0], to[1], o.lift, o.ease);
    const p = at(t);
    if (p.k < 1) sparkTrail(S.g, dt => (t - dt < t0 ? null : at(t - dt)), 10, o.trail || '#fff0c0');
    ticket(S.g, p.x, p.y, { s: o.s || 1, spin: o.spin != null ? o.spin : (o.spin0 || 0) + t * 9 * (1 - p.k), rot: (o.rot || 0) * p.k, std: P.std });
    return p;
  }

  function pose(S, P, o = {}) {
    const g = S.g, live = o.live !== false, T = S.T + P.seed;
    const blink = live && T % 4.1 < 0.13;
    const v = blink ? Object.assign({}, o.v, { closed: true }) : o.v;
    const cv = G.figureCanvas(S.look(P.id, v), 2), src = o.tint ? K.tinted(cv, o.tint, o.ta == null ? 1 : o.ta) : cv;
    const up = live && Math.sin(T * Math.PI * 2 / 3.4) > 0.15 ? 1 : 0;
    const cut = Math.round((WAIST[P.look.body] || 41) * 2), FW = cv.width, FH = cv.height, X0 = -FW / 2, Y0 = -G.FIG_FOOT * 2;
    g.save();
    if (o.a != null) g.globalAlpha *= cl(o.a);
    g.translate(Math.round(o.x == null ? CX : o.x), Math.round(o.y == null ? CY : o.y));
    if (o.flip) g.scale(-1, 1);
    g.drawImage(src, 0, cut - 1, FW, FH - cut + 1, X0, Y0 + cut - 1, FW, FH - cut + 1);
    g.drawImage(src, 0, 0, FW, cut, X0, Y0 - up, FW, cut);
    g.restore();
  }

  function windowStars(g, T, x, y, w, h, drift, streak) {
    clip(g, x, y, w, h, () => {
      rect(g, '#04060e', x, y, w, h);
      K.stars(g, T, 60, 13, 0.9, LH, T * (drift || 0));
      if (streak) K.hStreaks(g, T, 16, 5, 240, '#b8d0ff', 0.5, y + 2, y + h - 2);
    });
  }

  function cup(g, x, y, s) {
    ell(g, '#a89c88', x, y + 1.6 * s, 9.4 * s, 2.7 * s);
    ell(g, '#f4efe4', x, y + 0.8 * s, 8.6 * s, 2.2 * s);
    poly(g, '#f8f4ea', [x - 5 * s, y - 6 * s, x + 5 * s, y - 6 * s, x + 4 * s, y, x - 4 * s, y]);
    poly(g, '#d4ccbc', [x + 1.6 * s, y - 6 * s, x + 5 * s, y - 6 * s, x + 4 * s, y, x + 1.6 * s, y]);
    rect(g, '#d8b060', x - 5 * s, y - 6 * s - 0.5, 10 * s, Math.max(1, 0.6 * s));
    ell(g, '#3a2010', x, y - 6 * s, 4.4 * s, 1.1 * s);
    g.strokeStyle = '#f4efe4'; g.lineWidth = Math.max(1, s); g.beginPath(); g.arc(x + 5.6 * s, y - 3.4 * s, 2 * s, -1.2, 1.2); g.stroke();
  }

  function steam(g, T, x, y, h, a) {
    for (let i = 0; i < 5; i++) {
      const ph = (T * 0.45 + i / 5) % 1;
      ell(g, rgba('#ffffff', (a || 0.5) * Math.sin(ph * Math.PI) * 0.6), x + Math.sin(ph * 7 + i * 2) * 3 * (1 + ph), y - ph * h, 1.5 + ph * 4, 1 + ph * 2.6);
    }
  }

  function pot(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    poly(g, '#8a6a2a', [-9, -14, 9, -14, 13, 10, -13, 10]);
    poly(g, '#d8b060', [-9, -14, 0, -14, 0, 10, -13, 10]);
    rect(g, '#f0d890', -7, -12, 2, 18);
    poly(g, '#8a6a2a', [-12, -6, -27, -16, -28, -12, -12, 1]);
    ell(g, '#5a4018', 0, -15, 7, 2.4);
    rect(g, '#3a2a14', 12, -10, 5, 14);
    g.restore();
  }

  function suitcase(g, x, y) {
    rect(g, '#4a1010', x - 19, y - 31, 38, 31);
    rect(g, '#c8323a', x - 18, y - 30, 36, 29);
    rect(g, '#e8626a', x - 18, y - 30, 36, 2);
    rect(g, '#d8b060', x - 18, y - 17, 36, 2);
    rect(g, '#d8b060', x - 13, y - 30, 2, 29); rect(g, '#d8b060', x + 11, y - 30, 2, 29);
    rect(g, '#2a1a10', x - 6, y - 36, 12, 2); rect(g, '#2a1a10', x - 6, y - 36, 2, 6); rect(g, '#2a1a10', x + 4, y - 36, 2, 6);
  }

  function blackHole(g, x, y, r, T) {
    lighter(g, () => glow(g, x, y, r * 3.4, '#9a5aff', 0.45));
    const disc = (a0, a1, col, w) => { g.save(); g.translate(x, y); g.rotate(-0.35 + Math.sin(T * 0.3) * 0.05); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.ellipse(0, 0, r * 2.2, r * 0.55, 0, a0, a1); g.stroke(); g.restore(); };
    disc(0, Math.PI * 2, '#c8a0ff', 2);
    ell(g, '#000000', x, y, r, r);
    ring(g, '#fff4ff', 1, x, y, r + 0.5);
    disc(0.15, Math.PI - 0.15, '#ffe8ff', 2);
  }

  function orbit(g, x, y, rx, ry, T, col, a, n) {
    lighter(g, () => {
      for (let i = 0; i < (n || 3); i++) {
        const k = 1 + i * 0.35, s = T * (1.2 + i * 0.4) + i;
        g.strokeStyle = rgba(col, a * (1 - i * 0.22)); g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, rx * k, ry * k, 0, s, s + 4.2); g.stroke();
      }
    });
  }

  function rock(g, x, y, s, rot, col) { poly(g, col, [x + Math.cos(rot) * s, y + Math.sin(rot) * s, x + Math.cos(rot + 2.1) * s * 0.7, y + Math.sin(rot + 2.1) * s * 0.7, x + Math.cos(rot + 3.9) * s * 0.9, y + Math.sin(rot + 3.9) * s * 0.9]); }

  function flag(g, T, x, top, w, h, cols) {
    const n = 10, sw = w / n;
    rect(g, '#5a4a30', x - 2, top - 4, 3, LH);
    for (let j = 0; j < n; j++) {
      const x0 = x + j * sw, x1 = x0 + sw + 0.5, o0 = Math.sin(j * 0.6 - T * 5) * 5 * j / n, o1 = Math.sin((j + 1) * 0.6 - T * 5) * 5 * (j + 1) / n;
      poly(g, j % 2 ? cols[0] : G.shade(cols[0], -0.06), [x0, top + o0, x1, top + o1, x1, top + h + o1, x0, top + h + o0]);
      poly(g, cols[1], [x0, top + h * 0.38 + o0, x1, top + h * 0.38 + o1, x1, top + h * 0.6 + o1, x0, top + h * 0.6 + o0]);
      if (cols[2]) poly(g, cols[2], [x0, top + h - 2 + o0, x1, top + h - 2 + o1, x1, top + h + o1, x0, top + h + o0]);
    }
  }

  function gear(g, x, y, r, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let i = 0; i < 10; i++) { g.save(); g.rotate(i / 10 * Math.PI * 2); rect(g, col, -2.5, -r - 3, 5, 6); g.restore(); }
    ell(g, col, 0, 0, r, r); ell(g, G.shade(col, -0.45), 0, 0, r * 0.4, r * 0.4);
    g.restore();
  }

  function cloud(g, x, y, r) {
    ell(g, 'rgba(214,228,244,0.8)', x, y + r * 0.18, r * 0.95, r * 0.22);
    ell(g, 'rgba(255,255,255,0.85)', x, y, r, r * 0.42);
    ell(g, 'rgba(255,255,255,0.9)', x - r * 0.4, y - r * 0.18, r * 0.5, r * 0.36);
    ell(g, 'rgba(255,255,255,0.9)', x + r * 0.35, y - r * 0.22, r * 0.55, r * 0.4);
  }

  function luofu(g, T, base) {
    vgrad(g, 0, LH, [[0, '#4a7ac0'], [0.55, '#9ac0e4'], [1, '#e4eef8']]);
    lighter(g, () => glow(g, 250, 44, 90, '#fff4d8', 0.35));
    const b = base || 170;
    for (let i = 0; i < 6; i++) {
      const x = 4 + i * 56 + (i % 2) * 8, h = 34 + hx(i, 4, 31) * 46, w = 26, tiers = h > 60 ? 2 : 1;
      rect(g, '#a8bcd6', x, b - h, w, h); rect(g, '#bccce0', x, b - h, 6, h);
      for (let j = 0; j < tiers; j++) {
        const ty = b - h + j * 22, ew = w + 14 - j * 4;
        poly(g, '#4a5a86', [x + w / 2 - ew / 2 - 3, ty - 1, x + w / 2 - ew / 2 + 2, ty - 4, x + w / 2, ty - 12, x + w / 2 + ew / 2 - 2, ty - 4, x + w / 2 + ew / 2 + 3, ty - 1, x + w / 2 + ew / 2 - 3, ty, x + w / 2, ty - 7, x + w / 2 - ew / 2 + 3, ty]);
        rect(g, '#b8402a', x + 3, ty, 2, 10); rect(g, '#b8402a', x + w - 5, ty, 2, 10);
      }
      for (let k = 0; k < 3; k++) rect(g, '#f0d898', x + 11, b - h + 12 + k * 12, 4, 4);
    }
    vgrad(g, b - 14, b + 4, [[0, 'rgba(240,246,252,0)'], [1, 'rgba(240,246,252,0.9)']]);
    for (let i = 0; i < 7; i++) cloud(g, ((hx(i, 1, 31) * 420 + T * (6 + (i % 3) * 4)) % 420) - 50, 40 + hx(i, 2, 31) * 80, 16 + hx(i, 3, 31) * 22);
    const bx = ((T * 22) % 400) - 40, by = 62 + Math.sin(T) * 2;
    poly(g, '#5a6a8a', [bx - 12, by, bx + 12, by, bx + 8, by + 4, bx - 8, by + 4]); rect(g, '#d8b060', bx - 2, by - 6, 2, 6); poly(g, '#e8eef8', [bx, by - 8, bx + 8, by - 3, bx, by - 3]);
  }

  function lantern(g, T, x, y, i) {
    const sw = Math.sin(T * 1.6 + i) * 0.1;
    g.save(); g.translate(x, y); g.rotate(sw);
    rect(g, '#3a2a1a', -0.5, 0, 1, 12);
    ell(g, '#d8302a', 0, 20, 8, 9); ell(g, '#f05a40', -2, 18, 3, 5);
    rect(g, '#f0c060', -5, 11, 10, 2); rect(g, '#f0c060', -5, 28, 10, 2); rect(g, '#f0c060', -0.5, 30, 1, 6);
    g.restore();
    lighter(g, () => glow(g, x - Math.sin(sw) * 20, y + 20, 18, '#ffb070', 0.4));
  }

  function amp(g, x, y, w, h, pulse) {
    rect(g, '#0e0e14', x, y, w, h); rect(g, '#24242e', x + 2, y + 2, w - 4, h - 4);
    for (const cy of [y + h * 0.3, y + h * 0.72]) { ell(g, '#08080c', x + w / 2, cy, w * 0.28 + pulse * 2, w * 0.28 + pulse * 2); ell(g, '#3a3a46', x + w / 2, cy, w * 0.09, w * 0.09); }
  }

  function crate(g, x, y, w, h, col) {
    rect(g, '#0c0e16', x - 1, y - 1, w + 2, h + 2); rect(g, col, x, y, w, h);
    rect(g, 'rgba(255,255,255,0.16)', x, y, w, 1); rect(g, '#b8964e', x, y + 3, w, 2); rect(g, '#b8964e', x, y + h - 6, w, 2);
  }

  function barrel(g, x, y, s, rot, top) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    poly(g, '#6a4220', [-16, 0, -18, -15, -16, -30, 16, -30, 18, -15, 16, 0]);
    poly(g, '#8a5a2a', [-16, 0, -18, -15, -16, -30, -5, -30, -6, -15, -5, 0]);
    rect(g, '#3a3a40', -18, -26, 36, 2); rect(g, '#3a3a40', -18, -6, 36, 2);
    if (top === 'lid') { ell(g, '#9a6a34', 0, -30, 16, 4); ell(g, '#b8844a', -3, -31, 9, 2); }
    else if (top === 'open') ell(g, '#1a0e06', 0, -30, 16, 4);
    g.restore();
  }

  function guitar(g, x, y, rot, s) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    ell(g, '#2a50d0', 0, 0, 15, 11); ell(g, '#2a50d0', -11, 0, 11, 9); ell(g, '#5a7ae8', -2, -4, 8, 4); ell(g, '#e8e8f0', -4, 3, 5, 4);
    rect(g, '#1a1a22', 4, -2, 50, 4); rect(g, '#d8d8e0', 52, -3, 8, 6);
    for (let i = 0; i < 3; i++) rect(g, 'rgba(255,255,255,0.7)', -10, -1 + i, 64, 1);
    g.restore();
  }

  function scythe(g, x0, y0, x1, y1, glowA, s) {
    const k = s || 1, P2 = (dx, dy) => [x1 + dx * k, y1 + dy * k];
    line(g, '#3a3058', 3 * k, x0, y0, x1, y1);
    rect(g, '#d8b060', Math.round(x1 - 2 * k), Math.round(y1 - 1.5 * k), Math.round(4 * k), Math.round(3 * k));
    lighter(g, () => glow(g, x1 - 32 * k, y1, 34 * k, '#8a6aff', 0.4 * glowA));
    poly(g, '#6a58b0', [].concat(P2(0, 0), P2(-18, -12), P2(-44, -8), P2(-64, 8), P2(-46, 1), P2(-22, 2)));
    poly(g, '#e8e0ff', [].concat(P2(-18, -11), P2(-44, -7), P2(-64, 8), P2(-44, -3)));
    lighter(g, () => { g.strokeStyle = rgba('#c8b8ff', 0.7 * glowA); g.lineWidth = 1; g.beginPath(); g.moveTo(...P2(-18, -12)); g.lineTo(...P2(-44, -8)); g.lineTo(...P2(-64, 8)); g.stroke(); });
  }

  function snap(g, x, y, w, h, rot, inner) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, '#1a1418', -w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
    rect(g, '#f6f2e8', -w / 2, -h / 2, w, h);
    clip(g, -w / 2 + 3, -h / 2 + 3, w - 6, h - 14, () => inner(-w / 2 + 3, -h / 2 + 3, w - 6, h - 14));
    g.restore();
  }

  function cabinet(g, x, y, w, h, open) {
    rect(g, '#3a2214', x - 2, y - 2, w + 4, h + 4); rect(g, '#7a4a2a', x, y, w, h);
    const cw = w / 5, ch = h / 7;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      const out = r === 3 && c === 2 ? open : 0, dx = x + c * cw + 1 - out * 3, dy = y + r * ch + 1 + out * 2;
      rect(g, out ? '#b07a44' : '#9a6a3a', dx, dy, cw - 2 + out * 6, ch - 2);
      rect(g, '#e8c070', Math.round(dx + (cw - 2 + out * 6) / 2) - 1, Math.round(dy + ch / 2) - 1, 2, 2);
    }
  }

  function gourd(g, x, y, s) {
    lighter(g, () => glow(g, x, y, 24 * s, '#ffd070', 0.3));
    ell(g, '#b86a1a', x, y + 8 * s, 10 * s, 11 * s); ell(g, '#e8a040', x - 2 * s, y + 6 * s, 7 * s, 8 * s);
    ell(g, '#b86a1a', x, y - 6 * s, 6.5 * s, 7 * s); ell(g, '#e8a040', x - 1.5 * s, y - 7 * s, 4 * s, 4.5 * s);
    rect(g, '#d83a3a', x - 6 * s, y - 0.5 * s, 12 * s, 2 * s); rect(g, '#d83a3a', x + 2 * s, y + 1 * s, 2 * s, 7 * s);
    rect(g, '#5a3a1a', x - 1.5 * s, y - 15 * s, 3 * s, 3 * s);
  }

  function moonWindow(g, T, x, y, r) {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    vgrad(g, y - r, y + r, [[0, '#06121e'], [1, '#14303a']], x - r, r * 2);
    K.stars(g, T, 40, 21, 0.8);
    lighter(g, () => glow(g, x + r * 0.3, y - r * 0.3, r * 0.7, '#e8f8ff', 0.45));
    ell(g, '#eef8f4', x + r * 0.3, y - r * 0.3, r * 0.22, r * 0.22);
    for (let i = -3; i <= 3; i++) { rect(g, 'rgba(10,26,26,0.55)', x + i * r * 0.3, y - r, 1, r * 2); rect(g, 'rgba(10,26,26,0.55)', x - r, y + i * r * 0.3, r * 2, 1); }
    g.restore();
    ring(g, '#2a4a44', 5, x, y, r + 1); ring(g, '#c8a860', 1, x, y, r - 2);
  }

  function plum(g, T, pts, n) {
    g.strokeStyle = '#2a1a16'; g.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) { g.lineWidth = Math.max(1, 3 - i * 0.6); g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
    g.lineCap = 'butt'; g.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const s = hx(i, 3, 5) * (pts.length - 1), j = Math.floor(s), f = s - j, a = pts[j], b = pts[Math.min(pts.length - 1, j + 1)];
      A.flower(g, lerp(a[0], b[0], f) + (hx(i, 4, 5) - 0.5) * 8, lerp(a[1], b[1], f) + (hx(i, 5, 5) - 0.5) * 6, 2.5 + hx(i, 6, 5) * 1.5, T * 0.2 + i, '#f7f2ea', 0.95);
    }
  }

  function petals(g, T, n, seed, a) {
    for (let i = 0; i < n; i++) {
      const ph = (T * 0.16 + hx(i, seed, 1)) % 1, x = Math.round(hx(i, seed, 2) * LW + Math.sin(T * 1.3 + i) * 12), y = Math.round(ph * LH), al = (a || 0.9) * Math.sin(ph * Math.PI);
      const col = i % 3 ? '#fbe4ec' : '#f2b4c8', flip = Math.sin(T * 3 + i) > 0;
      rect(g, rgba(col, al), x, y, flip ? 3 : 2, 2); rect(g, rgba(col, al), x + 1, y - 1, 1, flip ? 1 : 3);
    }
  }

  function butterflies(g, T, n, cx, cy, rx, ry, scatter) {
    for (let i = 0; i < n; i++) {
      const ph = T * (0.4 + hx(i, 1, 61) * 0.5) + hx(i, 2, 61) * 6, k = 1 + (scatter || 0) * (1.5 + hx(i, 3, 61));
      A.butterfly(g, cx + Math.cos(ph * 1.3 + i) * rx * hx(i, 4, 61) * k, cy + Math.sin(ph * 1.7 + i) * ry * k, 2.5 + hx(i, 5, 61) * 3, T * 14 + i, i % 3 ? '#9a7aff' : '#d8c8ff', 0.85);
    }
  }

  function crosses(g, T, x, y, w, n, col) {
    for (let i = 0; i < n; i++) {
      const ph = (T * 0.32 + hx(i, 1, 41)) % 1, px = Math.round(x + (hx(i, 2, 41) - 0.5) * w), py = Math.round(y - ph * 170), a = Math.sin(ph * Math.PI) * 0.8;
      rect(g, rgba(col, a), px - 3, py, 7, 1); rect(g, rgba(col, a), px, py - 3, 1, 7);
    }
  }

  function confetti(g, T, x, y, n, k, fall) {
    const pal = ['#ff5a6a', '#ffd04a', '#5ad0ff', '#9aff6a', '#ff9af0'];
    for (let i = 0; i < n; i++) {
      const a = hx(i, 1, 71) * Math.PI * 2, v = 30 + hx(i, 2, 71) * 110;
      const px = fall ? hx(i, 3, 71) * LW + Math.sin(T * 2 + i) * 6 : x + Math.cos(a) * v * eOut(k);
      const py = fall ? ((T * (24 + hx(i, 4, 71) * 20) + hx(i, 5, 71) * LH) % LH) : y + Math.sin(a) * v * eOut(k) + k * k * 40;
      rect(g, pal[i % 5], Math.round(px), Math.round(py), Math.abs(Math.cos(T * 6 + i)) > 0.5 ? 3 : 1, 2);
    }
  }

  function constellation(g, pts, segs, k, col, ox, oy, s) {
    lighter(g, () => {
      segs.forEach(([a, b], i) => {
        const f = cl(k * segs.length - i);
        if (f <= 0) return;
        const p = pts[a], q = pts[b];
        line(g, rgba(col, 0.75), 1, ox + p[0] * s, oy + p[1] * s, ox + lerp(p[0], q[0], f) * s, oy + lerp(p[1], q[1], f) * s);
      });
      pts.forEach(([x, y]) => { glow(g, ox + x * s, oy + y * s, 4, col, 0.7); rect(g, '#ffffff', Math.round(ox + x * s), Math.round(oy + y * s), 1, 1); });
    });
  }

  const EXPRESS_STARS = [[0, 30], [0, 15], [9, 6], [27, 4], [35, 10], [35, 30], [41, 30], [41, 9], [79, 9], [79, 30], [8, 34], [27, 34], [50, 34], [70, 34]];
  const EXPRESS_SEGS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6], [6, 7], [7, 8], [8, 9], [9, 6], [0, 10], [10, 11], [11, 5], [6, 12], [12, 13], [13, 9]];

  function sitCase(g, x, y, lift, lit) {
    rect(g, '#1a1226', x - 22, y, 44, 14); rect(g, '#3a2a50', x - 22, y, 44, 2);
    if (lit > 0) lighter(g, () => glow(g, x, y - 50, 46, '#b07aff', 0.35 * lit));
    const gy = y - 104 - lift;
    g.strokeStyle = 'rgba(200,170,255,0.55)'; g.lineWidth = 1; g.strokeRect(x - 20.5, gy + 0.5, 41, 104);
    rect(g, 'rgba(200,170,255,0.06)', x - 20, gy, 40, 104);
    rect(g, 'rgba(255,255,255,0.25)', x - 16, gy + 4, 1, 60);
  }

  function tactical(g, T, x, y, w, h) {
    rect(g, '#0a1a2c', x - 2, y - 2, w + 4, h + 4); rect(g, '#06223a', x, y, w, h);
    clip(g, x, y, w, h, () => {
      for (let gx = x; gx < x + w; gx += 14) rect(g, 'rgba(74,162,234,0.16)', gx, y, 1, h);
      for (let gy = y; gy < y + h; gy += 14) rect(g, 'rgba(74,162,234,0.16)', x, gy, w, 1);
      g.strokeStyle = 'rgba(140,210,255,0.55)'; g.lineWidth = 1; g.beginPath();
      [[0.1, 0.7], [0.22, 0.42], [0.4, 0.3], [0.58, 0.36], [0.72, 0.22], [0.9, 0.4], [0.84, 0.74], [0.6, 0.86], [0.3, 0.84]].forEach(([u, v], i) => { const px = x + u * w, py = y + v * h; if (i) g.lineTo(px, py); else g.moveTo(px, py); });
      g.closePath(); g.stroke();
      const sy = y + ((T * 0.7) % 1) * h;
      lighter(g, () => { rect(g, 'rgba(140,210,255,0.7)', x, Math.round(sy), w, 1); rect(g, 'rgba(140,210,255,0.12)', x, Math.round(sy) - 6, w, 6); });
    });
  }

  function brackets(g, cx, cy, hw, hh, col, len) {
    for (const [x, y, sx, sy] of [[cx - hw, cy - hh, 1, 1], [cx + hw, cy - hh, -1, 1], [cx - hw, cy + hh, 1, -1], [cx + hw, cy + hh, -1, -1]]) {
      rect(g, col, Math.round(x), Math.round(y), len * sx, 1); rect(g, col, Math.round(x), Math.round(y), 1, len * sy);
    }
  }

  function wildfire(g, x, y) {
    rect(g, '#5a3a20', x - 1, y - 2, 46, 2);
    poly(g, '#a8202a', [x, y, x + 44, y, x + 44, y + 50, x + 22, y + 58, x, y + 50]);
    poly(g, '#ff9a30', [x + 22, y + 12, x + 32, y + 30, x + 26, y + 42, x + 18, y + 42, x + 12, y + 30]);
    poly(g, '#ffe070', [x + 22, y + 24, x + 26, y + 34, x + 22, y + 40, x + 18, y + 34]);
  }

  function molesFlag(g, T, x, y) {
    rect(g, '#5a4a30', x - 2, y - 4, 3, 90);
    const sway = Math.sin(T * 3) * 2;
    poly(g, '#e8b830', [x, y, x + 50, y + sway, x + 50, y + 40 + sway, x, y + 40]);
    ell(g, '#ece6d8', x + 25, y + 15 + sway / 2, 10, 6);
    ell(g, '#2a2024', x + 21, y + 14 + sway / 2, 1.6, 1.6); ell(g, '#2a2024', x + 29, y + 14 + sway / 2, 1.6, 1.6);
    ell(g, '#b08a64', x + 25, y + 27 + sway / 2, 7, 5); ell(g, '#f08aa0', x + 25, y + 25 + sway / 2, 2, 1.4);
  }

  function clipboard(g, x, y, rot, k, P) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, '#5a3a20', -26, -34, 52, 68); rect(g, '#f4eedc', -22, -28, 44, 58);
    for (let i = 0; i < 6; i++) rect(g, '#c8c0a8', -18, -10 + i * 7, 36, 1);
    rect(g, '#a8a8b4', -8, -37, 16, 6);
    ticket(g, 0, -20, { s: 1.3, std: P.std, glow: 0.4 });
    if (k > 0) {
      g.strokeStyle = '#2a3a6a'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i <= 24 * k; i++) { const px = -16 + i * 1.4, py = 4 + Math.sin(i * 1.7) * 2 + (i > 12 ? 7 : 0); if (i === 0 || i === 13) g.moveTo(px - (i > 12 ? 17 : 0), py); else g.lineTo(px - (i > 12 ? 17 : 0), py); }
      g.stroke();
    }
    g.restore();
  }

  function folder(g, x, y, w, h) {
    rect(g, '#7a5a2a', x - 1, y - 1, w + 2, h + 2); rect(g, '#d8b878', x, y, w, h);
    rect(g, '#c8a868', x + w / 2 - 1, y, 2, h);
    for (let i = 0; i < 5; i++) { rect(g, '#a89060', x + 6, y + 8 + i * 7, w / 2 - 14, 1); rect(g, '#a89060', x + w / 2 + 6, y + 8 + i * 7, w / 2 - 14, 1); }
    rect(g, '#d8b878', x + 6, y - 5, 18, 5);
  }

  function stamp(g, x, y, s, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(-0.18); g.scale(s, s);
    g.strokeStyle = '#c8202a'; g.lineWidth = 2; g.strokeRect(-20, -10, 40, 20);
    star4(g, -12, 0, 5, '#c8202a');
    rect(g, '#c8202a', -4, -4, 18, 2); rect(g, '#c8202a', -4, 2, 14, 2);
    g.restore();
  }

  function dummy(g, x, y, cut, T) {
    rect(g, '#6a4a2a', x - 2, y - 40, 4, 40);
    const k = cut > 0 ? eOut(cl(cut / 0.6)) : 0;
    poly(g, '#d8c070', [x - 9, y - 40, x + 9, y - 40, x + 7, y - 60, x - 7, y - 60]);
    g.save(); g.translate(x + k * 40, y - 60 - k * 30 + k * k * 50); g.rotate(k * 3);
    ell(g, '#e8d090', 0, -8, 8, 8); rect(g, '#a88a4a', -14, 2, 28, 3);
    g.restore();
  }

  function shards(g, T, x, y, n, r, col, a) {
    for (let i = 0; i < n; i++) {
      const q = i / n * Math.PI * 2 + T * (0.6 + hx(i, 1, 9) * 0.3), rr = r * (0.8 + hx(i, 2, 9) * 0.4);
      A.crystal(g, x + Math.cos(q) * rr, y + Math.sin(q) * rr * 0.45, 7 + hx(i, 3, 9) * 5, q + Math.PI / 2, a);
    }
  }

  function spark(g, x, y, r, col, a) { if (a > 0) lighter(g, () => { glow(g, x, y, r, col, a); ring(g, rgba('#ffffff', a), 1, x, y, r * 0.4); }); }

  function card(g, look, x, y, rot, luck, T) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot);
    rect(g, 'rgba(0,0,0,0.35)', -30, -18, 64, 42);
    rect(g, '#e8dcbc', -32, -21, 64, 42); rect(g, '#2f7438', -32, -21, 64, 7); rect(g, '#fff6e0', -29, -19, 22, 2);
    rect(g, '#2a1c10', -29, -11, 18, 18); G.drawPortrait(g, look, -28, -10, 16);
    [12, 15, 11].forEach((v, i) => { rect(g, '#b8a888', -8, -10 + i * 5, 36, 2); rect(g, '#6a8aa0', -8, -10 + i * 5, v, 2); });
    rect(g, '#b8a888', -8, 9, 36, 5);
    const lw = Math.round(luck * 150);
    if (lw > 0) { lighter(g, () => glow(g, -8 + lw, 11, 14, '#fff4b0', 0.9)); rect(g, '#d8b040', -8, 9, lw, 5); rect(g, '#fff4b0', -8, 9, lw, 1); }
    g.restore();
  }

  function camera(g, x, y, rot, s) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); g.scale(s, s);
    rect(g, '#5a3a48', -11, -7, 22, 15); rect(g, '#f3b6c9', -10, -6, 20, 13); rect(g, '#d888a8', -10, 4, 20, 3);
    ell(g, '#2a2230', 1, 0, 5, 5); ell(g, '#5a7ab0', 1, 0, 3, 3); rect(g, '#ffffff', 0, -2, 1, 1);
    rect(g, '#fff8e0', -9, -5, 4, 2); rect(g, '#d888a8', 5, -9, 5, 2);
    g.restore();
  }

  const SHOWS = {
    himeko: {
      d: 4.2, line: 'Кофе на двоих готов. Куда едем дальше?',
      sfx: [[0.2, 'steam'], [1.25, 'glint'], [1.5, 'confirm'], [2.8, 'whoosh'], [3.3, 'steam']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          vgrad(g, 0, LH, [[0, '#140a08'], [0.55, '#2a160e'], [1, '#120806']]);
          windowStars(g, T, 24, 34, 272, 100, 40, true);
          for (const x of [24, 92, 160, 228, 294]) rect(g, '#6a4420', x, 32, 3, 104);
          rect(g, '#6a4420', 24, 32, 274, 3); rect(g, '#c89a50', 24, 134, 274, 3);
          lighter(g, () => glow(g, 64, 44, 70, '#ffc070', 0.35));
          vgrad(g, 148, LH, [[0, '#5a2c16'], [1, '#1e0e08']]); rect(g, '#8a5a30', 0, 148, LW, 2);
          const pour = seg(t, 0.15, 0.95), pr = lerp(-0.2, -0.75, sm(seg(t, 0, 0.25))) + 0.4 * sm(seg(t, 0.95, 1.3));
          pot(g, 214, 108 - 20 * sm(seg(t, 0.95, 1.4)), pr);
          if (pour > 0 && pour < 1) {
            const sx = 214 + Math.cos(pr) * -27 - Math.sin(pr) * -15, sy = 108 + Math.sin(pr) * -27 + Math.cos(pr) * -15;
            line(g, '#4a2810', 2, sx, sy, 150, 160); line(g, '#7a4a28', 1, sx - 1, sy, 149, 160);
          }
          cup(g, 150, 176, 2.4);
          if (t > 0.5) steam(g, T, 150, 158, 40, 0.6);
          const p = fly(S, P, t, 0.55, 1.3, [306, 4], [184, 184], { lift: 16, s: 1.6, rot: -0.35, ease: sm });
          if (p && p.k >= 1) twinkle(g, 184, 184, 6, 1 - seg(t, 1.3, 1.5));
        } else if (t < 2.8) {
          const k = t - 1.5;
          vgrad(g, 0, LH, [[0, '#1a0c08'], [1, '#2e160c']]);
          windowStars(g, T, 0, 30, 130, 120, 40, true);
          rect(g, '#6a4420', 128, 30, 4, 122); rect(g, '#c89a50', 0, 150, 132, 3);
          lighter(g, () => glow(g, 70, 70, 130, '#ffc070', 0.3));
          S.bust(P.id, 214 + Math.round(k * 3), FLOOR + 8, 172, { v: k < 0.5 ? { closed: true } : null });
          cup(g, 64, 214, 3.2);
          ticket(g, 104, 214, { s: 2.2, rot: -0.35, std: P.std, glow: 0.6 });
          steam(g, T, 64, 186, 70, 0.7);
          lighter(g, () => glow(g, 290, 110, 60, '#ff7a3a', 0.25));
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            S.bg('parlor', T, { moving: true });
            rect(g, 'rgba(20,6,4,0.3)', 0, 0, LW, LH);
            ell(g, '#3a1a10', 104, 206, 22, 5); rect(g, '#5a3018', 102, 206, 4, 26); ell(g, '#6a3a1c', 104, 204, 22, 5);
            cup(g, 96, 203, 1); cup(g, 113, 204, 1);
            ticket(g, 104, 209, { s: 0.9, rot: 0.2, std: P.std, glow: 0.5 });
            steam(g, T, 96, 196, 26, 0.5); steam(g, T + 1.3, 113, 197, 26, 0.5);
            suitcase(g, 246, CY - 2);
            stand(g, '#ffb070');
            pose(S, P);
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    welt: {
      d: 4.2, line: 'Вельт Ян. Как самочувствие? Тогда в путь.',
      sfx: [[0.15, 'whoosh'], [0.85, 'tech'], [1.45, 'rumble'], [2.2, 'glint'], [2.8, 'warp']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.4) {
          S.bg('space', T, { drift: 30 });
          const k = eOut(seg(t, 0.1, 1.2)), x = lerp(380, 168, k), y = lerp(36, 100, k), well = seg(t, 0.7, 1.2);
          if (well > 0) {
            lighter(g, () => glow(g, 168, 100, 50, '#7a3aff', 0.4 * well));
            orbit(g, 168, 100, 26, 8, T, '#c8a0ff', 0.8 * well, 3);
            for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2 + T * 0.5, r = 40 + 6 * Math.sin(T * 2 + i); rect(g, rgba('#e8d8ff', 0.8 * well), Math.round(168 + Math.cos(q) * r), Math.round(100 + Math.sin(q) * r * 0.5), 1, 1); }
          }
          lighter(g, () => { line(g, rgba('#c8d8ff', 0.6 * (1 - k)), 2, x, y, x + 140 * (1 - k), y - 40 * (1 - k)); });
          ticket(g, x, y, { s: 1.5, spin: t * 14 * (1 - k) + 0.4, rot: 0.25 * (1 - k), std: P.std });
        } else if (t < 2.8) {
          const k = t - 1.4, bob = Math.sin(T * 2) * 2;
          vgrad(g, 0, LH, [[0, '#06040e'], [1, '#1a1030']]);
          K.stars(g, T, 80, 3, 0.7);
          lighter(g, () => glow(g, 232, 92, 70, '#7a3aff', 0.35));
          orbit(g, 232, 92 + bob, 30, 9, T, '#c8a0ff', 0.85, 3);
          for (let i = 0; i < 6; i++) { const q = T * 0.8 + i * 1.05, r = 44 + i * 4; rock(g, 232 + Math.cos(q) * r, 92 + Math.sin(q) * r * 0.4, 2 + (i % 3), T + i, '#6a6080'); }
          ticket(g, 232, 92 + bob, { s: 1.8, spin: T * 1.5, std: P.std });
          S.bust(P.id, 98, FLOOR + 10, 176);
          line(g, '#2a2226', 3, 150, 214, 214, 108);
          rect(g, '#c8a050', 212, 104, 5, 5);
          lighter(g, () => glow(g, 214, 106, 12 + 4 * Math.sin(T * 9), '#b07aff', 0.8));
          const gl = seg(k, 0.65, 0.8) * (1 - seg(k, 0.8, 1.05));
          if (gl > 0) lighter(g, () => { line(g, rgba('#ffffff', gl), 2, 98 + 2, FLOOR + 10 - 92, 98 + 14, FLOOR + 10 - 104); glow(g, 98 + 8, FLOOR + 10 - 98, 12, '#ffffff', gl * 0.6); });
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.12, 1, eOut(k / 1.3)), () => {
            S.bg('space', T, { planet: { x: 64, y: 300, r: 150, kind: 'jarilo' } });
            vignette(g, 0.5, '#100420');
            blackHole(g, 268, 66, 11, T);
            for (let i = 0; i < 7; i++) { const q = T * 0.6 + i * 0.9; if (Math.sin(q) < 0) rock(g, CX + Math.cos(q) * 74, CY - 70 + Math.sin(q) * 18, 2 + (i % 3), T + i, '#5a5070'); }
            orbit(g, CX, CY - 1, 34, 7, T, '#c8a0ff', 0.6, 3);
            stand(g, '#b07aff');
            pose(S, P);
            for (let i = 0; i < 7; i++) { const q = T * 0.6 + i * 0.9; if (Math.sin(q) >= 0) rock(g, CX + Math.cos(q) * 74, CY - 70 + Math.sin(q) * 18, 2 + (i % 3), T + i, '#8a80a0'); }
            const h = hand(P, 1), bob = Math.sin(T * 2) * 2;
            orbit(g, h.x + 14, h.y - 10 + bob, 10, 3, T, '#c8a0ff', 0.8, 2);
            ticket(g, h.x + 14, h.y - 10 + bob, { s: 1, spin: T * 1.2, std: P.std });
          });
        }
        cuts(g, t, [1.4, 2.8]);
      }
    },

    bronya: {
      d: 4.2, line: 'Броня Рэнд, Среброгривые стражи. Я с тобой.',
      sfx: [[0.1, 'step'], [0.4, 'step'], [0.7, 'step'], [1.0, 'step'], [1.5, 'whoosh'], [2.05, 'glint'], [2.8, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          S.bg('city', T, {});
          flag(g, T, 30, 46, 44, 26, ['#f2f2f6', '#3a72d8']);
          flag(g, T + 1, 262, 46, 44, 26, ['#f2f2f6', '#3a72d8']);
          for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) S.sprite('guard', 'down', 0, 34 + i * 32 + r * 16, 176 + r * 10, { tint: '#1c2640', ta: 0.55 - r * 0.15 });
          S.sprite(P.id, 'right', Math.floor(T * 7) % 4, lerp(10, 220, t / 1.5), 204);
          K.snowfall(g, T, 90, 7, { speed: 40, wind: 70, streak: true, a: 0.7 });
        } else if (t < 2.8) {
          const k = t - 1.5, c = eOut(seg(k, 0, 0.55));
          vgrad(g, 0, LH, [[0, '#5a6a88'], [1, '#c8d4e4']]);
          lighter(g, () => { for (let i = 0; i < 4; i++) { g.strokeStyle = rgba('#d8fff0', 0.35); g.lineWidth = 2; g.beginPath(); g.ellipse(150, 100 + i * 14, 120 - i * 10, 18, -0.1, T * 3 + i, T * 3 + i + 2.4); g.stroke(); } g.lineWidth = 1; });
          K.snowfall(g, T, 120, 9, { speed: 50, wind: 120, streak: true, a: 0.8 });
          S.bust(P.id, 208, FLOOR + 8, 172, { v: k > 0.5 && k < 0.8 ? { closed: true } : null });
          const x = lerp(-20, 116, c) + Math.cos(k * 14) * 24 * (1 - c), y = 98 + Math.sin(k * 14) * 16 * (1 - c);
          ticket(g, x, y + (c >= 1 ? Math.sin(T * 3) : 0), { s: 2, spin: (1 - c) * k * 16, std: P.std });
          spark(g, 116, 98, 16, '#ffffff', 1 - seg(k, 0.55, 0.8));
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            S.soft('city', T, {}, 0.12);
            flag(g, T, 34, 40, 96, 54, ['#f2f2f6', '#3a72d8', '#d8b050']);
            for (let i = 0; i < 4; i++) S.fig('guard', 248 + i * 22, 214, { k: 1, tint: '#2a3450', ta: 0.7 });
            stand(g, '#8ad8ff');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 2, h.y + 4, { s: 0.9, rot: -0.5, std: P.std, glow: 0.6 });
          });
          K.snowfall(g, T, 90, 11, { speed: 40, wind: 90, streak: true, a: 0.75 });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    gepard: {
      d: 4.2, line: 'Гепард Ландау, капитан стражи. Держись за моим щитом.',
      sfx: [[0.3, 'whoosh'], [1.42, 'shield'], [1.62, 'glint'], [1.66, 'break'], [2.8, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.4) {
          S.bg('snow', T, { wall: true, storm: true });
          S.fig(P.id, 154, 200, { k: 1, tint: '#141c2c', ta: 0.86 });
          fly(S, P, t, 0.5, 1.4, [-14, 30], [150, 120], { lift: -10, s: 1.3, ease: eIn });
        } else if (t < 2.8) {
          const k = t - 1.4, sh = eOut(seg(k, 0, 0.2)), hit = k >= 0.22, quake = hit && k < 0.4 ? (1 - (k - 0.22) / 0.18) * 2 : 0;
          g.save(); g.translate(Math.round(Math.sin(T * 60) * quake), 0);
          vgrad(g, 0, LH, [[0, '#5a6a84'], [1, '#aab8cc']]);
          K.snowfall(g, T, 160, 4, { speed: 60, wind: 90, streak: true, a: 0.7 });
          S.bust(P.id, 218, FLOOR + 8, 176);
          rect(g, rgba('#bfefff', 0.12 * sh), 54, 44, 150, 140);
          K.hexShield(g, 128, 112, 70 * sh, 0.9, T, '#9ae0ff');
          if (!hit) ticket(g, lerp(-20, 128, eIn(k / 0.22)), lerp(60, 112, eIn(k / 0.22)), { s: 1.8, spin: k * 20, std: P.std });
          else {
            const f = eOut(seg(k, 0.22, 0.6));
            for (let i = 0; i < 7; i++) A.crystal(g, 128, 112, 10 + 16 * f * (0.6 + hx(i, 1, 5) * 0.6), i / 7 * Math.PI * 2 + 0.3, 0.85);
            ticket(g, 128, 112, { s: 1.8, rot: -0.2, std: P.std });
            spark(g, 128, 112, 30, '#c8f4ff', 1 - seg(k, 0.22, 0.5));
          }
          g.restore();
        } else {
          const k = t - 2.8, rise = eOut(seg(k, 0, 0.5));
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            S.soft('snow', T, { wall: true }, 0.2);
            for (let i = 0; i < 14; i++) { const x = i * 24 - 8, h = (40 + hx(i, 1, 51) * 60) * rise; poly(g, rgba('#bfefff', 0.85), [x, FLOOR + 10, x + 12, FLOOR + 10 - h, x + 24, FLOOR + 10]); poly(g, rgba('#ffffff', 0.6), [x + 9, FLOOR + 10, x + 12, FLOOR + 10 - h, x + 14, FLOOR + 10]); }
            flag(g, T, 56, 40, 40, 70, ['#2d5bd3', '#d8b050']);
            stand(g, '#9ae0ff');
            pose(S, P);
            const h = hand(P, 1);
            rect(g, rgba('#bfefff', 0.45), Math.round(h.x + 2), Math.round(h.y - 16), 16, 12);
            ticket(g, h.x + 10, h.y - 10, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
            g.strokeStyle = 'rgba(232,250,255,0.8)'; g.strokeRect(Math.round(h.x + 2) + 0.5, Math.round(h.y - 16) + 0.5, 15, 11);
          });
          K.snowfall(g, T, 110, 13, { speed: 40, wind: 60, streak: true, a: 0.7 });
        }
        cuts(g, t, [1.4, 2.8]);
      }
    },

    clara: {
      d: 4.2, line: 'Господин Сварог разрешил. Я пойду с тобой!',
      sfx: [[0.1, 'rumble'], [0.9, 'glint'], [1.65, 'step'], [1.9, 'step'], [2.1, 'steam'], [2.45, 'glint'], [2.8, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          S.bg('rivet', T, { kind: 'factory' });
          rect(g, 'rgba(10,4,4,0.35)', 0, 0, LW, LH);
          gear(g, 40, 70, 24, T * 0.6, '#3a3a44'); gear(g, 84, 46, 14, -T * 1.1, '#4a4a54'); gear(g, 300, 60, 28, -T * 0.5, '#3a3a44');
          A.svarog(g, 240, FLOOR + 48, 1.0, T, 1);
          const sweep = Math.sin(T * 1.4) * 60;
          lighter(g, () => poly(g, 'rgba(255,46,142,0.12)', [234, 76, 246, 76, 150 + sweep + 40, FLOOR, 150 + sweep - 40, FLOOR]));
          S.fig(P.id, 112, 206, { k: 1 });
          const x = 130 + Math.sin(t * 3) * 20, y = lerp(-10, 118, t / 1.5);
          ticket(g, x, y, { s: 1.3, spin: Math.sin(T * 5) * 1.2, rot: Math.sin(t * 3) * 0.4, std: P.std });
        } else if (t < 2.8) {
          const k = t - 1.5, hop = k < 0.7 ? Math.abs(Math.sin(k * 9)) * 8 : 0;
          vgrad(g, 0, LH, [[0, '#120806'], [1, '#2a120c']]);
          gear(g, 290, 70, 40, T * 0.4, '#2a2a32');
          lighter(g, () => glow(g, 250, 160, 90, '#ff7a30', 0.3));
          S.bust(P.id, 124, FLOOR + 10 - hop, 150, { v: k > 1.0 ? { mouth: 'open' } : null });
          const take = eOut(seg(k, 0.55, 0.85)), lower = sm(seg(k, 0.95, 1.25));
          const hx0 = lerp(400, 196, take), hy0 = lerp(-60, 34, take) + lower * 70;
          const tx = take < 1 ? 160 : hx0 - 36, ty = take < 1 ? 56 + Math.sin(T * 3) * 3 : hy0 + 22;
          ticket(g, tx, ty, { s: 1.6, spin: take < 1 ? Math.sin(T * 4) * 0.8 : 0, std: P.std });
          A.svarogHand(g, hx0, hy0, 1.2);
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            S.bg('rivet', T, { kind: 'factory' });
            rect(g, 'rgba(10,4,4,0.45)', 0, 0, LW, LH);
            gear(g, 44, 60, 26, T * 0.5, '#2e2e38');
            A.svarog(g, 252, FLOOR + 100, 1.12, T, 1);
            stand(g, '#ff8a70', 20);
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x - 8, h.y - 16, { s: 0.9, rot: -0.3, std: P.std, glow: 0.7 });
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    yanqing: {
      d: 4.2, line: 'Лейтенант Яньцин! А сильные противники в пути будут?',
      sfx: [[0.35, 'swing'], [0.65, 'swing'], [0.95, 'swing'], [1.05, 'break'], [1.88, 'glint'], [2.8, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.4) {
          luofu(g, T, 150);
          vgrad(g, 150, LH, [[0, '#d8dce4'], [1, '#9aa4b4']]);
          for (let x = -40; x < LW + 40; x += 30) line(g, 'rgba(90,100,120,0.35)', 1, 160 + (x - 160) * 0.4, 150, x, LH);
          dummy(g, 230, 196, t - 1.05, T);
          const dash = x => lerp(30, 176, eOut(seg(x, 0.1, 1.0)));
          for (let i = 3; i >= 1; i--) S.fig(P.id, dash(t - i * 0.05), 204, { k: 1, tint: '#9ae8ff', ta: 1, a: 0.22 * (1 - seg(t, 0.9, 1.2)) * (4 - i) / 3 });
          S.fig(P.id, dash(t), 204, { k: 1, rot: 0.08 * (1 - seg(t, 0.9, 1.3)) });
          if (t < 0.9) K.hStreaks(g, T, 10, 7, -400, '#ffffff', 0.5, 110, 200);
          [0.35, 0.65, 0.95].forEach((at, i) => {
            if (t < at || t > at + 0.25) return;
            const a = 1 - (t - at) / 0.25, s0 = -2.4 + i * 0.9;
            lighter(g, () => { g.lineWidth = 6; g.strokeStyle = rgba('#9ae8ff', a * 0.5); g.beginPath(); g.arc(226, 160, 34, s0, s0 + 2.2); g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#ffffff', a); g.stroke(); g.lineWidth = 1; });
          });
        } else if (t < 2.8) {
          const k = t - 1.4, land = seg(k, 0.25, 0.5);
          luofu(g, T * 3, 230);
          S.bust(P.id, 82, FLOOR + 8, 164, { v: k > 0.7 ? { mouth: 'open' } : null });
          lighter(g, () => glow(g, 190, 150, 120, '#c8f0ff', 0.25));
          poly(g, '#9ab8d0', [96, 236, 264, 60, 268, 66, 104, 242]);
          poly(g, '#eaf8ff', [96, 236, 264, 60, 266, 62, 100, 238]);
          rect(g, '#d8b050', 90, 226, 16, 6);
          if (land < 1) { const p = along(k, 0.25, 0.5, 300, -10, 264, 52, 0, eIn); ticket(g, p.x, p.y, { s: 1.6, spin: k * 18, std: P.std }); }
          else ticket(g, 264, 52 + Math.sin(T * 6) * 0.5, { s: 1.6, spin: Math.sin(T * 2) * 0.3, rot: Math.sin(T * 3) * 0.08, std: P.std });
          twinkle(g, 264, 56, 8, seg(k, 0.45, 0.55) * (1 - seg(k, 0.6, 0.9)));
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            luofu(g, T, 196);
            vgrad(g, 196, LH, [[0, '#e8ecf2'], [1, '#b8c0cc']]);
            const fan = eOut(seg(k, 0, 0.6)), base = i => { const q = -2.6 + i * 0.35, r = 62 * fan; return { q, x: CX + Math.cos(q) * r, y: CY - 120 + Math.sin(q) * r * 0.9 + Math.sin(T * 2 + i) * 2 }; };
            for (let i = 0; i < 7; i++) { const b = base(i); A.sword(g, b.x, b.y, b.q, 30, fan); }
            stand(g, '#9ae8ff');
            pose(S, P);
            const b = base(3);
            ticket(g, b.x + Math.cos(b.q) * 32, b.y + Math.sin(b.q) * 32 - 3, { s: 0.9, spin: Math.sin(T * 2) * 0.3, std: P.std, a: fan });
          });
        }
        cuts(g, t, [1.4, 2.8]);
      }
    },

    bailu: {
      d: 4.2, line: 'Доктор Байлу на месте! Поранишься, сразу ко мне.',
      sfx: [[0.3, 'step'], [0.6, 'step'], [1.7, 'select'], [2.0, 'confirm'], [2.3, 'swing'], [2.85, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const terrace = (bright) => {
          luofu(g, T, 156);
          vgrad(g, 156, LH, [[0, '#c89a6a'], [1, '#7a5a3a']]);
          for (let x = 0; x < LW; x += 18) rect(g, 'rgba(60,30,10,0.25)', x, 156, 1, LH);
          rect(g, '#9a2a2a', 0, 20, LW, 10); rect(g, '#d8b050', 0, 30, LW, 2);
          for (const x of [8, 300]) { rect(g, '#b8302a', x, 30, 12, 140); rect(g, '#d84a3a', x, 30, 3, 140); rect(g, '#d8b050', x - 2, 30, 16, 3); }
          [70, 160, 250].forEach((x, i) => lantern(g, T, x, 32, i));
          if (bright) lighter(g, () => glow(g, 160, 120, 140, '#fff4d8', 0.15));
        };
        if (t < 1.4) {
          terrace(true);
          cabinet(g, 30, 80, 74, 84, sm(seg(t, 0.5, 0.8)) * (1 - sm(seg(t, 1.0, 1.3))));
          S.fig(P.id, 196, 206 - Math.abs(Math.sin(T * 6)) * 8, { k: 1, rot: Math.sin(T * 6) * 0.05 });
          fly(S, P, t, 0.6, 1.4, [330, 20], [212, 110], { lift: -20, s: 1.2, ease: sm });
        } else if (t < 2.8) {
          const k = t - 1.4, bx = 170, by = FLOOR + 10, size = 156, top = bustTop(by, size);
          terrace(false);
          const shake = k > 0.6 && k < 0.95 ? Math.sin(k * 40) * 2 : 0;
          S.bust(P.id, bx + shake, by, size, { v: k > 0.55 && k < 1.0 ? { closed: true, mouth: 'open' } : null });
          const hornX = bx - 30, hornY = top + 30;
          if (k < 0.3) { const p = along(k, 0, 0.3, 240, 20, hornX, hornY, 0, eIn); ticket(g, p.x, p.y, { s: 1.6, spin: k * 16, std: P.std }); }
          else if (k < 0.95) ticket(g, hornX + shake, hornY, { s: 1.6, rot: -0.4 + shake * 0.05, std: P.std });
          else { const p = along(k, 0.95, 1.4, hornX, hornY, 40, -20, 30, eOut); ticket(g, p.x, p.y, { s: 1.6, spin: k * 20, std: P.std }); }
          const sw = seg(k, 0.8, 1.0) * (1 - seg(k, 1.05, 1.3));
          if (sw > 0) {
            g.strokeStyle = '#5a82d0'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(330, 236); g.quadraticCurveTo(lerp(330, 210, sw), lerp(200, 120, sw), lerp(300, 160, sw), lerp(200, 50, sw)); g.stroke();
            g.lineWidth = 1; g.lineCap = 'butt';
            ell(g, '#eef2fa', lerp(300, 160, sw), lerp(200, 50, sw), 6, 4);
          }
          for (let i = 0; i < 3; i++) if (hx(i, Math.floor(T * 8), 5) > 0.5) A.bolt(g, 100 + hx(i, 1, Math.floor(T * 8)) * 140, 50, 110 + hx(i, 2, Math.floor(T * 8)) * 120, 90, Math.floor(T * 20) + i, '#7af0e0', 1);
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            terrace(true);
            for (let i = 0; i < 40; i++) { const ph = (T * 1.2 + hx(i, 1, 91)) % 1; rect(g, rgba('#9af8e8', 0.55 * Math.sin(ph * Math.PI)), Math.round(hx(i, 2, 91) * LW), Math.round(30 + ph * 190), 1, 5); }
            gourd(g, 254, 150 + Math.sin(T * 2) * 4, 1.3);
            stand(g, '#7af0e0', 20);
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 6, h.y - 4, { s: 0.8, rot: -0.4, std: P.std, glow: 0.6 });
          });
        }
        cuts(g, t, [1.4, 2.8]);
      }
    },

    ruanmei: {
      d: 4.2, line: 'Жуань Мэй. Мне любопытно, куда ведёт твой путь.',
      sfx: [[0.3, 'select'], [0.7, 'select'], [1.55, 'glint'], [2.05, 'heal'], [2.35, 'glint'], [2.8, 'star5']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          vgrad(g, 0, LH, [[0, '#06141a'], [1, '#12323a']]);
          moonWindow(g, T, 104, 104, 70);
          plum(g, T, [[0, 52], [50, 66], [96, 60], [150, 80], [184, 74]], 12);
          const k = seg(t, 0.1, 1.2), hx0 = 236, hy0 = 150;
          rect(g, '#3a2418', hx0 - 2, hy0 + 34, 4, 40);
          ell(g, '#f2ece0', hx0, hy0, 34, 34);
          g.strokeStyle = '#2fb2aa'; g.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            const q = i / 5 * Math.PI * 2 - Math.PI / 2, f = cl(k * 5 - i);
            if (f <= 0) continue;
            g.beginPath(); g.ellipse(hx0 + Math.cos(q) * 11, hy0 + Math.sin(q) * 11, 9, 6, q, 0, Math.PI * 2 * f); g.stroke();
          }
          ell(g, '#dcb75c', hx0, hy0, 4, 4);
          ring(g, '#8a5a30', 3, hx0, hy0, 34); ring(g, '#c8945a', 1, hx0, hy0, 32);
          const nq = k * Math.PI * 10, nx = hx0 + Math.cos(nq) * 14, ny = hy0 + Math.sin(nq) * 14 - 6;
          line(g, '#e8f0f0', 1, nx, ny, nx + 6, ny - 10); line(g, 'rgba(47,178,170,0.7)', 1, nx, ny, 300, 40);
          petals(g, T, 18, 3);
          fly(S, P, t, 0.7, 1.5, [104, 104], [252, 132], { lift: 30, s: 1.2, ease: sm });
        } else if (t < 2.8) {
          const k = t - 1.5;
          vgrad(g, 0, LH, [[0, '#081a20'], [0.7, '#14363c'], [1, '#0a1c20']]);
          vgrad(g, 168, LH, [[0, '#2a1a14'], [1, '#140c08']]); rect(g, '#5a3a24', 0, 168, LW, 2);
          S.bust(P.id, 238, FLOOR + 8, 164, { v: k < 0.7 ? { closed: true } : null });
          ell(g, 'rgba(200,240,240,0.25)', 124, 178, 30, 8); g.strokeStyle = 'rgba(220,250,250,0.7)'; g.beginPath(); g.ellipse(124, 178, 30, 8, 0, 0, Math.PI * 2); g.stroke();
          const settle = eOut(seg(k, 0, 0.3));
          ticket(g, 124, lerp(60, 176, settle), { s: 1.6, spin: (1 - settle) * k * 14, rot: settle * 0.05, std: P.std, glow: 0.7 });
          const grow = seg(k, 0.4, 0.8), bloom = eOut(seg(k, 0.8, 1.1));
          if (grow > 0) {
            g.strokeStyle = '#3a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(124, 174); g.quadraticCurveTo(116, 160, 124, 174 - 44 * grow); g.stroke(); g.lineWidth = 1;
            if (grow > 0.5) { ell(g, '#5a9a5a', 118, 156, 5, 2.4, -0.5); ell(g, '#5a9a5a', 130, 150, 5, 2.4, 0.5); }
          }
          if (bloom > 0) { lighter(g, () => glow(g, 124, 130, 30 * bloom, '#8adfff', 0.5)); A.flower(g, 124, 130, 9 * bloom, T * 0.3, '#f7f2ea', 1); }
          petals(g, T, 14, 5);
        } else {
          const k = t - 2.8, ring1 = eOut(seg(k, 0, 0.7));
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            vgrad(g, 0, LH, [[0, '#06141a'], [0.7, '#14363c'], [1, '#1e4a4e']]);
            moonWindow(g, T, 80, 92, 56);
            plum(g, T, [[LW, 26], [270, 40], [230, 34], [196, 50]], 8);
            lighter(g, () => { g.strokeStyle = rgba('#f2d070', 0.8 * ring1); g.lineWidth = 2; g.beginPath(); g.ellipse(CX, CY - 2, 90 * ring1 + 0.1, 16 * ring1 + 0.1, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; g.beginPath(); g.ellipse(CX, CY - 2, 70 * ring1 + 0.1, 12 * ring1 + 0.1, 0, 0, Math.PI * 2); g.stroke(); });
            for (let i = 0; i < 10; i++) { const q = i / 10 * Math.PI * 2 + T * 0.6; if (Math.sin(q) < 0) A.flower(g, CX + Math.cos(q) * 80 * ring1, CY - 2 + Math.sin(q) * 14 * ring1, 4, T + i, i % 2 ? '#f4d8e4' : '#dff8f8', 0.9 * ring1); }
            stand(g, '#8adfff');
            pose(S, P);
            for (let i = 0; i < 10; i++) { const q = i / 10 * Math.PI * 2 + T * 0.6; if (Math.sin(q) >= 0) A.flower(g, CX + Math.cos(q) * 80 * ring1, CY - 2 + Math.sin(q) * 14 * ring1, 4, T + i, i % 2 ? '#f4d8e4' : '#dff8f8', 0.9 * ring1); }
            const h = hand(P, -1), bob = Math.sin(T * 1.6) * 2;
            ell(g, 'rgba(200,240,240,0.3)', h.x - 14, h.y + bob, 10, 3);
            ticket(g, h.x - 14, h.y - 2 + bob, { s: 0.8, std: P.std, glow: 0.5 });
            A.flower(g, h.x - 14, h.y - 12 + bob, 4, T * 0.4, '#f7f2ea', 1);
            petals(g, T, 16, 7);
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    kafka: {
      d: 4.2, line: 'Кафка. Ты не запомнишь никого, кроме меня.',
      sfx: [[0.2, 'select'], [0.9, 'glint'], [1.55, 'whoosh'], [2.1, 'glint'], [2.4, 'break'], [2.8, 'star5']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          vgrad(g, 0, LH, [[0, '#0c0410'], [0.6, '#2a0a22'], [1, '#14040c']]);
          for (let i = 0; i < 16; i++) { const x = i * 21; poly(g, i % 2 ? '#4a0c1e' : '#6a1228', [x, 0, x + 21, 0, x + 25, 18 + (i % 3) * 3, x - 4, 18 + (i % 3) * 3]); }
          lighter(g, () => poly(g, rgba('#ffd8ee', 0.14), [140, 0, 180, 0, 250, FLOOR, 70, FLOOR]));
          ell(g, '#1a0612', 160, FLOOR, 90, 10);
          A.web(g, 52, 50, 46, 0.8, T * 0.1);
          const k = sm(seg(t, 0.1, 1.3)), y = lerp(-10, 120, k), sway = Math.sin(t * 5) * 14 * (1 - k);
          lighter(g, () => line(g, rgba('#f0dcff', 0.7), 1, 160, 0, 160 + sway, y - 6));
          ticket(g, 160 + sway, y, { s: 1.4, rot: Math.sin(t * 5) * 0.3 * (1 - k), std: P.std });
          for (let i = 0; i < 6; i++) { const ph = (T * 0.35 + hx(i, 2, 13)) % 1; rect(g, rgba('#ffb8e0', Math.sin(ph * Math.PI)), Math.round(40 + hx(i, 3, 13) * 240), Math.round(FLOOR - 10 - ph * 120), 2, 2); }
        } else if (t < 2.8) {
          const k = t - 1.5;
          vgrad(g, 0, LH, [[0, '#14040e'], [1, '#3a0c26']]);
          A.web(g, 84, 96, 70, 0.6, T * 0.1);
          S.bust(P.id, 112, FLOOR + 8, 168, { v: k < 0.55 ? { closed: true } : null });
          const hold = eOut(seg(k, 0, 0.4)), x = lerp(250, 222, hold), y = lerp(40, 128, hold);
          lighter(g, () => line(g, rgba('#f0dcff', 0.6), 1, 160, 0, x, y - 8));
          ticket(g, x, y, { s: 1.6, rot: 0.2 * (1 - hold), std: P.std, glow: 0.7 });
          if (k > 0.75) { for (let j = 0; j < 3; j++) A.bolt(g, x - 30 + j * 30, y - 60, x - 10 + j * 10, y - 4, Math.floor(T * 20) + j * 5, '#c07aff', 2); lighter(g, () => glow(g, x, y, 34, '#c07aff', 0.5 * (1 - seg(k, 0.75, 1.3)))); }
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            vgrad(g, 0, LH, [[0, '#0c0410'], [0.6, '#2a0a22'], [1, '#3a0c26']]);
            for (let i = 0; i < 16; i++) { const x = i * 21; poly(g, i % 2 ? '#4a0c1e' : '#6a1228', [x, 0, x + 21, 0, x + 25, 18 + (i % 3) * 3, x - 4, 18 + (i % 3) * 3]); }
            lighter(g, () => poly(g, rgba('#ffd8ee', 0.12), [CX - 20, 0, CX + 20, 0, CX + 80, CY + 4, CX - 80, CY + 4]));
            A.web(g, CX - 92, 66, 52, 0.7, T * 0.1);
            A.web(g, CX + 96, 84, 40, 0.5, -T * 0.1);
            stand(g, '#e070ff');
            pose(S, P);
            const h = hand(P, 1), bob = Math.sin(T * 1.8) * 2;
            lighter(g, () => line(g, rgba('#f0dcff', 0.6), 1, h.x + 6, h.y - 2, h.x + 14, h.y + 18 + bob));
            ticket(g, h.x + 14, h.y + 22 + bob, { s: 0.8, rot: 0.1, std: P.std, glow: 0.5 });
            for (let i = 0; i < 6; i++) { const ph = (T * 0.3 + hx(i, 4, 13)) % 1; rect(g, rgba('#ffb8e0', Math.sin(ph * Math.PI)), Math.round(CX - 120 + hx(i, 5, 13) * 240), Math.round(CY - 10 - ph * 150), 2, 2); }
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    silverwolf: {
      d: 4.2, line: 'Серебряный Волк. Не тормози, новый уровень уже грузится.',
      sfx: [[0.2, 'select'], [0.5, 'select'], [0.8, 'select'], [1.2, 'glint'], [1.55, 'whoosh'], [2.2, 'break'], [2.8, 'star5']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const grid = (y0, a) => { for (let i = -10; i <= 10; i++) line(g, rgba('#7a8aff', 0.3 * a), 1, 160 + i * 6, y0, 160 + i * 46, LH); for (let i = 0; i < 6; i++) { const k = ((i + (T * 0.8) % 1) / 6), y = y0 + (LH - y0) * k * k; line(g, rgba('#8aa0ff', (0.12 + 0.35 * k) * a), 1, 0, y, LW, y); } };
        if (t < 1.5) {
          vgrad(g, 0, LH, [[0, '#02041a'], [1, '#100c36']]);
          grid(150, 1);
          const bar = seg(t, 0.15, 1.0);
          A.hackWin(g, 90, 70, 140, 56, 'ЗАГРУЗКА ПРОПУСКА', '#7a6af0', cl(t * 4), 5, T);
          rect(g, '#0a1030', 100, 108, 120, 8); rect(g, '#50dcff', 101, 109, Math.round(118 * bar), 6);
          for (let i = 0; i < 24; i++) { const k = seg(t, 0.9 + i * 0.012, 1.2 + i * 0.012), sx = 100 + (i % 6) * 20 + hx(i, 1, 17) * 6, sy = 108 + Math.floor(i / 6) * 4; if (k > 0 && k < 1) rect(g, rgba(i % 2 ? '#7a6af0' : '#50dcff', 1), Math.round(lerp(sx, 160 + ((i % 6) - 3) * 4, eOut(k))), Math.round(lerp(sy, 150 + (Math.floor(i / 6) - 2) * 3, eOut(k))), 3, 3); }
          if (t > 1.2) ticket(g, 160, 150, { s: 1.4, spin: (1.5 - t) * 10, std: P.std });
          K.glitch(g, T, 80, 60, 160, 100, 0.3, 3);
        } else if (t < 2.8) {
          const k = t - 1.5;
          vgrad(g, 0, LH, [[0, '#04061a'], [1, '#1a1048']]);
          grid(160, 0.6);
          S.bust(P.id, 108, FLOOR + 8, 168, { v: k < 0.5 ? { closed: true } : null });
          A.hackWin(g, 196, 46, 108, 40, 'ПРОПУСК ВЗЛОМАН', '#50dcff', seg(k, 0.3, 0.5), 6, T);
          ticket(g, 250, lerp(150, 120, eOut(seg(k, 0, 0.4))), { s: 1.6, spin: k < 0.4 ? T * 10 : 0, std: P.std, glow: 0.7 });
          if (k > 0.7) K.glitch(g, T, 210, 90, 80, 60, 0.6 * (1 - seg(k, 0.7, 1.3)), 7);
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            vgrad(g, 0, LH, [[0, '#04061a'], [0.6, '#0c1640'], [1, '#1a1048']]);
            grid(150, 1);
            A.hackWin(g, CX - 140, 50 + Math.round(Math.sin(T * 0.9) * 3), 70, 36, 'ИЗМЕНИТЬ?', '#7a6af0', 1, 8, T);
            A.hackWin(g, CX + 70, 96 + Math.round(Math.sin(T * 0.8 + 2) * 3), 64, 32, 'БАГ.EXE', '#ff5a8a', 1, 9, T);
            stand(g, '#7a6af0');
            pose(S, P);
            const h = hand(P, 1), bob = Math.sin(T * 2) * 2;
            ticket(g, h.x + 12, h.y - 4 + bob, { s: 0.8, std: P.std, glow: 0.5 });
            if (Math.sin(T * 3) > 0.92) K.glitch(g, T, h.x, h.y - 14, 26, 18, 0.7, 11);
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    blade: {
      d: 4.2, line: 'Блэйд. Смерть меня отвергла. Это моё проклятие.',
      sfx: [[0.2, 'select'], [1.0, 'swing'], [1.55, 'whoosh'], [1.9, 'swing'], [2.0, 'crit'], [2.8, 'star5']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const field = (y0, n) => { for (let i = 0; i < n; i++) { const x = 10 + i * (300 / n) + hx(i, 1, 23) * 10, h = 16 + hx(i, 2, 23) * 22, r = (hx(i, 3, 23) - 0.5) * 0.4; g.save(); g.translate(x, y0 + hx(i, 4, 23) * 8); g.rotate(r); rect(g, '#4a4650', -1, -h, 2, h); rect(g, '#1a1418', -4, -h - 2, 8, 2); rect(g, '#2a2026', -1, -h - 8, 2, 6); if (i % 3 === 1) rect(g, '#c8302a', 0, -h - 6, 1, 9); g.restore(); } };
        const sky = () => { vgrad(g, 0, LH, [[0, '#0a0206'], [0.55, '#3a0a10'], [1, '#6a1414']]); lighter(g, () => glow(g, 230, 62, 60, '#ff4a32', 0.5)); ell(g, '#c8322a', 230, 62, 26, 26); ell(g, '#e04a36', 225, 57, 20, 20); };
        if (t < 1.5) {
          sky();
          poly(g, '#14060a', [0, 170, 80, 160, 200, 168, LW, 158, LW, LH, 0, LH]);
          field(176, 12);
          const k = sm(seg(t, 0.1, 1.0)), x = lerp(-20, 170, k), y = lerp(60, 128, k) - Math.sin(k * Math.PI) * 30;
          if (t < 1.0) ticket(g, x, y, { s: 1.4, spin: t * 9, std: P.std });
          else { line(g, '#4a4650', 2, 170, 176, 172, 120); rect(g, '#1a1418', 166, 118, 12, 2); ticket(g, 171, 140, { s: 1.4, rot: -0.1, std: P.std }); }
          for (let i = 0; i < 16; i++) { const ph = (T * 0.15 + hx(i, 5, 23)) % 1; rect(g, rgba(i % 3 ? '#ff7a5a' : '#ffd8c8', 0.8), Math.round((hx(i, 6, 23) * 340 - ph * 80 + 340) % 340 - 10), Math.round(ph * LH), 2, 1); }
        } else if (t < 2.8) {
          const k = t - 1.5;
          sky();
          S.bust(P.id, 120, FLOOR + 8, 168, { v: k < 0.5 ? { closed: true } : null });
          const draw = eOut(seg(k, 0.3, 0.55));
          A.crackBlade(g, lerp(330, 196, draw), lerp(40, 112, draw), 2.4, 110, 1, 0.4 + 0.6 * draw);
          ticket(g, 214, 104 + (k < 0.5 ? Math.sin(T * 6) * 3 : 0), { s: 1.6, rot: 0.6, std: P.std, glow: 0.6 });
          if (k > 0.4 && k < 0.7) flash(g, '#ffd8d0', 0.5 * (1 - seg(k, 0.4, 0.7)));
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            sky();
            poly(g, '#14060a', [0, CY - 20, 90, CY - 30, 200, CY - 24, LW, CY - 32, LW, LH, 0, LH]);
            field(CY - 16, 10);
            stand(g, '#ff4a32');
            A.crackBlade(g, CX + 34, CY - 4, -1.45, 84, 1, 0.6 + 0.3 * Math.sin(T * 3));
            ticket(g, CX + 36, CY - 60, { s: 0.8, rot: 0.3, std: P.std, glow: 0.5 });
            pose(S, P);
            for (let i = 0; i < 14; i++) { const ph = (T * 0.12 + hx(i, 7, 23)) % 1; rect(g, rgba(i % 3 ? '#ff7a5a' : '#ffd8c8', 0.8), Math.round((hx(i, 8, 23) * 340 - ph * 80 + 340) % 340 - 10), Math.round(ph * LH), 2, 1); }
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    },

    seele: {
      d: 4.2, line: 'Зеле. Не отставай, и поладим.',
      sfx: [[0.2, 'select'], [1.4, 'tech'], [1.7, 'swing'], [1.82, 'crit'], [2.2, 'glint'], [2.8, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.4) {
          S.bg('under', T, { kind: 'town' });
          rect(g, 'rgba(26,8,48,0.45)', 0, 0, LW, LH);
          butterflies(g, T, 14, 160, 110, 150, 60, 0);
          const x = lerp(10, 236, sm(t / 1.4)), y = 104 + Math.sin(t * 5) * 18;
          sparkTrail(g, dt => ({ x: lerp(10, 236, sm((t - dt) / 1.4)), y: 104 + Math.sin((t - dt) * 5) * 18 }), 8, '#d8c8ff');
          ticket(g, x, y, { s: 1.4, spin: Math.sin(T * 14) * 1.3, rot: Math.sin(t * 5) * 0.3, std: P.std });
        } else if (t < 2.8) {
          const k = t - 1.4, slash = seg(k, 0.3, 0.45);
          vgrad(g, 0, LH, [[0, '#0a0618'], [1, '#26104e']]);
          butterflies(g, T, 18, 170, 110, 150, 60, seg(k, 0.3, 0.9));
          S.bust(P.id, 108, FLOOR + 8, 168, { tint: k < 0.25 ? '#8a6aff' : null, ta: 0.7 });
          K.glitch(g, T, 50, 50, 140, 150, (1 - seg(k, 0.1, 0.4)) * 0.9, 5);
          if (slash > 0 && slash < 1) lighter(g, () => { g.lineWidth = 10; g.strokeStyle = rgba('#8a6aff', 0.6 * (1 - slash)); g.beginPath(); g.arc(200, 40, 150, 0.6, 0.6 + 1.6 * eOut(slash)); g.stroke(); g.lineWidth = 3; g.strokeStyle = rgba('#ffffff', 1 - slash); g.stroke(); g.lineWidth = 1; });
          if (k > 0.35) { scythe(g, 340, 250, 312, 60, 1, 1.4); ticket(g, 222, 70, { s: 1.6, rot: 0.5, std: P.std }); }
          else { const p = along(k, 0, 0.35, 200, 120, 222, 70, 10); ticket(g, p.x, p.y, { s: 1.6, spin: Math.sin(T * 14) * 1.2, std: P.std }); }
          twinkle(g, 222, 70, 8, seg(k, 0.75, 0.85) * (1 - seg(k, 0.85, 1.1)));
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            S.bg('under', T, { kind: 'town' });
            rect(g, 'rgba(26,8,48,0.55)', 0, 0, LW, LH);
            lighter(g, () => { g.lineWidth = 8; g.strokeStyle = rgba('#8a6aff', 0.35); g.beginPath(); g.arc(CX + 40, CY - 120, 92, 3.6, 5.6); g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#e8e0ff', 0.6); g.stroke(); g.lineWidth = 1; });
            scythe(g, CX + 22, CY - 6, CX + 68, CY - 196, 0.8);
            ticket(g, CX + 6, CY - 190, { s: 0.9, rot: 0.5, std: P.std, glow: 0.6 });
            stand(g, '#8a6aff');
            pose(S, P);
            butterflies(g, T, 10, CX, CY - 110, 90, 60, 0);
          });
        }
        cuts(g, t, [1.4, 2.8]);
      }
    },

    march: {
      d: 3.2, line: 'Я Март 7! Давай сфоткаемся на память?',
      sfx: [[0.2, 'select'], [0.6, 'select'], [0.92, 'shutter'], [1.25, 'ticket'], [2.1, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          zoom(g, 160, 100, 1.2, () => S.bg('parlor', T, { moving: true }));
          vignette(g, 0.7);
          const p = along(t, 0, 0.9, 40, 70, 196, 104, 12);
          ticket(g, p.x, p.y, { s: 1.5, spin: T * 2, rot: 0.2, std: P.std });
          const lock = seg(t, 0.55, 0.85), hw = lerp(36, 14, lock), col = lock >= 1 ? '#ffffff' : '#9affb0';
          brackets(g, p.x, p.y, hw, hw * 0.75, col, 6);
          brackets(g, 160, 120, 128, 84, '#ffffff', 16);
          if (Math.floor(T * 3) % 2) ell(g, '#ff4040', 44, 50, 3, 3);
          rect(g, '#ffffff', 52, 48, 14, 1); rect(g, '#ffffff', 52, 51, 10, 1);
          for (let i = 0; i < 4; i++) rect(g, i < 3 ? '#ffffff' : 'rgba(255,255,255,0.3)', 256 + i * 5, 48, 3, 6);
          if (t > 0.92) flash(g, '#ffffff', 1 - seg(t, 0.95, 1.1));
        } else if (t < 2.1) {
          const k = t - 1.1, up = eOut(seg(k, 0, 0.4)), dev = seg(k, 0.15, 0.7);
          vgrad(g, 0, LH, [[0, '#2a120c'], [1, '#160806']]);
          lighter(g, () => glow(g, 210, 90, 110, '#9ad8ff', 0.2));
          S.bust(P.id, 214, FLOOR + 8, 166, { v: { closed: true, mouth: 'open' } });
          snap(g, 110, lerp(280, 126, up), 64, 76, -0.12 + Math.sin(T * 3) * 0.02, (x, y, w, h) => {
            rect(g, '#06081a', x, y, w, h);
            for (let i = 0; i < 12; i++) rect(g, '#ffffff', x + Math.floor(hx(i, 1, 3) * w), y + Math.floor(hx(i, 2, 3) * h), 1, 1);
            ticket(g, x + w / 2, y + h / 2, { s: 1.4, rot: 0.2, std: P.std, glow: 0.8 });
            rect(g, rgba('#f6f2e8', 1 - dev), x, y, w, h);
          });
          shards(g, T, 214, 100, 6, 70, '#bfefff', 0.8);
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('parlor', T, { moving: true });
            rect(g, 'rgba(20,6,4,0.25)', 0, 0, LW, LH);
            for (let i = 0; i < 6; i++) {
              const ph = (T * 0.12 + hx(i, 1, 33)) % 1, x = 30 + hx(i, 2, 33) * 260, y = 30 + ph * 190;
              if (Math.abs(x - CX) < 40) continue;
              snap(g, x, y, 14, 17, Math.sin(T + i) * 0.4, (sx, sy, w, h) => { rect(g, ['#8ab0d8', '#f3b6c9', '#e8d090'][i % 3], sx, sy, w, h); });
            }
            stand(g, '#8adfff');
            pose(S, P);
            const h = hand(P, 1);
            snap(g, h.x + 6, h.y - 4, 12, 14, 0.2, (sx, sy, w, h2) => { rect(g, '#06081a', sx, sy, w, h2); rect(g, TICKET[P.std ? 'std' : 'ev'][0], sx + 2, sy + 2, w - 4, 3); });
            shards(g, T, CX, CY - 90, 5, 70, '#bfefff', 0.7);
          });
        }
        cuts(g, t, [2.1]);
      }
    },

    kazuma: {
      d: 4.8, line: 'Сато Казума, авантюрист. Это точно не Аксель…',
      sfx: [[0.05, 'whoosh'], [0.5, 'hit'], [0.8, 'select'], [1.05, 'ticket'], [1.3, 'deny'], [1.66, 'whoosh'], [2.2, 'glint'], [2.7, 'chest'], [2.9, 'deny'], [3.15, 'ticket'], [3.45, 'star4'], [3.75, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, EK = H.ExplosionKit;
        if (t < 0.6) {
          const k = eIn(seg(t, 0, 0.45)), land = seg(t, 0.45, 0.6), y = lerp(-20, 200, k);
          zoom(g, 160, 150, 1.12, () => S.bg('parlor', T, { moving: true }));
          rect(g, 'rgba(20,6,4,0.25)', 0, 0, LW, LH);
          if (k < 1) for (let i = 0; i < 6; i++) rect(g, rgba('#fff4d8', 0.5), 176 + i * 6, Math.round(y - 120 - i * 14), 1, 30);
          ell(g, rgba('#000000', 0.3 * k), 150, 202, 60 * k, 5);
          S.fig(P.id, 190, y + land * 2, { k: 2, s: 0.8, rot: lerp(0, -Math.PI * 2.5, k), v: land > 0 ? { closed: true } : null });
          if (land > 0) {
            for (let i = 0; i < 8; i++) ell(g, rgba('#d8c8a8', 0.6 * (1 - land)), 110 + i * 14 + (i - 4) * 10 * land, 198 - 8 * land * (i % 2), 6 + 4 * land, 3);
            for (let i = 0; i < 3; i++) { const a = T * 6 + i * 2.1; star4(g, 52 + Math.cos(a) * 14, 170 + Math.sin(a) * 4, 3, '#fff0b0'); }
          }
        } else if (t < 1.6) {
          const k = t - 0.6, up = eOut(seg(k, 0.1, 0.4)), wow = seg(k, 0.4, 0.55), no = seg(k, 0.68, 0.78);
          vgrad(g, 0, LH, [[0, '#2a120c'], [1, '#160806']]);
          lighter(g, () => glow(g, 160, 100, 140, '#ffc070', 0.18));
          S.bust('pompom', 74, FLOOR + 8, 120, { flip: true });
          S.bust(P.id, 238 - wow * 4, FLOOR + 8, 150, { v: no > 0 ? { mouth: 'open' } : null });
          card(g, P.look, lerp(330, 136, up), 156, -0.08 + Math.sin(T * 50) * 0.02 * wow * (1 - no), seg(k, 0.4, 0.7), T);
          EK.bubble(g, 80, 44, no > 0 ? 'Это не билет, пассажир!' : 'Ваш билет, пассажир?', 1, false);
          if (no > 0) EK.anger(g, 112, 104, 2, no);
          if (wow > 0 && no <= 0) for (let i = 0; i < 6; i++) star4(g, 110 + hx(i, 1, 71) * 170, 176 + (hx(i, 2, 71) - 0.5) * 40, 2 + 2 * Math.abs(Math.sin(T * 9 + i)), '#fff4b0');
        } else if (t < 2.6) {
          EK.beat(g, S.game, 'kazuma', 'steal', (t - 1.6) * 0.8, T);
        } else if (t < 3.6) {
          const k = t - 2.6, cam = eOut(seg(k, 0, 0.3)), mk = eOut(seg(k, 0.1, 0.35)), fall = seg(k, 0.5, 0.85);
          vgrad(g, 0, LH, [[0, '#2a120c'], [1, '#160806']]);
          windowStars(g, T, 0, 30, LW, 110, 40, true);
          rect(g, 'rgba(20,6,4,0.45)', 0, 0, LW, LH);
          S.bust('march', lerp(-60, 70, mk), FLOOR + 8, 130, { v: { mouth: 'open', blush: true }, flip: true });
          if (mk > 0.9) EK.anger(g, 104, 112, 2, 1);
          S.bust(P.id, 244, FLOOR + 8, 150, { v: { mouth: 'open' } });
          lighter(g, () => glow(g, 172, lerp(200, 150, cam), 26, '#ffffff', 0.5 * cam));
          camera(g, 172, lerp(200, 150, cam), Math.sin(T * 6) * 0.12, 1.8);
          if (mk > 0.5) EK.bubble(g, 74, 40, 'Это моя камера!', 1, false);
          const p = fly(S, P, k, 0.5, 0.85, [300, -10], [236, 70], { lift: -20, s: 1.7, rot: 0.25 });
          if (p && fall >= 1) {
            twinkle(g, 236, 70, 7, 1 - seg(k, 0.85, 1));
            g.save(); g.globalAlpha = seg(k, 0.85, 0.95); g.font = 'bold 14px Georgia, serif';
            g.fillStyle = '#1a0c06'; g.fillText('Удача!', 205, 51); g.fillStyle = '#ffe080'; g.fillText('Удача!', 204, 50);
            g.restore();
          }
        } else {
          const k = t - 3.6;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.2)), () => {
            S.bg('parlor', T, { moving: true });
            rect(g, 'rgba(20,6,4,0.3)', 0, 0, LW, LH);
            for (let i = 0; i < 12; i++) { const ph = (T * 0.5 + hx(i, 1, 72)) % 1, x = 30 + hx(i, 2, 72) * 260; if (Math.abs(x - CX) < 36) continue; ell(g, '#f2c040', x, ph * 260 - 20, 3 * Math.abs(Math.cos(T * 5 + i)) + 0.6, 3); }
            stand(g, '#9affb0');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 4, h.y - 3, { s: 1.1, rot: 0.3, std: P.std, glow: 0.6 });
          });
        }
        cuts(g, t, [0.6, 3.6]);
      }
    },

    herta: {
      d: 3.2, line: 'Ладно, малявка. Побуду с тобой, пока не надоест.',
      sfx: [[0.45, 'tech'], [0.85, 'door'], [1.3, 'glint'], [1.32, 'break'], [1.7, 'whoosh'], [2.1, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const vault = dim => {
          vgrad(g, 0, LH, [[0, '#0c0816'], [0.7, '#1e1430'], [1, '#120c1e']]);
          vgrad(g, 176, LH, [[0, '#24183a'], [1, '#0c0814']]);
          for (let i = -6; i <= 6; i++) line(g, 'rgba(160,120,220,0.18)', 1, 160 + i * 14, 176, 160 + i * 60, LH);
          lighter(g, () => glow(g, 160, 30, 110, '#b07aff', 0.2 * (1 - dim)));
        };
        if (t < 1.1) {
          vault(0);
          const lit = sm(seg(t, 0.45, 0.75)), lift = eOut(seg(t, 0.85, 1.1)) * 30;
          [76, 160, 244].forEach((x, i) => {
            const on = i === 1 ? lit : 0;
            S.fig(P.id, x, 184, { k: 1, tint: '#140c20', ta: 0.88 * (1 - on) });
            sitCase(g, x, 184, i === 1 ? lift : 0, on);
          });
          if (lit > 0) lighter(g, () => glow(g, 160, 120, 40, '#c8a0ff', 0.3 * lit));
        } else if (t < 2.1) {
          const k = t - 1.1, frz = k >= 0.2, spin = k > 0.6 && k < 0.92 && Math.floor(k * 16) % 2 === 1;
          vault(0.3);
          S.bust(P.id, 112, FLOOR + 8, 152, { flip: spin });
          if (!frz) { const p = along(k, 0, 0.2, 340, 40, 214, 100, 0, eIn); ticket(g, p.x, p.y, { s: 1.6, spin: k * 20, std: P.std }); }
          else {
            const f = eOut(seg(k, 0.2, 0.4)), bob = Math.sin(T * 2) * 2;
            ticket(g, 214, 100 + bob, { s: 1.6, rot: 0.15, std: P.std, glow: 0.4 });
            rect(g, rgba('#bfefff', 0.35 * f), 196, 86 + bob, 36, 28);
            g.strokeStyle = rgba('#e8faff', 0.8 * f); g.strokeRect(196.5, 86.5 + bob, 35, 27);
            rect(g, rgba('#ffffff', 0.6 * f), 199, 89 + bob, 1, 12);
            for (let i = 0; i < 6; i++) A.crystal(g, 214, 100 + bob, 14 + 10 * f, i / 6 * Math.PI * 2, 0.8 * f);
            spark(g, 214, 100, 26, '#c8f4ff', 1 - seg(k, 0.2, 0.45));
          }
        } else {
          const k = t - 2.1, sp = k < 0.45 && Math.floor(k * 16) % 2 === 1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            vault(0.4);
            [60, 300].forEach(x => { S.fig(P.id, x, 184, { k: 1, tint: '#140c20', ta: 0.88 }); sitCase(g, x, 184, 0, 0); });
            shards(g, T, CX, CY - 100, 7, 66, '#bfefff', 0.75);
            stand(g, '#c8a0ff');
            pose(S, P, { flip: sp });
            const h = hand(P, 1), bob = Math.sin(T * 2) * 2;
            rect(g, 'rgba(191,239,255,0.35)', Math.round(h.x + 4), Math.round(h.y - 22 + bob), 18, 14);
            ticket(g, h.x + 13, h.y - 15 + bob, { s: 0.8, rot: 0.15, std: P.std, glow: 0.4 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    asta: {
      d: 3.2, line: 'Я Аста! Покажу тебе созвездия, только попроси.',
      sfx: [[0.2, 'glint'], [0.45, 'glint'], [0.7, 'glint'], [1.25, 'ticket'], [1.55, 'star4'], [2.1, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const pts = [[40, 60], [62, 46], [90, 54], [104, 40], [126, 58]];
        if (t < 1.1) {
          S.bg('station', T, { kind: 'control' });
          lighter(g, () => {
            pts.forEach(([x, y], i) => { const on = seg(t, 0.1 + i * 0.15, 0.2 + i * 0.15); glow(g, x, y, 6, '#ffe0a0', on); if (i && on > 0) line(g, rgba('#ffe0a0', 0.7 * on), 1, pts[i - 1][0], pts[i - 1][1], lerp(pts[i - 1][0], x, on), lerp(pts[i - 1][1], y, on)); });
          });
          S.sprite(P.id, 'up', 0, 150, 198);
        } else if (t < 2.1) {
          const k = t - 1.1, head = seg(k, 0, 0.2), draw = seg(k, 0.25, 0.85);
          S.bg('space', T, {});
          constellation(g, EXPRESS_STARS, EXPRESS_SEGS, draw, '#ffe0a0', 150, 70, 1.6);
          const hx0 = 150, hy0 = 70 + 18 * 1.6;
          if (head < 1) { const p = along(k, 0, 0.2, 40, 200, hx0, hy0, 30, eOut); ticket(g, p.x, p.y, { s: 1.4, spin: k * 18, std: P.std }); sparkTrail(g, dt => along(k - dt, 0, 0.2, 40, 200, hx0, hy0, 30, eOut), 10, '#fff0c0'); }
          else { twinkle(g, hx0, hy0, 10 + Math.sin(T * 6) * 2, 1); ticket(g, hx0, hy0, { s: 0.9, std: P.std, a: 1 - seg(k, 0.2, 0.5) }); }
          S.bust(P.id, 86, FLOOR + 8, 150, { v: k > 0.3 ? { mouth: 'open' } : null });
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('station', T, { kind: 'control' });
            constellation(g, EXPRESS_STARS, EXPRESS_SEGS, 1, '#ffe0a0', 30, 40, 1.1);
            twinkle(g, 30, 40 + 18 * 1.1, 6 + Math.sin(T * 6), 1);
            for (let i = 0; i < 10; i++) { const tw = 0.5 + 0.5 * Math.sin(T * (2 + hx(i, 1, 63) * 3) + i); star4(g, Math.round(40 + hx(i, 2, 63) * 250), Math.round(40 + hx(i, 3, 63) * 120), 2, rgba('#ffecb4', tw * 0.9)); }
            stand(g, '#ffd070');
            pose(S, P);
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    arlan: {
      d: 3.2, line: 'Если что, встану впереди. Это моя работа.',
      sfx: [[0.1, 'debuff'], [0.55, 'debuff'], [1.12, 'crit'], [1.2, 'glint'], [1.6, 'buff'], [2.1, 'tech']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          S.bg('station', T, { kind: 'storage', alert: true });
          S.fig(P.id, 150, 206, { k: 1, tint: '#120808', ta: 0.88 });
          line(g, '#2a2228', 2, 166, 204, 196, 92); poly(g, '#3a3240', [196, 92, 214, 80, 206, 100]);
          fly(S, P, t, 0.5, 1.1, [340, 50], [176, 118], { s: 1.3, ease: eIn });
        } else if (t < 2.1) {
          const k = t - 1.1, calm = sm(seg(k, 0.4, 0.7)), bob = Math.sin(T * 3) * 2;
          vgrad(g, 0, LH, [[0, '#0c0a14'], [1, '#1a1626']]);
          flash(g, '#ff2030', (0.1 + 0.06 * Math.sin(T * 10)) * (1 - calm));
          lighter(g, () => glow(g, 160, 40, 140, '#4a8aff', 0.3 * calm));
          S.bust(P.id, 120, FLOOR + 8, 168);
          if (k < 0.3) for (let i = 0; i < 2; i++) A.bolt(g, 150 + i * 20, 236, 226, 96 + bob, Math.floor(T * 30) + i * 7, P.col, 2);
          lighter(g, () => ring(g, rgba('#c07aff', 0.7), 1, 226, 96 + bob, 16 + Math.sin(T * 9) * 2));
          ticket(g, 226, 96 + bob, { s: 1.7, spin: Math.sin(T * 2) * 0.4, std: P.std });
          K.sparks(g, T, 226, 96 + bob, 10, 6, '#e0b0ff', 26);
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('station', T, { kind: 'storage' });
            rect(g, 'rgba(10,20,48,0.35)', 0, 0, LW, LH);
            crate(g, 20, 168, 40, 30, '#3a4258'); crate(g, 26, 140, 30, 28, '#4a526a'); crate(g, 266, 172, 44, 26, '#3a4258');
            line(g, '#6a6a78', 3, CX + 24, CY - 4, CX + 54, CY - 196);
            poly(g, '#d8d8e4', [CX + 54, CY - 196, CX + 76, CY - 214, CX + 70, CY - 186]);
            K.sparks(g, T, CX + 60, CY - 198, 8, 6, '#e0b0ff', 22);
            stand(g, '#c07aff');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 4, h.y + 2, { s: 0.8, rot: -0.6, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    serval: {
      d: 3.2, line: 'Медиатор что надо. Ну что, зажжём?',
      sfx: [[0.3, 'door'], [1.2, 'select'], [1.52, 'strum'], [1.55, 'crit'], [2.1, 'strum']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          const on = seg(t, 0.3, 0.4);
          S.bg('workshop', T);
          rect(g, rgba('#04040a', 0.8 - on * 0.25), 0, 0, LW, LH);
          if (on > 0) lighter(g, () => poly(g, rgba('#fff0d0', 0.22 * on), [150, 0, 170, 0, 214, FLOOR, 106, FLOOR]));
          amp(g, 18, 140, 56, 70, 0); amp(g, 246, 140, 56, 70, 0);
          S.fig(P.id, 160, 206, { k: 1, tint: '#0c0a14', ta: 0.9 - on * 0.6 });
          fly(S, P, t, 0.6, 1.1, [320, 20], [170, 148], { s: 1.2, ease: sm });
        } else if (t < 2.1) {
          const k = t - 1.1, st = seg(k, 0.4, 0.5), vib = k > 0.45 ? (1 - seg(k, 0.45, 1.0)) : 0;
          vgrad(g, 0, LH, [[0, '#0a0614'], [1, '#22103a']]);
          S.bust(P.id, 92, FLOOR + 8, 160, { v: k > 0.55 ? { mouth: 'open' } : null });
          g.save(); g.translate(250, 182); g.rotate(-0.32);
          ell(g, '#2a50d0', 0, 0, 60, 44); ell(g, '#2a50d0', -44, 0, 44, 36); ell(g, '#5a7ae8', -8, -16, 30, 14); ell(g, '#e8e8f0', -16, 12, 20, 16);
          rect(g, '#1a1a22', 16, -8, 200, 16);
          for (let i = 0; i < 4; i++) { const y = -6 + i * 4; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(-40, y); for (let x = -40; x <= 210; x += 10) g.lineTo(x, y + Math.sin(x * 0.4 + T * 60) * 1.5 * vib); g.stroke(); }
          g.restore();
          const pick = k < 0.4 ? { x: 262, y: 104 + Math.sin(T * 4) * 3 } : { x: lerp(262, 234, st), y: lerp(104, 204, st) };
          ticket(g, pick.x, pick.y, { s: 1.5, rot: 0.6, std: P.std });
          if (k > 0.45) {
            const r = seg(k, 0.45, 0.9);
            lighter(g, () => { ring(g, rgba('#e0b0ff', 1 - r), 3, 236, 184, 20 + r * 150); ring(g, rgba('#ffffff', 1 - r), 1, 236, 184, 10 + r * 120); });
            if (r < 0.5) A.bolt(g, 236, 184, 120 + hx(1, Math.floor(T * 20), 3) * 190, 30, Math.floor(T * 30), P.col, 2);
          }
        } else {
          const k = t - 2.1, beat = Math.max(0, 1 - ((T * 2.2) % 1) * 3);
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('workshop', T);
            rect(g, 'rgba(6,4,14,0.6)', 0, 0, LW, LH);
            lighter(g, () => { for (let i = 0; i < 3; i++) { const x = 70 + i * 90 + Math.sin(T * 1.2 + i * 2) * 30; poly(g, rgba(['#c07aff', '#5ad0ff', '#ffd070'][i], 0.12), [x - 4, 0, x + 4, 0, x + 50, FLOOR, x - 50, FLOOR]); } });
            amp(g, 12, 132, 56, 80, beat); amp(g, 252, 132, 56, 80, beat);
            if (beat > 0.6) A.bolt(g, 40, 132, 120, 40, Math.floor(T * 8), P.col, 1);
            stand(g, '#c07aff');
            pose(S, P);
            guitar(g, CX + 4, CY - 98, -0.55, 1);
            for (let i = 0; i < 4; i++) { const ph = (T * 0.3 + i / 4) % 1, nx = Math.round(CX + 40 + Math.sin(ph * 6 + i) * 10 - i * 30), ny = Math.round(CY - 80 - ph * 120), a = Math.sin(ph * Math.PI) * 0.9; rect(g, rgba('#ffecaa', a), nx, ny, 4, 3); rect(g, rgba('#ffecaa', a), nx + 3, ny - 9, 1, 10); rect(g, rgba('#ffecaa', a), nx + 4, ny - 9, 3, 1); }
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    natasha: {
      d: 3.2, line: 'Раны оставь мне. Только не геройствуй зря.',
      sfx: [[0.2, 'step'], [0.9, 'select'], [1.25, 'text'], [1.4, 'text'], [1.55, 'text'], [1.7, 'heal'], [2.1, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          S.bg('under', T, { kind: 'clinic' });
          rect(g, 'rgba(10,6,4,0.3)', 0, 0, LW, LH);
          rect(g, '#4a2a18', 168, 176, 70, 6); rect(g, '#3a2010', 172, 182, 4, 24); rect(g, '#3a2010', 230, 182, 4, 24);
          rect(g, '#f4eedc', 186, 170, 20, 6);
          S.sprite(P.id, 'left', 0, 252, 196);
          fly(S, P, t, 0.3, 1.0, [150, 30], [196, 168], { lift: -10, s: 1.1, ease: sm });
        } else if (t < 2.1) {
          const k = t - 1.1;
          S.soft('under', T, { kind: 'clinic' }, 0.35);
          S.bust(P.id, 224, FLOOR + 8, 164, { v: k > 0.5 ? { blush: true } : null });
          clipboard(g, 104, 168, -0.1, seg(k, 0.1, 0.6), P);
          crosses(g, T, 110, 200, 160, 8, '#a0ffb8');
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('under', T, { kind: 'clinic' });
            rect(g, 'rgba(10,6,4,0.35)', 0, 0, LW, LH);
            wildfire(g, 250, 60);
            lighter(g, () => glow(g, CX, 40, 90, '#ffd890', 0.3 + 0.03 * Math.sin(T * 7)));
            crosses(g, T, CX, CY - 10, 170, 9, '#a0ffb8');
            stand(g, '#a0ffb8');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 4, h.y, { s: 0.8, rot: -0.3, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    sampo: {
      d: 3.2, line: 'Сампо Коски, к вашим услугам! Слухи, карты, консервы.',
      sfx: [[0.3, 'whoosh'], [0.78, 'steam'], [1.45, 'glint'], [1.75, 'break'], [2.1, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          S.bg('city', T, { night: true });
          crate(g, 78, 176, 40, 26, '#6a4a2a'); rect(g, '#d84a3a', 82, 170, 8, 6); rect(g, '#4a8ad8', 92, 168, 8, 8); rect(g, '#e8c060', 104, 171, 10, 5);
          if (t < 0.85) S.sprite(P.id, 'down', 0, 136, 196);
          if (t < 0.8) fly(S, P, t, 0.2, 0.8, [330, 30], [140, 160], { s: 1.2, ease: sm });
          if (t > 0.75 && t < 1.1) K.smoke(g, T, 136, 182, 7, 34, '#e8e8f0', 0.8 * (1 - seg(t, 0.9, 1.1)) + 0.01);
        } else if (t < 2.1) {
          const k = t - 1.1, pop = eOut(seg(k, 0.35, 0.5)), box = seg(k, 0.6, 1.0);
          S.soft('city', T, { night: true }, 0.35);
          S.bust(P.id, 168, FLOOR + 8, 166, { v: k > 0.3 ? { mouth: 'open' } : null });
          if (k < 0.5) K.smoke(g, T, 168, 150, 8, 60, '#e8e8f0', 0.8 * (1 - seg(k, 0, 0.5)) + 0.01);
          if (pop > 0) { ticket(g, 108, 84, { s: 1.6 * pop, rot: -0.3, std: P.std }); twinkle(g, 108, 84, 10, 1 - seg(k, 0.4, 0.7)); }
          if (box < 0.15) A.gift(g, 262, 178, 12, Math.sin(T * 12) * 0.1);
          else confetti(g, T, 262, 178, 30, box, false);
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('city', T, { night: true });
            lighter(g, () => { for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc0', 0.35); g.lineWidth = 2; g.beginPath(); g.ellipse(CX, CY - 60 - j * 30, 60 + j * 8, 10, 0, T * 3 + j, T * 3 + j + 2.6); g.stroke(); } g.lineWidth = 1; });
            A.gift(g, CX - 52, CY - 12, 10, 0.1);
            stand(g, '#7affc0');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 6, h.y - 12, { s: 0.9, rot: 0.3, std: P.std, glow: 0.6 });
            confetti(g, T, 0, 0, 24, 0, true);
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    hook: {
      d: 3.2, line: 'Хук нашла сокровище! Теперь ты тоже из «Кротов»!',
      sfx: [[0.7, 'select'], [0.82, 'step'], [0.98, 'step'], [1.12, 'break'], [1.3, 'confirm'], [2.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          S.bg('mine', T);
          rect(g, 'rgba(8,4,2,0.3)', 0, 0, LW, LH);
          const wob = (seg(t, 0.8, 0.86) * (1 - seg(t, 0.86, 0.92)) + seg(t, 0.96, 1.02) * (1 - seg(t, 1.02, 1.08))) * 0.12 * Math.sin(T * 60);
          barrel(g, 160, 206, 1.6, wob, 'lid');
          if (t < 0.7) fly(S, P, t, 0.2, 0.7, [60, 10], [160, 154], { lift: -14, s: 1.2, ease: sm, rot: 0.1 });
          else ticket(g, 160 + wob * 40, 154, { s: 1.2, rot: 0.1 + wob, std: P.std });
        } else if (t < 2.1) {
          const k = t - 1.1, rise = eOut(seg(k, 0.05, 0.35)), rim = 252 - 30 * 2.6;
          S.bg('mine', T);
          rect(g, 'rgba(8,4,2,0.4)', 0, 0, LW, LH);
          ell(g, '#1a0e06', 160, rim, 16 * 2.6, 4 * 2.6);
          clip(g, 0, 0, LW, rim, () => S.bust(P.id, 160, lerp(FLOOR + 110, FLOOR + 6, rise), 140, { v: { closed: true, mouth: 'open' } }));
          barrel(g, 160, 252, 2.6, 0, null);
          const lid = eOut(seg(k, 0, 0.5));
          g.save(); g.translate(160 + lid * 90, rim - lid * 120 + lid * lid * 60); g.rotate(lid * 6); ell(g, '#9a6a34', 0, 0, 30, 8); ell(g, '#b8844a', -5, -2, 16, 4); g.restore();
          const ty = lerp(240, 40, rise) + Math.sin(T * 6) * 2;
          ticket(g, 160, ty, { s: 1.8, rot: Math.sin(T * 5) * 0.2, std: P.std });
          if (rise > 0.6) twinkle(g, 160, ty, 12, 0.8);
          K.sparks(g, T, 160, 150, 26, 9, '#ffb050', 90);
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            S.bg('mine', T);
            rect(g, 'rgba(8,4,2,0.35)', 0, 0, LW, LH);
            molesFlag(g, T, 40, 60);
            lighter(g, () => glow(g, 280, 70, 30, '#ffb050', 0.45 + 0.05 * Math.sin(T * 8)));
            barrel(g, CX - 58, CY, 1.4, 0, 'open');
            stand(g, '#ff9a40');
            pose(S, P);
            const h = hand(P, 1), ty = h.y - 30 + Math.sin(T * 4) * 2;
            ticket(g, h.x + 4, ty, { s: 0.9, rot: 0.2, std: P.std });
            twinkle(g, h.x + 4, ty, 5, 0.5 + 0.5 * Math.sin(T * 5));
            K.embers(g, T, 30, 21, CX - 70, CX + 70, CY - 10, '#ffb050');
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    pela: {
      d: 3.2, line: 'Досье на тебя уже готово. Пела, разведка Среброгривых.',
      sfx: [[0.3, 'select'], [0.55, 'select'], [0.8, 'select'], [1.32, 'swing'], [1.58, 'hit'], [1.95, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.1) {
          vgrad(g, 0, LH, [[0, '#060c18'], [1, '#101c30']]);
          tactical(g, T, 30, 40, 260, 160);
          const p = along(t, 0, 1.05, 50, 160, 230, 70, 20);
          ticket(g, p.x, p.y, { s: 1.3, spin: T * 3, std: P.std });
          const lock = seg(t, 0.45, 0.85), hw = lerp(40, 14, lock);
          if (t > 0.4) { brackets(g, p.x, p.y, hw, hw * 0.7, '#ff6a6a', 6); for (let j = 0; j < 3; j++) rect(g, 'rgba(255,140,140,0.8)', Math.round(p.x + hw + 3), Math.round(p.y - hw * 0.7 + j * 4), Math.round(4 + hx(1, j, 3) * 12 * lock), 2); }
        } else if (t < 2.1) {
          const k = t - 1.1, slide = eOut(seg(k, 0.1, 0.3)), st = seg(k, 0.4, 0.48), thump = k > 0.48 && k < 0.6 ? 2 : 0;
          g.save(); g.translate(0, Math.round(Math.sin(T * 70) * thump));
          vgrad(g, 0, LH, [[0, '#0a1420'], [0.6, '#16243a'], [1, '#2a1e14']]);
          vgrad(g, 150, LH, [[0, '#4a3020'], [1, '#2a1a10']]); rect(g, '#6a4a30', 0, 150, LW, 2);
          lighter(g, () => glow(g, 70, 120, 90, '#ffd890', 0.3));
          S.bust(P.id, 238, FLOOR + 8, 160);
          folder(g, 30, 168, 150, 50);
          ticket(g, lerp(-20, 66, slide), lerp(140, 188, slide), { s: 1.8, rot: 0.1 * slide, std: P.std });
          if (st > 0) stamp(g, 130, lerp(120, 192, eIn(st)), lerp(1.6, 1, st), st >= 1 ? 1 : 0.7);
          const gl = seg(k, 0.75, 0.85) * (1 - seg(k, 0.85, 1.0));
          if (gl > 0) lighter(g, () => { line(g, rgba('#ffffff', gl), 2, 238 - 10, FLOOR + 8 - 86, 238 + 4, FLOOR + 8 - 98); glow(g, 238 - 3, FLOOR + 8 - 92, 12, '#ffffff', gl * 0.6); });
          g.restore();
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            vgrad(g, 0, LH, [[0, '#0a1420'], [1, '#1a2840']]);
            tactical(g, T, 14, 36, 120, 90);
            rect(g, '#2a3a52', 236, 40, 70, 80); clip(g, 240, 44, 62, 72, () => { vgrad(g, 44, 116, [[0, '#6a7890'], [1, '#c4d0de']], 240, 62); K.snowfall(g, T, 40, 17, { speed: 60, wind: 80, streak: true, a: 0.8 }); }); rect(g, '#2a3a52', 270, 40, 2, 80);
            vgrad(g, 196, LH, [[0, '#4a3020'], [1, '#2a1a10']]);
            folder(g, 20, 200, 60, 20); folder(g, 24, 194, 56, 20);
            stand(g, '#4aa2ea');
            pose(S, P);
            const h = hand(P, -1);
            rect(g, '#d8b878', Math.round(h.x - 14), Math.round(h.y - 8), 14, 18); rect(g, '#a89060', Math.round(h.x - 12), Math.round(h.y - 4), 10, 1);
            ticket(g, h.x - 7, h.y - 8, { s: 0.7, std: P.std, glow: 0.4 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    lynx: {
      d: 3.2, line: 'Рысь, экспедиционная группа. По работе в рабочие часы.',
      sfx: [[0.3, 'whoosh'], [0.85, 'step'], [1.5, 'shutter'], [1.75, 'shutter'], [2.2, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        if (t < 1.1) {
          F.snowNight(g, T, 170);
          const wob = t > 0.8 ? Math.sin(T * 40) * 0.06 * (1 - seg(t, 0.8, 1.1)) : 0;
          g.save(); g.translate(160, 196); g.rotate(wob); F.tent(g, 0, 0, 2, true); g.restore();
          K.snowfall(g, T, 30, 11, { speed: 30, wind: 30, a: 0.8 });
          if (t < 0.85) fly(S, P, t, 0.2, 0.85, [40, 20], [160, 180], { lift: -10, s: 1.2, ease: sm });
        } else if (t < 2.1) {
          const k = t - 1.1, snap = [0.4, 0.65].reduce((a, b) => Math.max(a, k > b ? 1 - seg(k, b, b + 0.12) : 0), 0);
          F.snowNight(g, T, 190);
          S.bust(P.id, 120, FLOOR + 8, 160, { v: k > 0.7 ? { mouth: 'open' } : null });
          rect(g, '#2a2a34', 200, 70, 46, 76); rect(g, '#6ad0ff', 204, 76, 38, 56);
          ticket(g, 223, 104, { s: 1.4, rot: 0.1, std: P.std });
          if (snap > 0) flash(g, '#ffffff', 0.5 * snap);
          K.snowfall(g, T, 20, 13, { speed: 20, wind: 10, a: 0.6 });
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            F.snowNight(g, T, 196);
            F.tent(g, 60, 204, 1.6, true);
            F.can(g, 270, 214, 1.6, 0.2);
            stand(g, '#8a7aff');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 4, h.y - 6, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    luka: {
      d: 3.2, line: 'Лука из «Дикого огня»! Турнир начинается? Прекрасно!',
      sfx: [[0.55, 'swing'], [0.62, 'hit'], [1.4, 'tech'], [1.7, 'crit'], [2.2, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const ring0 = () => { vgrad(g, 0, LH, [[0, '#0e0608'], [0.7, '#2a1010'], [1, '#14080a']]); lighter(g, () => poly(g, 'rgba(255,230,200,0.1)', [130, 0, 190, 0, 250, FLOOR, 70, FLOOR])); F.ropes(g, 150); };
        if (t < 1.1) {
          ring0();
          rect(g, '#3a2a20', 230, 0, 2, 120); ell(g, '#8a3a2a', 231, 140, 14, 26);
          S.sprite(P.id, 'right', Math.floor(T * 8) % 4, 150, 196);
          if (t < 0.6) fly(S, P, t, 0.1, 0.6, [330, 40], [176, 150], { s: 1.1, ease: sm });
          else { const p = along(t, 0.6, 1.1, 176, 150, 60, 30, 30, eOut); ticket(g, p.x, p.y, { s: 1.1, spin: t * 20, std: P.std }); }
        } else if (t < 2.1) {
          const k = t - 1.1, heat = seg(k, 0.25, 0.55);
          ring0();
          S.bust(P.id, 120, FLOOR + 8, 164, { v: k > 0.55 ? { mouth: 'open' } : null });
          F.gauntlet(g, 230, 120, 2.2, -0.3, heat);
          ticket(g, 252, 112, { s: 1.4, rot: -0.3, std: P.std, a: seg(k, 0.5, 0.7) });
          if (k > 0.6 && k < 0.8) flash(g, '#ffd8b0', 0.4 * (1 - seg(k, 0.6, 0.8)));
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            ring0();
            stand(g, '#ff8a6a');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 6, h.y - 10, { s: 0.9, rot: 0.3, std: P.std, glow: 0.6 });
            K.sparks(g, T, CX, CY - 80, 14, 5, '#ffb060', 80);
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    sushang: {
      d: 3.2, line: 'Облачный Рыцарь Сушан! Понадобится помощь, обращайся!',
      sfx: [[0.3, 'step'], [0.5, 'step'], [0.7, 'step'], [1.45, 'swing'], [1.6, 'glint'], [2.2, 'ult']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        if (t < 1.1) {
          luofu(g, T, 156);
          vgrad(g, 156, LH, [[0, '#c8a888'], [1, '#8a6a4a']]);
          const x = lerp(20, 190, sm(seg(t, 0.1, 1.0)));
          S.sprite(P.id, 'right', Math.floor(T * 10) % 4, x, 200);
          const p = along(t, 0, 1.0, 60, 120, 260, 70, 30, sm);
          ticket(g, p.x, p.y + Math.sin(T * 8) * 6, { s: 1.1, spin: T * 6, std: P.std });
        } else if (t < 2.1) {
          const k = t - 1.1, cut = seg(k, 0.3, 0.5);
          luofu(g, T, 200);
          S.bust(P.id, 196, FLOOR + 8, 164, { v: k > 0.5 ? { mouth: 'open' } : null });
          if (cut > 0 && cut < 1) lighter(g, () => { g.lineWidth = 6; g.strokeStyle = rgba('#ffd890', 1 - cut); g.beginPath(); g.arc(120, 120, 80, -2.4, lerp(-2.4, 0.4, eOut(cut))); g.stroke(); g.lineWidth = 1; });
          const ty = k < 0.5 ? lerp(20, 100, seg(k, 0, 0.45)) : 100 + Math.sin(T * 5) * 2;
          ticket(g, 90, ty, { s: 1.6, rot: k > 0.5 ? 0 : k * 6, std: P.std });
          if (k > 0.5) twinkle(g, 90, 100, 10, 1 - seg(k, 0.5, 0.8));
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            luofu(g, T, 196);
            vgrad(g, 196, LH, [[0, '#c8a888'], [1, '#8a6a4a']]);
            F.phoenix(g, CX, CY - 120, 0.8, 0.4 + 0.1 * Math.sin(T * 3), T);
            stand(g, '#ffb070');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 6, h.y - 6, { s: 0.8, rot: -0.3, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    xueyi: {
      d: 3.2, line: 'Судья Сюэи. За каждого пойманного мне дают полдня жизни.',
      sfx: [[0.4, 'whoosh'], [0.75, 'debuff'], [1.5, 'tech'], [2.2, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const hall = () => { vgrad(g, 0, LH, [[0, '#06040a'], [1, '#1a0e1e']]); for (let i = 0; i < 6; i++) { rect(g, '#120a16', 10 + i * 56, 0, 14, 200); rect(g, '#2a1a2e', 10 + i * 56, 0, 2, 200); } rect(g, '#1a1020', 0, 196, LW, 44); };
        if (t < 1.1) {
          hall();
          const p = along(t, 0, 0.75, 330, 40, 200, 110, 10, sm);
          if (t < 0.75) ticket(g, p.x, p.y, { s: 1.2, spin: T * 8, std: P.std });
          else { const k = seg(t, 0.75, 1.1); F.chain(g, 60, 190, 200, 110, 1, '#d8d0f0'); ticket(g, lerp(200, 80, k), lerp(110, 180, k), { s: 1.2, rot: 0.3, std: P.std }); }
          if (t > 0.4 && t < 0.75) F.chain(g, 60, 190, 200, 110, seg(t, 0.4, 0.75), '#d8d0f0');
          S.sprite(P.id, 'right', 0, 60, 200);
        } else if (t < 2.1) {
          const k = t - 1.1;
          hall();
          F.coffin(g, 250, 220, 80, 80);
          S.bust(P.id, 130, FLOOR + 8, 164);
          lighter(g, () => glow(g, 130, 90, 60, '#8a7aff', 0.2 + 0.15 * seg(k, 0.3, 0.6)));
          ticket(g, 220, 110, { s: 1.5, rot: 0.2, std: P.std, a: seg(k, 0.2, 0.4) });
          F.chain(g, 160, 150, 216, 112, seg(k, 0.2, 0.4), '#d8d0f0');
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            hall();
            F.coffin(g, 60, 220, 70, 70);
            F.lanternR(g, 270, 50, 1.2, T, 0, false);
            lighter(g, () => glow(g, 270, 58, 14, '#8affd0', 0.4));
            stand(g, '#8a7aff');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 4, h.y - 4, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    tingyun: {
      d: 3.2, line: 'Тинъюнь, «Свистящее пламя». Сделку считаю заключённой!',
      sfx: [[0.3, 'select'], [0.6, 'select'], [0.9, 'confirm'], [1.5, 'whoosh'], [2.2, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const shop = () => { F.xianzhou(g, T, 140, ['#f2c8a0', '#f8e4c8', '#e0e8d0']); vgrad(g, 140, LH, [[0, '#b89a7a'], [1, '#7a5a3a']]); F.counter(g, 0, 176, LW); F.lanternR(g, 40, 70, 1.1, T, 0, true); F.lanternR(g, 280, 70, 1.1, T, 1, true); };
        if (t < 1.1) {
          shop();
          const tip = cl(seg(t, 0.5, 1.0)) * 0.25;
          g.save(); g.translate(160, 140); rect(g, '#d8b050', -1, -30, 2, 30); g.rotate(-tip); rect(g, '#d8b050', -40, -32, 80, 2); g.restore();
          ell(g, '#d8b050', 160 - 40 * Math.cos(tip), 150 - 30 - 40 * Math.sin(-tip) + 8, 14, 3); ell(g, '#d8b050', 160 + 40 * Math.cos(tip), 150 - 30 + 40 * Math.sin(-tip) + 8, 14, 3);
          for (let i = 0; i < 4; i++) ell(g, '#e8c050', 116 + i * 3, 116 - 40 * Math.sin(-tip) - i * 2, 4, 2);
          if (t < 0.5) fly(S, P, t, 0.05, 0.5, [330, 10], [200, 120 + 40 * Math.sin(-tip)], { s: 1.1, ease: sm });
          else ticket(g, 200, 118 + 40 * Math.sin(-tip), { s: 1.1, std: P.std });
        } else if (t < 2.1) {
          const k = t - 1.1, wave = Math.sin(seg(k, 0.3, 0.7) * Math.PI);
          shop();
          S.bust(P.id, 120, FLOOR + 8, 164, { v: k > 0.6 ? { closed: true } : null });
          F.fan(g, 206, 120, 34, -2.4 + wave * 0.6, -0.6 + wave * 0.6, '#e8d8a8', '#d8b050');
          const p = along(k, 0.3, 0.8, 300, 60, 216, 92, 20, eOut);
          ticket(g, p.x, p.y, { s: 1.4, rot: 0.2, std: P.std });
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            shop();
            stand(g, '#c07aff');
            pose(S, P);
            const h = hand(P, 1);
            F.fan(g, h.x + 6, h.y - 10, 16, -2.4, -0.8, '#e8d8a8', '#d8b050');
            ticket(g, h.x + 8, h.y - 22, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    hanya: {
      d: 3.2, line: 'Ханья, судья десяти владык. Твоё имя уже записано.',
      sfx: [[0.3, 'select'], [0.6, 'select'], [1.55, 'confirm'], [2.2, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const hall = () => { vgrad(g, 0, LH, [[0, '#0e0a10'], [1, '#2a1a1e']]); for (let i = 0; i < 8; i++) rect(g, '#1a1216', i * 42, 0, 4, 190); rect(g, '#2a1a1e', 0, 190, LW, 50); };
        if (t < 1.1) {
          hall();
          rect(g, '#efe6d0', 70, 40, 180, 150);
          F.brush(g, [80, 60, 120, 64, 160, 58, 200, 66, 240, 60, 84, 90, 130, 94, 180, 88, 230, 96], seg(t, 0.1, 0.9), '#1a1418', 3);
          if (t < 0.9) fly(S, P, t, 0.4, 0.9, [330, 0], [200, 150], { s: 1.2, ease: sm });
          else ticket(g, 200, 150, { s: 1.2, std: P.std });
        } else if (t < 2.1) {
          const k = t - 1.1, st = eOut(seg(k, 0.4, 0.55));
          hall();
          S.bust(P.id, 110, FLOOR + 8, 164);
          ticket(g, 230, 120, { s: 2.2, rot: 0.05, std: P.std });
          F.stamp(g, 230, 120, lerp(2.4, 1, st), 'ЗАПИСАН', st, '#d83a3a');
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            hall();
            rect(g, '#efe6d0', 14, 60, 80, 110);
            F.brush(g, [24, 76, 60, 80, 84, 74, 50, 110, 30, 130, 80, 140], 1, '#1a1418', 3);
            F.coffin(g, 280, 210, 60, 50);
            stand(g, '#e8d0a0');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 6, h.y - 4, { s: 0.8, rot: -0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    qingque: {
      d: 3.2, line: 'Цинцюэ, Комиссия по предсказаниям. Сыграем в обед?',
      sfx: [[0.2, 'select'], [0.4, 'select'], [0.6, 'select'], [0.8, 'select'], [1.6, 'star4'], [2.2, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const table = () => { vgrad(g, 0, LH, [[0, '#14100a'], [1, '#2a2214']]); rect(g, '#2a6a3a', 0, 160, LW, 50); rect(g, '#1a4a28', 0, 160, LW, 4); rect(g, '#3a2a1a', 0, 210, LW, 30); };
        if (t < 1.1) {
          table();
          for (let i = 0; i < 4; i++) { const k = eOut(seg(t, 0.15 + i * 0.2, 0.3 + i * 0.2)); F.tile(g, lerp(160, 100 + i * 34, k), lerp(-20, 180, k), 1.8, i < 3 ? 1 : 2, (1 - k) * 5, k); }
          if (t > 0.9) ticket(g, 202, 170, { s: 1.2, rot: -0.1, std: P.std, a: seg(t, 0.9, 1.0) });
        } else if (t < 2.1) {
          const k = t - 1.1, wake = k > 0.45;
          table();
          S.bust(P.id, 120, FLOOR + 8, 164, { v: wake ? { mouth: 'open' } : { closed: true } });
          for (let i = 0; i < 3; i++) F.tile(g, 196 + i * 26, 160, 2, 1, 0);
          ticket(g, 274, 160, { s: 1.5, rot: 0, std: P.std });
          if (wake) twinkle(g, 274, 160, 12, 1 - seg(k, 0.45, 0.8));
          if (!wake) { g.save(); g.font = 'bold 12px Georgia, serif'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText('z', 160 + Math.sin(T * 3) * 3, 70 - (T * 20) % 20); g.restore(); }
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            table();
            for (let i = 0; i < 5; i++) F.tile(g, CX + Math.cos(T + i * 1.26) * 70, CY - 110 + Math.sin(T + i * 1.26) * 20, 1.2, i, Math.sin(T + i) * 0.3);
            stand(g, '#8a7aff');
            pose(S, P);
            const h = hand(P, 1);
            ticket(g, h.x + 6, h.y - 6, { s: 0.8, rot: 0.3, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    yukong: {
      d: 3.2, line: 'Юйкун, Комиссия по полётам. Добро пожаловать на Лофу.',
      sfx: [[0.3, 'whoosh'], [1.4, 'swing'], [1.7, 'glint'], [2.2, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const sky = () => { vgrad(g, 0, LH, [[0, '#4a6aa8'], [0.6, '#a8c4e8'], [1, '#e8d8b0']]); for (let i = 0; i < 5; i++) ell(g, 'rgba(255,255,255,0.45)', ((i * 80 + T * 10) % 400) - 40, 70 + (i % 2) * 20, 40, 9); };
        if (t < 1.1) {
          sky();
          const kx = lerp(80, 220, sm(seg(t, 0, 1.1))), ky = 80 + Math.sin(T * 2) * 6;
          F.kite(g, kx, ky, 2, '#d84a3a', T, 0);
          ticket(g, kx, ky + 50, { s: 1.1, rot: Math.sin(T * 4) * 0.3, std: P.std });
          g.strokeStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(kx, ky + 24); g.lineTo(40, LH); g.stroke();
        } else if (t < 2.1) {
          const k = t - 1.1, pull = sm(seg(k, 0.25, 0.7));
          sky();
          S.bust(P.id, 110, FLOOR + 8, 164);
          const kx = lerp(260, 200, pull), ky = lerp(50, 110, pull);
          F.kite(g, kx, ky, 2, '#d84a3a', T, 0);
          ticket(g, kx, ky + 50, { s: 1.4, rot: 0.1, std: P.std });
          g.strokeStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(kx, ky + 24); g.lineTo(150, 170); g.stroke();
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            sky();
            rect(g, '#6a4a2a', 0, 190, LW, 50); rect(g, '#8a6a3a', 0, 190, LW, 3);
            for (let i = 0; i < 4; i++) F.kite(g, 40 + i * 76, 50 + (i % 2) * 20 + Math.sin(T + i) * 4, 1, i % 2 ? '#e8b040' : '#d84a3a', T, i);
            stand(g, '#ffd850');
            pose(S, P);
            const h = hand(P, -1);
            ticket(g, h.x - 6, h.y - 6, { s: 0.8, rot: -0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    },

    guinaifen: {
      d: 3.2, line: 'Малышка Гуй в эфире! Понравилось? Подписывайтесь!',
      sfx: [[0.25, 'whoosh'], [0.5, 'whoosh'], [0.75, 'whoosh'], [1.4, 'msg_in'], [1.6, 'msg_in'], [2.2, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, F = H.FoursScenes;
        const alley = () => { vgrad(g, 0, LH, [[0, '#1a0a14'], [0.6, '#3a1418'], [1, '#2a1a14']]); for (let i = 0; i < 9; i++) F.lanternR(g, 18 + i * 36, 18, 1, T, i, true); rect(g, '#4a3024', 0, 196, LW, 44); };
        if (t < 1.1) {
          alley();
          S.sprite(P.id, 'down', 0, 160, 204);
          for (let i = 0; i < 4; i++) {
            const ph = (T * 1.4 + i / 4) % 1, x = 160 + Math.cos(ph * Math.PI * 2) * 22, y = 150 - Math.abs(Math.sin(ph * Math.PI * 2)) * 40;
            if (i === 3 && t > 0.3) ticket(g, x, y, { s: 0.9, spin: T * 6, std: P.std }); else ell(g, ['#ff6a3a', '#ffd040', '#5ac0ff'][i % 3], x, y, 4, 4);
          }
        } else if (t < 2.1) {
          const k = t - 1.1;
          alley();
          S.bust(P.id, 150, FLOOR + 8, 164, { v: { mouth: 'open' } });
          rect(g, 'rgba(0,0,0,0.5)', 8, 40, 92, 70);
          g.save(); g.font = 'bold 8px Arial, sans-serif';
          g.fillStyle = '#ff3a3a'; g.fillText('● ЭФИР', 12, 52);
          const chat = ['+1', 'Малышка Гуй!', 'донат: 50 стрел', 'ещё фокус!'];
          chat.slice(0, 1 + Math.floor(seg(k, 0.1, 0.8) * 3.99)).forEach((m, i) => { g.fillStyle = '#f2ece0'; g.fillText(m, 12, 66 + i * 11); });
          g.restore();
          ticket(g, 250, 100, { s: 1.5, rot: 0.2, std: P.std });
          F.hoop(g, 250, 100, 26, T * 2, 0.8);
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            alley();
            F.firework(g, 60, 60, (T * 0.6) % 1, '#ffd040', 1);
            F.firework(g, 270, 50, (T * 0.6 + 0.5) % 1, '#ff6a3a', 2);
            stand(g, '#ff7a3a');
            pose(S, P);
            const h = hand(P, 1);
            F.hoop(g, h.x + 6, h.y - 20, 14, T * 2, 0.8);
            ticket(g, h.x + 6, h.y - 20, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    }
  };

  const GENERIC = {
    d: 2.6, line: '', sfx: [[0.3, 'glint']],
    act(S, P) {
      const g = S.g;
      vgrad(g, 0, LH, [[0, '#04060e'], [1, '#121a34']]);
      K.stars(g, S.T, 80, 5, 0.8);
      lighter(g, () => poly(g, 'rgba(255,240,208,0.12)', [CX - 10, 0, CX + 10, 0, CX + 60, CY, CX - 60, CY]));
      stand(g, P.col);
      pose(S, P, { a: sm(S.t / 0.6) });
    }
  };

  const SHAPES = {};
  function shapes(path) {
    if (SHAPES[path]) return SHAPES[path];
    const out = [];
    const add = (pts, every) => {
      let len = 0;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); }
      out.push({ pts, len, every });
    };
    const rec = {
      poly(c, p) { const pts = []; for (let i = 0; i < p.length; i += 2) pts.push([p[i], p[i + 1]]); add(pts, 1); },
      ell(c, x, y, rx, ry) { const pts = []; for (let i = 0; i < 24; i++) { const q = -Math.PI / 2 + i / 24 * Math.PI * 2; pts.push([x + Math.cos(q) * rx, y + Math.sin(q) * ry]); } add(pts, 6); },
      rect(c, x, y, w, h) { add([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 1); }
    };
    if (G.PATH_ART[path]) G.PATH_ART[path](rec, '#ffffff');
    return (SHAPES[path] = out);
  }

  function trace(g, path, cx, cy, size, k, col, a) {
    const s = size / 16, ox = cx - size / 2, oy = cy - size / 2;
    lighter(g, () => {
      for (const sh of shapes(path)) {
        let left = sh.len * k;
        const n = sh.pts.length, line = [], nodes = [];
        for (let i = 0; i < n && left > 0; i++) {
          const p = sh.pts[i], q = sh.pts[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, f = Math.min(1, left / L);
          if (i === 0) line.push([ox + p[0] * s, oy + p[1] * s]);
          line.push([ox + lerp(p[0], q[0], f) * s, oy + lerp(p[1], q[1], f) * s]);
          if (i % sh.every === 0) nodes.push(line[line.length - 2]);
          left -= L;
        }
        if (line.length < 2) continue;
        for (const [w, al] of [[3, 0.25], [1, 0.9]]) {
          g.strokeStyle = rgba(col, al * a); g.lineWidth = w; g.beginPath(); g.moveTo(line[0][0], line[0][1]);
          for (let i = 1; i < line.length; i++) g.lineTo(line[i][0], line[i][1]);
          g.stroke();
        }
        g.lineWidth = 1;
        for (const [x, y] of nodes) star4(g, Math.round(x), Math.round(y), 2.5, rgba('#ffffff', 0.8 * a));
        const head = line[line.length - 1];
        if (k < 1) { glow(g, head[0], head[1], 7, '#ffffff', 0.9 * a); rect(g, '#ffffff', Math.round(head[0]), Math.round(head[1]), 1, 1); }
      }
    });
  }

  const EMBLEMS = new Map();
  function emblem(g, path, cx, cy, size, col, a, sc) {
    if (a <= 0 || sc <= 0) return;
    const key = path + '|' + size + '|' + col;
    let cv = EMBLEMS.get(key);
    if (!cv) { cv = G.mkCanvas(size, size); G.pathIcon(cv.getContext('2d'), path, 0, 0, size, col); EMBLEMS.set(key, cv); }
    const w = size * sc;
    g.save(); g.globalAlpha *= cl(a);
    g.drawImage(cv, Math.round(cx - w / 2), Math.round(cy - w / 2), Math.round(w), Math.round(w));
    g.restore();
  }

  function bricks(g, t, o) {
    const bw = 34, bh = 13;
    for (let r = 0; r < 10; r++) {
      const y = LH - 14 - r * (bh + 2), on = sm(seg(t, 0.04 + r * 0.05, 0.24 + r * 0.05));
      if (on <= 0) continue;
      for (let c = -1; c < 11; c++) {
        const x0 = c * (bw + 2) + (r % 2) * 18, mid = x0 + bw / 2 < MX, x = x0 + (mid ? -1 : 1) * eIn(o) * 200;
        g.strokeStyle = rgba('#ffb040', 0.35 * on); g.lineWidth = 1; g.strokeRect(Math.round(x) + 0.5, y + 0.5, bw, bh);
        rect(g, rgba('#ff9a30', 0.07 * on), Math.round(x) + 1, y + 1, bw - 1, bh - 1);
      }
    }
  }

  const PATH_FX = {
    destruction: {
      hue: '#ff6a2a', flash: '#ffd8b0', sfx: 'break',
      bg(g, S, t) {
        const k = eOut(seg(t, 0.1, 0.9));
        lighter(g, () => {
          for (let i = 0; i < 7; i++) {
            const a0 = i / 7 * Math.PI * 2 + 0.3;
            g.strokeStyle = rgba('#ff7a3a', 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(MX, MY);
            for (let j = 1; j <= 6; j++) { const r = j / 6 * 190 * k, a = a0 + (hx(i, j, 5) - 0.5) * 0.5; g.lineTo(MX + Math.cos(a) * r, MY + Math.sin(a) * r * 0.8); }
            g.stroke();
          }
          glow(g, MX, MY, 150, '#ff3a10', 0.12);
        });
        K.embers(g, S.T, 50, 3, 0, LW, LH, '#ff9a40');
      },
      em: o => [1 + o * 0.15, 1 - sm(seg(o, 0.2, 0.5))],
      out(g, S, t, o) {
        if (o <= 0) return;
        lighter(g, () => { for (let i = 0; i < 6; i++) { const a = hx(i, 1, 9) * Math.PI * 2, r = 70 * eOut(cl(o * 2.5)); line(g, rgba('#ffffff', 1 - o), 2, MX, MY, MX + Math.cos(a) * r, MY + Math.sin(a) * r); } });
        K.shards(g, o, MX, MY, 28, 4, '#ffb070', 220, '#ffffff');
        flash(g, this.flash, sm(seg(o, 0.55, 1)));
      }
    },
    preservation: {
      hue: '#ffb040', flash: '#ffe8b8', sfx: 'shield',
      bg(g, S, t, o) { bricks(g, t, o); if (o > 0) lighter(g, () => { rect(g, rgba('#fff0c8', 0.8 * o), MX - 200 * eIn(o), 0, 400 * eIn(o), LH); glow(g, MX, MY, 160, '#ffd070', 0.6 * o); }); },
      em: o => [1, 1 - sm(seg(o, 0.2, 0.6))],
      out(g, S, t, o) { flash(g, this.flash, sm(seg(o, 0.6, 1))); }
    },
    hunt: {
      hue: '#5ad8ff', flash: '#e8fbff', sfx: 'swing',
      bg(g, S) {
        K.hStreaks(g, S.T, 44, 11, 520, '#a8ecff', 0.5, 4, LH - 4);
        for (let i = 0; i < 3; i++) ring(g, rgba('#7ae0ff', 0.16 + 0.08 * Math.sin(S.T * 4 + i)), 1, MX, MY, 66 + i * 24);
      },
      em: o => [1, 1 - sm(seg(o, 0.2, 0.45))],
      out(g, S, t, o) {
        if (o <= 0) return;
        const k = eOut(seg(o, 0, 0.35)), x0 = -40, y0 = MY + 60, x1 = 360, y1 = MY - 60, ax = lerp(x0, x1, k), ay = lerp(y0, y1, k), ang = Math.atan2(y1 - y0, x1 - x0);
        lighter(g, () => { line(g, rgba('#7ae0ff', 0.6), 6, x0, y0, ax, ay); line(g, '#ffffff', 2, x0, y0, ax, ay); });
        poly(g, '#ffffff', [ax + Math.cos(ang) * 10, ay + Math.sin(ang) * 10, ax + Math.cos(ang + 2.5) * 8, ay + Math.sin(ang + 2.5) * 8, ax + Math.cos(ang - 2.5) * 8, ay + Math.sin(ang - 2.5) * 8]);
        flash(g, this.flash, sm(seg(o, 0.5, 1)));
      }
    },
    erudition: {
      hue: '#7a9aff', flash: '#e8eeff', sfx: 'tech',
      bg(g, S) {
        for (let x = 8; x < LW; x += 16) for (let y = 8; y < LH; y += 16) rect(g, 'rgba(154,184,255,0.14)', x, y, 1, 1);
        lighter(g, () => {
          for (let i = 0; i < 3; i++) { g.save(); g.translate(MX, MY); g.rotate(S.T * 0.3 * (i % 2 ? -1 : 1) + i); g.strokeStyle = rgba('#9ab8ff', 0.28); g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 92 + i * 26, 26 + i * 9, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
          for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2 + S.T * 0.4, r1 = i % 3 ? 62 : 67; line(g, rgba('#c8d8ff', 0.4), 1, MX + Math.cos(a) * 58, MY + Math.sin(a) * 58, MX + Math.cos(a) * r1, MY + Math.sin(a) * r1); }
        });
      },
      em: o => [1 + o * 0.3, 1 - sm(seg(o, 0.3, 0.6))],
      out(g, S, t, o) {
        if (o <= 0) return;
        const r = 58 + eIn(o) * 280;
        lighter(g, () => { ring(g, rgba('#ffffff', 0.9), 3, MX, MY, r); glow(g, MX, MY, r, '#c8d8ff', 0.6 * o); });
        flash(g, this.flash, sm(seg(o, 0.55, 1)));
      }
    },
    harmony: {
      hue: '#ff9ad8', flash: '#fff0f8', sfx: 'buff',
      bg(g, S) {
        lighter(g, () => { for (let i = 0; i < 5; i++) { const ph = (S.T * 0.55 + i / 5) % 1; ring(g, rgba('#ffd0f0', 0.35 * (1 - ph)), 1, MX, MY, 40 + ph * 180); } });
        for (let i = 0; i < 24; i++) { const ph = (S.T * 0.2 + hx(i, 1, 29)) % 1; rect(g, rgba('#ffe8f8', 0.7 * Math.sin(ph * Math.PI)), Math.round(hx(i, 2, 29) * LW), Math.round(LH - ph * LH), 1, 1); }
      },
      em: o => [1 + 0.08 * Math.sin(o * 30) * (1 - o), 1 - sm(seg(o, 0.35, 0.65))],
      out(g, S, t, o) {
        lighter(g, () => { for (let i = 0; i < 3; i++) { const k = eOut(seg(o, i * 0.12, 0.5 + i * 0.12)); if (k > 0 && k < 1) ring(g, rgba('#ffe8f8', 1 - k), 3, MX, MY, 30 + k * 260); } });
        flash(g, this.flash, sm(seg(o, 0.55, 1)));
      }
    },
    nihility: {
      hue: '#8a6ab0', flash: '#000000', sfx: 'debuff',
      bg(g, S, t, o) {
        for (let i = 0; i < 80; i++) {
          const ph = (S.T * 0.4 + hx(i, 1, 13)) % 1, a = hx(i, 2, 13) * Math.PI * 2, r = (1 - ph) * (180 + hx(i, 3, 13) * 60) * (1 - eIn(o));
          rect(g, rgba('#b8a0d8', 0.6 * ph), Math.round(MX + Math.cos(a) * r), Math.round(MY + Math.sin(a) * r * 0.75), 1, 1);
        }
        vignette(g, 0.75);
      },
      em: o => [1 - eIn(seg(o, 0, 0.55)), 1 - seg(o, 0.45, 0.6)],
      out(g, S, t, o) {
        const k = seg(o, 0.5, 0.85);
        if (k > 0 && k < 1) lighter(g, () => ring(g, rgba('#c8a8ff', 1 - k), 2, MX, MY, 4 + eOut(k) * 200));
        flash(g, this.flash, sm(seg(o, 0.7, 1)));
      }
    },
    abundance: {
      hue: '#6ae08a', flash: '#f0fff0', sfx: 'heal',
      bg(g, S, t) {
        const k = eOut(seg(t, 0.05, 1.0));
        [[0, 0], [LW, 0], [0, LH], [LW, LH]].forEach(([x0, y0], b) => {
          const pts = [[x0, y0]];
          for (let j = 1; j <= 8; j++) { const f = j / 8 * k * 0.62; pts.push([lerp(x0, MX, f) + Math.sin(j * 1.7 + b) * 10, lerp(y0, MY, f) + Math.cos(j * 1.3 + b) * 8, f]); }
          g.strokeStyle = '#5a8a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0);
          for (const [nx, ny] of pts) g.lineTo(nx, ny);
          g.stroke(); g.lineWidth = 1;
          pts.forEach(([nx, ny, f], j) => { if (j % 2 === 0 && f > 0.05) { ell(g, '#6ab86a', nx + 4, ny - 2, 4, 2, 0.6); A.flower(g, nx - 3, ny + 3, 2.5, j + b, '#f0fff0', 0.9); } });
          const tip = pts[pts.length - 1];
          lighter(g, () => glow(g, tip[0], tip[1], 8, '#c8ffb0', 0.5));
        });
        for (let i = 0; i < 20; i++) { const ph = (S.T * 0.25 + hx(i, 1, 37)) % 1; rect(g, rgba('#e8ffb8', 0.7 * Math.sin(ph * Math.PI)), Math.round(hx(i, 2, 37) * LW), Math.round(LH - ph * LH), 1, 1); }
      },
      em: o => [1 + eOut(o) * 0.25, 1 - sm(seg(o, 0.3, 0.6))],
      out(g, S, t, o) {
        if (o <= 0) return;
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + hx(i, 1, 17), r = eOut(o) * (60 + hx(i, 2, 17) * 160); A.flower(g, MX + Math.cos(a) * r, MY + Math.sin(a) * r, 4 + hx(i, 3, 17) * 3, o * 4 + i, i % 2 ? '#e8ffe8' : '#c8f8d0', 1 - seg(o, 0.6, 1)); }
        flash(g, this.flash, sm(seg(o, 0.6, 1)));
      }
    },
    remembrance: {
      hue: '#9ad8ff', flash: '#eef8ff', sfx: 'glint',
      bg(g, S, t) {
        const k = eOut(seg(t, 0.05, 0.9));
        for (let i = 0; i < 16; i++) {
          const ph = (S.T * 0.12 + hx(i, 3, 41)) % 1, x = hx(i, 4, 41) * LW, y = LH - ph * (LH + 40), w = 10 + hx(i, 5, 41) * 18, a = 0.18 + 0.3 * Math.sin(ph * Math.PI);
          g.save(); g.translate(x, y); g.rotate((hx(i, 6, 41) - 0.5) * 1.2 + S.T * 0.2);
          poly(g, rgba('#bfe6ff', a * k), [0, -w * 0.6, w * 0.4, 0, 0, w * 0.6, -w * 0.3, 0]);
          poly(g, rgba('#ffffff', a * 0.6 * k), [0, -w * 0.6, w * 0.15, -w * 0.1, -w * 0.1, 0]);
          g.restore();
        }
        lighter(g, () => { for (let i = 0; i < 3; i++) ring(g, rgba('#9ad8ff', (0.12 + 0.06 * Math.sin(S.T * 2 + i)) * k), 1, MX, MY, 60 + i * 30); glow(g, MX, MY, 140, '#6ab8ff', 0.1 * k); });
      },
      em: o => [1, 1 - sm(seg(o, 0.25, 0.6))],
      out(g, S, t, o) {
        if (o <= 0) return;
        for (let i = 0; i < 22; i++) {
          const a = hx(i, 1, 43) * Math.PI * 2, r = eOut(o) * (30 + hx(i, 2, 43) * 120), x = MX + Math.cos(a) * r, y = MY + Math.sin(a) * r - o * 60, s = 3 + hx(i, 3, 43) * 5;
          poly(g, rgba(i % 2 ? '#dff2ff' : '#9ad8ff', 1 - seg(o, 0.4, 1)), [x, y - s, x + s * 0.5, y, x, y + s, x - s * 0.5, y]);
        }
        flash(g, this.flash, sm(seg(o, 0.6, 1)));
      }
    }
  };

  function sign(S, P, t) {
    const g = S.g, fx = PATH_FX[P.path] || PATH_FX.destruction, col = RAR[P.rar] || RAR[4];
    const o = seg(t, 1.0, SIGN), k = eOut(seg(t, 0.06, 0.7)), fill = sm(seg(t, 0.5, 0.85)), [es, ea] = fx.em(o);
    vgrad(g, 0, LH, [[0, '#020308'], [0.55, G.dark(fx.hue, 0.86)], [1, '#030410']]);
    K.stars(g, S.T, 60, 5, 0.6);
    fx.bg(g, S, t, o);
    lighter(g, () => { glow(g, MX, MY, 64 + fill * 30, col, 0.35 * fill * ea); glow(g, MX, MY, 28, '#ffffff', 0.22 * fill * ea); });
    if (ea > 0) ring(g, rgba(col, 0.6 * fill * ea), 1, MX, MY, 54 * es);
    trace(g, P.path, MX, MY, EMB * es, k, col, ea * (1 - fill * 0.5));
    emblem(g, P.path, MX + 1, MY + 2, EMB, G.dark(col, 0.55), fill * ea * 0.9, es);
    emblem(g, P.path, MX, MY, EMB, G.light(col, 0.35), fill * ea, es);
    const sh = seg(t, 0.85, 1.0) * (1 - seg(t, 1.0, 1.1));
    if (sh > 0) lighter(g, () => emblem(g, P.path, MX, MY, EMB, '#ffffff', sh * 0.6, es));
    fx.out(g, S, t, o);
  }

  function params(game, r, std) {
    const d = H.CHARS[r.id] || {}, el = H.ELEMENTS[d.elem] || H.ELEMENTS.phys;
    return { id: r.id, rar: r.rar, std: !!std, path: d.path || 'destruction', elem: d.elem || 'phys', col: el.col, look: G.lookOf(r.id, game), seed: hx(r.id.length, r.id.charCodeAt(0), 3) * 4 };
  }

  function render(game, r, t, std) {
    const cv = buf.cv || (buf.cv = G.mkCanvas(LW, LH)), g = cv.getContext('2d'), P = params(game, r, std);
    g.save();
    g.imageSmoothingEnabled = false;
    const S = H.Cine.stage(g, game, t);
    if (t < SIGN) { S.t = t; S.d = SIGN; sign(S, P, t); }
    else {
      const show = SHOWS[r.id] || GENERIC, fx = PATH_FX[P.path] || PATH_FX.destruction;
      S.t = t - SIGN; S.d = show.d;
      show.act(S, P);
      if (S.t < 0.3) flash(g, fx.flash, 1 - S.t / 0.3);
    }
    g.restore();
    H.Cine.dither(g);
    return cv;
  }

  const spaced = s => s.split('').join(' ');

  function overlay(ui, c, r, t) {
    const show = SHOWS[r.id] || GENERIC, end = SIGN + show.d, col = RAR[r.rar] || RAR[4];
    const h = Math.round(BAR * 2 * (t < end ? sm(seg(t, 0, 0.35)) : 1 - sm(seg(t, end, end + 0.4))));
    if (h > 0) {
      c.fillStyle = '#000000'; c.fillRect(0, 0, W, h); c.fillRect(0, HGT - h, W, h);
      c.fillStyle = rgba(col, 0.55); c.fillRect(0, h - 1, W, 1); c.fillRect(0, HGT - h, W, 1);
    }
    const path = (H.CHARS[r.id] || {}).path, a = seg(t, 0.5, 0.8) * (1 - seg(t, 1.0, 1.15));
    if (t < SIGN && path && a > 0) {
      c.save(); c.globalAlpha = a;
      ui.text(spaced('ПУТЬ'), W / 2, 310, { align: 'center', size: 11, bold: true, col: G.light(col, 0.45) });
      ui.text(spaced(H.PATHS[path].name.toUpperCase()), W / 2, 326, { align: 'center', size: 22, bold: true, serif: true, col: '#fff4d8' });
      c.fillStyle = rgba(col, 0.8); c.fillRect(W / 2 - 120, 360, 240, 1);
      ui.diamond(W / 2 - 120, 360.5, 3, col); ui.diamond(W / 2 + 120, 360.5, 3, col); ui.diamond(W / 2, 360.5, 4, '#fff4d8');
      c.restore();
    }
  }

  function lineOf(id, game) { const s = (SHOWS[id] || GENERIC).line; return s ? (game ? game.fill(s) : s) : ''; }

  const cueCache = new Map();
  function cues(r) {
    const key = r.id + '|' + r.rar;
    let list = cueCache.get(key);
    if (!list) {
      const show = SHOWS[r.id] || GENERIC, fx = PATH_FX[(H.CHARS[r.id] || {}).path] || PATH_FX.destruction;
      list = [[0.05, 'warp'], [0.62, 'glint'], [0.8, r.rar === 5 ? 'star5' : 'star4'], [1.02, fx.sfx]].concat(show.sfx.map(([x, id]) => [SIGN + x, id]));
      cueCache.set(key, list);
    }
    return list;
  }

  H.WarpIntro = { SIGN, SHOWS, PATH_FX, CARD: { x: CX, y: CY }, length: id => SIGN + (SHOWS[id] || GENERIC).d, has: id => !!SHOWS[id], render, overlay, line: lineOf, cues, ticket, shapes };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
