(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit;
  const { W, HGT, C } = H.UI_CONST;
  const { LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const IN = 0.75, HIT = 0.85, TEAM = 0.9, FADE = 0.3;
  const FLOOR = LH - BAR;
  const buf = { cv: null };

  function star5(g, x, y, r, rot, col) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    poly(g, col, pts);
  }

  function bolt(g, x0, y0, x1, y1, seed, col, w) {
    const n = 7, nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1;
    let px = x0, py = y0;
    lighter(g, () => {
      for (let i = 1; i <= n; i++) {
        const k = i / n, j = i === n ? 0 : (hx(i, seed, 13) - 0.5) * 22;
        const x = lerp(x0, x1, k) + nx / L * j, y = lerp(y0, y1, k) + ny / L * j;
        line(g, rgba(col, 0.55), w + 3, px, py, x, y);
        line(g, '#ffffff', Math.max(1, w - 1), px, py, x, y);
        px = x; py = y;
      }
    });
  }

  function crystal(g, x, y, len, rot, a) {
    const c = Math.cos(rot), s = Math.sin(rot), wd = len * 0.18;
    poly(g, rgba('#bfefff', a), [x + c * len, y + s * len, x - s * wd, y + c * wd, x - c * len * 0.3, y - s * len * 0.3, x + s * wd, y - c * wd]);
    poly(g, rgba('#ffffff', a * 0.8), [x + c * len, y + s * len, x - s * wd * 0.4, y + c * wd * 0.4, x - c * len * 0.1, y - s * len * 0.1]);
  }

  function flower(g, x, y, r, rot, col, a) {
    for (let i = 0; i < 5; i++) { const q = rot + i / 5 * Math.PI * 2; ell(g, rgba(col, a), x + Math.cos(q) * r * 0.6, y + Math.sin(q) * r * 0.6, r * 0.55, r * 0.4, q); }
    ell(g, rgba('#f2d070', a), x, y, r * 0.25, r * 0.25);
  }

  function butterfly(g, x, y, s, ph, col, a) {
    const w = 0.25 + 0.75 * Math.abs(Math.sin(ph));
    poly(g, rgba(col, a), [x, y, x - s * 1.4 * w, y - s, x - s * 1.1 * w, y + s * 0.7]);
    poly(g, rgba(col, a), [x, y, x + s * 1.4 * w, y - s, x + s * 1.1 * w, y + s * 0.7]);
    rect(g, rgba('#ffffff', a), Math.round(x), Math.round(y - s * 0.5), 1, Math.max(1, Math.round(s)));
  }

  function sword(g, x, y, rot, len, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    lighter(g, () => glow(g, len * 0.4, 0, len * 0.5, '#8adfff', 0.35 * a));
    poly(g, rgba('#eaf8ff', a), [0, -1.5, len, 0, 0, 1.5]);
    rect(g, rgba('#d8b050', a), -3, -4, 2, 8);
    rect(g, rgba('#2a3a5a', a), -9, -1, 6, 2);
    g.restore();
  }

  function gift(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, '#d83a4a', -s, -s, s * 2, s * 2); rect(g, '#8a1a2a', -s, s * 0.6, s * 2, s * 0.4);
    rect(g, '#f2d070', -s * 0.18, -s, s * 0.36, s * 2); rect(g, '#f2d070', -s, -s * 0.18, s * 2, s * 0.36);
    ell(g, '#f2d070', -s * 0.4, -s - 2, s * 0.4, s * 0.25, -0.4); ell(g, '#f2d070', s * 0.4, -s - 2, s * 0.4, s * 0.25, 0.4);
    g.restore();
  }

  function svarog(g, x, y, s, t, eye) {
    const n = Math.round(210 * s), c = G.foeCanvas('svarog_b', n, 0), [ex, ey] = G.SVAROG.EYE;
    const X = Math.round(x - n / 2), Y = Math.round(y - n * 0.97), px = X + ex * n / 100, py = Y + ey * n / 100;
    const was = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(c, X, Y, n, n);
    g.imageSmoothingEnabled = was;
    if (eye < 1) ell(g, rgba('#25264a', 1 - eye), px, py, n * 0.024, n * 0.022);
    lighter(g, () => glow(g, px, py, 30 * s, '#ff2e8e', 0.7 * eye * (0.8 + 0.2 * Math.sin(t * 6))));
  }

  function svarogHand(g, x, y, s) {
    const { P, Ph, Pd, Pk, Ws, E } = G.SVAROG;
    g.save(); g.translate(x, y); g.scale(s, s);
    poly(g, Pk, [6, -20, 32, -20, 96, -96, 64, -110]); poly(g, P, [10, -18, 28, -18, 90, -92, 66, -104]); poly(g, Ph, [10, -18, 16, -18, 72, -100, 66, -104]);
    rect(g, Pk, -32, -24, 64, 12); rect(g, Ws, -30, -22, 60, 8);
    rect(g, Pk, -32, -14, 64, 36); rect(g, P, -30, -12, 60, 32); rect(g, Ph, -30, -12, 60, 6); rect(g, Pd, 18, -6, 12, 26);
    for (let f = 0; f < 4; f++) {
      const fx = -29 + f * 15, len = 26 - (f === 0 ? 8 : 0);
      rect(g, Pk, fx - 1, 18, 13, len + 2); rect(g, f % 2 ? P : Ph, fx, 18, 11, len); rect(g, Pd, fx, 18 + len * 0.45, 11, 3); rect(g, Pd, fx + 8, 18, 3, len);
    }
    ell(g, Pk, 0, 4, 9, 9); ell(g, E, 0, 4, 6, 6); ell(g, '#ffd6f0', -2, 2, 2.4, 2.4);
    lighter(g, () => glow(g, 0, 4, 22, E, 0.5));
    g.restore();
  }

  function stealHand(g, x, y, s, a, col) {
    lighter(g, () => glow(g, x, y, 18 * s, col || '#9affb0', 0.7 * a));
    ell(g, rgba('#f6dcc6', a), x, y, 6 * s, 5 * s);
    for (let i = 0; i < 4; i++) rect(g, rgba('#f6dcc6', a), Math.round(x + 4 * s), Math.round(y - 5 * s + i * 2.6 * s), Math.round(6 * s), Math.max(1, Math.round(1.8 * s)));
    rect(g, rgba('#f6dcc6', a), Math.round(x - 2 * s), Math.round(y - 8 * s), Math.round(2 * s), Math.round(5 * s));
    lighter(g, () => ring(g, rgba(col || '#c8ffd8', 0.8 * a), 1, x, y, 10 * s));
  }

  function runeCircle(g, x, y, rx, ry, rot, col, a) {
    if (a <= 0) return;
    lighter(g, () => {
      g.strokeStyle = rgba(col, a); g.lineWidth = 1;
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(x, y, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 12; i++) { const q = rot + i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(q) * rx * 0.78, y + Math.sin(q) * ry * 0.78); g.lineTo(x + Math.cos(q) * rx, y + Math.sin(q) * ry); g.stroke(); }
      for (let i = 0; i < 6; i++) { const q0 = rot * -1.4 + i / 6 * Math.PI * 2, q1 = q0 + Math.PI * 2 / 3; g.beginPath(); g.moveTo(x + Math.cos(q0) * rx * 0.74, y + Math.sin(q0) * ry * 0.74); g.lineTo(x + Math.cos(q1) * rx * 0.74, y + Math.sin(q1) * ry * 0.74); g.stroke(); }
      glow(g, x, y, rx * 0.6, col, 0.25 * a);
    });
  }

  function heart(g, x, y, s, col, a) {
    ell(g, rgba(col, a), x - s * 0.5, y, s * 0.6, s * 0.6);
    ell(g, rgba(col, a), x + s * 0.5, y, s * 0.6, s * 0.6);
    poly(g, rgba(col, a), [x - s * 1.05, y + s * 0.2, x + s * 1.05, y + s * 0.2, x, y + s * 1.3]);
  }

  function boom(g, x, y, k, T, col) {
    const r = 20 + 120 * eOut(k);
    lighter(g, () => {
      glow(g, x, y, r * 1.4, col || '#ff7a30', 0.9 * (1 - k * 0.6));
      glow(g, x, y, r * 0.6, '#fff4d0', 1 - k);
      ring(g, rgba('#ffd8a0', 1 - k), 3, x, y, r);
      ring(g, rgba('#ffffff', 0.8 * (1 - k)), 2, x, y, r * 0.7);
    });
    for (let i = 0; i < 6; i++) ell(g, rgba(i % 2 ? '#5a3a2a' : '#8a5a3a', 0.6 * (1 - k * 0.8)), x + (hx(i, 3, 41) - 0.5) * r * 1.2, y - r * 0.3 - k * 60 * hx(i, 4, 41), r * 0.4 * (0.6 + hx(i, 5, 41)), r * 0.3);
  }

  function web(g, x, y, r, a, rot) {
    if (a <= 0) return;
    lighter(g, () => {
      for (let i = 0; i < 8; i++) { const q = rot + i * Math.PI / 4; line(g, rgba('#f0dcff', 0.5 * a), 1, x, y, x + Math.cos(q) * r, y + Math.sin(q) * r); }
      for (let k = 1; k <= 4; k++) {
        const rr = r * k / 4;
        for (let i = 0; i < 8; i++) { const q0 = rot + i * Math.PI / 4, q1 = q0 + Math.PI / 4; line(g, rgba('#f0dcff', 0.4 * a), 1, x + Math.cos(q0) * rr, y + Math.sin(q0) * rr, x + Math.cos(q1) * rr * 0.92, y + Math.sin(q1) * rr * 0.92); }
      }
    });
  }

  function hackWin(g, x, y, w, h, title, col, a, seed, T) {
    if (a <= 0) return;
    rect(g, rgba('#0a1030', 0.85 * a), x, y, w, h);
    rect(g, rgba(col, a), x, y, w, 7);
    g.strokeStyle = rgba('#a8c0ff', a); g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w - 1, h - 1);
    g.fillStyle = rgba('#ffffff', a); g.font = 'bold 6px Tahoma, Arial, sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillText(title, Math.round(x + 3), Math.round(y));
    for (let r = 0; r < Math.floor((h - 10) / 5); r++) rect(g, rgba('#a0c8ff', (0.3 + 0.5 * hx(r, seed, 3)) * a), x + 3, y + 10 + r * 5, Math.round((w - 8) * (0.3 + 0.7 * hx(r, seed, Math.floor(T * 3)))), 2);
  }

  function crackBlade(g, x, y, rot, len, a, glowA) {
    g.save(); g.translate(x, y); g.rotate(rot);
    lighter(g, () => glow(g, len * 0.5, 0, len * 0.55, '#ff3a2a', 0.45 * glowA));
    poly(g, rgba('#2a2228', a), [0, -2.4, len * 0.92, -1.4, len, 0, len * 0.92, 1.4, 0, 2.4]);
    poly(g, rgba('#5a4e58', a), [0, -2.4, len * 0.92, -1.4, len, 0, 0, -0.4]);
    for (let i = 0; i < 5; i++) { const x0 = len * (0.12 + i * 0.17); line(g, rgba('#ff5a3a', a * (0.6 + 0.4 * glowA)), 1, x0, -1.6, x0 + 5, 0.4); line(g, rgba('#ffb070', a * glowA), 1, x0 + 5, 0.4, x0 + 9, -0.8); }
    rect(g, rgba('#c8a050', a), -4, -5, 3, 10); rect(g, rgba('#1a1418', a), -14, -1.5, 10, 3); rect(g, rgba('#c8302a', a), -12, 1.5, 2, 8);
    g.restore();
  }

  function backdrop(S, P, dim, tint) {
    S.g.drawImage(G.bgCanvas(P.bg || 'station', W, HGT), 0, 0, LW, LH);
    if (dim) rect(S.g, rgba(tint || '#000000', dim), 0, 0, LW, LH);
  }

  function hero(S, P, x, y, o) { S.fig(P.look, x, y, Object.assign({ k: 2 }, o)); }

  function foes(S, P, o = {}) {
    for (const f of P.foes) G.drawEnemy(S.g, f.u.data, f.x, f.y, f.s, { t: S.T, flash: o.flash || 0 });
  }

  function foeCenter(P) {
    if (!P.foes.length) return { x: 200, y: 110 };
    let x = 0, y = 0;
    for (const f of P.foes) { x += f.x; y += f.y - f.s * 0.45; }
    return { x: x / P.foes.length, y: y / P.foes.length };
  }

  const BURST = {
    phys(g, x, y, s, t, i) {
      const k = cl(t / 0.45);
      lighter(g, () => {
        glow(g, x, y, s * 0.6, '#ffffff', 0.8 * (1 - k));
        for (let j = 0; j < 3; j++) { const a = 0.5 + j * 1.05 + i, r = s * 0.55 * eOut(k); line(g, rgba('#ffffff', 1 - k), 2, x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r); }
      });
      K.shards(g, t * 1.4, x, y, 12, 3 + i, '#c8c8d0', s * 0.6, '#ffffff');
    },
    fire(g, x, y, s, t, i) {
      const k = cl(t / 0.55);
      lighter(g, () => { glow(g, x, y, s * 0.8 * eOut(k), '#ff7a20', 0.9 * (1 - k)); glow(g, x, y, s * 0.3, '#fff0c0', 1 - k); ring(g, rgba('#ffb060', 1 - k), 2, x, y, s * 0.7 * eOut(k)); });
      K.sparks(g, t + i, x, y, 14, 5 + i, '#ffb050', s * 0.6);
    },
    ice(g, x, y, s, t, i) {
      const k = eOut(cl(t / 0.3)), f = 1 - cl((t - 0.3) / 0.5);
      for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.42 + hx(j, i, 3) * 0.2; crystal(g, x, y + s * 0.35, s * (0.35 + hx(j, i, 4) * 0.35) * k, a, 0.9 * f); }
      lighter(g, () => glow(g, x, y, s * 0.6, '#8adfff', 0.6 * f));
    },
    elec(g, x, y, s, t, i) {
      const k = cl(t / 0.5);
      if (k < 0.7) for (let j = 0; j < 2; j++) bolt(g, x + (hx(j, i, 6) - 0.5) * s, y - s * 1.6, x, y, Math.floor(t * 20) + j * 7 + i, '#c07aff', 2);
      lighter(g, () => glow(g, x, y, s * 0.7, '#c07aff', 0.8 * (1 - k)));
    },
    wind(g, x, y, s, t, i) {
      const k = cl(t / 0.55);
      lighter(g, () => {
        for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc0', 0.9 * (1 - k)); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, s * (0.3 + j * 0.15) * (0.6 + k), s * (0.12 + j * 0.05) * (0.6 + k), 0, t * 9 + j, t * 9 + j + 3.6); g.stroke(); }
        glow(g, x, y, s * 0.5, '#5fe0a8', 0.6 * (1 - k));
      });
      g.lineWidth = 1;
    },
    quant(g, x, y, s, t, i) {
      const k = cl(t / 0.5);
      for (let j = 0; j < 10; j++) { const a = hx(j, i, 7) * Math.PI * 2, r = s * 0.6 * eOut(k) * (0.4 + hx(j, i, 8)), q = 2 + hx(j, i, 9) * 4; rect(g, rgba(j % 2 ? '#8a7aff' : '#e0d8ff', 1 - k), Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), q, q); }
      K.glitch(g, t, x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, 0.9 * (1 - k), i + 2);
      lighter(g, () => glow(g, x, y, s * 0.6, '#8a7aff', 0.7 * (1 - k)));
    },
    imag(g, x, y, s, t, i) {
      const k = cl(t / 0.55);
      lighter(g, () => {
        for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2 + i, r0 = s * 0.12, r1 = s * (0.5 + 0.4 * hx(j, i, 3)) * eOut(k); line(g, rgba('#ffe880', 1 - k), 1, x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1); }
        glow(g, x, y, s * 0.6, '#ffd850', 0.8 * (1 - k));
      });
    }
  };

  const TEAM_TINT = { heal: '#04140a', shield: '#04101c', buff: '#141004', speed: '#140804', bloom: '#04141a', guard: '#140404' };
  const TEAM_FX = {
    heal(g, x, y, t, i, T) {
      const k = cl(t / 0.6);
      lighter(g, () => glow(g, x, y - 46, 40, '#60ff90', 0.5 * (1 - k * 0.6)));
      for (let j = 0; j < 5; j++) { const ph = (T * 0.8 + hx(j, i, 3)) % 1, px = x + (hx(j, i, 4) - 0.5) * 34, py = y - 10 - ph * 80, a = (1 - ph) * cl(t * 4); rect(g, rgba('#a0ffb8', a), Math.round(px - 3), Math.round(py), 7, 1); rect(g, rgba('#a0ffb8', a), Math.round(px), Math.round(py - 3), 1, 7); }
    },
    shield(g, x, y, t, i, T) { K.hexShield(g, x, y - 46, 38 * eOut(cl(t / 0.35)), 0.9 * cl(t * 3), T + i, '#9ad8ff'); },
    buff(g, x, y, t, i, T) {
      const k = cl(t / 0.5);
      lighter(g, () => { g.strokeStyle = rgba('#ffd060', 0.8 * (1 - k * 0.5)); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 26 * eOut(k), 6 * eOut(k), 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; glow(g, x, y - 46, 34, '#ffd060', 0.35 * (1 - k * 0.5)); });
      for (let j = 0; j < 3; j++) { const ph = (T * 1.1 + j / 3 + i * 0.2) % 1, px = x - 14 + j * 14, py = y - 30 - ph * 60; poly(g, rgba('#ffe080', (1 - ph) * cl(t * 4)), [px, py - 5, px + 4, py, px + 1.5, py, px + 1.5, py + 5, px - 1.5, py + 5, px - 1.5, py, px - 4, py]); }
    },
    speed(g, x, y, t, i, T) {
      TEAM_FX.buff(g, x, y, t, i, T);
      lighter(g, () => { for (let j = 0; j < 5; j++) { const yy = y - 20 - j * 14, len = 16 + hx(j, i, 5) * 20, xx = x - 30 - ((T * 120 + j * 23) % 40); line(g, rgba('#ffb070', 0.6 * cl(t * 3)), 1, xx, yy, xx + len, yy); } });
    },
    bloom(g, x, y, t, i, T) {
      const k = eOut(cl(t / 0.5));
      for (let j = 0; j < 6; j++) { const q = j / 6 * Math.PI * 2 + T * 1.5; flower(g, x + Math.cos(q) * 22 * k, y - 2 + Math.sin(q) * 5 * k, 4, T + j, j % 2 ? '#f4d8e4' : '#bff0f0', 0.9 * cl(t * 3)); }
      lighter(g, () => glow(g, x, y - 46, 34, '#8adfff', 0.3 * k));
    },
    guard(g, x, y, t, i, T) { K.hexShield(g, x, y - 46, 40 * eOut(cl(t / 0.35)), 0.9 * cl(t * 3), T, '#ff8a70'); }
  };

  function cutIn(S, P, def) {
    const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.3)), dir = def.side === 'l' ? -1 : 1;
    vgrad(g, 0, LH, [[0, G.dark(P.col, 0.75)], [0.6, G.dark(P.col, 0.88)], [1, '#04050c']]);
    for (let i = 0; i < 7; i++) { const off = ((S.T * 300 + i * 64) % 470) - 70; poly(g, rgba(P.col, 0.07 + 0.05 * (i % 2)), [off, 0, off + 24, 0, off - 96, LH, off - 120, LH]); }
    const cx = dir > 0 ? 214 : 106, bx = lerp(cx + dir * 260, cx, k);
    const band = dir > 0 ? [bx - 70, BAR + 6, bx + 120, BAR + 6, bx + 60, FLOOR - 4, bx - 130, FLOOR - 4] : [bx - 120, BAR + 6, bx + 70, BAR + 6, bx + 130, FLOOR - 4, bx - 60, FLOOR - 4];
    poly(g, rgba(P.col, 0.55), band);
    lighter(g, () => { line(g, rgba('#ffffff', 0.8), 1, band[0], band[1], band[6], band[7]); line(g, rgba('#ffffff', 0.8), 1, band[2], band[3], band[4], band[5]); });
    K.speedLines(g, S.T, cx, 110, 36, '#ffffff', 0.5, 70);
    const push = lerp(1, 1.07, sm(t / S.d));
    g.save(); g.translate(Math.round(bx), FLOOR + 10); g.scale(push, push);
    S.bust(P.look, 0, 0, 172, { v: def.v, tint: t < 0.09 ? '#ffffff' : null, flip: dir < 0 });
    g.restore();
    if (t > 0.3 && t < 0.62) { const q = seg(t, 0.3, 0.62), gx = lerp(cx - 70 * dir, cx + 70 * dir, q); lighter(g, () => { line(g, rgba('#ffffff', Math.sin(q * Math.PI)), 1, gx - 40, 92, gx + 40, 92); glow(g, gx, 92, 14, '#ffffff', 0.8 * Math.sin(q * Math.PI)); }); }
    G.elemIcon(g, P.elem, dir > 0 ? 40 : LW - 40, BAR + 24, 12);
    if (P.rar >= 5) {
      lighter(g, () => { rect(g, rgba('#ffd870', 0.9), 0, BAR, LW, 1); rect(g, rgba('#ffd870', 0.9), 0, FLOOR - 1, LW, 1); });
      K.sparks(g, S.T, cx, 120, 14, 3, '#ffe8a0', 90);
    }
    vignette(g, 0.4);
  }

  function hitBeat(S, P, def) {
    const g = S.g, t = S.t, fo = P.foes, c = foeCenter(P), one = fo.length === 1;
    const z = lerp(one ? 2.1 : 1.6, one ? 1.75 : 1.3, eOut(t / S.d));
    g.save();
    S.shake(t, t < 0.35 ? 3 * (1 - t / 0.35) : 0);
    S.cam(lerp(c.x, 160, 0.2), c.y - 2, z, () => {
      g.drawImage(G.bgCanvas(P.bg || 'station', W, HGT), 0, 0, LW, LH);
      if (def.impact === 'pull') { const k = eOut(cl(t / 0.5)); lighter(g, () => glow(g, c.x, c.y - 20, 60, '#8a3aff', 0.5 * (1 - k * 0.5))); ell(g, '#000000', c.x, c.y - 20, 18 * (1 - k * 0.6), 18 * (1 - k * 0.6)); }
      fo.forEach((f, i) => {
        const lt = t - 0.08 - i * 0.05, pk = def.impact === 'pull' ? eOut(cl(lt / 0.5)) : 0;
        const x = lerp(f.x, c.x, pk * 0.35), s = f.s * (1 - 0.15 * pk);
        const fl = lt > 0 ? Math.max(0, 1 - lt * 2.5) : 0, jit = lt > 0 && lt < 0.3 ? Math.sin(lt * 70) * 2 : 0;
        G.drawEnemy(g, f.u.data, x + jit, f.y, s, { t: S.T, flash: fl });
      });
      fo.forEach((f, i) => { const lt = t - 0.08 - i * 0.05; if (lt > 0) (BURST[P.elem] || BURST.phys)(g, f.x, f.y - f.s * 0.45, f.s, lt, i); });
    });
    g.restore();
    if (t < 0.22) flash(g, P.col, 0.45 * (1 - t / 0.22));
    vignette(g, 0.45);
  }

  function teamBeat(S, P, def) {
    const g = S.g, t = S.t, kind = def.team || 'buff', list = P.allies, n = list.length;
    backdrop(S, P, 0.5, TEAM_TINT[kind]);
    S.cam(160, 150, lerp(1.14, 1, eOut(t / S.d)), () => {
      if (kind === 'guard') svarog(g, 170, FLOOR + 30, 0.7, S.T, cl(t * 2));
      list.forEach((a, i) => {
        const x = 160 + (i - (n - 1) / 2) * 64, y = 214, lt = t - 0.05 - i * 0.07;
        lighter(g, () => glow(g, x, y - 46, 40, a.u === P.u ? P.col : '#ffffff', a.u === P.u ? 0.35 : 0.12));
        S.fig(a.look, x, y, { k: 1 });
        if (lt > 0) TEAM_FX[kind](g, x, y, lt, i, S.T);
      });
    });
    if (t < 0.2) flash(g, P.col, 0.4 * (1 - t / 0.2));
    vignette(g, 0.45);
  }

  const SHOWS = {
    trail: {
      line: 'Ловите подачу!', side: 'r', v: { mouth: 'open' }, d: 1.35, sfx: [[0.15, 'glint'], [0.62, 'crit'], [0.68, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, hit = 0.62, sw = eOut(seg(t, hit - 0.14, hit + 0.04));
        backdrop(S, P, 0.55, '#05040a');
        K.speedLines(g, S.T, 120, 120, 30, '#ffffff', 0.3, 60);
        hero(S, P, 112, 262, { rot: lerp(-0.1, 0.14, sw) });
        if (t > hit - 0.14 && t < hit + 0.3) {
          const a = 1 - seg(t, hit, hit + 0.3);
          lighter(g, () => { g.lineWidth = 12; g.strokeStyle = rgba('#ffe7a0', a * 0.5); g.beginPath(); g.arc(122, 150, 72, -2.4, lerp(-2.4, 0.3, sw)); g.stroke(); g.lineWidth = 4; g.strokeStyle = rgba('#ffffff', a); g.stroke(); g.lineWidth = 1; });
        }
        let bx, by;
        if (t < hit) { const k = eIn(seg(t, 0.05, hit)); bx = lerp(260, 188, k); by = lerp(36, 126, k); }
        else { const k = eIn(seg(t, hit, hit + 0.55)); bx = lerp(188, 380, k); by = lerp(126, 16, k); }
        if (t >= hit) lighter(g, () => { for (let i = 0; i < 6; i++) line(g, rgba('#ffd860', 0.6 - i * 0.09), Math.max(1, 3 - i * 0.4), bx, by, lerp(bx, 188, 0.15 + i * 0.12), lerp(by, 126, 0.15 + i * 0.12)); });
        lighter(g, () => glow(g, bx, by, 22, '#ffe070', 0.9));
        star5(g, bx, by, 9, S.T * 9, '#fff2b0');
        if (t > hit && t < hit + 0.25) { const k = seg(t, hit, hit + 0.25); lighter(g, () => { ring(g, rgba('#ffffff', 1 - k), 3, 188, 126, 10 + k * 70); glow(g, 188, 126, 60, '#ffffff', 1 - k); }); }
        K.sparks(g, S.T, bx, by, 10, 4, '#ffe8a0', 26);
      }
    },
    trail_p: {
      line: 'Держитесь за мной!', side: 'l', v: { mouth: 'open' }, d: 1.45, sfx: [[0.1, 'shield'], [0.45, 'rumble'], [0.95, 'whoosh'], [1.12, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, rise = eOut(seg(t, 0, 0.5)), throwK = eIn(seg(t, 0.9, 1.15));
        backdrop(S, P, 0.62, '#140600');
        lighter(g, () => glow(g, 170, 130, 170, '#ff8a20', 0.35 * rise));
        for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
          const x = c * 38 - (r % 2) * 19, y = BAR + 4 + r * 36 + (1 - rise) * 40, sh = hx(c, r, 93);
          poly(g, rgba(sh > 0.6 ? '#ffd070' : '#c88a30', 0.4 * rise), [x, y, x + 34, y, x + 38, y + 16, x + 34, y + 32, x, y + 32, x - 4, y + 16]);
        }
        hero(S, P, 150, lerp(296, 262, rise));
        if (t < 0.9) {
          line(g, '#d8b060', 3, 196, 230, 204, 46);
          poly(g, '#fff0c0', [204, 30, 212, 52, 198, 50]);
          lighter(g, () => glow(g, 205, 44, 26, '#ff9a30', 0.6 + 0.3 * Math.sin(S.T * 20)));
          K.embers(g, S.T, 30, 7, 190, 214, 120, '#ffb040');
        } else {
          const sx = lerp(204, 360, throwK), sy = lerp(46, 230, throwK), ang = Math.atan2(184, 156);
          lighter(g, () => { line(g, rgba('#ff9a30', 0.8), 6, sx, sy, sx - Math.cos(ang) * 120, sy - Math.sin(ang) * 120); line(g, '#fff0c0', 2, sx, sy, sx - Math.cos(ang) * 60, sy - Math.sin(ang) * 60); glow(g, sx, sy, 30, '#ffb040', 0.9); });
        }
        K.embers(g, S.T, 40, 9, 0, LW, FLOOR, '#ffb050');
        if (t > 1.12) flash(g, '#ffa040', 0.6 * (1 - seg(t, 1.12, 1.45)));
      }
    },
    march: {
      line: 'Улыбочку!', side: 'r', v: { mouth: 'open' }, d: 1.45, sfx: [[0.12, 'select'], [0.5, 'ticket'], [0.55, 'glint'], [0.85, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, snap = 0.55;
        if (t < snap) {
          backdrop(S, P, 0.1); foes(S, P);
          rect(g, 'rgba(20,40,70,0.22)', 0, 0, LW, LH);
          const L = 24, T0 = BAR + 10, B0 = FLOOR - 10, R0 = LW - 24;
          for (const [x, y, sx, sy] of [[L, T0, 1, 1], [R0, T0, -1, 1], [L, B0, 1, -1], [R0, B0, -1, -1]]) { rect(g, '#ffffff', x, y, 18 * sx, 1); rect(g, '#ffffff', x, y, 1, 18 * sy); }
          const c = foeCenter(P), k = 1 - eOut(t / 0.4), hw = 30 + k * 50, hh = 26 + k * 40;
          for (const [x, y, sx, sy] of [[c.x - hw, c.y - hh, 1, 1], [c.x + hw, c.y - hh, -1, 1], [c.x - hw, c.y + hh, 1, -1], [c.x + hw, c.y + hh, -1, -1]]) { rect(g, '#9affb0', Math.round(x), Math.round(y), 8 * sx, 1); rect(g, '#9affb0', Math.round(x), Math.round(y), 1, 8 * sy); }
          if (Math.floor(S.T * 4) % 2) ell(g, '#ff4040', L + 10, T0 + 12, 3, 3);
          rect(g, 'rgba(255,255,255,0.6)', 140, LH / 2, 40, 1);
        } else {
          const k = t - snap;
          backdrop(S, P, 0.3, '#06223a'); foes(S, P);
          for (let i = 0; i < 18; i++) {
            const ti = i * 0.03, ph = cl((k - ti) / 0.32), x1 = 20 + hx(i, 1, 21) * 280, y1 = 130 + hx(i, 2, 21) * 60, len = 18 + hx(i, 3, 21) * 16;
            if (ph <= 0) continue;
            const x = lerp(x1 - 90, x1, eIn(ph)), y = lerp(-30, y1, eIn(ph));
            crystal(g, x, y, len, Math.atan2(y1 + 30, 90), ph < 1 ? 0.95 : 0.95 * (1 - cl((k - ti - 0.32) / 0.5)));
            if (ph >= 1) K.shards(g, (k - ti - 0.32) * 1.5, x1, y1, 6, i, '#bfefff', 24, '#ffffff');
          }
          K.snowfall(g, S.T, 60, 4, { speed: 80, wind: 60 });
          if (k < 0.14) flash(g, '#ffffff', 1 - k / 0.14);
        }
      }
    },
    danheng: {
      line: 'Не двигайся.', side: 'l', d: 1.4, sfx: [[0.1, 'whoosh'], [0.82, 'swing'], [0.95, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, lunge = eOut(seg(t, 0.8, 1.0));
        vgrad(g, 0, LH, [[0, '#04161a'], [0.6, '#0d3a3a'], [1, '#06120f']]);
        for (let i = 0; i < 7; i++) ell(g, rgba('#bff6e0', 0.08), ((hx(i, 2, 31) * 420 - S.T * 40 * (1 + i % 3)) % 420 + 420) % 420 - 50, BAR + 20 + i * 24, 70, 12);
        const head = t * 1.5;
        const at = s => ({ x: -60 + s * 300, y: 110 + Math.sin(s * 5) * 46 });
        lighter(g, () => {
          g.lineCap = 'round';
          for (let j = 40; j > 0; j--) {
            const a = at(head - j * 0.022), b = at(head - (j - 1) * 0.022), r = 13 - j * 0.28;
            if (r <= 0) continue;
            glow(g, a.x, a.y, r * 2.2, P.col, 0.14);
            line(g, rgba('#7af0c8', 0.55), r * 2, a.x, a.y, b.x, b.y);
            line(g, rgba('#e0fff0', 0.5), Math.max(1, r * 0.5), a.x, a.y - r * 0.4, b.x, b.y - r * 0.4);
            if (j % 4 === 0) { line(g, rgba('#e0fff0', 0.7), 1, a.x, a.y - r, a.x - 6, a.y - r - 7); }
          }
          g.lineCap = 'butt';
          const x = -60 + head * 300, y = 110 + Math.sin(head * 5) * 46;
          poly(g, rgba('#e0fff0', 0.95), [x + 24, y, x - 6, y - 12, x - 2, y, x - 6, y + 12]);
          line(g, rgba('#e0fff0', 0.9), 1, x - 4, y - 10, x - 18, y - 24); line(g, rgba('#e0fff0', 0.9), 1, x - 4, y + 10, x - 18, y + 22);
          rect(g, '#ffffff', Math.round(x + 6), Math.round(y - 3), 2, 2);
        });
        const hxp = lerp(110, 210, lunge);
        if (t > 0.8) K.hStreaks(g, S.T, 30, 5, -600, '#c8fff0', 0.5, BAR, FLOOR);
        hero(S, P, hxp, 262, { rot: lunge * 0.12 });
        line(g, '#d8d8c8', 2, hxp + 6, 172, hxp + 110, 150);
        poly(g, '#e8fff8', [hxp + 110, 146, hxp + 126, 149, hxp + 110, 154]);
        if (t > 0.95) flash(g, '#c8fff0', 0.5 * (1 - seg(t, 0.95, 1.3)));
      }
    },
    himeko: {
      line: 'Посмотрим, как вам это.', side: 'r', d: 1.55, sfx: [[0.1, 'tech'], [0.55, 'warp'], [0.9, 'crit'], [1.0, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t;
        if (t < 0.85) {
          S.bg('space', S.T, { planet: { x: 160, y: 340, r: 180, kind: 'jarilo' } });
          const y = 70 + Math.sin(S.T * 2) * 2, ch = seg(t, 0.15, 0.55);
          rect(g, '#3a5a9a', 128, y - 4, 20, 8); rect(g, '#3a5a9a', 172, y - 4, 20, 8);
          for (let i = 0; i < 4; i++) { rect(g, '#7aa0e0', 130 + i * 5, y - 3, 1, 6); rect(g, '#7aa0e0', 174 + i * 5, y - 3, 1, 6); }
          rect(g, '#c8a050', 148, y - 7, 24, 14); rect(g, '#f0d080', 148, y - 7, 24, 2);
          ell(g, '#2a2a34', 160, y + 9, 7, 3);
          lighter(g, () => glow(g, 160, y + 10, 8 + ch * 24, '#ff9a40', 0.5 + ch * 0.5));
          if (t > 0.55) { const w = lerp(2, 16, eOut(seg(t, 0.55, 0.75))); lighter(g, () => { rect(g, rgba('#ff8a30', 0.7), 160 - w, y + 10, w * 2, LH); rect(g, '#fff0d0', 160 - w * 0.35, y + 10, w * 0.7, LH); glow(g, 160, 190, 60, '#ffb060', 0.8); }); }
        } else {
          const k = t - 0.85, c = foeCenter(P), w = lerp(30, 70, eOut(cl(k / 0.3)));
          backdrop(S, P, 0.3, '#2a0800'); foes(S, P, { flash: 0.5 });
          lighter(g, () => { rect(g, rgba('#ff7a20', 0.7), c.x - w, 0, w * 2, LH); rect(g, '#fff0d0', c.x - w * 0.35, 0, w * 0.7, LH); glow(g, c.x, c.y + 30, 120, '#ff9a40', 0.8); });
          K.embers(g, S.T, 60, 11, 0, LW, FLOOR, '#ffd070');
          if (k < 0.14) flash(g, '#ffffff', 1 - k / 0.14);
        }
      }
    },
    welt: {
      line: 'Замрите.', side: 'r', d: 1.5, impact: 'pull', sfx: [[0.1, 'tech'], [0.45, 'rumble'], [1.0, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0.25, 1.1)), x = 214, y = 84, r = lerp(2, 32, k);
        backdrop(S, P, 0.6, '#140620');
        hero(S, P, 96, 262);
        line(g, '#2a2a32', 3, 118, 176, 150, 62);
        lighter(g, () => glow(g, 150, 62, 12, '#ffd850', 0.7 + 0.3 * Math.sin(S.T * 12)));
        lighter(g, () => {
          for (let i = 0; i < 44; i++) {
            const ph = (S.T * 0.7 + hx(i, 1, 41)) % 1, a = hx(i, 2, 41) * Math.PI * 2 + ph * 4, rr = r + (1 - ph) * 130;
            rect(g, rgba(i % 3 ? '#c8a0ff' : '#ffe880', ph * k), Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.6), 2, 1);
          }
          glow(g, x, y, r * 3, '#8a3aff', 0.5 * k);
          g.save(); g.translate(x, y); g.rotate(-0.25);
          for (let j = 0; j < 3; j++) { g.strokeStyle = rgba(j ? '#ffd890' : '#ffffff', 0.8 * k); g.lineWidth = 3 - j; g.beginPath(); g.ellipse(0, 0, r * (2 + j * 0.3), r * (0.45 + j * 0.06), 0, S.T * 2 + j, S.T * 2 + j + 5.4); g.stroke(); }
          g.restore(); g.lineWidth = 1;
        });
        ell(g, '#000000', x, y, r, r);
        ring(g, rgba('#ffffff', 0.7 * k), 1, x, y, r + 1);
        ring(g, rgba('#c8a0ff', 0.3 * k), 1, x, y, r * 1.7);
      }
    },
    natasha: {
      line: 'Потерпите, сейчас полегчает.', side: 'r', d: 1.25, team: 'heal', sfx: [[0.15, 'heal'], [0.7, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.6));
        vgrad(g, 0, LH, [[0, '#06140e'], [1, '#14382a']]);
        lighter(g, () => { glow(g, 160, 120, 160, '#60ff90', 0.3 * k); rect(g, rgba('#9affb8', 0.35 * k), 146, BAR + 10, 28, 150); rect(g, rgba('#9affb8', 0.35 * k), 100, 86, 120, 28); });
        hero(S, P, 160, 262);
        for (let r = 0; r < 3; r++) {
          g.strokeStyle = rgba('#e04050', 0.7); g.lineWidth = 2; g.beginPath();
          for (let x = 0; x <= LW * k; x += 8) { const y = 112 + r * 34 + Math.sin(x * 0.03 + S.T * 3 + r * 2) * 18; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke(); g.lineWidth = 1;
        }
        for (let i = 0; i < 14; i++) { const ph = (S.T * 0.6 + hx(i, 1, 41)) % 1, x = Math.round(hx(i, 2, 41) * LW), y = Math.round(FLOOR - ph * 180); rect(g, rgba('#c0ffd0', 1 - ph), x - 3, y, 7, 1); rect(g, rgba('#c0ffd0', 1 - ph), x, y - 3, 1, 7); }
      }
    },
    serval: {
      line: 'А теперь соло!', side: 'l', v: { mouth: 'open' }, d: 1.4, sfx: [[0.2, 'confirm'], [0.45, 'crit'], [0.75, 'crit'], [1.05, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, beats = [0.45, 0.75, 1.05];
        vgrad(g, 0, LH, [[0, '#06040e'], [1, '#1a0c2a']]);
        lighter(g, () => { for (let i = 0; i < 3; i++) { const x = 80 + i * 80 + Math.sin(S.T * 1.5 + i * 2) * 30; poly(g, rgba('#c07aff', 0.12), [x - 5, 0, x + 5, 0, x + 60, LH, x - 60, LH]); } });
        const pulse = beats.reduce((a, b) => Math.max(a, t > b ? 1 - cl((t - b) / 0.2) : 0), 0);
        for (const x of [12, 248]) for (let r = 0; r < 2; r++) {
          const y = FLOOR - 50 - r * 52;
          rect(g, '#16161c', x, y, 60, 50); rect(g, '#2a2a34', x + 2, y + 2, 56, 46);
          ell(g, '#08080c', x + 30, y + 25, 17 + pulse * 2, 17 + pulse * 2); ell(g, '#3a3a46', x + 30, y + 25, 5, 5);
        }
        hero(S, P, 160, 262);
        g.save(); g.translate(170, 180); g.rotate(-0.55);
        ell(g, '#2a50d0', 0, 0, 15, 11); ell(g, '#2a50d0', -11, 0, 11, 9); rect(g, '#1a1a22', 4, -2, 50, 4); rect(g, '#d8d8e0', 52, -3, 8, 6);
        for (let s = 0; s < 3; s++) rect(g, 'rgba(255,255,255,0.7)', -10, -1 + s, 64, 1);
        g.restore();
        beats.forEach((b, i) => {
          if (t < b || t > b + 0.25) return;
          const a = 1 - (t - b) / 0.25, ax = i % 2 ? 278 : 42;
          bolt(g, ax, FLOOR - 80, 60 + hx(i, 1, 7) * 200, BAR, Math.floor(S.T * 30) + i, P.col, 2);
          lighter(g, () => { ring(g, rgba('#e0b0ff', a), 2, ax, FLOOR - 75, 20 + (1 - a) * 60); ring(g, rgba('#e0b0ff', a), 2, 320 - ax, FLOOR - 75, 20 + (1 - a) * 60); });
          flash(g, '#c07aff', a * 0.2);
        });
      }
    },
    asta: {
      line: 'Все по местам, ускоряемся!', side: 'r', d: 1.35, team: 'speed', sfx: [[0.2, 'glint'], [0.5, 'glint'], [0.85, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, pts = [[40, 82], [78, 64], [116, 84], [150, 72], [176, 108], [208, 96], [222, 136]];
        S.bg('space', S.T, { drift: 20 });
        pts.forEach((p, i) => {
          const at = 0.08 + i * 0.09, k = eOut(cl((t - at) / 0.15));
          if (k <= 0) return;
          if (i) { const q = pts[i - 1]; lighter(g, () => line(g, rgba('#ffe0a0', 0.7), 1, q[0], q[1], lerp(q[0], p[0], k), lerp(q[1], p[1], k))); }
          lighter(g, () => glow(g, p[0], p[1], 10 * k, '#ffd070', 0.8));
          star5(g, p[0], p[1], 3 * k, S.T, '#fff4d0');
        });
        if (t > 0.8) lighter(g, () => { for (let i = 0; i < 5; i++) { const ph = cl((t - 0.8 - i * 0.06) / 0.3), x = 300 - ph * 260, y = BAR + 10 + i * 18 + ph * 50; if (ph > 0 && ph < 1) line(g, rgba('#ffffff', 1 - ph), 1, x, y, x + 30, y - 6); } });
        hero(S, P, 250, 262, { flip: true });
      }
    },
    arlan: {
      line: 'Ни шагу дальше.', side: 'l', d: 1.35, sfx: [[0.1, 'tech'], [0.38, 'rumble'], [0.85, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, slam = 0.85, dn = eIn(seg(t, slam - 0.1, slam));
        backdrop(S, P, 0.62, '#0a0612');
        for (let i = 0; i < 6; i++) ell(g, 'rgba(20,14,30,0.8)', i * 64 + Math.sin(S.T + i) * 6, BAR + 8, 52, 20);
        hero(S, P, 130, 262 + (t > slam ? 6 : 0));
        const ang = lerp(-1.35, 0.35, dn), px = 160, py = 210, L = 180, tx = px + Math.cos(ang) * L, ty = py + Math.sin(ang) * L;
        line(g, '#b8b8c4', 3, px, py, tx, ty);
        poly(g, '#e8e8f0', [tx, ty, tx + Math.cos(ang + 1.9) * 26, ty + Math.sin(ang + 1.9) * 26, tx + Math.cos(ang + 2.6) * 18, ty + Math.sin(ang + 2.6) * 18]);
        if (t < slam) {
          if (t > 0.32 && t < 0.5) bolt(g, tx + 40, 0, tx, ty, Math.floor(S.T * 30), P.col, 2);
          K.sparks(g, S.T * 2, tx, ty, 12, 6, '#e0b0ff', 22);
          lighter(g, () => glow(g, tx, ty, 18 + seg(t, 0.3, slam) * 20, P.col, 0.7));
        } else {
          const k = seg(t, slam, slam + 0.4);
          for (let i = 0; i < 6; i++) bolt(g, 300, FLOOR - 20, 300 + Math.cos(Math.PI + (i - 2.5) * 0.4) * 160 * eOut(k), FLOOR - 20 + Math.sin(Math.PI + (i - 2.5) * 0.4) * 50 * eOut(k), i * 5 + Math.floor(S.T * 20), P.col, 1);
          flash(g, '#c07aff', 0.5 * (1 - k));
        }
      }
    },
    herta: {
      line: 'Ладно, покажу фокус.', side: 'r', d: 1.4, sfx: [[0.15, 'glint'], [0.6, 'whoosh'], [1.02, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, rise = eOut(seg(t, 0, 0.6)), out = eIn(seg(t, 1.0, 1.35));
        vgrad(g, 0, LH, [[0, '#120a1e'], [1, '#2a1a3a']]);
        g.save(); g.translate(160, lerp(LH + 140, FLOOR + 44, rise)); S.bust(P.look, 0, 0, 230, { tint: '#8c5ccc', ta: 0.6, a: 0.9 }); g.restore();
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2 + S.T * 3, rx = 110 + out * 220, ry = 30 + out * 90;
          crystal(g, 160 + Math.cos(a) * rx, 156 + Math.sin(a) * ry, 12, a + Math.PI / 2, 0.95 * rise);
        }
        S.fig(P.look, 160, 214, { k: 1, flip: Math.floor(S.T * 10) % 2 === 1 });
        if (t > 1.02) flash(g, '#c8f0ff', 0.4 * (1 - seg(t, 1.02, 1.35)));
      }
    },
    gepard: {
      line: 'Держать строй!', side: 'l', v: { mouth: 'open' }, d: 1.35, team: 'shield', sfx: [[0.1, 'swing'], [0.5, 'break'], [0.55, 'rumble'], [0.9, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, punch = 0.5, k = eOut(seg(t, punch, punch + 0.45));
        g.save();
        S.shake(t, t > punch && t < punch + 0.3 ? 3 : 0);
        S.bg('snow', S.T, {});
        rect(g, 'rgba(6,16,30,0.45)', 0, 0, LW, LH);
        for (let i = 0; i < 12; i++) { const x = i * 28 - 6, h = (60 + hx(i, 1, 51) * 80) * k; poly(g, rgba('#bfefff', 0.9), [x, FLOOR, x + 14, FLOOR - h, x + 28, FLOOR]); poly(g, rgba('#ffffff', 0.7), [x + 10, FLOOR, x + 14, FLOOR - h, x + 16, FLOOR]); }
        K.hexShield(g, 160, 130, 120 * k, 0.9 * k, S.T, '#9ae0ff');
        hero(S, P, 160, 262 + (t > punch ? 6 : 0));
        g.restore();
        K.snowfall(g, S.T, 80, 3, { speed: 60, wind: 40 });
        if (t > punch && t < punch + 0.2) flash(g, '#ffffff', 0.7 * (1 - (t - punch) / 0.2));
      }
    },
    bronya: {
      line: 'За Белобог, вперёд!', side: 'r', d: 1.4, team: 'buff', sfx: [[0.1, 'confirm'], [0.6, 'hit'], [0.7, 'hit'], [0.8, 'hit'], [0.95, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.5));
        vgrad(g, 0, LH, [[0, '#24324e'], [1, '#8a9ab8']]);
        rect(g, '#5a4a30', 52, BAR + 2, 3, LH);
        for (let j = 0; j < 12; j++) {
          const x0 = 55 + j * 15, x1 = x0 + 15, o0 = Math.sin(j * 0.6 - S.T * 6) * 6 * j / 12, o1 = Math.sin((j + 1) * 0.6 - S.T * 6) * 6 * (j + 1) / 12, top = BAR + 10;
          poly(g, j % 2 ? '#e8ecf4' : '#f4f6fa', [x0, top + o0, x1, top + o1, x1, top + 90 + o1, x0, top + 90 + o0]);
          poly(g, '#3a72d8', [x0, top + 34 + o0, x1, top + 34 + o1, x1, top + 56 + o1, x0, top + 56 + o0]);
          poly(g, '#d8b050', [x0, top + 86 + o0, x1, top + 86 + o1, x1, top + 90 + o1, x0, top + 90 + o0]);
        }
        for (let i = 0; i < 7; i++) {
          const x = 70 + i * 26, sh = [0.6, 0.7, 0.8][i % 3];
          S.fig('gepard', x, 216, { k: 1, tint: '#141a2e', a: k });
          if (t > sh && t < sh + 0.12) lighter(g, () => glow(g, x + 6, 132, 10, '#ffe0a0', 1 - (t - sh) / 0.12));
        }
        hero(S, P, 250, 262, { flip: true });
      }
    },
    seele: {
      line: 'Не моргай.', side: 'l', d: 1.4, sfx: [[0.1, 'whoosh'], [0.6, 'swing'], [0.75, 'swing'], [0.9, 'swing'], [1.05, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t;
        vgrad(g, 0, LH, [[0, '#0a0618'], [1, '#22104a']]);
        for (let i = 0; i < 24; i++) {
          const ph = S.T * 0.5 + hx(i, 1, 61) * 6, x = 160 + Math.cos(ph * 1.3 + i) * 140 * hx(i, 2, 61), y = 120 + Math.sin(ph * 1.7 + i) * 70;
          butterfly(g, x, y, 3 + hx(i, 3, 61) * 3, S.T * 14 + i, i % 3 ? '#9a7aff' : '#d8c8ff', 0.85);
        }
        hero(S, P, 150, 262, { a: 1 - seg(t, 0.45, 0.55) });
        K.glitch(g, S.T, 100, 60, 120, 150, seg(t, 0.3, 0.55) * 0.9, 3);
        [[0.6, 20, BAR + 20, 300, FLOOR - 30], [0.75, 300, BAR + 10, 40, FLOOR - 10], [0.9, 0, 130, LW, 100]].forEach(([at, x0, y0, x1, y1]) => {
          if (t < at || t > at + 0.22) return;
          const a = 1 - (t - at) / 0.22, k = eOut(cl((t - at) / 0.06));
          lighter(g, () => { line(g, rgba('#8a7aff', a * 0.7), 7, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffffff', a), 2, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
        });
        if (t > 1.05) {
          const a = 1 - seg(t, 1.05, 1.4);
          lighter(g, () => { line(g, rgba('#ffffff', a), 3, 60, BAR + 10, 260, FLOOR - 10); line(g, rgba('#ffffff', a), 3, 260, BAR + 10, 60, FLOOR - 10); glow(g, 160, 120, 90, '#8a7aff', a); });
        }
      }
    },
    sampo: {
      line: 'Сюрприз от Сампо!', side: 'r', v: { mouth: 'open' }, d: 1.4, sfx: [[0.15, 'confirm'], [0.5, 'swing'], [1.0, 'break']],
      act(S, P) {
        const g = S.g, t = S.t;
        backdrop(S, P, 0.45, '#06140c');
        hero(S, P, 100, 262);
        if (t < 0.5) {
          const s = 12 * eOut(seg(t, 0.1, 0.3));
          if (t > 0.08) K.smoke(g, S.T, 150, 150, 5, 20, '#e8e8f0', 0.5 * (1 - seg(t, 0.1, 0.5)));
          if (s > 0) gift(g, 150, 150, s, Math.sin(S.T * 8) * 0.1);
        } else if (t < 1.0) {
          const k = seg(t, 0.5, 1.0);
          gift(g, lerp(150, 262, k), lerp(150, 170, k) - Math.sin(Math.PI * k) * 90, 12, k * 8);
        } else {
          const k = seg(t, 1.0, 1.4);
          lighter(g, () => { for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc0', 1 - k); g.lineWidth = 2; g.beginPath(); g.ellipse(262, 166, 20 + k * 90 + j * 10, 8 + k * 30 + j * 4, 0, S.T * 8 + j, S.T * 8 + j + 4); g.stroke(); } g.lineWidth = 1; glow(g, 262, 166, 70, '#5fe0a8', 1 - k); });
          for (let i = 0; i < 26; i++) { const a = hx(i, 1, 71) * Math.PI * 2, v = 30 + hx(i, 2, 71) * 110; rect(g, ['#ff5a6a', '#ffd04a', '#5ad0ff', '#9aff6a', '#ff9af0'][i % 5], Math.round(262 + Math.cos(a) * v * eOut(k)), Math.round(166 + Math.sin(a) * v * eOut(k) + k * k * 40), 3, 2); }
          if (k < 0.3) flash(g, '#ffffff', 0.6 * (1 - k / 0.3));
        }
      }
    },
    hook: {
      line: 'Смотри, туда! Ха!', side: 'l', v: { mouth: 'open' }, d: 1.35, sfx: [[0.1, 'confirm'], [0.5, 'whoosh'], [1.0, 'break']],
      act(S, P) {
        const g = S.g, t = S.t;
        backdrop(S, P, 0.5, '#1a0800');
        hero(S, P, 96, 262);
        if (t < 0.6) {
          const p = eOut(seg(t, 0.05, 0.2)) * (1 - seg(t, 0.5, 0.6)), cx = 158, cy = 74, pts = [];
          for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = (i % 2 ? 14 : 24) * p; pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
          if (p > 0) { poly(g, '#ffe040', pts); rect(g, '#c82a10', cx - 2, cy - 11 * p, 4, 14 * p); rect(g, '#c82a10', cx - 2, cy + 6 * p, 4, 4 * p); }
        }
        if (t > 0.5 && t < 1.0) {
          const k = eIn(seg(t, 0.5, 1.0)), x = lerp(360, 236, k), y = lerp(-30, 176, k);
          lighter(g, () => { line(g, rgba('#ff7a20', 0.7), 14, x, y, lerp(x, 360, 0.4), lerp(y, -30, 0.4)); glow(g, x, y, 32, '#ff8a30', 0.95); glow(g, x, y, 12, '#fff0c0', 1); });
          K.embers(g, S.T, 30, 13, x - 20, x + 20, y + 10, '#ffd070');
        }
        if (t >= 1.0) {
          const k = seg(t, 1.0, 1.35);
          lighter(g, () => { glow(g, 236, 176, 110 * eOut(k), '#ff7a20', 1 - k); ring(g, rgba('#ffd070', 1 - k), 3, 236, 176, 20 + k * 100); });
          K.sparks(g, S.T, 236, 176, 24, 9, '#ffb050', 80);
          if (k < 0.3) flash(g, '#ffd0a0', 0.6 * (1 - k / 0.3));
        }
      }
    },
    pela: {
      line: 'Цели отмечены.', side: 'r', d: 1.4, sfx: [[0.1, 'select'], [0.32, 'select'], [0.5, 'select'], [0.88, 'break']],
      act(S, P) {
        const g = S.g, t = S.t;
        backdrop(S, P, 0.25, '#001020'); foes(S, P);
        lighter(g, () => { for (let x = 0; x < LW; x += 20) rect(g, 'rgba(74,162,234,0.12)', x, 0, 1, LH); for (let y = 0; y < LH; y += 20) rect(g, 'rgba(74,162,234,0.12)', 0, y, LW, 1); });
        const sy = BAR + ((t * 1.3) % 1) * (FLOOR - BAR);
        lighter(g, () => { rect(g, 'rgba(140,210,255,0.8)', 0, Math.round(sy), LW, 1); rect(g, 'rgba(140,210,255,0.15)', 0, Math.round(sy) - 8, LW, 8); });
        P.foes.forEach((f, i) => {
          const at = 0.22 + i * 0.12, k = eOut(cl((t - at) / 0.2));
          if (k <= 0) return;
          const hw = f.s * (0.35 + (1 - k) * 0.4), cy = f.y - f.s * 0.45, hh = f.s * (0.42 + (1 - k) * 0.4), col = '#ff6a6a';
          for (const [x, y, sx, sy2] of [[f.x - hw, cy - hh, 1, 1], [f.x + hw, cy - hh, -1, 1], [f.x - hw, cy + hh, 1, -1], [f.x + hw, cy + hh, -1, -1]]) { rect(g, col, Math.round(x), Math.round(y), 6 * sx, 1); rect(g, col, Math.round(x), Math.round(y), 1, 6 * sy2); }
          for (let j = 0; j < 3; j++) rect(g, 'rgba(255,140,140,0.8)', Math.round(f.x + hw + 3), Math.round(cy - hh + j * 4), Math.round(4 + hx(i, j, 3) * 12 * k), 2);
        });
        rect(g, '#0a1a2a', 14, FLOOR - 74, 68, 68); rect(g, '#4aa2ea', 14, FLOOR - 74, 68, 1); rect(g, '#4aa2ea', 14, FLOOR - 7, 68, 1);
        g.save(); g.beginPath(); g.rect(16, FLOOR - 72, 64, 64); g.clip(); S.bust(P.look, 48, FLOOR - 6, 64); g.restore();
        if (t > 0.88) {
          const k = seg(t, 0.88, 1.3);
          lighter(g, () => { ring(g, rgba('#8adfff', 1 - k), 3, 160, 120, k * 240); glow(g, 160, 120, 140, '#8adfff', 0.5 * (1 - k)); });
          if (k < 0.2) flash(g, '#ffffff', 0.5 * (1 - k / 0.2));
        }
      }
    },
    ruanmei: {
      line: 'Пусть расцветёт.', side: 'l', d: 1.5, team: 'bloom', sfx: [[0.15, 'glint'], [0.6, 'glint'], [1.0, 'star5']],
      act(S, P) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0.1, 1.2));
        vgrad(g, 0, LH, [[0, '#081c22'], [0.7, '#1e4a4e'], [1, '#3a7a70']]);
        lighter(g, () => { for (let r = 0; r < 5; r++) { g.strokeStyle = rgba('#e8fff8', 0.18); g.beginPath(); for (let x = 0; x <= LW; x += 10) { const y = 60 + r * 30 + Math.sin(x * 0.02 + S.T + r) * 12; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } });
        lighter(g, () => { g.strokeStyle = rgba('#f2d070', 0.8 * k); g.lineWidth = 2; g.beginPath(); g.ellipse(160, 204, 140 * k, 26 * k, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; g.beginPath(); g.ellipse(160, 204, 110 * k, 20 * k, 0, 0, Math.PI * 2); g.stroke(); glow(g, 160, 204, 120 * k, '#8adfff', 0.3); });
        for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2 + S.T * 0.8; flower(g, 160 + Math.cos(q) * 125 * k, 204 + Math.sin(q) * 23 * k, 6, S.T + i, i % 2 ? '#f4d8e4' : '#dff8f8', 0.9 * k); }
        hero(S, P, 160, 262 - 8 * sm(t / 1.5));
        for (let i = 0; i < 30; i++) { const ph = (S.T * 0.25 + hx(i, 1, 81)) % 1, x = hx(i, 2, 81) * LW + Math.sin(S.T * 2 + i) * 10, y = BAR + ph * (FLOOR - BAR); flower(g, x, y, 2 + hx(i, 3, 81) * 2, S.T * 2 + i, i % 2 ? '#f4d8e4' : '#ffffff', 0.85 * (1 - ph * 0.5)); }
      }
    },
    bailu: {
      line: 'Доктор Байлу уже тут!', side: 'r', v: { mouth: 'open' }, d: 1.4, team: 'heal', sfx: [[0.1, 'whoosh'], [0.6, 'crit'], [0.8, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, j = seg(t, 0, 0.8);
        vgrad(g, 0, LH, [[0, '#0a1a2e'], [1, '#2a4a6a']]);
        for (let i = 0; i < 6; i++) ell(g, 'rgba(210,235,255,0.12)', ((i * 70 + S.T * 20) % 400) - 40, BAR + 18 + (i % 3) * 22, 60, 12);
        lighter(g, () => { for (let r = 0; r < 3; r++) { g.strokeStyle = rgba('#7af0e0', 0.5); g.lineWidth = 2; g.beginPath(); g.ellipse(170, 150, 60 + r * 20, 18 + r * 6, -0.15, S.T * 4 + r, S.T * 4 + r + 3); g.stroke(); } g.lineWidth = 1; });
        hero(S, P, lerp(110, 170, j), 262 - Math.sin(Math.PI * j) * 56);
        if (t > 0.6 && t < 0.8) bolt(g, 200, 0, 170, 110, Math.floor(S.T * 30), '#7af0e0', 2);
        if (t > 0.6) for (let i = 0; i < 60; i++) { const ph = ((S.T * 1.4 + hx(i, 1, 91)) % 1), x = hx(i, 2, 91) * LW, y = BAR + ph * (FLOOR - BAR); rect(g, rgba('#9af8e8', 0.7 * cl((t - 0.6) * 4)), Math.round(x), Math.round(y), 1, 5); }
      }
    },
    yanqing: {
      line: 'Мечи, ко мне!', side: 'l', d: 1.5, sfx: [[0.1, 'glint'], [0.5, 'swing'], [0.9, 'whoosh'], [1.2, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, rise = eOut(seg(t, 0, 0.6)), aim = sm(seg(t, 0.6, 0.85)), fly = eIn(seg(t, 0.9, 1.25));
        vgrad(g, 0, LH, [[0, '#0c1a2e'], [1, '#4a7aa8']]);
        K.snowfall(g, S.T, 50, 6, { speed: 30, wind: 20 });
        hero(S, P, 96, 262);
        for (let i = 0; i < 9; i++) {
          const a0 = -Math.PI / 2 + (i - 4) * 0.3, rot = lerp(a0, -0.12 + (i - 4) * 0.05, aim);
          const bx = 110 + Math.cos(a0) * 76 * rise, by = 140 + Math.sin(a0) * 76 * rise;
          sword(g, bx + Math.cos(rot) * fly * 380, by + Math.sin(rot) * fly * 380, rot, 30, rise);
        }
        if (t > 1.2) flash(g, '#c8f0ff', 0.4 * (1 - seg(t, 1.2, 1.5)));
      }
    },
    clara: {
      line: 'Сварог, помоги!', side: 'r', d: 1.5, team: 'guard', sfx: [[0.1, 'rumble'], [0.6, 'steam'], [1.0, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, rise = eOut(seg(t, 0, 0.8)), hand = eOut(seg(t, 0.8, 1.2));
        backdrop(S, P, 0.62, '#0a0614');
        svarog(g, 190, lerp(LH + 220, FLOOR + 40, rise), 1, S.T, seg(t, 0.6, 0.9));
        hero(S, P, 110, 262);
        svarogHand(g, lerp(380, 150, hand), lerp(-70, 70, hand), 1);
        if (t > 1.0) K.hexShield(g, 110, 140, 70 * eOut(seg(t, 1.0, 1.3)), 0.8, S.T, '#ff8a70');
      }
    },
    miyabi: {
      line: 'Клянусь своим клинком.', side: 'l', d: 1.6, sfx: [[0.1, 'glint'], [0.55, 'swing'], [0.66, 'swing'], [0.77, 'swing'], [1.05, 'whoosh'], [1.2, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, still = t > 0.5 && t < 1.15, T = still ? 0.5 : S.T;
        vgrad(g, 0, LH, [[0, '#060c1c'], [0.7, '#1a2c4a'], [1, '#4a6a8c']]);
        poly(g, '#e8f0fa', [0, FLOOR - 26, LW, FLOOR - 40, LW, LH, 0, LH]);
        K.snowfall(g, T, 60, 9, { speed: 26, wind: -12 });
        hero(S, P, 108, 262, { a: t < 1.0 ? 1 : 1 - seg(t, 1.0, 1.1) });
        lighter(g, () => glow(g, 128, 186, 26, '#8adfff', 0.5 * seg(t, 0.1, 0.45) * (t < 1.0 ? 1 : 0)));
        [[0.55, 150, 96, 300, 104], [0.66, 150, 132, 310, 124], [0.77, 150, 160, 300, 170]].forEach(([at, x0, y0, x1, y1]) => {
          if (t < at) return;
          const k = eOut(cl((t - at) / 0.05)), a = t < 1.0 ? 1 : 1 - seg(t, 1.0, 1.15);
          lighter(g, () => { line(g, rgba('#8adfff', a * 0.6), 6, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffffff', a), 1, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
        });
        if (still) rect(g, rgba('#0a1428', 0.25 * Math.sin(seg(t, 0.5, 1.15) * Math.PI)), 0, 0, LW, LH);
        if (t > 1.05) {
          const k = eOut(seg(t, 1.05, 1.2)), a = 1 - seg(t, 1.25, 1.6);
          lighter(g, () => { line(g, rgba('#8adfff', a * 0.7), 10, 40, FLOOR - 10, lerp(40, 300, k), lerp(FLOOR - 10, BAR + 10, k)); line(g, rgba('#ffffff', a), 3, 40, FLOOR - 10, lerp(40, 300, k), lerp(FLOOR - 10, BAR + 10, k)); });
          for (let j = 0; j < 9; j++) crystal(g, 170 + (hx(j, 5, 81) - 0.5) * 120, 120 + (hx(j, 6, 81) - 0.5) * 60, 14 + hx(j, 7, 81) * 18, -Math.PI / 2 + (hx(j, 8, 81) - 0.5) * 2, a * eOut(seg(t, 1.15, 1.3)));
          if (t < 1.25) flash(g, '#e8f8ff', 0.7 * (1 - seg(t, 1.05, 1.25)));
        }
      }
    },
    yanagi: {
      line: 'Враги Секции 6 заплатят.', side: 'r', d: 1.5, sfx: [[0.1, 'glint'], [0.45, 'whoosh'], [0.7, 'swing'], [1.0, 'break'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, slow = seg(t, 0, 0.6);
        vgrad(g, 0, LH, [[0, '#0c0618'], [0.6, '#2a1446'], [1, '#5a2a6a']]);
        ell(g, '#f4f0ff', 260, 54, 22, 22); ell(g, '#1c0e30', 270, 48, 20, 20);
        const cx = 160, cy = 120, R = 70 + 10 * slow;
        lighter(g, () => { ring(g, rgba('#c8b0ff', 0.7), 2, cx, cy, R); ring(g, rgba('#6a4aa8', 0.6), 1, cx, cy, R - 6); });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rect(g, rgba(i % 3 ? '#a890e0' : '#f0e0ff', 0.9), Math.round(cx + Math.sin(a) * (R - 3)), Math.round(cy - Math.cos(a) * (R - 3)), 2, 2); }
        const hand = S.T * (t < 0.6 ? 0.3 : 6);
        lighter(g, () => { line(g, rgba('#f0e0ff', 0.9), 2, cx, cy, cx + Math.sin(hand) * (R - 14), cy - Math.cos(hand) * (R - 14)); line(g, rgba('#f0e0ff', 0.9), 2, cx, cy, cx + Math.sin(hand / 12) * (R - 30), cy - Math.cos(hand / 12) * (R - 30)); });
        hero(S, P, 220, 262, { flip: true });
        if (t > 0.6) {
          const k = eOut(seg(t, 0.6, 0.85)), a = 1 - seg(t, 0.9, 1.3), a0 = Math.PI * 1.15, a1 = a0 + Math.PI * 1.1 * k;
          lighter(g, () => {
            g.strokeStyle = rgba('#c07aff', a * 0.7); g.lineWidth = 9; g.beginPath(); g.arc(200, 150, 96, a0, a1); g.stroke();
            g.strokeStyle = rgba('#ffffff', a); g.lineWidth = 2; g.beginPath(); g.arc(200, 150, 96, a0, a1); g.stroke(); g.lineWidth = 1;
          });
        }
        if (t > 0.95) {
          const a = 1 - seg(t, 1.1, 1.5);
          for (let j = 0; j < 3; j++) bolt(g, 120 + j * 30, BAR, 140 + j * 12, FLOOR - 20, Math.floor(S.T * 24) + j * 5, '#c07aff', 3);
          lighter(g, () => glow(g, 150, FLOOR - 30, 90, '#c07aff', 0.8 * a));
          if (t < 1.1) flash(g, '#f0e0ff', 0.6 * (1 - seg(t, 0.95, 1.1)));
        }
      }
    },
    phrolova: {
      line: 'Занавес поднят. Геката, твой выход.', side: 'l', d: 1.6, sfx: [[0.1, 'glint'], [0.45, 'whoosh'], [0.8, 'ult'], [1.18, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, open = eOut(seg(t, 0, 0.45)), rise = eOut(seg(t, 0.35, 1.0)), burst = seg(t, 1.15, 1.6);
        vgrad(g, 0, LH, [[0, '#14020a'], [0.6, '#3a0814'], [1, '#12020a']]);
        lighter(g, () => poly(g, rgba('#ffe0e8', 0.16 + 0.1 * rise), [148, 0, 172, 0, 236, FLOOR, 84, FLOOR]));
        ell(g, '#2a0610', 160, FLOOR + 4, 140, 22);
        g.strokeStyle = '#c8963a'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(160, FLOOR + 4, 138, 21, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
        const n = 170, hy = FLOOR + 36 - rise * 60, hc = G.foeCanvas('hecate', n, Math.floor(S.T * 2.2) % 2);
        lighter(g, () => glow(g, 206, hy - n * 0.55, 90, '#ff3a78', 0.5 * rise));
        g.save(); g.globalAlpha = 0.25 + 0.75 * rise; g.imageSmoothingEnabled = false;
        g.drawImage(hc, Math.round(206 - n / 2), Math.round(hy - n), n, n);
        g.restore();
        hero(S, P, 92, 262, {});
        const ang = -2.2 + Math.sin(t * 5) * 0.6 + t * 1.2, hx0 = 112, hy0 = 150, tx = hx0 + Math.cos(ang) * 46, ty = hy0 + Math.sin(ang) * 46;
        line(g, '#5a0c18', 2, hx0, hy0, tx, ty);
        lighter(g, () => { glow(g, tx, ty, 16, '#ff2a4a', 0.8); for (let k = 1; k < 7; k++) { const a2 = ang - k * 0.12; ell(g, rgba('#ff4a68', 0.5 - k * 0.07), hx0 + Math.cos(a2) * 46, hy0 + Math.sin(a2) * 46, 2, 2); } });
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 3; line(g, '#ff2a4a', 1, tx, ty, tx + Math.cos(a) * 6, ty + Math.sin(a) * 6); }
        for (const s of [-1, 1]) {
          const edge = s < 0 ? lerp(160, 0, open) : lerp(160, LW, open);
          for (let k = 0; k < 5; k++) { const x0 = s < 0 ? edge - k * 16 : edge + k * 16, x1 = x0 + (s < 0 ? -20 : 20); poly(g, k % 2 ? '#6a0a1a' : '#8e1226', [x0, 0, x1, 0, x1, LH, x0 - s * 6, LH]); }
          poly(g, '#8e1226', s < 0 ? [0, 0, Math.max(0, edge - 70), 0, Math.max(0, edge - 76), LH, 0, LH] : [LW, 0, Math.min(LW, edge + 70), 0, Math.min(LW, edge + 76), LH, LW, LH]);
        }
        if (t > 0.6) for (let i = 0; i < 24; i++) { const ph = (t * 0.7 + hx(i, 3, 95)) % 1, x = 30 + hx(i, 4, 95) * 260 + Math.sin(t * 2 + i) * 14, y = BAR + ph * (FLOOR - BAR); ell(g, rgba(i % 2 ? '#ff3a5a' : '#b81830', 0.9), x, y, 2, 1, t * 3 + i); }
        if (burst > 0) {
          lighter(g, () => { glow(g, 206, 110, 140 * eOut(burst), '#ff4a78', 0.7 * (1 - burst)); ring(g, rgba('#ffd0dc', 1 - burst), 2, 206, 110, 20 + burst * 160); });
          if (burst < 0.25) flash(g, '#ffe8ee', 0.6 * (1 - burst / 0.25));
        }
      }
    },
    scar: {
      line: 'Сказка кончилась. Начинается кошмар.', side: 'r', d: 1.6, sfx: [[0.1, 'glint'], [0.4, 'rumble'], [0.85, 'break'], [1.15, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, grow = eOut(seg(t, 0.25, 0.85)), turn = seg(t, 0.85, 1.05), roar = seg(t, 1.05, 1.6);
        vgrad(g, 0, LH, [[0, '#05040c'], [0.6, '#1a0a14'], [1, '#2a1006']]);
        g.save(); g.beginPath(); g.ellipse(160, 130, 150, 120, 0, 0, Math.PI * 2); g.clip();
        g.strokeStyle = rgba('#ff7a3a', 0.15 + 0.15 * grow); g.lineWidth = 1;
        for (let r = -8; r <= 8; r++) for (let q = -10; q <= 10; q++) { const x = 160 + q * 21, y = 130 + r * 24 + (q % 2 ? 12 : 0); g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; if (k) g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); else g.moveTo(x + 14, y); } g.stroke(); }
        g.restore();
        for (let i = 0; i < 20; i++) { const ph = (S.T * 0.5 + hx(i, 5, 96)) % 1; rect(g, rgba(i % 2 ? '#ffb060' : '#ff6a20', 1 - ph), Math.round(20 + hx(i, 6, 96) * 280), Math.round(FLOOR - ph * 160), 2, 2); }
        const n = Math.round(lerp(150, 236, grow)), nc = G.foeCanvas('scar_nightmare', n, Math.floor(S.T * 2.2) % 2), nx = 160 - n / 2, ny = FLOOR + 16 - n;
        g.save(); g.imageSmoothingEnabled = false;
        g.globalAlpha = turn > 0 ? 1 : 0.18 + 0.3 * grow;
        g.drawImage(nc, Math.round(nx), Math.round(ny), n, n);
        if (turn <= 0) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(10,4,16,0.75)'; g.fillRect(nx, ny, n, n); }
        g.restore();
        lighter(g, () => { for (const [ex, ey] of [[44.6, 19], [46.2, 24.4], [45.6, 30], [55.4, 19], [53.8, 24.4], [54.4, 30]]) glow(g, nx + ex * n / 100, ny + ey * n / 100, 6, '#ffe040', 0.4 + 0.6 * grow); });
        hero(S, P, 160, 262, { a: 1 - turn });
        if (turn > 0 && turn < 1) flash(g, '#f0e0ff', 0.75 * Math.sin(turn * Math.PI));
        if (roar > 0) {
          lighter(g, () => { for (let k = 0; k < 3; k++) ring(g, rgba(k ? '#c890ff' : '#ffb060', (1 - roar) * (1 - k * 0.25)), 3 - k, 160, 110, 20 + roar * (150 + k * 30)); glow(g, 160, 120, 120 * roar, '#a060ff', 0.5 * (1 - roar)); });
          K.sparks(g, S.T, 160, 120, 18, 31, '#ffb060', 110);
        }
      }
    },
    kafka: {
      line: 'Пришла пора прощаться...', side: 'r', d: 1.6, sfx: [[0.1, 'glint'], [0.5, 'whoosh'], [0.95, 'break'], [1.15, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, raise = eOut(seg(t, 0.2, 0.6)), strike = seg(t, 0.9, 1.6);
        vgrad(g, 0, LH, [[0, '#0a0410'], [0.6, '#2a0a24'], [1, '#14040e']]);
        lighter(g, () => poly(g, rgba('#ffd8ee', 0.12 + 0.08 * raise), [96, 0, 132, 0, 196, FLOOR, 30, FLOOR]));
        ell(g, '#1a0612', 112, FLOOR + 2, 80, 10);
        for (let i = 0; i < 14; i++) { const x = 6 + i * 22; poly(g, i % 2 ? '#4a0c1e' : '#6a1228', [x, 0, x + 22, 0, x + 26, 16 + (i % 3) * 3, x - 4, 16 + (i % 3) * 3]); }
        web(g, 250, 70, 62 * eOut(seg(t, 0.3, 0.9)), cl(t * 2) * (1 - strike * 0.6), T * 0.2);
        hero(S, P, 112, 262, { v: t > 0.9 ? { closed: true } : null });
        const hx0 = 132, hy0 = 128 - raise * 26;
        for (let i = 0; i < 6; i++) {
          const k = eOut(seg(t, 0.45 + i * 0.04, 0.85 + i * 0.04)), q = -0.7 + i * 0.28, x1 = hx0 + Math.cos(q) * 190 * k, y1 = hy0 + Math.sin(q) * 120 * k;
          if (k > 0) lighter(g, () => line(g, rgba('#f4d8ff', 0.75 * (1 - strike)), 1, hx0, hy0, x1, y1));
        }
        lighter(g, () => glow(g, hx0, hy0, 14, '#e070ff', 0.6 * raise));
        if (t > 0.9) {
          for (let j = 0; j < 4; j++) bolt(g, 190 + j * 34, BAR, 200 + j * 24 + Math.sin(T * 30 + j) * 6, FLOOR - 20, Math.floor(T * 22) + j * 9, '#c07aff', 3);
          lighter(g, () => glow(g, 240, 150, 110, '#c07aff', 0.75 * (1 - strike)));
          if (t < 1.05) flash(g, '#f4e0ff', 0.65 * (1 - seg(t, 0.9, 1.05)));
        }
        for (let i = 0; i < 8; i++) { const ph = (T * 0.4 + hx(i, 2, 91)) % 1, x = 30 + hx(i, 3, 91) * 260, y = FLOOR - 10 - ph * 140; rect(g, rgba(i % 2 ? '#ffb8e0' : '#e0b8ff', 0.8 * Math.sin(ph * Math.PI)), Math.round(x), Math.round(y), 2, 2); rect(g, rgba('#ffb8e0', 0.8 * Math.sin(ph * Math.PI)), Math.round(x + 2), Math.round(y - 6), 1, 6); }
      }
    },
    silverwolf: {
      line: 'С такой-то скоростью? Слишком медленно!', side: 'l', d: 1.6, sfx: [[0.1, 'select'], [0.35, 'select'], [0.6, 'select'], [0.95, 'break'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, stamp = eOut(seg(t, 0.95, 1.12));
        vgrad(g, 0, LH, [[0, '#02041a'], [0.6, '#0a1440'], [1, '#160c3a']]);
        const hy = 150;
        for (let i = -10; i <= 10; i++) line(g, rgba('#7a8aff', 0.35), 1, 160 + i * 6, hy, 160 + i * 44, LH);
        for (let i = 0; i < 6; i++) { const k = ((i + (T * 0.8) % 1) / 6), y = hy + (LH - hy) * k * k; line(g, rgba('#8aa0ff', 0.15 + 0.4 * k), 1, 0, y, LW, y); }
        hackWin(g, 176, 46, 92, 46, 'ИЗМЕНИТЬ?', '#7a6af0', seg(t, 0.15, 0.3), 1, T);
        hackWin(g, 214, 104, 80, 40, 'ЗАЩИТА −45%', '#50dcff', seg(t, 0.4, 0.55), 2, T);
        hackWin(g, 170, 150, 70, 34, 'БАГ.EXE', '#ff5a8a', seg(t, 0.65, 0.8), 3, T);
        hero(S, P, 90, 262);
        lighter(g, () => glow(g, 112, 140, 20, '#7a6af0', 0.5 + 0.2 * Math.sin(T * 9)));
        K.glitch(g, T, 150, 30, 160, 170, 0.35 + 0.5 * seg(t, 0.8, 0.95), 7);
        if (t > 0.95) {
          const s = lerp(2.4, 1, stamp), a = 1 - seg(t, 1.35, 1.6);
          g.save(); g.translate(234, 112); g.rotate(-0.18); g.scale(s, s);
          g.strokeStyle = rgba('#ff3a6a', a); g.lineWidth = 3; g.strokeRect(-58, -18, 116, 36); g.lineWidth = 1;
          g.fillStyle = rgba('#ff3a6a', a); g.font = 'bold 22px Tahoma, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ЗАБАНЕН', 0, 1);
          g.restore();
          if (t < 1.1) flash(g, '#d8d0ff', 0.6 * (1 - seg(t, 0.95, 1.1)));
          for (let i = 0; i < 18; i++) { const q = hx(i, 4, 31) * Math.PI * 2, r = 20 + stamp * 90 * hx(i, 5, 31); rect(g, rgba(i % 2 ? '#7a6af0' : '#50dcff', a), Math.round(234 + Math.cos(q) * r), Math.round(112 + Math.sin(q) * r * 0.6), 4, 4); }
        }
      }
    },
    blade: {
      line: 'Этот рай для меня недостижим...', side: 'r', d: 1.6, sfx: [[0.1, 'swing'], [0.5, 'whoosh'], [0.95, 'swing'], [1.05, 'swing'], [1.2, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.15, 0.7)), cut = seg(t, 0.95, 1.6);
        vgrad(g, 0, LH, [[0, '#0a0206'], [0.5, '#3a0a10'], [1, '#6a1414']]);
        lighter(g, () => glow(g, 220, 70, 70, '#ff4a32', 0.5));
        ell(g, '#c8322a', 220, 70, 30, 30); ell(g, '#e04a36', 214, 64, 24, 24);
        poly(g, '#14060a', [0, FLOOR - 20, 60, FLOOR - 30, 140, FLOOR - 24, 220, FLOOR - 34, LW, FLOOR - 26, LW, LH, 0, LH]);
        for (let i = 0; i < 10; i++) { const x = 20 + i * 32 + hx(i, 1, 51) * 10, h = 14 + hx(i, 2, 51) * 18; line(g, '#4a4650', 2, x, FLOOR - 26, x + (hx(i, 3, 51) - 0.5) * 8, FLOOR - 26 - h); rect(g, '#1a1418', Math.round(x - 4), Math.round(FLOOR - 28 - h), 8, 2); }
        hero(S, P, 96, 262, { tint: t < 0.12 ? '#ff4a3a' : null });
        crackBlade(g, 124, 188 - rise * 70, -0.9 - rise * 0.5, 96, 1, 0.4 + 0.6 * rise);
        if (t < 0.9) for (let i = 0; i < 10; i++) { const ph = (T * 0.9 + hx(i, 6, 51)) % 1, x = 60 + hx(i, 7, 51) * 90; rect(g, rgba('#ff6a4a', 0.8 * (1 - ph)), Math.round(x), Math.round(FLOOR - 20 - ph * 120), 1, 3); }
        if (t > 0.95) {
          const a = 1 - seg(t, 1.25, 1.6);
          [[0.95, 40, BAR + 10, 300, FLOOR - 10], [1.05, 300, BAR + 10, 40, FLOOR - 10]].forEach(([at, x0, y0, x1, y1]) => {
            if (t < at) return;
            const k = eOut(cl((t - at) / 0.07));
            lighter(g, () => { line(g, rgba('#ff3a2a', 0.7 * a), 10, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffe0d0', a), 2, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
          });
          for (let i = 0; i < 26; i++) { const q = hx(i, 8, 51) * Math.PI * 2, r = 10 + eOut(cut) * 120 * hx(i, 9, 51); rect(g, rgba(i % 3 ? '#ff5a3a' : '#ffd0c0', a), Math.round(170 + Math.cos(q) * r), Math.round(120 + Math.sin(q) * r * 0.7), 2, 1); }
          if (t < 1.12) flash(g, '#ffd8d0', 0.55 * (1 - seg(t, 0.95, 1.12)));
        }
      }
    },
    kazuma: {
      line: 'Кража!', side: 'r', v: { mouth: 'open' }, d: 1.45, sfx: [[0.1, 'glint'], [0.42, 'whoosh'], [0.62, 'chest'], [1.0, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, c = foeCenter(P), reach = eOut(seg(t, 0.08, 0.5)), grab = seg(t, 0.5, 0.62), back = eIn(seg(t, 0.62, 0.95)), show = seg(t, 0.95, 1.45);
        backdrop(S, P, 0.35, '#041a0c'); foes(S, P, { flash: grab > 0 && grab < 1 ? 0.6 : 0 });
        K.speedLines(g, S.T, c.x, c.y, 24, '#c8ffd8', 0.35 * (1 - back), 60);
        const hx0 = 96, hy0 = 168, px = lerp(hx0, c.x - 6, reach * (1 - back)), py = lerp(hy0, c.y, reach * (1 - back));
        if (t < 0.95) {
          lighter(g, () => line(g, rgba('#9affb0', 0.5 * reach * (1 - back)), 2, hx0, hy0, px, py));
          stealHand(g, px, py, 1.4, 1, '#9affb0');
        }
        if (grab > 0 && grab < 1) { lighter(g, () => glow(g, c.x, c.y, 60 * grab, '#ffffff', 0.9 * (1 - grab))); K.sparks(g, S.T, c.x, c.y, 16, 7, '#d8ffe0', 60); }
        if (t > 0.62) {
          const ix = t < 0.95 ? lerp(c.x, 108, back) : 108, iy = t < 0.95 ? lerp(c.y, 120, back) - Math.sin(back * Math.PI) * 30 : 112 - Math.sin(show * 6) * 2;
          g.save(); g.translate(ix, iy); g.rotate(t < 0.95 ? back * 7 : -0.6);
          lighter(g, () => glow(g, 0, 0, 22, '#ffe080', 0.5));
          poly(g, '#d8dce8', [-2, -26, 2, -26, 3, 8, -3, 8]); rect(g, '#c8a040', -8, 8, 16, 3); rect(g, '#3a2a1a', -2, 11, 4, 9);
          g.restore();
        }
        hero(S, P, 96, 262, {});
        if (show > 0) { K.sparks(g, S.T, 108, 112, 10, 3, '#ffe8a0', 40); lighter(g, () => glow(g, 108, 112, 30, '#ffe080', 0.4 * (1 - show))); }
      }
    },
    aqua: {
      line: 'Священное создание воды!', side: 'l', v: { mouth: 'open' }, d: 1.5, sfx: [[0.1, 'buff'], [0.42, 'splash'], [0.75, 'splash'], [1.1, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, c = foeCenter(P), bloom = eOut(seg(t, 0.05, 0.4)), pour = seg(t, 0.35, 1.05), freeze = seg(t, 1.0, 1.5);
        backdrop(S, P, 0.3, '#06203a'); foes(S, P);
        for (let i = 0; i < 6; i++) flower(g, 70 + Math.cos(i + S.T) * 22 * bloom, 96 + Math.sin(i * 1.3 + S.T) * 8 * bloom, 5, S.T + i, i % 2 ? '#f2bcd8' : '#bfe8ff', 0.8 * bloom);
        lighter(g, () => glow(g, 70, 96, 30, '#bfe8ff', 0.6 * bloom));
        if (pour > 0) {
          const top = BAR, h = (FLOOR - top) * cl(pour * 1.6);
          for (let i = 0; i < 9; i++) {
            const x = c.x - 70 + i * 17 + Math.sin(S.T * 5 + i) * 3, w = 10 + hx(i, 2, 61) * 6;
            rect(g, rgba(freeze > 0 ? '#d8f4ff' : '#4a9ae8', 0.55 * (1 - freeze * 0.4)), Math.round(x), top, Math.round(w), Math.round(h));
            rect(g, rgba('#bfe8ff', 0.4), Math.round(x + 2), top, 2, Math.round(h));
          }
          if (pour > 0.6) for (let i = 0; i < 10; i++) ell(g, rgba('#bfe8ff', 0.6 * (1 - freeze)), c.x - 80 + i * 18, FLOOR - 8 - Math.abs(Math.sin(S.T * 8 + i)) * 10, 8, 3);
        }
        if (freeze > 0) {
          for (let i = 0; i < 14; i++) {
            const a = -Math.PI / 2 + (i - 7) * 0.22, len = (24 + hx(i, 3, 62) * 30) * eOut(freeze), x0 = c.x - 70 + i * 11;
            poly(g, rgba('#e8fbff', 0.9), [x0, FLOOR - 4, x0 + Math.cos(a) * len * 0.2 - 3, FLOOR - 4 + Math.sin(a) * len * 0.5, x0 + Math.cos(a) * len * 0.1, FLOOR - 4 + Math.sin(a) * len, x0 + 3, FLOOR - 4 + Math.sin(a) * len * 0.5]);
          }
          if (freeze < 0.2) flash(g, '#ffffff', 0.7 * (1 - freeze / 0.2));
        }
        hero(S, P, 70, 262, {});
      }
    },
    megumin: {
      line: 'Взрыв!', side: 'r', v: { mouth: 'open' }, d: 1.6, sfx: [[0.1, 'glint'], [0.35, 'tech'], [0.72, 'rumble'], [0.95, 'break'], [1.02, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, c = foeCenter(P), circ = seg(t, 0.05, 0.75), beam = seg(t, 0.72, 0.9), blast = seg(t, 0.88, 1.6);
        vgrad(g, 0, LH, [[0, '#120610'], [0.55, '#3a1418'], [1, '#1a0a0a']]);
        K.stars(g, S.T, 40, 9, 0.6, 120);
        foes(S, P, { flash: blast > 0 && blast < 0.3 ? 0.8 : 0 });
        for (let i = 0; i < 4; i++) {
          const k = eOut(cl((circ - i * 0.18) / 0.4));
          runeCircle(g, c.x, c.y - 70 - i * 16, (40 + i * 10) * k, (10 + i * 2.5) * k, S.T * (i % 2 ? -1.5 : 1.5), i % 2 ? '#ff6a5a' : '#ffb070', 0.9 * k * (1 - blast));
        }
        if (beam > 0 && blast < 0.4) lighter(g, () => { rect(g, rgba('#fff4e0', 0.9), Math.round(c.x - 4 - beam * 3), BAR, Math.round(8 + beam * 6), Math.round(c.y - BAR)); glow(g, c.x, c.y, 30, '#ffffff', 0.8); });
        if (blast > 0) {
          boom(g, c.x, c.y, blast, S.T, '#ff6a20');
          K.sparks(g, S.T, c.x, c.y, 26, 13, '#ffb050', 140);
          if (blast < 0.15) flash(g, '#fff0e0', 0.9 * (1 - blast / 0.15));
        }
        if (t < 1.35) hero(S, P, 64, 262, {});
        else { const fall = eOut(seg(t, 1.35, 1.6)); hero(S, P, lerp(64, 40, fall), lerp(262, FLOOR + 2, fall), { rot: fall * Math.PI / 2 }); }
      }
    },
    darkness: {
      line: 'Все удары мне! Ещё!', side: 'l', v: { blush: true }, d: 1.45, team: 'shield', sfx: [[0.1, 'swing'], [0.4, 'shield'], [0.65, 'hit'], [0.85, 'hit'], [1.05, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, plant = eOut(seg(t, 0.05, 0.35)), wall = seg(t, 0.3, 0.6);
        backdrop(S, P, 0.35, '#1a0410');
        K.hexShield(g, 150, 180, 70 * eOut(wall), 0.7 * cl(wall * 2), S.T, '#ff9ac8');
        for (let i = 0; i < 5; i++) {
          const lt = t - 0.55 - i * 0.16;
          if (lt < 0 || lt > 0.3) continue;
          const k = lt / 0.3, y = 150 + (i % 3) * 22, x = lerp(330, 170, k);
          lighter(g, () => { line(g, rgba('#ffffff', 1 - k * 0.5), 2, x, y, x + 30, y - 6); glow(g, x, y, 10, '#ffd0e0', 0.7); });
          if (k > 0.85) K.shards(g, (k - 0.85) * 4, 168, y, 8, i, '#ffd0e0', 24, '#ffffff');
        }
        g.save(); g.translate(176, FLOOR); g.rotate(-0.05);
        poly(g, '#c8ccd8', [-3, -lerp(10, 92, plant), 3, -lerp(10, 92, plant), 2, 6, -2, 6]); rect(g, '#d8b050', -10, -lerp(10, 92, plant) - 2, 20, 3); rect(g, '#3a2a30', -2, -lerp(10, 92, plant) - 16, 4, 14);
        g.restore();
        hero(S, P, 150, 262, {});
        for (let i = 0; i < 6; i++) { const ph = (S.T * 0.7 + i / 6) % 1; if (t > 0.6) heart(g, 130 + (hx(i, 2, 77) - 0.5) * 60, 120 - ph * 70, 3, '#ff7ab8', (1 - ph) * cl((t - 0.6) * 3)); }
      }
    }
  };

  class UltShow {
    constructor(ui, u, o = {}) {
      this.ui = ui; this.game = ui.game; this.u = u;
      const forced = o.outfit !== undefined;
      this.outfit = forced ? o.outfit : H.wornOutfit ? H.wornOutfit(u.charId, this.game) : null;
      this.def = (H.outfitCutOf && H.outfitCutOf(this.outfit, 'ult')) || SHOWS[u.charId] || SHOWS.trail;
      const ch = H.CHARS[u.charId] || {}, el = H.ELEMENTS[u.elem] || H.ELEMENTS.phys;
      const lookOf = a => (a !== u || !forced ? G.lookOf(a.charId, this.game) : this.outfit ? H.outfitLook(this.outfit, this.game.state.gender) : G.lookOf(a.charId, null));
      this.P = {
        u, id: u.charId, elem: u.elem, col: el.col, rar: ch.rarity || 4, name: o.name || (ch.ult && ch.ult.name) || '', look: lookOf(u),
        foes: o.foes || [], allies: (o.allies || [u]).map(a => ({ u: a, look: lookOf(a) })), bg: o.bg || 'station'
      };
      this.beats = [{ id: 'in', d: IN, sfx: [[0, 'ult'], [0.32, 'glint']] }, { id: 'act', d: this.def.d, sfx: this.def.sfx }];
      if (this.P.foes.length) this.beats.push({ id: 'hit', d: HIT, sfx: [[0.08, 'crit'], [0.22, 'hit']] });
      else this.beats.push({ id: 'team', d: TEAM, sfx: [[0.06, this.def.team === 'heal' ? 'heal' : this.def.team === 'shield' || this.def.team === 'guard' ? 'shield' : 'buff']] });
      this.i = 0; this.t = 0; this.T = 0; this.cue = 0; this.fade = 0; this.done = false;
    }

    get length() { return this.beats.reduce((a, b) => a + b.d, 0) + FADE; }
    get beat() { return this.beats[this.i]; }
    get fading() { return this.fade > 0; }

    tick(dt) {
      if (this.done) return;
      if (this.fade > 0) { this.fade += dt; if (this.fade >= FADE) this.done = true; return; }
      this.t += dt; this.T += dt;
      const b = this.beat, cues = b.sfx || [];
      while (this.cue < cues.length && cues[this.cue][0] <= this.t) this.ui.sfx(cues[this.cue++][1]);
      if (this.t >= b.d) {
        if (this.i < this.beats.length - 1) { this.i++; this.t = 0; this.cue = 0; }
        else this.fade = 0.001;
      }
    }

    skip() { if (!this.fade) this.fade = 0.001; }

    render() {
      const cv = buf.cv || (buf.cv = G.mkCanvas(LW, LH)), g = cv.getContext('2d'), b = this.beat;
      g.save();
      g.imageSmoothingEnabled = false;
      const S = H.Cine.stage(g, this.game, this.T);
      S.t = Math.min(this.t, b.d); S.d = b.d;
      if (b.id === 'in') cutIn(S, this.P, this.def);
      else if (b.id === 'act') this.def.act(S, this.P);
      else if (b.id === 'hit') hitBeat(S, this.P, this.def);
      else teamBeat(S, this.P, this.def);
      g.restore();
      if (this.i === 0 && this.t < 0.12) flash(g, '#ffffff', 1 - this.t / 0.12);
      else if (this.i > 0 && this.t < 0.08) flash(g, '#ffffff', 0.5 * (1 - this.t / 0.08));
      H.Cine.dither(g);
      return cv;
    }

    draw(c) {
      const ui = this.ui, P = this.P, b = this.beat, t = this.t, cv = this.render();
      c.save();
      c.globalAlpha = this.fade > 0 ? 1 - cl(this.fade / FADE) : 1;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, W, HGT);
      c.fillStyle = '#000000'; c.fillRect(0, 0, W, BAR * 2); c.fillRect(0, HGT - BAR * 2, W, BAR * 2);
      c.fillStyle = rgba(P.col, 0.7); c.fillRect(0, BAR * 2 - 1, W, 1); c.fillRect(0, HGT - BAR * 2, W, 1);
      if (b.id === 'in') {
        const k = eOut(cl((t - 0.1) / 0.3)), right = this.def.side === 'l', x = right ? W - 28 : 28, al = right ? 'right' : 'left', off = (1 - k) * (right ? 180 : -180);
        c.globalAlpha *= k;
        ui.text('АБСОЛЮТНАЯ ТЕХНИКА', x + off, HGT - 54, { align: al, size: 10, bold: true, col: G.light(P.col, 0.3) });
        ui.text(P.name, x + off, HGT - 40, { align: al, size: 20, bold: true, serif: true, col: C.gold });
        const nw = ui.measure(P.u.name, 12, true);
        ui.text(P.u.name, 14, 20, { size: 12, bold: true, col: C.cream });
        for (let i = 0; i < P.rar; i++) ui.diamond(14 + nw + 12 + i * 11, 27, 4, P.rar >= 5 ? C.gold : '#c0a0ff');
      } else {
        ui.text(P.name, 14, 22, { size: 11, bold: true, serif: true, col: C.gold });
        if (b.id === 'act' && this.def.line && t > 0.1) {
          c.globalAlpha *= cl((t - 0.1) / 0.15);
          ui.text(P.u.name, W / 2, HGT - BAR * 2 + 10, { align: 'center', size: 11, bold: true, serif: true, col: C.gold });
          ui.text(this.def.line, W / 2, HGT - BAR * 2 + 27, { align: 'center', size: 13, col: C.cream });
        }
      }
      c.restore();
      if (!this.fade) {
        ui.hints([['Esc', 'Пропустить']], W - 12, 20, { align: 'right' });
        ui.hit(0, 0, W, HGT, () => this.skip());
      }
    }
  }

  H.Ults = { SHOWS, Show: UltShow, BURST, TEAM_FX, TEAM_TINT, Stage: { backdrop, foes, foeCenter }, Art: { star5, bolt, crystal, flower, butterfly, sword, gift, svarog, svarogHand, web, hackWin, crackBlade }, MODES: [{ id: 'on', tag: 'Всегда' }, { id: 'first', tag: 'Первая в бою' }, { id: 'off', tag: 'Выкл.' }] };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
