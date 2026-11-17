(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, ST = H.Ults.Stage;
  const { W, HGT, C } = H.UI_CONST;
  const { LW, LH, BAR, cl, lerp, eOut, eIn, seg, hx, rgba, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const A = H.Ults.Art, BURST = H.Ults.BURST;
  const FADE = 0.2, LINE_AT = 0.1;
  const FOLLOW_D = 0.5, CHAIN_D = 0.3, LINGER = 0.3, PANEL_H = 58, PANEL_Y = 262, PANEL_STEP = 40, PANEL_MAX = 3, ORDER_W = 66;
  const MARKS = { follow: 'БОНУС-АТАКА', counter: 'КОНТРАТАКА', action: 'БОНУС-ДЕЙСТВИЕ' };
  const FLOOR = LH - BAR;
  const buf = { cv: null };

  function mainFoe(P) {
    if (!P.foes.length) return { x: 210, y: 150, s: 40 };
    const byX = P.foes.slice().sort((a, b) => a.x - b.x);
    return byX[Math.floor((byX.length - 1) / 2)];
  }

  function blastOrder(P) {
    const m = mainFoe(P), rest = P.foes.filter(f => f !== m).sort((a, b) => a.x - b.x);
    return P.foes.length ? [rest[0], m, rest[1]].filter(Boolean) : [];
  }

  function flake(g, x, y, r, rot, col) {
    for (let i = 0; i < 6; i++) {
      const a = rot + i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
      line(g, col, 1, x, y, x + c * r, y + s * r);
      for (const q of [0.45, 0.72]) {
        const bx = x + c * r * q, by = y + s * r * q, w = r * 0.22 * (1.1 - q);
        line(g, col, 1, bx, by, bx + Math.cos(a + 0.8) * w, by + Math.sin(a + 0.8) * w);
        line(g, col, 1, bx, by, bx + Math.cos(a - 0.8) * w, by + Math.sin(a - 0.8) * w);
      }
    }
  }

  function caseWeapon(g, x0, y0, spin, heat) {
    g.save(); g.translate(x0, y0); g.scale(1.8, 1.8);
    drawCase(g, 0, 0, spin, heat);
    g.restore();
  }

  function drawCase(g, x, y, spin, heat) {
    rect(g, '#3a1a1c', x - 8, y - 6, 16, 12);
    rect(g, '#c8a050', x - 8, y - 6, 16, 2);
    rect(g, '#1a0c0e', x - 2, y - 9, 4, 3);
    for (const dx of [-4, 4]) {
      ring(g, rgba('#ffb060', 0.5 + 0.5 * heat), 1, x + dx, y + 1, 3);
      line(g, '#ffd080', 1, x + dx, y + 1, x + dx + Math.cos(spin) * 3, y + 1 + Math.sin(spin) * 3);
    }
    if (heat > 0) lighter(g, () => glow(g, x, y, 14 + heat * 10, '#ff6a20', 0.5 * heat));
  }

  function hitAll(g, P, t, at, step, kind) {
    P.foes.forEach((f, i) => { const t0 = at + i * step; if (t > t0) BURST[kind](g, f.x, f.y - f.s * 0.4, f.s, t - t0, i); });
  }

  function flashOf(P, t, at, step, len) {
    return P.foes.some((f, i) => t > at + i * step && t < at + i * step + len) ? 0.5 : 0;
  }

  function bat(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    poly(g, '#8a8a96', [0, -2, 44, -3.5, 46, 0, 44, 3.5, 0, 2]);
    rect(g, '#2a2a34', -10, -2, 12, 4);
    line(g, '#d8d8e0', 1, 8, -1, 42, -2);
    g.restore();
  }

  function needle(g, x, y, len, rot, a) {
    const c = Math.cos(rot), s = Math.sin(rot);
    line(g, rgba('#bfefff', a), 2, x - c * len, y - s * len, x, y);
    line(g, rgba('#ffffff', a), 1, x - c * len * 0.5, y - s * len * 0.5, x, y);
  }

  function pup(g, x, y, open) {
    ell(g, '#f0e8dc', x, y, 9, 6);
    ell(g, '#f0e8dc', x + 8, y - 6, 6, 5);
    poly(g, '#a0603a', [x + 4, y - 10, x + 7, y - 16, x + 9, y - 10]);
    poly(g, '#a0603a', [x + 9, y - 10, x + 12, y - 15, x + 13, y - 9]);
    rect(g, '#1a1418', x + 10, y - 7, 1, 1);
    rect(g, '#1a1418', x + 13, y - 5, 2, 1 + (open ? 2 : 0));
    for (const dx of [-6, -1, 4]) rect(g, '#e0d8cc', x + dx, y + 4, 2, 4);
  }

  function mateOf(P) {
    const m = P.allies.find(a => a.u !== P.u);
    return m ? { look: m.look, x: 232, self: false } : { look: P.look, x: 84, self: true };
  }

  function crossMark(g, x, y, s, col, a) {
    rect(g, rgba(col, a), x - s, y - s * 0.3, s * 2, s * 0.6);
    rect(g, rgba(col, a), x - s * 0.3, y - s, s * 0.6, s * 2);
  }

  function hopPath(P, tip, start, hop, t) {
    const hops = P.foes.length ? [P.foes[0], P.foes[Math.floor(P.foes.length / 2)], P.foes[P.foes.length - 1]] : [];
    const top = f => ({ x: f.x, y: f.y - f.s * 0.5 }), end = start + hops.length * hop;
    if (t < start || !hops.length) return { o: tip, hops, end };
    if (t < end) {
      const k = (t - start) / hop, i = Math.min(hops.length - 1, Math.floor(k)), q = k - i, from = i ? top(hops[i - 1]) : tip, to = top(hops[i]);
      return { o: { x: lerp(from.x, to.x, q), y: lerp(from.y, to.y, q) - Math.sin(q * Math.PI) * 24 }, hops, end };
    }
    return { o: null, hops, end };
  }

  function bottle(g, x, y, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    ell(g, rgba(col, 0.9), 0, 2, 4, 5); rect(g, '#d8d0c0', -1.5, -6, 3, 4); rect(g, '#8a5a3a', -2, -8, 4, 2);
    ell(g, rgba('#ffffff', 0.6), -1.5, 0, 1, 2);
    g.restore();
  }

  function shovel(g, x, y, rot, len, heat) {
    g.save(); g.translate(x, y); g.rotate(rot);
    line(g, '#6a4a2a', 3, 0, 0, len, 0);
    poly(g, '#8a8a96', [len, -7, len + 18, -6, len + 22, 0, len + 18, 6, len, 7]);
    line(g, '#c8c8d0', 1, len + 2, -5, len + 18, -4);
    g.restore();
    if (heat > 0) lighter(g, () => glow(g, x + Math.cos(rot) * (len + 12), y + Math.sin(rot) * (len + 12), 14 + heat * 16, '#ff6a20', 0.7 * heat));
  }

  function numby(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    ell(g, '#ffb040', 0, 0, 9, 7);
    ell(g, '#ffe080', -2, -2, 5, 3);
    poly(g, '#ff8a20', [-6, -5, -4, -11, -1, -6]);
    poly(g, '#ff8a20', [2, -6, 5, -11, 6, -5]);
    ell(g, '#ffd0a0', 8, 1, 3, 2.5);
    rect(g, '#2a1a0a', 3, -2, 1, 2);
    for (const dx of [-5, 3]) rect(g, '#e07020', dx, 5, 2, 3);
    g.restore();
  }

  function rose(g, x, y, r, col) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ell(g, col, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.55, r * 0.55); }
    ell(g, '#ffd0d8', x, y, r * 0.35, r * 0.35);
  }

  function dialog(g, x, y, a, press) {
    const w = 64, h = 34;
    rect(g, rgba('#c0c0c0', a), x, y, w, h);
    rect(g, rgba('#ffffff', a), x, y, w, 1); rect(g, rgba('#ffffff', a), x, y, 1, h);
    rect(g, rgba('#404040', a), x, y + h - 1, w, 1); rect(g, rgba('#404040', a), x + w - 1, y, 1, h);
    rect(g, rgba('#000080', a), x + 2, y + 2, w - 4, 7);
    rect(g, rgba('#ffffff', a), x + 4, y + 4, 18, 2);
    ell(g, rgba('#ffffff', a), x + 10, y + 16, 4, 4); rect(g, rgba('#000080', a), x + 9, y + 13, 2, 3); rect(g, rgba('#000080', a), x + 9, y + 17, 2, 1);
    rect(g, rgba('#000000', a), x + 18, y + 14, 34, 1); rect(g, rgba('#000000', a), x + 18, y + 17, 24, 1);
    for (const [bx, on] of [[x + 12, press], [x + 36, 0]]) {
      rect(g, rgba(on ? '#404040' : '#ffffff', a), bx, y + 23, 18, 8);
      rect(g, rgba('#c0c0c0', a), bx + 1, y + 24, 16, 6);
      rect(g, rgba('#000000', a), bx + 5, y + 26, 8, 1);
    }
  }

  function arrow(g, x, y, a) {
    poly(g, rgba('#ffffff', a), [x, y, x, y + 10, x + 3, y + 7, x + 5, y + 11, x + 7, y + 10, x + 5, y + 6, x + 9, y + 6]);
  }

  function crescent(g, x, y, r, rot, col, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = rgba(col, a); g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); g.arc(-r * 0.35, 0, r * 0.92, Math.PI / 2, -Math.PI / 2, true); g.fill();
    g.restore();
  }

  function abacus(g, x, y, k, T) {
    rect(g, '#3a2a1a', x - 18, y - 12, 36, 24); rect(g, '#1a1008', x - 16, y - 10, 32, 20); rect(g, '#5a4a2a', x - 16, y - 2, 32, 1);
    for (let i = 0; i < 5; i++) { const bx = x - 13 + i * 6.5; line(g, '#8a7a5a', 1, bx, y - 10, bx, y + 10); const up = (i + Math.floor(k * 5)) % 2; rect(g, '#e0c060', bx - 2, up ? y - 8 : y - 5, 4, 3); rect(g, '#e0c060', bx - 2, y + 2 + (up ? 0 : 3), 4, 3); }
  }

  function tile(g, x, y, w, h, face, a) {
    rect(g, rgba('#2a6a4a', a), x - w / 2 - 1, y - h / 2 + 2, w + 2, h);
    rect(g, rgba('#f4f0e4', a), x - w / 2, y - h / 2, w, h);
    if (face > 0) { const c = rgba('#2a8a5a', a * face); ell(g, c, x, y - h * 0.18, w * 0.2, w * 0.2); ell(g, rgba('#c03040', a * face), x, y + h * 0.18, w * 0.2, w * 0.2); }
  }

  function talisman(g, x, y, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, rgba('#f0d870', a), -5, -10, 10, 20); rect(g, rgba('#c03030', a), -3, -7, 6, 1); rect(g, rgba('#c03030', a), -1, -6, 2, 12); rect(g, rgba('#c03030', a), -3, 2, 6, 1);
    g.restore();
  }

  function mechArm(g, x, y, ang, len, a) {
    const ex = x + Math.cos(ang) * len * 0.55, ey = y + Math.sin(ang) * len * 0.55, tx = ex + Math.cos(ang + 0.6) * len * 0.5, ty = ey + Math.sin(ang + 0.6) * len * 0.5;
    line(g, rgba('#3a2a4a', a), 3, x, y, ex, ey); line(g, rgba('#3a2a4a', a), 3, ex, ey, tx, ty);
    ell(g, rgba('#c07aff', a), ex, ey, 2, 2);
    line(g, rgba('#e0c0ff', a), 1, tx, ty, tx + Math.cos(ang + 1) * 5, ty + Math.sin(ang + 1) * 5);
    return { x: tx, y: ty };
  }

  function personaCard(g, x, y, t, at) {
    const k = seg(t, 0, at), br = seg(t, at, at + 0.12);
    if (br < 1) {
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 20) * 0.1 * (1 - k)); g.scale(Math.max(0.15, Math.abs(Math.cos(k * Math.PI * 2))), 1);
      rect(g, rgba('#1a3a8a', 1 - br), -7, -10, 14, 20); rect(g, rgba('#e8f0ff', 1 - br), -6, -9, 12, 18); rect(g, rgba('#3a6ad0', 1 - br), -4, -6, 8, 12);
      g.restore();
    }
    if (br > 0 && br < 1) { K.shards(g, br * 0.6, x, y, 10, 4, '#9ac0ff', 26, '#ffffff'); lighter(g, () => glow(g, x, y, 20 * br, '#6a9aff', 1 - br)); }
    return br >= 1;
  }

  function persona(g, id, x, y, h, a) {
    if (H.Personas && H.Personas.has(id)) H.Personas.draw(g, id, x, y, h, { a });
  }

  function jackFrost(g, x, y, s, a) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
    ell(g, '#f0f8ff', 0, -10, 12, 11); ell(g, '#ffffff', 0, -26, 10, 9);
    poly(g, '#3a6ad0', [-10, -32, 0, -50, 10, -32]); ell(g, '#3a6ad0', -12, -34, 3, 3); ell(g, '#3a6ad0', 12, -34, 3, 3);
    rect(g, '#1a1a2a', -4, -29, 2, 3); rect(g, '#1a1a2a', 2, -29, 2, 3); rect(g, '#e04040', -3, -22, 6, 2);
    g.restore();
  }

  function yoshitsune(g, x, y, s, a) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
    poly(g, '#d0d8e8', [-10, 0, -8, -40, 8, -40, 10, 0]); ell(g, '#f0f0f8', 0, -48, 7, 8); poly(g, '#e04040', [-4, -56, 0, -70, 4, -56]);
    for (const s2 of [-1, 1]) line(g, '#e8f0ff', 2, s2 * 8, -30, s2 * 26, -54);
    g.restore();
  }

  const SHOWS = {
    himeko: {
      line: 'Немного жара.', d: 0.95, sfx: [[0.02, 'tech'], [0.3, 'glint'], [0.48, 'crit'], [0.74, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, order = blastOrder(P), hx0 = 72, hy = 214;
        const at = i => 0.42 + i * 0.08;
        const hitA = order.some((f, i) => t > at(i) && t < at(i) + 0.2) ? 0.45 : 0;
        ST.backdrop(S, P, 0.55, '#1a0600');
        lighter(g, () => glow(g, hx0, hy - 60, 70, '#ff5a10', 0.2 + 0.2 * seg(t, 0.1, 0.4)));
        ST.foes(S, P, { flash: hitA });
        order.forEach((f, i) => {
          const fy = f.y + 2, mark = eOut(seg(t, 0.28 + i * 0.03, 0.4 + i * 0.03)), fade = 1 - seg(t, at(i), at(i) + 0.15);
          if (mark > 0 && fade > 0) {
            ring(g, rgba('#ff8a30', 0.9 * fade), 1, f.x, fy, f.s * 0.5 * mark);
            ell(g, rgba('#ff5a10', 0.25 * fade), f.x, fy, f.s * 0.5 * mark, f.s * 0.14 * mark);
            line(g, rgba('#ffd080', 0.8 * fade), 1, f.x - f.s * 0.5 * mark, fy, f.x + f.s * 0.5 * mark, fy);
          }
          if (t > at(i)) H.Ults.BURST.fire(g, f.x, f.y - f.s * 0.35, f.s * 1.2, t - at(i), i);
        });
        const lean = seg(t, 0, 0.3), heat = seg(t, 0.15, 0.4) * (1 - seg(t, 0.75, 0.95));
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: lerp(0, -0.05, lean) });
        caseWeapon(g, hx0 + 30, hy - 62, T * 14 * (0.3 + heat), heat);
        if (t > 0.7) {
          const k = seg(t, 0.7, 0.95);
          lighter(g, () => { for (let i = 0; i < 5; i++) line(g, rgba('#ffb070', 0.35 * (1 - k)), 1, 30 + i * 60 + Math.sin(T * 9 + i) * 3, FLOOR - 10, 34 + i * 60 + Math.sin(T * 9 + i + 1) * 3, FLOOR - 40 - k * 20); });
          K.embers(g, T, 18, 7, 0, LW, FLOOR, '#ffd070');
        }
        vignette(g, 0.35);
      }
    },
    trail: {
      line: 'Отбиваю!', d: 1.0, sfx: [[0.02, 'step'], [0.4, 'swing'], [0.5, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), hx0 = lerp(66, Math.min(96, m.x - 80), eOut(seg(t, 0.3, 0.42))), hy = 214;
        ST.backdrop(S, P, 0.55, '#08060e');
        ST.foes(S, P, { flash: flashOf(P, t, 0.48, 0.04, 0.2) });
        if (t > 0.3 && t < 0.5) K.speedLines(g, T, m.x, m.y - 30, 26, '#ffffff', 0.35, 50);
        const sw = eOut(seg(t, 0.38, 0.5)), rest = seg(t, 0.75, 1);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: lerp(0, 0.12, sw) - rest * 0.1 });
        bat(g, hx0 + 6, hy - 92, t < 0.38 ? -2.3 : t < 0.75 ? lerp(-2.3, 0.4, sw) : lerp(0.4, -2.0, eOut(rest)));
        if (t > 0.38 && t < 0.7) lighter(g, () => { const a = 1 - seg(t, 0.45, 0.7); g.lineWidth = 6; g.strokeStyle = rgba('#ffe7a0', a * 0.6); g.beginPath(); g.arc(hx0 + 6, hy - 92, 50, -2.3, lerp(-2.3, 0.4, sw)); g.stroke(); g.lineWidth = 1; });
        hitAll(g, P, t, 0.48, 0.04, 'phys');
        if (t > 0.48) { const k = seg(t, 0.48, 0.8); lighter(g, () => ring(g, rgba('#ffffff', 0.8 * (1 - k)), 2, m.x, m.y - m.s * 0.4, 10 + k * 90)); }
        if (t > 0.75) { const k = seg(t, 0.75, 1); lighter(g, () => A.star5(g, hx0 + 30, hy - 120 - k * 6, 3 + 2 * Math.sin(k * Math.PI), T * 4, rgba('#fff2b0', 1 - k * 0.6))); K.embers(g, T, 10, 3, 0, LW, FLOOR, '#c8c0b0'); }
        vignette(g, 0.35);
      }
    },
    trail_p: {
      line: 'Не пройдёте.', d: 0.9, sfx: [[0.02, 'step'], [0.3, 'rumble'], [0.68, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, x = 140, y = 214, plant = eOut(seg(t, 0, 0.25)), wall = eOut(seg(t, 0.3, 0.6)), sink = seg(t, 0.7, 0.9);
        ST.backdrop(S, P, 0.5, '#1a0800');
        S.fig(P.look, x, y, { k: 2, s: 0.78 });
        line(g, '#3a2a20', 3, x + 26, lerp(y - 140, y - 110, plant), x + 26, y - 4);
        poly(g, '#ffb040', [x + 22, lerp(y - 140, y - 110, plant), x + 26, lerp(y - 160, y - 130, plant), x + 30, lerp(y - 140, y - 110, plant)]);
        if (plant >= 1) lighter(g, () => glow(g, x + 26, y - 4, 20 + wall * 20, '#ffb040', 0.6));
        lighter(g, () => {
          for (let i = 0; i < 14; i++) {
            const fx = 40 + i * 18, h = (60 + hx(i, 2, 5) * 50) * wall * (1 - sink * 0.6), fl = Math.sin(T * 14 + i) * 4;
            if (h <= 0) continue;
            poly(g, rgba('#ff7a20', 0.55 * (1 - sink)), [fx - 9, FLOOR, fx + fl, FLOOR - h, fx + 9, FLOOR]);
            poly(g, rgba('#ffe0a0', 0.6 * (1 - sink)), [fx - 4, FLOOR, fx + fl * 0.6, FLOOR - h * 0.6, fx + 4, FLOOR]);
          }
          if (sink > 0) { glow(g, x, y - 70, 60, '#ffb040', 0.5 * sink); ring(g, rgba('#ffd080', sink), 2, x, y - 70, 50); }
        });
        K.embers(g, T, 20, 9, 0, LW, FLOOR, '#ffd070');
        vignette(g, 0.4);
      }
    },
    danheng: {
      line: 'Ветер, вперёд.', d: 0.85, sfx: [[0.02, 'whoosh'], [0.3, 'swing'], [0.36, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, spin = seg(t, 0, 0.25), lunge = eOut(seg(t, 0.25, 0.4)), hx0 = lerp(66, Math.min(106, m.x - 70), lunge), hy = 214;
        ST.backdrop(S, P, 0.5, '#04140e');
        ST.foes(S, P, { flash: t > 0.34 && t < 0.55 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: lunge * 0.12 });
        const tipX = hx0 + 40 + lunge * 30, tipY = hy - 86;
        line(g, '#c8d0d8', 2, hx0 - 20, tipY + 6, tipX, tipY);
        poly(g, '#e8f4ff', [tipX, tipY - 3, tipX + 10, tipY, tipX, tipY + 3]);
        lighter(g, () => {
          for (let i = 0; i < 3; i++) { const r = 8 + i * 5; g.strokeStyle = rgba('#7affc8', 0.6 - i * 0.15); g.lineWidth = 1; g.beginPath(); g.arc(tipX, tipY, r, T * 12 + i, T * 12 + i + Math.PI * (1 + spin)); g.stroke(); }
          if (t > 0.28) { const k = seg(t, 0.28, 0.6); line(g, rgba('#7affc8', 0.7 * (1 - k)), 6, hx0, tipY, LW, my); line(g, rgba('#ffffff', 0.8 * (1 - k)), 2, hx0, tipY, LW, my); }
        });
        if (t > 0.34) { const k = seg(t, 0.34, 0.7); for (let i = 0; i < 9; i++) { const a = -0.6 + i * 0.15; lighter(g, () => line(g, rgba('#bfffe6', 0.7 * (1 - k)), 1, m.x + 20, my, m.x + 20 + Math.cos(a) * (20 + k * 60), my + Math.sin(a) * (20 + k * 60))); } }
        K.hStreaks(g, T, 10, 4, 500, '#bfffe6', 0.3 * (1 - seg(t, 0.6, 0.85)), BAR, FLOOR);
        vignette(g, 0.35);
      }
    },
    welt: {
      line: 'Тяжело, правда?', d: 1.0, sfx: [[0.02, 'glint'], [0.44, 'hit'], [0.58, 'hit'], [0.72, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 74, hy = 214, tip = { x: hx0 + 30, y: hy - 112 }, HOP = 0.14, START = 0.3;
        const hops = P.foes.length ? [P.foes[Math.floor(P.foes.length / 2)], P.foes[0], P.foes[P.foes.length - 1]] : [];
        const end = START + hops.length * HOP, top = f => ({ x: f.x, y: f.y - f.s * 0.5 }), land = i => START + (i + 1) * HOP;
        ST.backdrop(S, P, 0.55, '#0e0618');
        for (const f of P.foes) {
          const pressed = hops.some((h, i) => h === f && t > land(i) && t < land(i) + 0.12);
          G.drawEnemy(g, f.u.data, f.x, f.y + (pressed ? 2 : 0), f.s, { t: T, flash: pressed ? 0.4 : 0 });
        }
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: -0.04 * seg(t, 0, 0.3) });
        line(g, '#2a2030', 2, hx0 + 12, hy - 40, tip.x, tip.y);
        let o = tip, r = 3 + 5 * eOut(seg(t, 0, 0.3));
        if (t >= START && hops.length) {
          if (t < end) {
            const k = (t - START) / HOP, i = Math.min(hops.length - 1, Math.floor(k)), q = k - i, from = i ? top(hops[i - 1]) : tip, to = top(hops[i]);
            o = { x: lerp(from.x, to.x, q), y: lerp(from.y, to.y, q) - Math.sin(q * Math.PI) * 26 };
          } else {
            const from = top(hops[hops.length - 1]), q = eIn(seg(t, end, 0.92));
            o = { x: lerp(from.x, tip.x, q), y: lerp(from.y, tip.y, q) - Math.sin(q * Math.PI) * 20 };
          }
          r *= 1 - seg(t, 0.9, 1);
        }
        if (r > 0.3) { lighter(g, () => { glow(g, o.x, o.y, r * 3, '#b070ff', 0.7); ring(g, rgba('#d8b0ff', 0.8), 1, o.x, o.y, r * 1.6); }); ell(g, '#08040e', o.x, o.y, r, r); }
        hops.forEach((f, i) => { if (t > land(i)) BURST.imag(g, f.x, f.y - f.s * 0.4, f.s * 0.8, t - land(i), i); });
        vignette(g, 0.4);
      }
    },
    herta: {
      line: 'Разберусь сама.', d: 0.95, sfx: [[0.02, 'scan'], [0.42, 'crit'], [0.75, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 70, hy = 214, draw = eOut(seg(t, 0.05, 0.35)), pop = seg(t, 0.38, 0.5);
        ST.backdrop(S, P, 0.55, '#04101c');
        ST.foes(S, P, { flash: flashOf(P, t, 0.42, 0.03, 0.2) });
        if (P.foes.length && pop < 1) {
          const xs = P.foes.map(f => f.x), x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30, y0 = 70;
          lighter(g, () => {
            line(g, rgba('#8adfff', 0.8 * (1 - pop)), 1, x0, y0, lerp(x0, x1, draw), y0);
            P.foes.forEach((f, i) => { const k = seg(t, 0.1 + i * 0.06, 0.3 + i * 0.06); line(g, rgba('#8adfff', 0.6 * (1 - pop)), 1, f.x, y0, f.x, lerp(y0, f.y - f.s * 0.8, k)); ring(g, rgba('#bfefff', 0.7 * k * (1 - pop)), 1, f.x, y0, 5); rect(g, rgba('#bfefff', 0.6 * k * (1 - pop)), f.x + 7, y0 - 8, 10, 1); rect(g, rgba('#bfefff', 0.6 * k * (1 - pop)), f.x + 7, y0 - 5, 6, 1); });
          });
        }
        if (pop > 0) P.foes.forEach((f, i) => { for (let j = 0; j < 5; j++) { const k = eIn(seg(t, 0.38 + j * 0.01, 0.46 + j * 0.01)), a = 1 - seg(t, 0.55, 0.75), ang = Math.PI / 2 + (j - 2) * 0.18, tx = f.x + (j - 2) * 6, ty = f.y - f.s * 0.3; if (k > 0) lighter(g, () => needle(g, lerp(tx - Math.cos(ang) * 90, tx, k), lerp(ty - Math.sin(ang) * 90, ty, k), 16, ang, a)); } });
        hitAll(g, P, t, 0.44, 0.03, 'ice');
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, flip: t > 0.72 });
        if (t > 0.72) {
          const k = seg(t, 0.72, 0.95), tx = hx0, ty = hy - 150;
          rect(g, rgba('#04101c', 0.8), tx - 14, ty - 6, 28, 12); rect(g, rgba('#8adfff', k), tx - 14, ty - 6, 28, 1);
          for (let i = 0; i < 3; i++) rect(g, rgba('#bfefff', k), tx - 9 + i * 7, ty - 2, 4, 5);
        }
        vignette(g, 0.35);
      }
    },
    asta: {
      line: 'Звёзды, огонь!', d: 1.0, sfx: [[0.02, 'sparkle'], [0.36, 'hit'], [0.52, 'hit'], [0.68, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 74, hy = 214, cx = 120, cy = 62, hops = P.foes.length ? [P.foes[0], P.foes[P.foes.length - 1], P.foes[Math.floor(P.foes.length / 2)]] : [];
        ST.backdrop(S, P, 0.55, '#0a0620');
        K.stars(g, T, 40, 6, 0.6);
        ST.foes(S, P, { flash: hops.some((f, i) => t > 0.36 + i * 0.16 && t < 0.5 + i * 0.16) ? 0.4 : 0 });
        const pts = [[0, 0], [22, -10], [44, 2], [60, -14], [30, 18]].map(([x, y]) => [cx + x, cy + y]);
        const lit = eOut(seg(t, 0.05, 0.3));
        lighter(g, () => {
          for (let i = 0; i < pts.length - 1; i++) line(g, rgba('#ffd080', 0.5 * lit), 1, pts[i][0], pts[i][1], lerp(pts[i][0], pts[i + 1][0], lit), lerp(pts[i][1], pts[i + 1][1], lit));
          pts.forEach(([x, y], i) => { const gone = hops[i] && t > 0.3 + i * 0.16; if (!gone || t > 0.85) A.star5(g, x, y, 3 * (t > 0.85 ? seg(t, 0.85, 1) : lit), T * 2 + i, '#fff0b0'); });
          hops.forEach((f, i) => {
            const t0 = 0.3 + i * 0.16, k = eIn(seg(t, t0, t0 + 0.08));
            if (k > 0 && k < 1) { const x = lerp(pts[i][0], f.x, k), y = lerp(pts[i][1], f.y - f.s * 0.4, k); line(g, rgba('#ffb040', 0.7), 3, lerp(pts[i][0], f.x, Math.max(0, k - 0.3)), lerp(pts[i][1], f.y - f.s * 0.4, Math.max(0, k - 0.3)), x, y); A.star5(g, x, y, 5, T * 9, '#ffffff'); }
          });
        });
        hops.forEach((f, i) => { const t0 = 0.38 + i * 0.16; if (t > t0) BURST.fire(g, f.x, f.y - f.s * 0.4, f.s * 0.8, t - t0, i); });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: -0.05 * lit });
        vignette(g, 0.35);
      }
    },
    arlan: {
      line: 'Боль мне не помеха.', d: 0.9, sfx: [[0.02, 'swing'], [0.38, 'crit'], [0.7, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, jump = eOut(seg(t, 0.25, 0.38)), hx0 = lerp(70, Math.min(110, m.x - 70), jump), hy = 214 - Math.sin(jump * Math.PI) * 30;
        ST.backdrop(S, P, 0.55, '#100818');
        ST.foes(S, P, { flash: t > 0.38 && t < 0.6 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: lerp(-0.05, 0.15, jump) });
        if (t < 0.38) {
          const k = seg(t, 0.02, 0.3);
          lighter(g, () => { for (let i = 0; i < 4; i++) A.bolt(g, hx0 - 14 + i * 4, hy - 120, hx0 + 10, hy - 70, Math.floor(T * 30) + i, '#c07aff', 1); glow(g, hx0 + 10, hy - 90, 18 * k, '#c07aff', 0.6); });
          rect(g, rgba('#ff3040', 0.5 + 0.5 * Math.sin(T * 20)), hx0 - 2, hy - 96, 6, 2);
        }
        if (t >= 0.36 && t < 0.62) lighter(g, () => { A.bolt(g, m.x, BAR, m.x, my, Math.floor(T * 30), '#e0b0ff', 3); glow(g, m.x, my, 40, '#c07aff', 0.8 * (1 - seg(t, 0.38, 0.62))); });
        if (t > 0.38) BURST.elec(g, m.x, my, m.s, t - 0.38, 0);
        const px = 26 + Math.sin(T * 3) * 1;
        pup(g, px, FLOOR - 10 - (t > 0.65 && t < 0.8 ? 4 : 0), t > 0.65 && t < 0.85);
        vignette(g, 0.4);
      }
    },
    ruanmei: {
      line: 'Послушайте струны.', d: 1.05, sfx: [[0.02, 'strum'], [0.4, 'buff'], [0.8, 'sparkle']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 72, hy = 214, hand = { x: hx0 + 18, y: hy - 96 };
        const mates = P.allies.filter(a => a.u !== P.u).slice(0, 3);
        ST.backdrop(S, P, 0.5, '#06141a');
        mates.forEach((a, i) => S.fig(a.look, 160 + i * 56, 214, { k: 2, s: 0.56, a: 0.85 }));
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const bloom = eOut(seg(t, 0.02, 0.3));
        lighter(g, () => {
          A.flower(g, hand.x, hand.y, 9 * bloom, T, '#bfefff', 0.9);
          line(g, rgba('#e8fbff', 0.8 * (1 - seg(t, 0.85, 1.05))), 1, hand.x - 30, hand.y + Math.sin(T * 40) * (1 - seg(t, 0, 0.4)) * 2, hand.x + 30, hand.y);
          mates.forEach((a, i) => {
            const tx = 160 + i * 56, ty = 214 - 70, k = eOut(seg(t, 0.32 + i * 0.06, 0.55 + i * 0.06)), fade = 1 - seg(t, 0.85, 1.05);
            if (k <= 0) return;
            g.strokeStyle = rgba('#bfefff', 0.6 * fade); g.lineWidth = 1; g.beginPath(); g.moveTo(hand.x, hand.y); g.quadraticCurveTo((hand.x + tx) / 2, hand.y - 40, lerp(hand.x, tx, k), lerp(hand.y, ty, k)); g.stroke();
            if (k >= 1) A.flower(g, tx, ty, 8 * fade + 2, T + i, '#d8f6ff', fade);
          });
          if (t > 0.8) for (let i = 0; i < 10; i++) { const q = seg(t, 0.8, 1.05), x = 120 + hx(i, 3, 9) * 180, y = 80 + q * 120 + hx(i, 4, 9) * 30; ell(g, rgba('#e8fbff', 0.7 * (1 - q)), x + Math.sin(T * 3 + i) * 6, y, 2, 1); }
        });
        vignette(g, 0.35);
      }
    },
    natasha: {
      line: 'Сейчас подлечу.', d: 0.9, sfx: [[0.02, 'tech'], [0.42, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.5, '#06140a');
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        const raise = eOut(seg(t, 0, 0.25)), sx = hx0 + 22, sy = hy - lerp(70, 104, raise);
        rect(g, '#d8e0e8', sx - 1, sy - 10, 3, 14); rect(g, '#60ff90', sx, sy - 8, 1, 8); line(g, '#ffffff', 1, sx, sy - 10, sx, sy - 16);
        if (t < 0.3) lighter(g, () => glow(g, sx, sy - 16, 4 + 3 * Math.sin(T * 20), '#ffffff', 0.9));
        const wave = seg(t, 0.28, 0.5);
        if (wave > 0 && wave < 1) lighter(g, () => { const x = lerp(sx, tx, eOut(wave)), y = lerp(sy, ty, eOut(wave)) - Math.sin(wave * Math.PI) * 30; glow(g, x, y, 12, '#60ff90', 0.8); for (let i = 1; i < 6; i++) { const q = Math.max(0, wave - i * 0.05); ell(g, rgba('#a0ffc0', 0.5 - i * 0.08), lerp(sx, tx, eOut(q)), lerp(sy, ty, eOut(q)) - Math.sin(q * Math.PI) * 30, 2, 2); } });
        if (t >= 0.45) { const k = eOut(seg(t, 0.45, 0.6)), a = 1 - seg(t, 0.75, 0.9); lighter(g, () => { glow(g, tx, ty, 34 * k, '#60ff90', 0.5 * a); crossMark(g, tx, ty - 10, 8 * k, '#a0ffc0', a); }); K.sparks(g, T, tx, ty, 8, 2, '#a0ffc0', 30); }
        if (t > 0.65) { const k = eOut(seg(t, 0.65, 0.85)); rect(g, '#5a3a2a', hx0 - 34, FLOOR - 12, 20, 10); rect(g, '#8a5a3a', hx0 - 34, lerp(FLOOR - 20, FLOOR - 12, k), 20, 3); crossMark(g, hx0 - 24, FLOOR - 7, 2, '#ffffff', 1); }
        vignette(g, 0.35);
      }
    },
    serval: {
      line: 'Разогреваемся!', d: 0.95, sfx: [[0.02, 'strum'], [0.38, 'crit'], [0.5, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214, m = mainFoe(P), my = m.y - m.s * 0.4, order = blastOrder(P);
        ST.backdrop(S, P, 0.55, '#100818');
        rect(g, '#1a1418', 20, FLOOR - 46, 34, 46); rect(g, '#3a3040', 22, FLOOR - 44, 30, 42); for (const yy of [14, 30]) ell(g, '#0a0810', 37, FLOOR - 44 + yy, 9, 7);
        const amp = 1 - seg(t, 0, 0.35);
        if (amp > 0) lighter(g, () => glow(g, 37, FLOOR - 30, 30, '#c07aff', 0.6 * amp));
        ST.foes(S, P, { flash: t > 0.36 && t < 0.56 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: -0.04 * Math.sin(T * 18) * amp });
        lighter(g, () => { for (let i = 0; i < 4; i++) line(g, rgba('#e0c8ff', 0.7 * amp), 1, hx0 - 6, hy - 64 + i * 2 + Math.sin(T * 60 + i) * amp, hx0 + 26, hy - 74 + i * 2); });
        if (t >= 0.34 && t < 0.62) lighter(g, () => { A.bolt(g, hx0 + 26, hy - 74, m.x, my, Math.floor(T * 30), '#c07aff', 2); for (const f of order) if (f !== m) A.bolt(g, m.x, my, f.x, f.y - f.s * 0.4, Math.floor(T * 30) + 3, '#e0b0ff', 1); });
        order.forEach((f, i) => { const t0 = f === m ? 0.38 : 0.48; if (t > t0) BURST.elec(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        if (t > 0.7) K.sparks(g, T, hx0 + 20, hy - 72, 6, 5, '#e0b0ff', 14);
        vignette(g, 0.35);
      }
    },
    gepard: {
      line: 'Щиты вверх!', d: 0.9, sfx: [[0.02, 'shield'], [0.34, 'crit'], [0.66, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, step = eOut(seg(t, 0.25, 0.34)), hx0 = lerp(76, Math.min(96, m.x - 80), step), hy = 214;
        ST.backdrop(S, P, 0.5, '#061220');
        K.snowfall(g, T, 30, 21, { a: 0.5 });
        ST.foes(S, P, { flash: t > 0.34 && t < 0.55 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8, rot: step * 0.1 - seg(t, 0.6, 0.9) * 0.1 });
        const frost = seg(t, 0, 0.3);
        lighter(g, () => { glow(g, hx0 + 24, hy - 84, 10 + frost * 8, '#8adfff', 0.5 * frost); for (let i = 0; i < 4; i++) A.crystal(g, hx0 + 22 + i * 3, hy - 82, 4 * frost, -1 - i * 0.4, 0.8 * frost); });
        if (t > 0.34) {
          const k = eOut(seg(t, 0.34, 0.55)), a = 1 - seg(t, 0.75, 0.9) * 0.5;
          for (let i = 0; i < 7; i++) A.crystal(g, m.x + (i - 3) * 7, m.y, m.s * (0.25 + hx(i, 2, 7) * 0.35) * k, -Math.PI / 2 + (i - 3) * 0.25, 0.85 * a);
          BURST.ice(g, m.x, my, m.s, t - 0.34, 0);
        }
        if (t > 0.6) lighter(g, () => K.hexShield(g, hx0 + 30, hy - 70, 26, 0.5 * seg(t, 0.6, 0.75) * (1 - seg(t, 0.8, 0.9)), T, '#8adfff'));
        vignette(g, 0.35);
      }
    },
    bronya: {
      line: 'Твой ход, вперёд.', d: 0.9, sfx: [[0.02, 'buff'], [0.36, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.5, '#06101c');
        const wave = 1 - seg(t, 0.65, 0.9);
        line(g, '#4a4a5a', 2, 34, FLOOR, 34, FLOOR - 120);
        const fx = (i, j) => 36 + i * 9 + Math.sin(T * 8 + i * 0.8) * 3 * wave, fy = (i, j) => FLOOR - 118 + j * 26 + Math.sin(T * 8 + i * 0.8) * 2 * wave;
        for (let i = 0; i < 6; i++) { rect(g, i % 2 ? '#c8d8f0' : '#e8f0ff', fx(i, 0), fy(i, 0), 9, 26); rect(g, '#2a4a8a', fx(i, 0), fy(i, 0) + 10, 9, 5); }
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        const aim = eOut(seg(t, 0, 0.25));
        line(g, '#3a3a48', 3, hx0 + 8, hy - 88, hx0 + 8 + 40 * aim, hy - 92);
        const fly = seg(t, 0.3, 0.6);
        if (fly > 0) lighter(g, () => { for (let i = 0; i < 4; i++) { const q = cl(fly * 1.4 - i * 0.12); if (q <= 0 || q >= 1) continue; const x = lerp(hx0 + 50, tx, q), y = lerp(hy - 92, ty, q); line(g, rgba('#7affc8', 0.8), 2, x - 6, y - 6, x, y); line(g, rgba('#7affc8', 0.8), 2, x - 6, y + 6, x, y); } });
        if (t > 0.55) { const k = eOut(seg(t, 0.55, 0.7)), a = 1 - seg(t, 0.8, 0.9), y = ty - 50 - k * 8; lighter(g, () => { poly(g, rgba('#7affc8', a), [tx, y - 10, tx + 10, y, tx + 4, y, tx + 4, y + 10, tx - 4, y + 10, tx - 4, y, tx - 10, y]); glow(g, tx, ty, 30, '#7affc8', 0.3 * a); }); K.hStreaks(g, T, 8, 6, 400, '#bfffe6', 0.4 * a, ty - 40, ty + 40); }
        vignette(g, 0.35);
      }
    },
    seele: {
      line: 'Я здесь.', d: 0.85, sfx: [[0.02, 'whoosh'], [0.3, 'swing'], [0.46, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4;
        ST.backdrop(S, P, 0.55, '#0e0418');
        ST.foes(S, P, { flash: t > 0.28 && t < 0.6 ? 0.5 : 0 });
        const vanish = seg(t, 0.05, 0.2), back = seg(t, 0.6, 0.72);
        if (t < 0.25) S.fig(P.look, 80, 214, { k: 2, s: 0.76, a: 1 - vanish });
        lighter(g, () => A.butterfly(g, t < 0.6 ? lerp(80, m.x, eOut(seg(t, 0.1, 0.3))) : lerp(m.x + 20, m.x + 66, back), t < 0.6 ? lerp(140, my - 20, eOut(seg(t, 0.1, 0.3))) : 126, 5, T * 14, '#c07aff', 1));
        const cuts = [[-0.9, 0.24], [0.8, 0.34], [-0.1, 0.44]];
        lighter(g, () => cuts.forEach(([ang, at]) => { const k = seg(t, at, at + 0.06), a = 1 - seg(t, at + 0.06, at + 0.3); if (k <= 0 || a <= 0) return; const c = Math.cos(ang), s = Math.sin(ang), r = m.s * 0.9; line(g, rgba('#c07aff', a * 0.7), 5, m.x - c * r, my - s * r, lerp(m.x - c * r, m.x + c * r, k), lerp(my - s * r, my + s * r, k)); line(g, rgba('#ffffff', a), 1, m.x - c * r, my - s * r, lerp(m.x - c * r, m.x + c * r, k), lerp(my - s * r, my + s * r, k)); }));
        if (t > 0.44) BURST.quant(g, m.x, my, m.s, t - 0.44, 0);
        if (t > 0.6) S.fig(P.look, Math.min(LW - 30, m.x + 70), 214, { k: 2, s: 0.74, flip: true, a: back });
        vignette(g, 0.4);
      }
    },
    sampo: {
      line: 'Ловите подарочек!', d: 1.0, sfx: [[0.02, 'snap'], [0.4, 'hit'], [0.54, 'hit'], [0.68, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 76, hy = 214, tip = { x: hx0 + 24, y: hy - 96 };
        ST.backdrop(S, P, 0.5, '#081a10');
        const hp = hopPath(P, tip, 0.28, 0.14, t), land = i => 0.28 + (i + 1) * 0.14;
        ST.foes(S, P, { flash: hp.hops.some((f, i) => t > land(i) && t < land(i) + 0.12) ? 0.35 : 0 });
        hp.hops.forEach((f, i) => { if (t > land(i)) { const k = seg(t, land(i), land(i) + 0.3), a = 1 - seg(t, 0.85, 1); for (let j = 0; j < 4; j++) ell(g, rgba('#60c060', 0.35 * a), f.x + (j - 1.5) * 8 + Math.sin(T * 3 + j) * 3, f.y - f.s * 0.3 - k * 10 - j * 3, 8 + k * 6, 6 + k * 4); } });
        const bow = seg(t, 0.75, 0.95);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: bow * 0.25 });
        if (t < 0.28) { const k = eOut(seg(t, 0.02, 0.2)); bottle(g, lerp(hx0 + 12, tip.x, k), lerp(hy - 70, tip.y, k), T * 6, '#60e070'); lighter(g, () => A.star5(g, tip.x + 6, tip.y - 8, 3 * k, T * 5, '#ffffff')); }
        else if (hp.o) bottle(g, hp.o.x, hp.o.y, T * 14, '#60e070');
        if (bow > 0) for (let i = 0; i < 3; i++) bottle(g, hx0 - 22 - i * 5, hy - 70 + i * 4, -0.4 + i * 0.3, ['#e06060', '#60a0e0', '#e0c060'][i]);
        vignette(g, 0.35);
      }
    },
    hook: {
      line: 'Хук идёт!', d: 0.9, sfx: [[0.02, 'swing'], [0.38, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 86, hy = 214, sw = eOut(seg(t, 0.28, 0.4));
        ST.backdrop(S, P, 0.55, '#1a0800');
        ST.foes(S, P, { flash: t > 0.38 && t < 0.6 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.72, rot: sw * 0.12 - seg(t, 0.65, 0.9) * 0.12 });
        const rot = t < 0.28 ? -1.2 + Math.sin(T * 16) * 0.6 : t < 0.65 ? lerp(-2.4, 0.3, sw) : lerp(0.3, -1.4, eOut(seg(t, 0.65, 0.85)));
        shovel(g, hx0 + 10, hy - 80, rot, 30, 0.4 + 0.6 * seg(t, 0, 0.3));
        if (t > 0.38) { lighter(g, () => line(g, rgba('#ffb060', 0.8 * (1 - seg(t, 0.38, 0.6))), 4, hx0 + 40, hy - 120, m.x, my)); BURST.fire(g, m.x, my, m.s, t - 0.38, 0); K.embers(g, T, 14, 4, m.x - 30, m.x + 30, m.y, '#ffb060'); }
        vignette(g, 0.35);
      }
    },
    'hook.rage': {
      line: 'Ну всё, держитесь!', d: 1.0, sfx: [[0.02, 'rumble'], [0.4, 'crit'], [0.52, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 86, hy = 214, sw = eOut(seg(t, 0.3, 0.42)), order = blastOrder(P);
        ST.backdrop(S, P, 0.65, '#2a0400');
        if (t > 0.7) { const k = seg(t, 0.7, 1); for (let i = 0; i < 3; i++) { const x = 26 + i * 22, y = FLOOR - 4, c0 = rgba('#5a1410', 0.85 * k); ell(g, c0, x, y - 18, 9, 16); ell(g, c0, x, y - 40, 7, 7); rect(g, rgba('#ff6a30', 0.8 * k), x - 4, y - 42, 8, 2); } }
        ST.foes(S, P, { flash: t > 0.4 && t < 0.65 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: sw * 0.14 });
        lighter(g, () => { for (const dx of [-3, 3]) glow(g, hx0 + dx, hy - 132, 3 + seg(t, 0, 0.25) * 3, '#ff3020', 0.9); });
        shovel(g, hx0 + 10, hy - 80, t < 0.3 ? -1.2 + Math.sin(T * 20) * 0.5 : lerp(-2.4, 0.4, sw), 32, 1);
        lighter(g, () => glow(g, hx0 + 10, hy - 110, 30 + 10 * Math.sin(T * 12), '#ff4a10', 0.35));
        if (t > 0.42) {
          const k = seg(t, 0.42, 0.62);
          lighter(g, () => { let x = hx0 + 30, y = FLOOR - 4; for (let i = 0; i < 10; i++) { const nx = x + (LW - hx0) / 10 * k, ny = FLOOR - 4 + (i % 2 ? -5 : 5); line(g, rgba('#ff8a30', 0.9 * (1 - seg(t, 0.8, 1))), 2, x, y, nx, ny); x = nx; y = ny; } });
          order.forEach((f, i) => BURST.fire(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1.1 : 0.8), t - 0.42 - (f === m ? 0 : 0.08), i));
        }
        K.embers(g, T, 26, 8, 0, LW, FLOOR, '#ffb060');
        vignette(g, 0.45);
      }
    },
    pela: {
      line: 'Цель разобрана.', d: 0.85, sfx: [[0.02, 'scan'], [0.34, 'crit'], [0.48, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.5, '#061220');
        ST.foes(S, P, { flash: t > 0.34 && t < 0.52 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        rect(g, '#2a3040', hx0 + 12, hy - 92, 14, 18); rect(g, rgba('#8adfff', 0.5 + 0.3 * Math.sin(T * 10)), hx0 + 14, hy - 90, 10, 14);
        const lock = eOut(seg(t, 0.02, 0.28)), a = 1 - seg(t, 0.36, 0.5), r = lerp(60, m.s * 0.5, lock);
        lighter(g, () => {
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rect(g, rgba('#8adfff', a), m.x + sx * r, my + sy * r, -sx * 8, 1); rect(g, rgba('#8adfff', a), m.x + sx * r, my + sy * r, 1, -sy * 8); }
          line(g, rgba('#8adfff', 0.4 * a), 1, m.x - r, my, m.x + r, my); line(g, rgba('#8adfff', 0.4 * a), 1, m.x, my - r, m.x, my + r);
        });
        if (t > 0.34) BURST.ice(g, m.x, my, m.s, t - 0.34, 0);
        if (t > 0.3 && t < 0.7) { const k = seg(t, 0.4, 0.62), x = m.x + m.s * 0.5, y = my - m.s * 0.6; poly(g, rgba('#80ff90', 1 - k), [x, y - 6, x + 5, y, x + 2, y, x + 2, y + 5, x - 2, y + 5, x - 2, y, x - 5, y]); if (k > 0) line(g, rgba('#ff5050', 1 - k), 2, x - 7, y + 7, x + 7, y - 7); }
        if (t > 0.65) { const k = seg(t, 0.65, 0.85); for (let i = 0; i < 3; i++) rect(g, rgba('#bfefff', 0.8), hx0 + 15, hy - 87 + i * 4, 8 * cl(k * 3 - i), 1); }
        vignette(g, 0.35);
      }
    },
    clara: {
      line: 'Не трогайте нас.', d: 1.0, sfx: [[0.02, 'tech'], [0.36, 'swing'], [0.5, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 96, hy = 214;
        ST.backdrop(S, P, 0.6, '#140408');
        A.svarog(g, 52, FLOOR + 8, 0.62, T, eOut(seg(t, 0.02, 0.25)));
        const sweep = eOut(seg(t, 0.3, 0.55)), xs = P.foes.map(f => f.x), x0 = P.foes.length ? Math.min(...xs) - 40 : 160, x1 = P.foes.length ? Math.max(...xs) + 40 : 280;
        P.foes.forEach((f, i) => { const hit = sweep > (f.x - x0) / (x1 - x0); G.drawEnemy(g, f.u.data, f.x, f.y, f.s, { t: T, flash: hit && t < 0.75 ? 0.4 : 0 }); if (hit) { const a = 1 - seg(t, 0.8, 1); lighter(g, () => { ring(g, rgba('#ff2e5e', a), 1, f.x, f.y - f.s * 0.5, 8); rect(g, rgba('#ff2e5e', a), f.x - 1, f.y - f.s * 0.5 - 4, 2, 8); }); } });
        if (t > 0.28 && t < 0.7) { const a = 1 - seg(t, 0.55, 0.7); g.save(); g.globalAlpha = a; A.svarogHand(g, lerp(x0, x1, sweep), 150, 0.45); g.restore(); lighter(g, () => line(g, rgba('#ff6a8a', 0.5 * a), 8, x0, 160, lerp(x0, x1, sweep), 160)); }
        P.foes.forEach((f, i) => { const at = 0.36 + ((f.x - x0) / (x1 - x0)) * 0.2; if (t > at) BURST.phys(g, f.x, f.y - f.s * 0.4, f.s * 0.8, t - at, i); });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.66 });
        vignette(g, 0.4);
      }
    },
    lynx: {
      line: 'Консервы к бою.', d: 0.9, sfx: [[0.02, 'snap'], [0.42, 'heal'], [0.6, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.45, '#081620');
        K.snowfall(g, T, 40, 31, { a: 0.6, wind: 20 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.7 });
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        const fly = seg(t, 0.22, 0.45), cx = fly <= 0 ? hx0 + 16 : lerp(hx0 + 16, tx, fly), cy = fly <= 0 ? hy - lerp(60, 90, seg(t, 0, 0.2)) : lerp(hy - 90, ty, fly) - Math.sin(fly * Math.PI) * 40;
        if (fly < 1) { g.save(); g.translate(cx, cy); g.rotate(fly * 10); rect(g, '#c8c8d0', -4, -5, 8, 10); rect(g, '#d04040', -4, -2, 8, 4); g.restore(); }
        if (t > 0.45) { const k = eOut(seg(t, 0.45, 0.6)), a = 1 - seg(t, 0.75, 0.9); lighter(g, () => { glow(g, tx, ty, 34 * k, '#60ff90', 0.4 * a); poly(g, rgba('#a0ffc0', a), [tx, ty - 46 * k, tx + 14 * k, ty - 26 * k, tx - 14 * k, ty - 26 * k]); }); K.sparks(g, T, tx, ty, 8, 7, '#a0ffc0', 26); }
        if (t > 0.7) { const k = eOut(seg(t, 0.7, 0.88)); poly(g, '#d06050', [hx0 - 10, lerp(hy - 150, hy - 140, k), hx0, lerp(hy - 168, hy - 150, k), hx0 + 10, lerp(hy - 150, hy - 140, k)]); }
        vignette(g, 0.35);
      }
    },
    luka: {
      line: 'Раунд первый!', d: 0.85, sfx: [[0.02, 'tech'], [0.3, 'crit'], [0.44, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, step = eOut(seg(t, 0.22, 0.3)), hx0 = lerp(76, Math.min(110, m.x - 70), step), hy = 214;
        ST.backdrop(S, P, 0.55, '#140808');
        const lift = t > 0.3 ? Math.sin(seg(t, 0.3, 0.7) * Math.PI) * 18 : 0;
        for (const f of P.foes) G.drawEnemy(g, f.u.data, f.x, f.y - (f === m ? lift : 0), f.s, { t: T, flash: f === m && t > 0.3 && t < 0.5 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: step * 0.08 - (t > 0.3 ? 0.12 : 0) });
        const charge = seg(t, 0, 0.22);
        if (t < 0.3) lighter(g, () => { for (let i = 0; i < 3; i++) ell(g, rgba('#ffffff', 0.3 * charge), hx0 + 26 - i * 6, hy - 80 - i * 4 - Math.sin(T * 30 + i) * 2, 3, 2); });
        if (t > 0.3 && t < 0.6) lighter(g, () => { const k = seg(t, 0.3, 0.6); line(g, rgba('#ffd0a0', 1 - k), 6, m.x, m.y, m.x, my - 40 - k * 40); });
        if (t > 0.3) BURST.phys(g, m.x, my - lift, m.s, t - 0.3, 0);
        if (t > 0.44) { const k = seg(t, 0.44, 0.6), a = 1 - seg(t, 0.75, 0.85); poly(g, rgba('#d02030', a), [m.x + m.s * 0.5, my - lift - 10 - 4 * k, m.x + m.s * 0.5 + 4, my - lift - 2, m.x + m.s * 0.5 - 4, my - lift - 2]); }
        if (t > 0.6) lighter(g, () => { for (let i = 0; i < 3; i++) ell(g, rgba('#e0e0e0', 0.25), hx0 + 24, hy - 84 - i * 6 - seg(t, 0.6, 0.85) * 10, 3 + i, 2 + i); });
        vignette(g, 0.35);
      }
    },
    kafka: {
      line: 'Слушай меня.', d: 1.0, sfx: [[0.02, 'glint'], [0.4, 'crit'], [0.52, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214, m = mainFoe(P), order = blastOrder(P), hand = { x: hx0 + 22, y: hy - 96 };
        ST.backdrop(S, P, 0.6, '#0e0418');
        lighter(g, () => { glow(g, 250, 60, 40, '#e8e0ff', 0.4 * seg(t, 0, 0.3)); ell(g, rgba('#f0ecff', 0.5 * seg(t, 0, 0.3)), 250, 60, 12, 12); });
        ST.foes(S, P, { flash: t > 0.4 && t < 0.6 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: -0.03 * seg(t, 0, 0.3) });
        order.forEach((f, i) => {
          const k = eOut(seg(t, 0.2 + i * 0.04, 0.38 + i * 0.04)), a = 1 - seg(t, 0.75, 1), fy = f.y - f.s * 0.45;
          if (k <= 0) return;
          g.strokeStyle = rgba('#d8c8ff', 0.7 * a); g.lineWidth = 1; g.beginPath(); g.moveTo(hand.x, hand.y); g.quadraticCurveTo((hand.x + f.x) / 2, hand.y - 30 - i * 8, lerp(hand.x, f.x, k), lerp(hand.y, fy, k)); g.stroke();
          if (k >= 1 && t > 0.4 && t < 0.62) lighter(g, () => A.bolt(g, f.x, fy - 30, f.x, fy, Math.floor(T * 30) + i, '#c07aff', f === m ? 2 : 1));
        });
        if (t > 0.4) { BURST.elec(g, m.x, m.y - m.s * 0.4, m.s, t - 0.4, 0); if (t < 0.7) for (let i = 0; i < 4; i++) { const q = seg(t, 0.42 + i * 0.03, 0.6 + i * 0.03); if (q > 0 && q < 1) lighter(g, () => glow(g, m.x + (i - 1.5) * 10, m.y - m.s * (0.2 + q * 0.6), 6, '#ff60c0', 1 - q)); } }
        vignette(g, 0.4);
      }
    },
    silverwolf: {
      line: 'Патч применён.', d: 0.9, sfx: [[0.02, 'select'], [0.36, 'crit'], [0.66, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214, bx = m.x - 32, by = my - 60;
        ST.backdrop(S, P, 0.6, '#0a0618');
        ST.foes(S, P, { flash: t > 0.36 && t < 0.55 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const pop = eOut(seg(t, 0.02, 0.15)), press = t > 0.3 && t < 0.36 ? 1 : 0, gone = seg(t, 0.36, 0.42);
        if (gone < 1) { g.save(); g.translate(bx + 32, by + 17); g.scale(pop, pop); dialog(g, -32, -17, 1 - gone, press); g.restore(); }
        if (t > 0.12 && t < 0.4) { const k = eOut(seg(t, 0.12, 0.3)); arrow(g, lerp(hx0 + 30, bx + 20, k), lerp(hy - 100, by + 26, k), 1); }
        if (t > 0.36) { if (t < 0.75) K.shards(g, (t - 0.36) * 2, m.x, my - 20, 16, 4, '#c0c0c0', 50, '#000080'); BURST.quant(g, m.x, my, m.s, t - 0.38, 0); if (t < 0.6) K.glitch(g, T, m.x - 30, my - 30, 60, 50, 0.6 * (1 - seg(t, 0.4, 0.6)), 3); }
        if (t > 0.6) { const k = seg(t, 0.6, 0.8), r = k < 1 ? 2 + k * 7 : 0; if (r) ell(g, '#ff9ad0', hx0 + 8, hy - 136, r, r); else K.sparks(g, T, hx0 + 8, hy - 136, 6, 2, '#ff9ad0', 12); }
        vignette(g, 0.4);
      }
    },
    blade: {
      line: 'Ещё не конец.', d: 1.0, sfx: [[0.02, 'rumble'], [0.36, 'glint'], [0.7, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 150, hy = 214, run = eOut(seg(t, 0.05, 0.35)), spread = eOut(seg(t, 0.35, 0.75));
        ST.backdrop(S, P, 0.65, '#04100a');
        lighter(g, () => {
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2 + 0.3, len = 160 * spread;
            if (len <= 0) break;
            let x = hx0, y = hy - 80;
            for (let j = 1; j <= 5; j++) { const nx = hx0 + Math.cos(a) * len * j / 5 + (hx(i, j, 3) - 0.5) * 16, ny = hy - 80 + Math.sin(a) * len * j / 5 + (hx(i, j, 4) - 0.5) * 16; line(g, rgba('#7affc8', 0.6), 1, x, y, nx, ny); x = nx; y = ny; }
          }
          if (spread > 0) glow(g, hx0, hy - 80, 50 * spread, '#2affa0', 0.3);
        });
        K.hStreaks(g, T, 14, 5, 300, '#7affc8', 0.3 * spread, BAR, FLOOR);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8 });
        lighter(g, () => { line(g, rgba('#ff5040', 0.9 * run), 2, hx0 - 30, hy - 60, lerp(hx0 - 30, hx0 + 30, run), hy - 96); glow(g, lerp(hx0 - 30, hx0 + 30, run), hy - 96, 6, '#ff5040', run); });
        if (t > 0.75) { const k = seg(t, 0.75, 1); lighter(g, () => { for (const dx of [-3, 3]) glow(g, hx0 + dx, hy - 140, 3 + k * 2, '#ff3020', 0.9); }); }
        const bw = 70, bxx = hx0 - bw / 2, byy = hy + 6, hp = 1 - 0.3 * seg(t, 0.68, 0.8);
        rect(g, '#1a1418', bxx - 1, byy - 1, bw + 2, 5); rect(g, t > 0.68 && t < 0.9 ? '#ff4040' : '#60d080', bxx, byy, bw * hp, 3);
        vignette(g, 0.45);
      }
    },
    topaz: {
      line: 'Платить будем?', d: 0.95, sfx: [[0.02, 'ticket'], [0.4, 'crit'], [0.75, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#1a1004');
        ST.foes(S, P, { flash: t > 0.4 && t < 0.6 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const out = eOut(seg(t, 0.02, 0.25)), bx = hx0 + 24 + out * 10, by = hy - 100;
        if (t < 0.45) { rect(g, '#f0ecd8', bx, by - 12, 18 * out, 24); rect(g, '#2a2a34', bx + 3, by - 8, 10 * out, 1); rect(g, '#2a2a34', bx + 3, by - 4, 8 * out, 1); if (out > 0.8) ring(g, '#d04040', 2, bx + 12, by + 6, 4); }
        const fly = seg(t, 0.25, 0.42), back = seg(t, 0.62, 0.9);
        let nx = hx0 + 16, ny = hy - 112, rot = 0;
        if (t < 0.25) { nx = hx0 + 16; ny = hy - 112 + Math.sin(T * 10) * 2; }
        else if (t < 0.62) { const k = eIn(fly); nx = lerp(hx0 + 16, m.x, k); ny = lerp(hy - 112, my, k); rot = k * 6; if (fly < 1) lighter(g, () => { line(g, rgba('#ff8a20', 0.7), 5, lerp(hx0 + 16, m.x, Math.max(0, k - 0.3)), lerp(hy - 112, my, Math.max(0, k - 0.3)), nx, ny); glow(g, nx, ny, 14, '#ffb040', 0.8); }); }
        else { const k = eOut(back); nx = lerp(m.x, hx0 + 10, k); ny = lerp(my, hy - 132, k) - Math.sin(k * Math.PI) * 30; }
        numby(g, nx, ny, 1.4, rot);
        if (t > 0.42) { BURST.fire(g, m.x, my, m.s, t - 0.42, 0); const k = eOut(seg(t, 0.44, 0.6)), a = 1 - seg(t, 0.85, 0.95), cx = m.x + m.s * 0.5, cy = my - m.s * 0.6; ell(g, rgba('#ffd060', a), cx, cy, 6 * k, 6 * k); ell(g, rgba('#c08a20', a), cx, cy, 4 * k, 4 * k); }
        vignette(g, 0.35);
      }
    },
    argenti: {
      line: 'Во имя Красоты!', d: 1.0, sfx: [[0.02, 'sparkle'], [0.4, 'swing'], [0.52, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214, hand = { x: hx0 + 24, y: hy - 98 };
        ST.backdrop(S, P, 0.55, '#140a14');
        ST.foes(S, P, { flash: flashOf(P, t, 0.45, 0.04, 0.2) });
        const kneel = seg(t, 0.75, 1);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: -0.04 * kneel });
        const hold = eOut(seg(t, 0.02, 0.25)), burst = seg(t, 0.28, 0.32);
        if (burst < 1) rose(g, hand.x, hand.y, 5 * hold, '#d02040');
        lighter(g, () => { if (t < 0.32) glow(g, hand.x, hand.y, 16 * hold, '#ffd0d8', 0.5); });
        P.foes.forEach((f, i) => {
          for (let j = 0; j < 6; j++) {
            const t0 = 0.3 + i * 0.04 + j * 0.015, k = eIn(seg(t, t0, t0 + 0.16)), a = 1 - seg(t, 0.6, 0.8);
            if (k <= 0 || a <= 0) continue;
            const ex = f.x + (j - 2.5) * 6, ey = f.y - f.s * 0.4 + (j % 2 ? 6 : -6), x = lerp(hand.x, ex, k), y = lerp(hand.y, ey, k) - Math.sin(k * Math.PI) * (16 + j * 4);
            g.save(); g.translate(x, y); g.rotate(T * 8 + j); ell(g, rgba('#e03050', a), 0, 0, 3, 1.5); g.restore();
            if (k >= 1) lighter(g, () => line(g, rgba('#ffffff', a), 1, ex - 6, ey - 4, ex + 6, ey + 4));
          }
        });
        hitAll(g, P, t, 0.46, 0.04, 'phys');
        if (kneel > 0) { rose(g, hx0 + 30, FLOOR - 4, 3, '#d02040'); lighter(g, () => glow(g, hx0 + 4, hy - 90, 12, '#ffe0a0', 0.4 * kneel)); }
        vignette(g, 0.35);
      }
    },
    ratio: {
      line: 'Учитесь, дилетанты.', d: 0.9, sfx: [[0.02, 'scan'], [0.42, 'crit'], [0.7, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#0e0a18');
        ST.foes(S, P, { flash: t > 0.42 && t < 0.6 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        const open = eOut(seg(t, 0.02, 0.22)), bx = hx0 + 26, by = hy - 92;
        rect(g, '#5a2a3a', bx - 12 * open, by - 8, 12 * open, 14); rect(g, '#f0ecd8', bx - 11 * open, by - 7, 11 * open, 12);
        rect(g, '#5a2a3a', bx, by - 8, 12, 14); rect(g, '#f0ecd8', bx + 1, by - 7, 10, 12);
        for (let i = 0; i < 3; i++) rect(g, '#6a6a7a', bx + 2, by - 4 + i * 3, 7, 1);
        const sym = [[-18, -26], [14, -32], [-4, -44], [20, -14]];
        lighter(g, () => sym.forEach(([dx, dy], i) => {
          const k = seg(t, 0.15 + i * 0.05, 0.3 + i * 0.05), a = 1 - seg(t, 0.42, 0.55);
          if (k <= 0 || a <= 0) return;
          const x = m.x + dx, y = my + dy;
          if (i % 2) { line(g, rgba('#ffe080', a), 1, x - 4, y - 4, x + 4, y - 4); line(g, rgba('#ffe080', a), 1, x - 4, y - 4, x, y); line(g, rgba('#ffe080', a), 1, x, y, x - 4, y + 4); line(g, rgba('#ffe080', a), 1, x - 4, y + 4, x + 4, y + 4); }
          else { ell(g, rgba('#ffe080', a), x - 3, y + 3, 1, 1); ell(g, rgba('#ffe080', a), x + 3, y + 3, 1, 1); ell(g, rgba('#ffe080', a), x, y - 2, 1, 1); }
        }));
        if (t > 0.36 && t < 0.6) lighter(g, () => { const k = seg(t, 0.36, 0.44); line(g, rgba('#ffd860', 0.9 * (1 - seg(t, 0.45, 0.6))), 3, bx + 6, by, lerp(bx + 6, m.x, k), lerp(by, my, k)); });
        if (t > 0.42) BURST.imag(g, m.x, my, m.s, t - 0.42, 0);
        if (t > 0.65) { const k = seg(t, 0.65, 0.8); g.save(); g.translate(bx - 6, by); g.scale(1 - k, 1); rect(g, '#5a2a3a', 0, -8, 12, 14); g.restore(); }
        vignette(g, 0.35);
      }
    },
    bailu: {
      line: 'Не болеть!', d: 0.95, sfx: [[0.02, 'splash'], [0.44, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, mate = mateOf(P), tx = mate.x, ty = 214 - 70, bob = Math.sin(T * 4) * 3, hx0 = 80, hy = 196 + bob;
        ST.backdrop(S, P, 0.45, '#081420');
        if (!mate.self) S.fig(mate.look, tx, 214, { k: 2, s: 0.66, flip: true });
        for (let i = 0; i < 5; i++) ell(g, rgba('#e8f0ff', 0.85), hx0 - 30 + i * 15, hy + 4 + Math.sin(T * 5 + i) * 2, 12, 6);
        ell(g, '#bfe0ff', hx0 + 40, hy - 2, 7, 5);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.68 });
        const sip = seg(t, 0, 0.3);
        ell(g, '#c08a40', hx0 + 14, hy - 92 + sip * 4, 4, 5); ell(g, '#c08a40', hx0 + 14, hy - 99 + sip * 4, 2.5, 3);
        for (let i = 0; i < 6; i++) {
          const k = eIn(seg(t, 0.3 + i * 0.02, 0.48 + i * 0.02));
          if (k <= 0 || k >= 1) continue;
          const x = lerp(hx0 + 16, tx + (i - 2.5) * 4, k), y = lerp(hy - 96, ty, k) - Math.sin(k * Math.PI) * 30;
          ell(g, rgba('#9ad8ff', 0.9), x, y, 2, 3);
        }
        if (t > 0.48) { const k = seg(t, 0.48, 0.75), a = 1 - seg(t, 0.75, 0.95); lighter(g, () => { A.bolt(g, tx, ty - 50, tx, ty + 10, Math.floor(T * 30), '#a0ffc0', 1); glow(g, tx, ty, 30 * eOut(k), '#60ff90', 0.5 * a); crossMark(g, tx, ty - 6, 6, '#c0ffd0', a); }); }
        if (t > 0.75) { const k = seg(t, 0.75, 0.95); ell(g, rgba('#ffffff', 0.4 * (1 - k)), hx0 + 6, hy - 130 - k * 12, 3 + k * 2, 2); }
        vignette(g, 0.35);
      }
    },
    yanqing: {
      line: 'Я быстрее!', d: 0.85, sfx: [[0.02, 'glint'], [0.3, 'swing'], [0.36, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.5, '#061220');
        ST.foes(S, P, { flash: t > 0.34 && t < 0.55 ? 0.5 : 0 });
        const ring2 = seg(t, 0.5, 0.75);
        for (let i = 0; i < 5; i++) {
          const a0 = -Math.PI / 2 + (i - 2) * 0.35, rx = hx0 - 20 + Math.cos(a0) * 34, ry = hy - 120 + Math.sin(a0) * 20;
          const ca = i / 5 * Math.PI * 2 + T * 3, cx = hx0 + Math.cos(ca) * 34, cy = hy - 80 + Math.sin(ca) * 14;
          const x = lerp(rx, cx, eOut(ring2)), y = lerp(ry, cy, eOut(ring2));
          A.sword(g, x, y, ring2 > 0 ? ca + Math.PI / 2 : -Math.PI / 2, 22, 0.9);
        }
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: t > 0.28 && t < 0.5 ? 0.12 : 0 });
        if (t > 0.28 && t < 0.5) lighter(g, () => line(g, rgba('#bfefff', 1 - seg(t, 0.3, 0.5)), 3, hx0 + 20, hy - 90, m.x, my));
        if (t > 0.34) BURST.ice(g, m.x, my, m.s, t - 0.34, 0);
        if (t > 0.7) { const k = seg(t, 0.7, 0.85); ell(g, '#d04040', hx0 + 24, hy - 76 + Math.sin(k * 8) * 3, 2, 3); }
        vignette(g, 0.35);
      }
    },
    jingyuan: {
      line: 'Гром, слушай.', d: 1.05, sfx: [[0.02, 'rumble'], [0.42, 'crit'], [0.56, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 76, hy = 214, dark = seg(t, 0, 0.35);
        ST.backdrop(S, P, 0.5 + 0.2 * dark, '#0a0818');
        if (dark > 0) { const a = dark * (1 - seg(t, 0.85, 1.05)); lighter(g, () => { glow(g, 250, 80, 90, '#6a4aff', 0.3 * a); for (const dx of [-12, 12]) glow(g, 250 + dx, 74, 4, '#e0d0ff', 0.9 * a); for (let i = 0; i < 3; i++) if (Math.floor(T * 12 + i) % 4 === 0) A.bolt(g, 200 + i * 50, BAR, 210 + i * 46, 110, Math.floor(T * 30) + i, '#a090ff', 1); }); }
        ST.foes(S, P, { flash: flashOf(P, t, 0.42, 0.07, 0.2) });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        const lift = eOut(seg(t, 0.05, 0.35));
        line(g, '#8a6a3a', 2, hx0 + 10, hy - 60, hx0 + 18, lerp(hy - 110, hy - 150, lift));
        poly(g, '#e0c060', [hx0 + 14, lerp(hy - 110, hy - 150, lift), hx0 + 22, lerp(hy - 124, hy - 164, lift), hx0 + 24, lerp(hy - 108, hy - 148, lift)]);
        P.foes.forEach((f, i) => { const t0 = 0.4 + i * 0.07; if (t > t0 && t < t0 + 0.2) lighter(g, () => A.bolt(g, f.x + (hx(i, 1, 3) - 0.5) * 20, BAR, f.x, f.y - f.s * 0.4, Math.floor(T * 30) + i, '#e0b0ff', 2)); });
        hitAll(g, P, t, 0.42, 0.07, 'elec');
        if (t > 0.85) { const k = seg(t, 0.85, 1.05); ell(g, rgba('#ffffff', 0.4 * (1 - k)), hx0 + 8, hy - 136 - k * 10, 3, 2); }
        vignette(g, 0.4);
      }
    },
    luocha: {
      line: 'Пусть цветёт жизнь.', d: 0.95, sfx: [[0.02, 'glint'], [0.44, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x;
        ST.backdrop(S, P, 0.5, '#141008');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        const glowK = eOut(seg(t, 0.02, 0.3));
        lighter(g, () => glow(g, hx0 + 22, hy - 92, 14 * glowK, '#ffe080', 0.8));
        const seal = eOut(seg(t, 0.32, 0.55)), a = 1 - seg(t, 0.78, 0.95);
        if (seal > 0) lighter(g, () => {
          ring(g, rgba('#ffe080', a), 1, tx, FLOOR - 2, 30 * seal);
          ring(g, rgba('#ffd060', a * 0.7), 1, tx, FLOOR - 2, 22 * seal);
          for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + T; line(g, rgba('#ffe080', a * 0.7), 1, tx + Math.cos(an) * 22 * seal, FLOOR - 2 + Math.sin(an) * 8 * seal, tx + Math.cos(an) * 30 * seal, FLOOR - 2 + Math.sin(an) * 11 * seal); }
          for (let i = 0; i < 8; i++) { const q = (seg(t, 0.4, 0.95) + i / 8) % 1; ell(g, rgba('#fff0b0', a * (1 - q)), tx + (hx(i, 2, 5) - 0.5) * 40, FLOOR - 4 - q * 90, 1.5, 1.5); }
          glow(g, tx, FLOOR - 60, 30 * seal, '#ffe080', 0.35 * a);
        });
        if (t > 0.7) lighter(g, () => glow(g, hx0 - 26, hy - 120, 4 + 2 * Math.sin(T * 8), '#ffffff', 0.9));
        vignette(g, 0.35);
      }
    },
    imbibitor: {
      line: 'Вода покорна мне.', d: 0.9, sfx: [[0.02, 'splash'], [0.4, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 150, hy = 214, mark = eOut(seg(t, 0.02, 0.3)), rise = eOut(seg(t, 0.3, 0.65));
        ST.backdrop(S, P, 0.6, '#04121a');
        lighter(g, () => { for (let i = 0; i < 12; i++) { const x = 20 + i * 26, h = 30 * rise * (0.5 + hx(i, 1, 3)); line(g, rgba('#7ad8ff', 0.4 * rise), 2, x, FLOOR, x + Math.sin(T * 6 + i) * 4, FLOOR - h); } });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8 });
        lighter(g, () => {
          const hx = hx0 + 20, hyy = hy - 96;
          for (let i = 0; i < 4; i++) { const dx = (i % 2) * 4, dy = Math.floor(i / 2) * 4; poly(g, rgba('#7affff', mark), [hx + dx, hyy + dy - 2, hx + dx + 2, hyy + dy, hx + dx, hyy + dy + 2, hx + dx - 2, hyy + dy]); }
          for (const s of [-1, 1]) { g.strokeStyle = rgba('#9ae8ff', 0.8 * rise); g.lineWidth = 2; g.beginPath(); g.moveTo(hx0 + s * 6, hy - 140); g.quadraticCurveTo(hx0 + s * 26, hy - 160 - rise * 10, hx0 + s * 18, hy - 140 - 40 * rise); g.stroke(); }
          if (t > 0.65) { const k = seg(t, 0.65, 0.9); for (const dx of [-3, 3]) glow(g, hx0 + dx, hy - 134, 3 + k * 2, '#7affff', 0.9); }
        });
        vignette(g, 0.45);
      }
    },
    fuxuan: {
      line: 'Всё предсказано.', d: 1.0, sfx: [[0.02, 'scan'], [0.42, 'shield'], [0.76, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, k = seg(t, 0.02, 0.4), mtx = eOut(seg(t, 0.3, 0.7)), a = 1 - seg(t, 0.85, 1);
        const mates = P.allies.filter(x => x.u !== P.u).slice(0, 3);
        ST.backdrop(S, P, 0.55, '#0e0818');
        mates.forEach((x, i) => S.fig(x.look, 170 + i * 50, 214, { k: 2, s: 0.56, a: 0.85 }));
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        abacus(g, hx0 + 34, hy - 120 + Math.sin(T * 3) * 2, t > 0.76 ? 1 : k, T);
        if (mtx > 0) lighter(g, () => {
          const x0 = 40, x1 = lerp(40, LW - 20, mtx);
          for (let i = 0; i < 6; i++) line(g, rgba('#c07aff', 0.5 * a), 1, x0, 120 + i * 16, x1, 120 + i * 16 + (i % 2 ? 6 : -6));
          for (let i = 0; i < 10; i++) { const x = 40 + i * 28; if (x < x1) line(g, rgba('#c07aff', 0.35 * a), 1, x, 116, x + 10, FLOOR); }
          glow(g, 200, 160, 80 * mtx, '#c07aff', 0.2 * a);
        });
        vignette(g, 0.4);
      }
    },
    jingliu: {
      line: 'Тихо.', d: 0.85, sfx: [[0.02, 'glint'], [0.32, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.6, '#04101c');
        const cut = seg(t, 0.25, 0.32), split = t > 0.32 ? eOut(seg(t, 0.32, 0.5)) * (1 - seg(t, 0.6, 0.8)) : 0;
        g.save(); g.beginPath(); g.rect(0, 0, LW, my); g.clip(); g.translate(-split * 4, -split * 2); ST.foes(S, P, { flash: t > 0.32 && t < 0.5 ? 0.6 : 0 }); g.restore();
        g.save(); g.beginPath(); g.rect(0, my, LW, LH); g.clip(); g.translate(split * 4, split * 2); ST.foes(S, P, { flash: t > 0.32 && t < 0.5 ? 0.6 : 0 }); g.restore();
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        if (cut > 0) lighter(g, () => { const a = 1 - seg(t, 0.4, 0.7); line(g, rgba('#bfefff', a), 3, 0, my, LW * cut, my); line(g, rgba('#ffffff', a), 1, 0, my, LW * cut, my); });
        if (t > 0.5) for (let i = 0; i < 5; i++) A.crystal(g, m.x + (i - 2) * 8, my + 4, m.s * 0.3 * seg(t, 0.5, 0.7), -Math.PI / 2 + (i - 2) * 0.35, 0.8 * (1 - seg(t, 0.75, 0.85)));
        vignette(g, 0.4);
      }
    },
    'jingliu.moon': {
      line: 'Луна, взойди.', d: 1.05, sfx: [[0.02, 'glint'], [0.42, 'swing'], [0.56, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.65, '#040c18');
        ST.foes(S, P, { flash: t > 0.42 && t < 0.7 ? 0.5 : 0 });
        lighter(g, () => { const k = eOut(seg(t, 0.02, 0.35)); crescent(g, hx0, FLOOR + 6, 18 * k, Math.PI, '#bfefff', 0.35 * k); });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: -0.06 * seg(t, 0.8, 1.05) });
        order.forEach((f, i) => { const t0 = 0.38 + i * 0.06, k = eOut(seg(t, t0, t0 + 0.12)), a = 1 - seg(t, t0 + 0.2, t0 + 0.45); if (k > 0 && a > 0) lighter(g, () => { crescent(g, f.x, f.y - f.s * 0.45, f.s * 0.55, -0.6 + k * 1.2, '#d8f6ff', a); glow(g, f.x, f.y - f.s * 0.45, f.s * 0.6, '#8adfff', 0.5 * a); }); if (t > t0 + 0.08) BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * 0.8, t - t0 - 0.08, i); });
        vignette(g, 0.45);
      }
    },
    huohuo: {
      line: 'Т-только не меня!', d: 0.95, sfx: [[0.02, 'snap'], [0.44, 'heal'], [0.6, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, mate = mateOf(P), tx = mate.x, ty = 214 - 70, shake = (1 - seg(t, 0, 0.35)) * Math.sin(T * 60) * 1.5, hx0 = 84 + shake, hy = 214;
        ST.backdrop(S, P, 0.5, '#081a10');
        if (!mate.self) S.fig(mate.look, tx, 214, { k: 2, s: 0.66, flip: true });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.7 });
        const tailA = eOut(seg(t, 0.02, 0.25));
        lighter(g, () => { for (const dx of [-6, 6]) glow(g, hx0 - 30 + dx, hy - 150, 3, '#7aff9a', tailA); line(g, rgba('#7aff9a', tailA * (0.5 + 0.5 * seg(t, 0.7, 0.85))), 1, hx0 - 38, hy - 140, hx0 - 22, hy - 138); });
        const fly = seg(t, 0.25, 0.45);
        if (fly < 1) talisman(g, lerp(hx0 - 20, tx, eOut(fly)), lerp(hy - 140, ty - 20, eOut(fly)) - Math.sin(fly * Math.PI) * 20, T * (fly > 0 ? 10 : 0), 1);
        if (t > 0.45) { const k = seg(t, 0.45, 0.65), a = 1 - seg(t, 0.8, 0.95); lighter(g, () => { for (let i = 0; i < 6; i++) poly(g, rgba('#5aff8a', 0.6 * a * (1 - k)), [tx - 14 + i * 6, ty + 20, tx - 11 + i * 6, ty - 10 - k * 20, tx - 8 + i * 6, ty + 20]); glow(g, tx, ty, 30, '#60ff90', 0.4 * a); }); K.sparks(g, T, tx, ty, 10, 9, '#a0ffc0', 50); }
        vignette(g, 0.35);
      }
    },
    sushang: {
      line: 'Меч, не подведи!', d: 0.9, sfx: [[0.02, 'swing'], [0.34, 'rumble'], [0.42, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.55, '#100a08');
        const fall = eIn(seg(t, 0.2, 0.42)), a = 1 - seg(t, 0.5, 0.75);
        poly(g, rgba('#5a5a6a', 0.7 * a), [m.x - 60, lerp(-60, my + 10, fall), m.x, lerp(-140, my - 70, fall), m.x + 60, lerp(-60, my + 10, fall)]);
        poly(g, rgba('#8a8a9a', 0.5 * a), [m.x - 20, lerp(-100, my - 30, fall), m.x, lerp(-140, my - 70, fall), m.x + 18, lerp(-104, my - 34, fall)]);
        ST.foes(S, P, { flash: t > 0.42 && t < 0.6 ? 0.6 : 0 });
        if (t > 0.42) { BURST.phys(g, m.x, my, m.s * 1.2, t - 0.42, 0); K.shards(g, (t - 0.42) * 1.5, m.x, m.y, 14, 6, '#8a8a9a', 50, '#d8d8e0'); }
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: t < 0.3 ? -0.05 : 0.08 });
        A.sword(g, hx0 + 14, hy - 100, t < 0.3 ? -Math.PI / 2 : 0.4, 34, 1);
        if (t > 0.65) { const k = seg(t, 0.65, 0.9); lighter(g, () => { g.strokeStyle = rgba('#ffffff', 0.6 * (1 - k * 0.5)); g.lineWidth = 1; g.beginPath(); g.moveTo(hx0 - 40, hy - 120); g.quadraticCurveTo(hx0 - 20, hy - 150 - k * 6, hx0, hy - 128); g.quadraticCurveTo(hx0 + 20, hy - 150 - k * 6, hx0 + 40, hy - 120); g.stroke(); }); }
        vignette(g, 0.35);
      }
    },
    xueyi: {
      line: 'Приговор исполнен.', d: 0.9, sfx: [[0.02, 'tech'], [0.36, 'crit'], [0.46, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.55, '#0e0618');
        ST.foes(S, P, { flash: t > 0.36 && t < 0.56 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const open = eOut(seg(t, 0.02, 0.28)), fold = seg(t, 0.65, 0.9);
        for (const s of [-1, 1]) mechArm(g, hx0, hy - 96, -Math.PI / 2 + s * (0.3 + 0.9 * open * (1 - fold)), 40 * (0.5 + 0.5 * open), 1);
        if (t > 0.3 && t < 0.55) lighter(g, () => line(g, rgba('#c07aff', 1 - seg(t, 0.36, 0.55)), 4, hx0 + 20, hy - 110, m.x, my));
        order.forEach((f, i) => { if (f !== m && t > 0.4 && t < 0.65) lighter(g, () => line(g, rgba('#e0c0ff', 0.7 * (1 - seg(t, 0.45, 0.65))), 1, m.x, my, f.x, f.y - f.s * 0.4)); const t0 = f === m ? 0.36 : 0.46; if (t > t0) BURST.quant(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        vignette(g, 0.4);
      }
    },
    tingyun: {
      line: 'Удачи вам!', d: 0.9, sfx: [[0.02, 'strum'], [0.42, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.5, '#140c04');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        const bow = seg(t, 0.68, 0.9);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: bow * 0.12 });
        const open = eOut(seg(t, 0.02, 0.25)), fx = hx0 + 22, fy = hy - 104 + bow * 20;
        for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI * open; line(g, i % 2 ? '#e0a040' : '#f0d080', 2, fx, fy, fx + Math.cos(a) * 14, fy + Math.sin(a) * 14); }
        if (open > 0.5 && t < 0.4) K.sparks(g, T, fx, fy - 8, 6, 3, '#e0c0ff', 18);
        const jump = seg(t, 0.25, 0.48);
        if (jump > 0 && jump < 1) { const x = lerp(fx, tx, eOut(jump)), y = lerp(fy, ty, eOut(jump)) - Math.sin(jump * Math.PI) * 40; lighter(g, () => { poly(g, rgba('#ffb050', 0.9), [x - 8, y, x + 6, y - 6, x + 10, y - 12, x + 10, y - 4, x + 14, y, x + 6, y + 4]); A.bolt(g, x - 20, y + 2, x - 6, y, Math.floor(T * 30), '#e0b0ff', 1); }); }
        if (t > 0.48) { const k = seg(t, 0.48, 0.68), a = 1 - seg(t, 0.75, 0.9); lighter(g, () => { glow(g, tx, ty, 30 * eOut(k), '#c07aff', 0.5 * a); A.bolt(g, tx, ty - 50, tx, ty, Math.floor(T * 30), '#e0b0ff', 1); }); }
        vignette(g, 0.35);
      }
    },
    hanya: {
      line: 'Карма ждёт.', d: 0.9, sfx: [[0.02, 'swing'], [0.36, 'crit'], [0.48, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.55, '#120808');
        ST.foes(S, P, { flash: t > 0.36 && t < 0.55 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const bk = eOut(seg(t, 0.02, 0.2)), bx = hx0 + 24, by = hy - 92;
        rect(g, '#3a1a1a', bx - 10 * bk, by - 6, 20 * bk, 12); rect(g, '#f0e8d8', bx - 9 * bk, by - 5, 18 * bk, 10);
        if (t > 0.65) for (let i = 0; i < 3; i++) rect(g, '#2a1a1a', bx - 7, by - 3 + i * 3, 14 * cl(seg(t, 0.65, 0.85) * 3 - i), 1);
        if (t > 0.3 && t < 0.45) lighter(g, () => line(g, rgba('#ffd0a0', 1 - seg(t, 0.36, 0.45)), 3, bx, by, m.x, my));
        if (t > 0.36) {
          BURST.phys(g, m.x, my, m.s, t - 0.36, 0);
          const k = eOut(seg(t, 0.4, 0.6)), a = 1 - seg(t, 0.8, 0.9);
          for (let i = 0; i < 3; i++) { g.strokeStyle = rgba('#c0a060', a); g.lineWidth = 2; g.beginPath(); g.ellipse(m.x, my - 10 + i * 12, m.s * 0.55 * k, 5 * k, 0.1 * (i - 1), 0, Math.PI * 2); g.stroke(); }
        }
        vignette(g, 0.35);
      }
    },
    qingque: {
      line: 'Ещё одну кость...', d: 0.85, sfx: [[0.02, 'snap'], [0.32, 'snap'], [0.5, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 140, hy = 214;
        ST.backdrop(S, P, 0.55, '#0a1410');
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const pull = eOut(seg(t, 0.02, 0.25));
        for (let i = 0; i < 2; i++) {
          const x = hx0 + 40 + i * 18, y = lerp(hy - 60, hy - 110, pull), flip = i === 1 ? seg(t, 0.3, 0.45) : 1;
          g.save(); g.translate(x, y); g.scale(Math.max(0.1, Math.abs(Math.cos(flip * Math.PI))), 1); tile(g, 0, 0, 14, 20, flip > 0.5 || i === 0 ? 1 : 0, 1); g.restore();
        }
        if (t > 0.45) lighter(g, () => glow(g, hx0 + 49, hy - 110, 20 * seg(t, 0.45, 0.6), '#7affc8', 0.5 * (1 - seg(t, 0.7, 0.85))));
        if (t > 0.6) { const k = seg(t, 0.6, 0.85); g.fillStyle = rgba('#ffffff', 0.7 * (1 - k)); for (let i = 0; i < 2; i++) { const x = hx0 - 20 - i * 8, y = hy - 140 - k * 12 - i * 8, s2 = 3 + i; rect(g, rgba('#ffffff', 0.7 * (1 - k)), x, y, s2 * 2, 1); line(g, rgba('#ffffff', 0.7 * (1 - k)), 1, x + s2 * 2, y, x, y + s2 * 2); rect(g, rgba('#ffffff', 0.7 * (1 - k)), x, y + s2 * 2, s2 * 2, 1); } }
        vignette(g, 0.35);
      }
    },
    yukong: {
      line: 'Луки к небу!', d: 0.95, sfx: [[0.02, 'swing'], [0.36, 'whoosh'], [0.5, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 90, hy = 214, mates = P.allies.filter(a => a.u !== P.u).slice(0, 3);
        ST.backdrop(S, P, 0.5, '#081020');
        mates.forEach((a, i) => S.fig(a.look, 180 + i * 46, 214, { k: 2, s: 0.54, a: 0.85 }));
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const draw = seg(t, 0.02, 0.3);
        g.strokeStyle = '#c8a070'; g.lineWidth = 2; g.beginPath(); g.arc(hx0 + 18, hy - 100, 18, -1.2, 1.2); g.stroke();
        line(g, '#e8e0d0', 1, hx0 + 18 + Math.cos(-1.2) * 18 - draw * 8, hy - 100 + Math.sin(-1.2) * 18, hx0 + 18 + Math.cos(1.2) * 18 - draw * 8, hy - 100 + Math.sin(1.2) * 18);
        const up = seg(t, 0.3, 0.45);
        if (up > 0 && up < 1) lighter(g, () => { const y = lerp(hy - 100, BAR + 10, eIn(up)); line(g, rgba('#ffe0a0', 0.9), 2, hx0 + 18, y + 16, hx0 + 18, y); });
        if (t > 0.45) { const k = seg(t, 0.45, 0.8), a = 1 - seg(t, 0.75, 0.95); lighter(g, () => { for (let i = 0; i < 5; i++) { const x = 140 + i * 36, y = BAR + 30 + (i % 2) * 14 + k * 10; glow(g, x, y, 10 + 8 * k, ['#ff8a40', '#ffe080', '#ff8a40', '#ffe080', '#ff8a40'][i], 0.8 * a); } }); }
        if (t > 0.7) { const k = seg(t, 0.7, 0.95); lighter(g, () => { g.strokeStyle = rgba('#bfe0ff', 0.5 * k); g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 20; i++) { const x = 10 + i * 6, y = 100 + Math.sin(i * 0.6 + T * 4) * 8; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }); }
        vignette(g, 0.35);
      }
    },
    guinaifen: {
      line: 'Огонька не желаете?', d: 0.95, sfx: [[0.02, 'whoosh'], [0.4, 'crit'], [0.7, 'sparkle']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.5, '#180a04');
        ST.foes(S, P, { flash: t > 0.4 && t < 0.6 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: seg(t, 0.7, 0.9) * 0.2 });
        const toss = seg(t, 0.02, 0.3), fly = seg(t, 0.3, 0.42);
        let bx = hx0 + 16, by = hy - 100 - Math.sin(toss * Math.PI) * 40;
        if (fly > 0) { bx = lerp(hx0 + 16, m.x, eIn(fly)); by = lerp(hy - 100, my, eIn(fly)); }
        if (fly < 1) lighter(g, () => { glow(g, bx, by, 10, '#ff7a20', 0.9); ell(g, '#ffe0a0', bx, by, 4, 4); });
        order.forEach((f, i) => { const t0 = f === m ? 0.42 : 0.5; if (t > t0) BURST.fire(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        if (t > 0.5) K.embers(g, T, 18, 7, m.x - 50, m.x + 50, m.y, '#ffb060');
        if (t > 0.7) for (let i = 0; i < 6; i++) { const q = seg(t, 0.7 + i * 0.02, 0.95), x = hx0 - 30 + i * 12; if (q > 0) ell(g, '#ffd060', x, lerp(BAR, FLOOR - 4, q), 2, 2); }
        vignette(g, 0.35);
      }
    },
    miyabi: {
      line: 'Срез.', d: 0.9, sfx: [[0.02, 'glint'], [0.32, 'swing'], [0.62, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.6, '#061020');
        const cut = seg(t, 0.28, 0.34), a = 1 - seg(t, 0.4, 0.7);
        ST.foes(S, P, { flash: t > 0.32 && t < 0.55 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: t > 0.3 && t < 0.6 ? 0.06 : 0 });
        if (t < 0.3) lighter(g, () => glow(g, hx0 + 16, hy - 70, 6 + 4 * seg(t, 0.05, 0.28), '#bfefff', 0.8));
        if (cut > 0) lighter(g, () => { line(g, rgba('#bfefff', 0.6 * a), 5, 0, my, LW * cut, my); line(g, rgba('#ffffff', a), 1, 0, my, LW * cut, my); });
        order.forEach((f, i) => { if (t > 0.34) { K.sparks(g, T, f.x, f.y - f.s * 0.4, 10, 3 + i, '#e8fbff', f.s * 0.6 * seg(t, 0.34, 0.6)); BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 0.9 : 0.6), t - 0.36, i); } });
        if (t > 0.6) { const k = seg(t, 0.6, 0.66); line(g, '#2a2a34', 2, hx0 + 10, hy - 66, hx0 + 10 + 22 * (1 - k), hy - 70); }
        K.snowfall(g, T, 20, 5, { a: 0.4 });
        vignette(g, 0.4);
      }
    },
    yanagi: {
      line: 'Смена стойки.', d: 0.95, sfx: [[0.02, 'swing'], [0.38, 'crit'], [0.52, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.6, '#0a0a14');
        ST.foes(S, P, { flash: t > 0.38 && t < 0.58 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const spin = seg(t, 0.02, 0.32), ang = spin * Math.PI * 4;
        if (t < 0.34) { const cx = hx0 + 16, cy = hy - 96; line(g, '#3a3a4a', 2, cx - Math.cos(ang) * 24, cy - Math.sin(ang) * 24, cx + Math.cos(ang) * 24, cy + Math.sin(ang) * 24); poly(g, '#e0e0f0', [cx + Math.cos(ang) * 24, cy + Math.sin(ang) * 24, cx + Math.cos(ang + 0.2) * 32, cy + Math.sin(ang + 0.2) * 32, cx + Math.cos(ang - 0.1) * 30, cy + Math.sin(ang - 0.1) * 30]); }
        if (t > 0.1 && t < 0.7) { const a = seg(t, 0.1, 0.2) * (1 - seg(t, 0.55, 0.7)), x = hx0 - 30, y = hy - 160; lighter(g, () => { ring(g, rgba('#c07aff', a), 1, x, y, 8); crescent(g, x, y, 6, Math.floor(T) % 2 ? 0 : Math.PI, '#e0c0ff', a); }); }
        if (t > 0.34 && t < 0.6) lighter(g, () => A.bolt(g, hx0 + 30, hy - 100, m.x, my, Math.floor(T * 30), '#c07aff', 2));
        order.forEach((f, i) => { const t0 = f === m ? 0.38 : 0.48; if (t > t0) BURST.elec(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.6), t - t0, i); if (f !== m && t > 0.5) { const a = 1 - seg(t, 0.8, 0.95), x = f.x, y = f.y - f.s; rect(g, rgba('#ff6a8a', a), x - 6, y, 5, 1); rect(g, rgba('#6ab0ff', a), x + 2, y, 5, 1); rect(g, rgba('#6ab0ff', a), x + 4, y - 2, 1, 5); } });
        vignette(g, 0.4);
      }
    },
    phrolova: {
      line: 'Тише, начинаем.', d: 1.0, sfx: [[0.02, 'strum'], [0.44, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.7, '#0a0410');
        const spot = eOut(seg(t, 0.02, 0.25));
        lighter(g, () => poly(g, rgba('#fff0d0', 0.2 * spot), [hx0 - 6, 0, hx0 + 6, 0, hx0 + 40, FLOOR, hx0 - 40, FLOOR]));
        const sway = 1 - seg(t, 0.75, 1);
        for (const [x0, dir] of [[0, 1], [LW, -1]]) { for (let i = 0; i < 4; i++) rect(g, i % 2 ? '#6a1020' : '#8a1828', x0 + dir * (i * 7 + Math.sin(T * 3 + i) * 2 * sway) - (dir < 0 ? 7 : 0), BAR, 7, FLOOR - BAR); }
        ST.foes(S, P, { flash: flashOf(P, t, 0.44, 0.04, 0.2) });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const raise = eOut(seg(t, 0.02, 0.2));
        line(g, '#e8e0d0', 1, hx0 + 18, hy - 90, hx0 + 18 + 10 * raise, hy - 90 - 18 * raise);
        const write = seg(t, 0.15, 0.35), nx = hx0 + 50, ny = hy - 130;
        if (t < 0.45) lighter(g, () => { ell(g, rgba('#c07aff', write), nx, ny, 4, 3); line(g, rgba('#c07aff', write), 1, nx + 4, ny, nx + 4, ny - 14 * write); line(g, rgba('#c07aff', write), 1, nx + 4, ny - 14 * write, nx + 9, ny - 10 * write); });
        order.forEach((f, i) => { const k = eIn(seg(t, 0.35 + i * 0.04, 0.45 + i * 0.04)); if (k > 0 && k < 1) lighter(g, () => { const x = lerp(nx, f.x, k), y = lerp(ny, f.y - f.s * 0.4, k); ell(g, rgba('#e0c0ff', 0.9), x, y, 3, 2); glow(g, x, y, 8, '#c07aff', 0.8); }); });
        hitAll(g, P, t, 0.44, 0.04, 'quant');
        vignette(g, 0.45);
      }
    },
    scar: {
      line: 'Сладких снов.', d: 0.95, sfx: [[0.02, 'whoosh'], [0.4, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.65, '#140404');
        const stretch = eOut(seg(t, 0.02, 0.3));
        for (let i = 0; i < 5; i++) ell(g, rgba('#000000', 0.4 * stretch), hx0 + 30 + i * 40, FLOOR - 2, 10 + stretch * 30, 3);
        ST.foes(S, P, { flash: t > 0.4 && t < 0.6 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: seg(t, 0.75, 0.95) * 0.15 });
        const sw = seg(t, 0.3, 0.45), a = 1 - seg(t, 0.5, 0.75);
        if (sw > 0) lighter(g, () => { crescent(g, m.x, my, m.s * 0.7, lerp(-1.6, 1.2, eOut(sw)), '#ff7a30', 0.8 * a); crescent(g, m.x, my, m.s * 0.5, lerp(-1.6, 1.2, eOut(sw)), '#fff0c0', 0.6 * a); });
        if (t > 0.4) BURST.fire(g, m.x, my, m.s, t - 0.4, 0);
        if (t > 0.5) { const k = eOut(seg(t, 0.5, 0.65)), b = 1 - seg(t, 0.85, 0.95); lighter(g, () => { ring(g, rgba('#ff5040', b), 1, m.x, m.y - m.s - 6, 6 * k); for (let i = 0; i < 4; i++) { const an = i / 4 * Math.PI * 2 + T * 2; rect(g, rgba('#ff5040', b), m.x + Math.cos(an) * 8 * k - 1, m.y - m.s - 6 + Math.sin(an) * 8 * k - 1, 2, 2); } }); }
        vignette(g, 0.45);
      }
    },
    kazuma: {
      line: 'Это теперь моё.', d: 0.85, sfx: [[0.02, 'whoosh'], [0.32, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.5, '#0a1008');
        ST.foes(S, P, { flash: t > 0.3 && t < 0.4 ? 0.8 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: seg(t, 0, 0.25) * 0.08 });
        if (t > 0.28 && t < 0.36) flash(g, '#ffffff', 0.4);
        const fly = seg(t, 0.32, 0.55), px = lerp(m.x, hx0 + 20, eOut(fly)), py = lerp(my, hy - 96, eOut(fly)) - Math.sin(fly * Math.PI) * 30;
        if (t > 0.32) { rect(g, '#8a5a3a', px - 5, py - 4, 10, 8); rect(g, '#c08a50', px - 5, py - 4, 10, 2); ell(g, '#e0c060', px, py - 6, 2, 2); }
        if (t > 0.45) { const k = seg(t, 0.45, 0.7); for (let i = 0; i < 3; i++) lighter(g, () => ell(g, rgba('#ffffff', 0.6 * (1 - k)), m.x - m.s * 0.4 + i * 4, my - k * 10 - i * 4, 2, 2)); }
        if (t > 0.6) lighter(g, () => A.star5(g, hx0 + 26, hy - 110, 3 + Math.sin(T * 10), T * 4, '#fff0b0'));
        vignette(g, 0.35);
      }
    },
    'kazuma.bind': {
      line: 'Связывание!', d: 0.9, sfx: [[0.02, 'whoosh'], [0.4, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214;
        ST.backdrop(S, P, 0.5, '#0a1008');
        ST.foes(S, P);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const fly = eOut(seg(t, 0.05, 0.35));
        if (fly < 1) { g.strokeStyle = '#c8a070'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx0 + 20, hy - 96); g.quadraticCurveTo((hx0 + m.x) / 2, hy - 160, lerp(hx0 + 20, m.x, fly), lerp(hy - 96, my, fly)); g.stroke(); }
        if (t > 0.35) { const k = eOut(seg(t, 0.35, 0.6)); g.strokeStyle = '#c8a070'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(m.x, my - 10 + i * 10, m.s * 0.5 * k + 2, 4, 0.1 * (i - 1), 0, Math.PI * 2); g.stroke(); } }
        if (t > 0.6) { const k = eOut(seg(t, 0.6, 0.75)), x = m.x + m.s * 0.5, y = my; for (const s of [-1, 1]) ell(g, '#d04050', x + s * 5 * k, y - 3, 4 * k, 3 * k); ell(g, '#a02030', x, y - 3, 2, 2); }
        vignette(g, 0.35);
      }
    },
    'kazuma.drain': {
      line: 'Немножко возьму.', d: 0.85, sfx: [[0.02, 'tech'], [0.36, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, mate = mateOf(P), tx = mate.x, hx0 = mate.self ? 120 : 150, hy = 214;
        ST.backdrop(S, P, 0.5, '#081408');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const touch = seg(t, 0.05, 0.25), flow = seg(t, 0.25, 0.65), hand = { x: hx0 + 22, y: hy - 90 };
        if (touch > 0) lighter(g, () => glow(g, hand.x, hand.y, 10 * touch, '#60ff90', 0.7));
        if (flow > 0) lighter(g, () => { for (let i = 0; i < 6; i++) { const q = (flow * 2 + i / 6) % 1, x = lerp(hx0, tx, q), y = lerp(hy - 80, hy - 80, q) + Math.sin(q * 8 + i) * 4; const fa = 1 - seg(t, 0.6, 0.75); glow(g, x, y, 6, '#60ff90', 0.7 * fa); ell(g, rgba('#e0ffe8', fa), x, y, 2.5, 2.5); } line(g, rgba('#60ff90', 0.35 * (1 - seg(t, 0.6, 0.75))), 4, hx0 + 20, hy - 82, tx - 8, hy - 80); glow(g, tx, hy - 70, 24 * flow, '#60ff90', 0.4 * (1 - seg(t, 0.65, 0.85))); });
        if (t > 0.65) { const k = seg(t, 0.65, 0.85); line(g, '#e8d0b0', 2, hx0 + 20, hy - 90 + Math.sin(T * 40) * 3 * (1 - k), hx0 + 26, hy - 94 + Math.sin(T * 40 + 1) * 3 * (1 - k)); }
        vignette(g, 0.35);
      }
    },
    aqua: {
      line: 'Хвалите меня!', d: 0.9, sfx: [[0.02, 'glint'], [0.36, 'splash'], [0.5, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x;
        ST.backdrop(S, P, 0.45, '#061428');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        const droop = seg(t, 0.7, 0.9);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74, rot: -0.05 * (1 - droop) + 0.05 * droop });
        const raise = eOut(seg(t, 0.02, 0.25));
        line(g, '#c8d8f0', 2, hx0 + 16, hy - 70, hx0 + 22, hy - 100 - 20 * raise);
        lighter(g, () => glow(g, hx0 + 22, hy - 104 - 20 * raise, 6, '#9ae0ff', raise));
        const drop = eIn(seg(t, 0.2, 0.36));
        if (drop > 0 && drop < 1) ell(g, '#9ae0ff', tx, lerp(BAR, hy - 150, drop), 3, 4);
        if (t > 0.36) { const k = eOut(seg(t, 0.36, 0.5)), a = 1 - seg(t, 0.7, 0.9); lighter(g, () => { rect(g, rgba('#7ac8ff', 0.35 * a), tx - 18 * k, BAR, 36 * k, FLOOR - BAR); rect(g, rgba('#e8fbff', 0.5 * a), tx - 5 * k, BAR, 10 * k, FLOOR - BAR); }); K.sparks(g, T, tx, FLOOR - 10, 10, 4, '#e8fbff', 30); }
        if (t > 0.45 && t < 0.75) lighter(g, () => { for (let i = 0; i < 3; i++) A.star5(g, hx0 - 20 + i * 20, hy - 150 - i * 6, 3, T * 4 + i, '#fff0b0'); });
        if (droop > 0) { const y = hy - 150; line(g, rgba('#6a8ab0', droop), 1, hx0 + 10, y, hx0 + 10, y + 8); line(g, rgba('#6a8ab0', droop), 1, hx0 + 16, y + 2, hx0 + 16, y + 10); }
        vignette(g, 0.35);
      }
    },
    megumin: {
      line: 'Копим ману...', d: 1.0, sfx: [[0.02, 'tech'], [0.4, 'glint'], [0.8, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 140, hy = 214, tip = { x: hx0 + 26, y: hy - 150 }, gather = seg(t, 0.2, 0.85);
        ST.backdrop(S, P, 0.55 + 0.25 * gather, '#140404');
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8, rot: Math.sin(T * 8) * 0.01 });
        line(g, '#6a4a3a', 2, hx0 + 18, hy - 50, tip.x, tip.y);
        lighter(g, () => {
          for (let i = 0; i < 26; i++) { const q = (gather * 1.6 + i / 26) % 1, an = i * 2.4, r = (1 - q) * 120; if (gather <= 0) break; ell(g, rgba('#ff5040', 0.8 * q), tip.x + Math.cos(an) * r, tip.y + Math.sin(an) * r * 0.7, 1.5, 1.5); }
          glow(g, tip.x, tip.y, 6 + gather * 18, '#ff4020', 0.5 + 0.5 * gather);
          ell(g, '#ffd0c0', tip.x, tip.y, 2 + gather * 2, 2 + gather * 2);
          if (t > 0.6) glow(g, hx0 + 4, hy - 138, 4, '#ff3020', 0.9 * seg(t, 0.6, 0.75));
        });
        vignette(g, 0.5);
      }
    },
    darkness: {
      line: 'Ну же, бейте!', d: 0.9, sfx: [[0.02, 'step'], [0.4, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, step = eOut(seg(t, 0.02, 0.3)), hx0 = lerp(100, 150, step), hy = 214;
        ST.backdrop(S, P, 0.55, '#0c0c14');
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8 });
        rect(g, '#8a8a9a', hx0 + 14, hy - 100, 14, 26); rect(g, '#c8c8d8', hx0 + 15, hy - 99, 12, 3); rect(g, '#d0b040', hx0 + 19, hy - 92, 4, 10);
        for (let i = 0; i < 5; i++) {
          const k = eOut(seg(t, 0.3 + i * 0.03, 0.5 + i * 0.03)), y = 60 + i * 26, x0 = LW - 10, x1 = lerp(x0, hx0 + 40, k), a = 1 - seg(t, 0.75, 0.9);
          if (k <= 0) continue;
          lighter(g, () => { line(g, rgba('#ff4040', 0.8 * a), 2, x0, y, x1, lerp(y, hy - 90, k)); poly(g, rgba('#ff4040', a), [x1, lerp(y, hy - 90, k), x1 + 6, lerp(y, hy - 90, k) - 4, x1 + 6, lerp(y, hy - 90, k) + 4]); });
        }
        if (t > 0.65) { const k = seg(t, 0.65, 0.8); for (const dx of [-6, 6]) ell(g, rgba('#ff7a9a', 0.7 * k), hx0 + dx, hy - 132, 3, 1.5); lighter(g, () => { for (let i = 0; i < 2; i++) A.star5(g, hx0 + 22 + i * 8, hy - 146 - i * 6, 2, T * 3, '#ffb0c8'); }); }
        vignette(g, 0.4);
      }
    },
    yu: {
      line: 'Изанаги!', d: 0.95, sfx: [[0.02, 'glint'], [0.3, 'snap'], [0.5, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#08081a');
        ST.foes(S, P, { flash: t > 0.5 && t < 0.7 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.25), pa = seg(t, 0.3, 0.42) * (1 - seg(t, 0.75, 0.95));
        if (out) persona(g, 'izanagi', hx0 + 40, hy - 10, 110, 0.85 * pa);
        if (t > 0.48 && t < 0.7) lighter(g, () => A.bolt(g, m.x, BAR, m.x, my, Math.floor(T * 30), '#e0c0ff', 3));
        if (t > 0.5) BURST.elec(g, m.x, my, m.s, t - 0.5, 0);
        if (t > 0.75) K.sparks(g, T, hx0 + 40, hy - 60, 12, 6, '#9ac0ff', 40);
        vignette(g, 0.4);
      }
    },
    'yu.frost': {
      line: 'Джек Фрост!', d: 0.9, sfx: [[0.02, 'glint'], [0.3, 'snap'], [0.5, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.5, '#061428');
        ST.foes(S, P, { flash: t > 0.5 && t < 0.7 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.25), pa = seg(t, 0.3, 0.4) * (1 - seg(t, 0.75, 0.9));
        if (out) jackFrost(g, hx0 + 44, hy - 30 + Math.sin(T * 8) * 3, 1.4, pa);
        const fly = seg(t, 0.38, 0.5);
        if (fly > 0 && fly < 1) lighter(g, () => { const x = lerp(hx0 + 50, m.x, eIn(fly)), y = lerp(hy - 90, my, eIn(fly)); glow(g, x, y, 10, '#bfefff', 0.9); ell(g, '#ffffff', x, y, 4, 4); });
        order.forEach((f, i) => { const t0 = f === m ? 0.5 : 0.56; if (t > t0) BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        if (t > 0.72) { const k = seg(t, 0.72, 0.9); g.save(); g.translate(hx0 + 60, hy - 90); g.rotate(Math.sin(k * 12) * 0.5); rect(g, rgba('#f0f8ff', pa), -2, -8, 4, 8); g.restore(); }
        vignette(g, 0.35);
      }
    },
    'yu.yoshi': {
      line: 'Ёсицунэ!', d: 1.05, sfx: [[0.02, 'glint'], [0.3, 'swing'], [0.5, 'hit'], [0.7, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#100a14');
        const hits = [0, 1, 2, 3, 4, 5].map(i => P.foes.length ? P.foes[Math.floor(hx(i, 3, 7) * P.foes.length)] : null).filter(Boolean), at = i => 0.32 + i * 0.08;
        ST.foes(S, P, { flash: hits.some((f, i) => t > at(i) && t < at(i) + 0.06) ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.22), pa = seg(t, 0.25, 0.32) * (1 - seg(t, 0.85, 1.05));
        const cur = hits[Math.min(hits.length - 1, Math.max(0, Math.floor((t - 0.3) / 0.08)))];
        if (out) yoshitsune(g, t > 0.3 && t < 0.82 && cur ? cur.x - 24 : hx0 + 44, hy - 10, 1.3, pa);
        hits.forEach((f, i) => { const k = seg(t, at(i), at(i) + 0.05), a = 1 - seg(t, at(i) + 0.05, at(i) + 0.2); if (k > 0 && a > 0) { const an = -0.8 + hx(i, 5, 2) * 1.6, r = f.s * 0.7, y = f.y - f.s * 0.4; lighter(g, () => line(g, rgba('#ffffff', a), 2, f.x - Math.cos(an) * r, y - Math.sin(an) * r, f.x + Math.cos(an) * r * (2 * k - 1), y + Math.sin(an) * r * (2 * k - 1))); } if (t > at(i)) BURST.phys(g, f.x, f.y - f.s * 0.4, f.s * 0.6, t - at(i), i); });
        vignette(g, 0.4);
      }
    },
    yosuke: {
      line: 'Джирайя, давай!', d: 0.9, sfx: [[0.02, 'glint'], [0.3, 'snap'], [0.48, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.5, '#061a10');
        ST.foes(S, P, { flash: t > 0.48 && t < 0.65 ? 0.4 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.25), pa = seg(t, 0.3, 0.42) * (1 - seg(t, 0.7, 0.85));
        if (out) persona(g, 'jiraiya', hx0 + 40, hy - 10, 100, 0.85 * pa);
        if (t > 0.42) lighter(g, () => order.forEach((f, i) => { const k = seg(t, 0.42, 0.75), y = f.y - f.s * 0.4; for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc8', 0.7 * (1 - k)); g.lineWidth = 1; g.beginPath(); g.arc(f.x, y, (6 + j * 6) * (0.5 + k), T * 10 + j, T * 10 + j + 4); g.stroke(); } }));
        if (t > 0.48) BURST.wind(g, m.x, my, m.s, t - 0.48, 0);
        if (t > 0.7) { const k = seg(t, 0.7, 0.9), an = k * Math.PI * 6; line(g, '#c8c8d0', 1, hx0 + 22, hy - 92, hx0 + 22 + Math.cos(an) * 6, hy - 92 + Math.sin(an) * 6); }
        vignette(g, 0.35);
      }
    },
    chie: {
      line: 'Получай!', d: 0.9, sfx: [[0.02, 'step'], [0.36, 'crit'], [0.5, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, jump = eOut(seg(t, 0.15, 0.32)), hx0 = lerp(80, Math.min(110, m.x - 70), jump), hy = 214 - Math.sin(jump * Math.PI) * 26, order = blastOrder(P);
        ST.backdrop(S, P, 0.5, '#061220');
        ST.foes(S, P, { flash: t > 0.36 && t < 0.56 ? 0.5 : 0 });
        if (t > 0.1 && t < 0.4) persona(g, 'tomoe', hx0 - 30, 214, 90, 0.4 * (1 - seg(t, 0.3, 0.4)));
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: jump * 0.3 - seg(t, 0.55, 0.75) * 0.3 });
        if (t > 0.3 && t < 0.6) lighter(g, () => { const a = 1 - seg(t, 0.36, 0.6); g.strokeStyle = rgba('#bfefff', a); g.lineWidth = 4; g.beginPath(); g.moveTo(hx0 + 20, hy - 40); g.quadraticCurveTo(m.x - 20, my - 40, m.x + 30, my + 10); g.stroke(); for (const f of order) if (f !== m) line(g, rgba('#bfefff', 0.6 * a), 2, m.x, my, f.x, f.y - f.s * 0.4); });
        order.forEach((f, i) => { const t0 = f === m ? 0.36 : 0.46; if (t > t0) BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        if (t > 0.7) lighter(g, () => A.star5(g, hx0 + 24, hy - 130, 4, T * 6, '#ffe080'));
        vignette(g, 0.35);
      }
    },
    yukiko: {
      line: 'Коноханасакуя!', d: 0.9, sfx: [[0.02, 'glint'], [0.3, 'snap'], [0.5, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.45, '#1a0806');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.25), pa = seg(t, 0.3, 0.42) * (1 - seg(t, 0.72, 0.88));
        if (out) persona(g, 'sakuya', hx0 + 36, hy - 10, 100, 0.85 * pa);
        for (let i = 0; i < 8; i++) { const k = seg(t, 0.36 + i * 0.02, 0.56 + i * 0.02); if (k <= 0 || k >= 1) continue; const x = lerp(hx0 + 40, tx + (i - 4) * 4, eOut(k)), y = lerp(hy - 110, ty, eOut(k)) - Math.sin(k * Math.PI) * 26; lighter(g, () => { ell(g, rgba('#ffb060', 0.9), x, y, 2, 1.5); glow(g, x, y, 4, '#ff8a40', 0.6); }); }
        if (t > 0.55) { const a = 1 - seg(t, 0.75, 0.9); lighter(g, () => { glow(g, tx, ty, 30, '#60ff90', 0.5 * a); crossMark(g, tx, ty - 6, 6, '#c0ffd0', a); }); }
        if (t > 0.72) { const k = seg(t, 0.72, 0.9), fx = hx0 + 20, fy = hy - 108; for (let i = 0; i < 5; i++) { const an = -Math.PI + i / 4 * Math.PI; line(g, '#c84040', 2, fx, fy, fx + Math.cos(an) * 10 * k, fy + Math.sin(an) * 10 * k); } }
        vignette(g, 0.35);
      }
    },
    kanji: {
      line: 'Не пялься!', d: 0.95, sfx: [[0.02, 'swing'], [0.4, 'crit'], [0.6, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, mate2 = P.foes.find(f => f !== m);
        ST.backdrop(S, P, 0.55, '#120a06');
        ST.foes(S, P, { flash: t > 0.4 && t < 0.6 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8, rot: seg(t, 0.75, 0.95) * -0.2 });
        const lift = eOut(seg(t, 0.02, 0.3)), sw = eOut(seg(t, 0.32, 0.42));
        g.save(); g.translate(hx0 + 18, hy - 100); g.rotate(lerp(-2.2, 0.6, sw) - (1 - lift) * 0.4); rect(g, '#6a6a7a', 0, -2, 22, 3); rect(g, '#8a8a9a', 16, -8, 3, 14); rect(g, '#8a8a9a', 6, -8, 3, 14); g.restore();
        if (mate2) { const k = eOut(seg(t, 0.2, 0.4)), a = 1 - seg(t, 0.8, 0.95); g.strokeStyle = rgba('#e8e0d0', a); g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= 10; i++) { const q = i / 10 * k, x = lerp(m.x, mate2.x, q), y = lerp(my, mate2.y - mate2.s * 0.4, q) + (i % 2 ? -4 : 4); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
        if (t > 0.4) BURST.phys(g, m.x, my, m.s, t - 0.4, 0);
        if (t > 0.75) for (const dx of [-5, 5]) ell(g, rgba('#ff7a8a', 0.7 * seg(t, 0.75, 0.9)), hx0 + dx, hy - 140, 3, 1.5);
        vignette(g, 0.4);
      }
    },
    rise: {
      line: 'Анализирую!', d: 0.9, sfx: [[0.02, 'glint'], [0.3, 'scan'], [0.6, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#141008');
        ST.foes(S, P, { flash: 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const out = personaCard(g, hx0 + 26, hy - 100, t, 0.22), pa = seg(t, 0.25, 0.36) * (1 - seg(t, 0.75, 0.9));
        if (out) persona(g, 'himiko', hx0 + 36, hy - 10, 96, 0.8 * pa);
        if (t > 0.32 && t < 0.62) { const k = seg(t, 0.32, 0.6), y = lerp(m.y - m.s, m.y, k); lighter(g, () => { line(g, rgba('#ffe080', 0.9), 2, m.x - m.s * 0.6, y, m.x + m.s * 0.6, y); rect(g, rgba('#ffe080', 0.15), m.x - m.s * 0.6, m.y - m.s, m.s * 1.2, y - (m.y - m.s)); }); }
        if (t > 0.55) { const k = eOut(seg(t, 0.55, 0.7)), a = 1 - seg(t, 0.82, 0.9), cx = m.x, cy = m.y - m.s - 10; ring(g, rgba('#ffe080', a), 1, cx, cy, 6 * k); line(g, rgba('#ffe080', a), 1, cx, cy, cx, cy - 4 * k); line(g, rgba('#ffe080', a), 1, cx, cy, cx + 3 * k, cy); }
        vignette(g, 0.35);
      }
    },
    makoto: {
      line: 'Мяу. Моё.', d: 0.9, sfx: [[0.02, 'step'], [0.34, 'crit'], [0.5, 'sparkle']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, sneak = eOut(seg(t, 0.02, 0.3)), hx0 = lerp(70, Math.min(108, m.x - 74), sneak), hy = 214;
        ST.backdrop(S, P, 0.55, '#0e0618');
        ST.foes(S, P, { flash: t > 0.34 && t < 0.52 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy - Math.abs(Math.sin(T * 14)) * 2 * (1 - seg(t, 0.3, 0.35)), { k: 2, s: 0.72 });
        if (t > 0.3 && t < 0.5) lighter(g, () => line(g, rgba('#d0a0ff', 1 - seg(t, 0.34, 0.5)), 3, hx0 + 24, hy - 90, m.x, my));
        if (t > 0.34) BURST.imag(g, m.x, my, m.s, t - 0.34, 0);
        const fly = seg(t, 0.42, 0.66);
        if (fly > 0) { const x = lerp(m.x, hx0 + 20, eOut(fly)), y = lerp(my, hy - 96, eOut(fly)) - Math.sin(fly * Math.PI) * 26, a = 1 - seg(t, 0.75, 0.85); lighter(g, () => { A.star5(g, x, y, 4, T * 6, rgba('#fff0b0', a)); glow(g, x, y, 8, '#ffe080', 0.7 * a); }); }
        if (t > 0.75) { const k = seg(t, 0.75, 0.9); for (let i = 0; i < 2; i++) ell(g, rgba('#ffd0e0', 0.6 * (1 - k)), hx0 + 22 + i * 6, hy - 132 - k * 10 - i * 5, 2, 2); }
        vignette(g, 0.35);
      }
    },
    amanda: {
      line: 'Время превращаться!', d: 1.0, sfx: [[0.02, 'select'], [0.36, 'sparkle'], [0.7, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 150, hy = 214, glowK = seg(t, 0.3, 0.6), done = t > 0.6;
        ST.backdrop(S, P, 0.5 + 0.2 * glowK * (1 - seg(t, 0.6, 0.8)), '#1a0614');
        const look = done && P.u.kit && P.u.kit.pinkLook ? P.u.kit.pinkLook : P.look;
        S.fig(look, hx0, hy, { k: 2, s: 0.78, rot: done ? -0.05 : 0 });
        if (t < 0.3) { rect(g, '#c8c8d0', hx0 + 14, hy - 92, 6, 6); rect(g, '#2a2a34', hx0 + 15, hy - 91, 4, 4); }
        if (glowK > 0 && glowK < 1) lighter(g, () => { glow(g, hx0, hy - 80, 80 * glowK, '#ff7ac8', 0.8 * Math.sin(glowK * Math.PI)); for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2 + T * 4, r = 40 * (1 - glowK) + 10; A.star5(g, hx0 + Math.cos(an) * r, hy - 80 + Math.sin(an) * r * 1.4, 2.5, T * 5, '#ffd0f0'); } });
        if (done) { const k = eOut(seg(t, 0.6, 0.8)), a = 1 - seg(t, 0.9, 1) * 0.5; lighter(g, () => { g.strokeStyle = rgba('#ff9ad8', 0.8 * a); g.lineWidth = 2; g.beginPath(); g.ellipse(hx0, hy - 76, 34 * k, 70 * k, 0, 0, Math.PI * 2); g.stroke(); glow(g, hx0, hy - 76, 50 * k, '#ff7ac8', 0.25 * a); }); }
        vignette(g, 0.35);
      }
    },
    'amanda.pink': {
      line: 'Лови сердечко!', d: 0.85, sfx: [[0.02, 'sparkle'], [0.4, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 84, hy = 214, mate = mateOf(P), tx = mate.x, ty = hy - 70;
        ST.backdrop(S, P, 0.45, '#1a0614');
        if (!mate.self) S.fig(mate.look, tx, hy, { k: 2, s: 0.66, flip: true });
        S.fig(P.u.kit && P.u.kit.pinkLook ? P.u.kit.pinkLook : P.look, hx0, hy, { k: 2, s: 0.74 });
        const fly = seg(t, 0.15, 0.4);
        if (fly > 0 && fly < 1) lighter(g, () => { const x = lerp(hx0 + 20, tx, eOut(fly)), y = lerp(hy - 110, ty, eOut(fly)) - Math.sin(fly * Math.PI) * 30; glow(g, x, y, 10, '#ff7ac8', 0.9); ell(g, '#ffd0f0', x, y, 3, 3); });
        if (t > 0.4) { const k = eOut(seg(t, 0.4, 0.55)), a = 1 - seg(t, 0.75, 0.85) * 0.6; lighter(g, () => { g.strokeStyle = rgba('#ff9ad8', 0.85 * a); g.lineWidth = 2; g.beginPath(); g.ellipse(tx, ty + 6, 28 * k, 66 * k, 0, 0, Math.PI * 2); g.stroke(); glow(g, tx, ty, 40 * k, '#ff7ac8', 0.25 * a); }); K.sparks(g, T, tx, ty, 8, 5, '#ffd0f0', 40); }
        vignette(g, 0.35);
      }
    },
    talleah: {
      line: 'Вы арестованы!', d: 0.9, sfx: [[0.02, 'snap'], [0.38, 'crit'], [0.56, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#0a0a1a');
        ST.foes(S, P, { flash: t > 0.38 && t < 0.56 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const show = eOut(seg(t, 0.02, 0.2)), bx = hx0 + 30, by = hy - 104;
        if (t < 0.5) { g.save(); g.translate(bx, by); g.scale(show, show); poly(g, '#e0c060', [0, -9, 8, -3, 6, 7, -6, 7, -8, -3]); A.star5(g, 0, -1, 3, 0, '#fff0b0'); g.restore(); if (t < 0.25) lighter(g, () => glow(g, bx, by, 12, '#ffe080', 0.8 * show)); }
        if (t > 0.3 && t < 0.5) lighter(g, () => line(g, rgba('#c07aff', 1 - seg(t, 0.38, 0.5)), 3, bx, by, m.x, my));
        if (t > 0.38) BURST.quant(g, m.x, my, m.s, t - 0.38, 0);
        if (t > 0.45) { const k = eOut(seg(t, 0.45, 0.6)), a = 1 - seg(t, 0.8, 0.9), sx = m.x + m.s * 0.4, sy = my - m.s * 0.5; rect(g, rgba('#c07aff', a), sx - 7 * k, sy - 7 * k, 14 * k, 14 * k); rect(g, rgba('#1a0a2a', a), sx - 5 * k, sy - 5 * k, 10 * k, 10 * k); A.star5(g, sx, sy, 4 * k, 0, rgba('#e0c0ff', a)); }
        if (t > 0.65) { const k = seg(t, 0.65, 0.85); for (let i = 0; i < 3; i++) { const x = 22 + i * 18, y = FLOOR - 2, c0 = rgba('#8a9ac8', 0.8 * k); ell(g, c0, x, y - 16, 6, 14); ell(g, c0, x, y - 34, 5, 5); rect(g, rgba('#bfefff', k), x - 3, y - 35, 6, 1); } }
        vignette(g, 0.35);
      }
    },
    billy: {
      line: 'Огонь на поражение!', d: 1.0, sfx: [[0.02, 'swing'], [0.36, 'hit'], [0.48, 'hit'], [0.6, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.55, '#0a0a10');
        ST.foes(S, P, { flash: flashOf(P, t, 0.36, 0.08, 0.12) });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        const spin = seg(t, 0.02, 0.3);
        for (const s2 of [-1, 1]) { const cx = hx0 + 10 + s2 * 12, cy = hy - 86, an = spin < 1 ? spin * Math.PI * 6 : 0; line(g, '#3a3a44', 3, cx, cy, cx + Math.cos(an) * 12 * (s2 > 0 ? 1 : -1), cy + Math.sin(an) * 12); }
        if (t > 0.32 && t < 0.75) P.foes.forEach((f, i) => { for (let j = 0; j < 2; j++) { const t0 = 0.34 + i * 0.08 + j * 0.04; if (t > t0 && t < t0 + 0.05) lighter(g, () => { line(g, rgba('#ffe0a0', 0.9), 1, hx0 + 22, hy - 86, f.x, f.y - f.s * 0.4); glow(g, hx0 + 22, hy - 86, 8, '#ffd060', 0.9); }); } });
        hitAll(g, P, t, 0.36, 0.08, 'phys');
        if (t > 0.4 && t < 0.85) for (let i = 0; i < 6; i++) { const q = seg(t, 0.4 + i * 0.05, 0.6 + i * 0.05); if (q > 0 && q < 1) rect(g, '#e0b040', hx0 + 20 - q * 20 + i * 2, hy - 86 + q * 70 - Math.sin(q * Math.PI) * 20, 2, 1); }
        if (t > 0.8) { const k = seg(t, 0.8, 1); for (const dx of [-2, 22]) ell(g, rgba('#c8c8d0', 0.4 * (1 - k)), hx0 + dx, hy - 96 - k * 14, 2 + k * 3, 2 + k * 2); }
        vignette(g, 0.35);
      }
    },
    nicole: {
      line: 'Сюрприз внутри~', d: 0.95, sfx: [[0.02, 'tech'], [0.4, 'crit'], [0.56, 'debuff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 80, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.55, '#120618');
        if (t > 0.45) { const k = eOut(seg(t, 0.45, 0.62)), a = 1 - seg(t, 0.82, 0.95); lighter(g, () => { const xs = P.foes.map(f => f.x), cx = P.foes.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : m.x, w = P.foes.length ? (Math.max(...xs) - Math.min(...xs)) / 2 + 40 : 40; g.strokeStyle = rgba('#c07aff', 0.8 * a); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, m.y + 4, w * k, 10 * k, 0, 0, Math.PI * 2); g.stroke(); }); }
        ST.foes(S, P, { flash: t > 0.4 && t < 0.58 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.74 });
        const open = eOut(seg(t, 0.02, 0.25));
        rect(g, '#2a2a3a', hx0 + 14, hy - 80, 20, 12); rect(g, '#e05090', hx0 + 14, hy - 80 - 6 * open, 20, 3);
        const fly = seg(t, 0.28, 0.4);
        if (fly > 0 && fly < 1) { const x = lerp(hx0 + 30, m.x, eIn(fly)), y = lerp(hy - 84, my, eIn(fly)); g.save(); g.translate(x, y); g.rotate(T * 20); ell(g, '#ff9ad0', 0, 0, 5, 3); poly(g, '#ffd0f0', [-5, 0, -9, -3, -9, 3]); poly(g, '#ffd0f0', [5, 0, 9, -3, 9, 3]); g.restore(); }
        order.forEach((f, i) => { const t0 = f === m ? 0.4 : 0.48; if (t > t0) BURST.quant(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); });
        if (t > 0.75) { const k = seg(t, 0.75, 0.9); rect(g, rgba('#ff7a9a', 1 - k * 0.5), hx0 + 2, hy - 128, 4, 3 * (1 - k * 0.5) + 1); }
        vignette(g, 0.35);
      }
    },
    anby: {
      line: 'Атакую.', d: 0.85, sfx: [[0.02, 'whoosh'], [0.32, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, dash = eOut(seg(t, 0.2, 0.32)), hx0 = lerp(76, Math.min(112, m.x - 70), dash), hy = 214;
        ST.backdrop(S, P, 0.55, '#0e0a18');
        ST.foes(S, P, { flash: t > 0.32 && t < 0.52 ? 0.6 : 0 });
        if (t > 0.2 && t < 0.4) K.hStreaks(g, T, 12, 7, 600, '#e0c0ff', 0.4, hy - 120, hy - 40);
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76, rot: dash * 0.1 * (1 - seg(t, 0.55, 0.7)) });
        const charge = seg(t, 0, 0.2);
        lighter(g, () => { line(g, rgba('#e0c0ff', 0.6 + 0.4 * charge), 2, hx0 + 10, hy - 70, hx0 + 34, hy - 104); if (t < 0.3) A.bolt(g, hx0 + 10, hy - 70, hx0 + 34, hy - 104, Math.floor(T * 30), '#c07aff', 1); });
        if (t > 0.3 && t < 0.5) lighter(g, () => { const a = 1 - seg(t, 0.32, 0.5); line(g, rgba('#c07aff', a), 5, m.x - 30, my - 30, m.x + 30, my + 30); line(g, rgba('#ffffff', a), 1, m.x - 30, my - 30, m.x + 30, my + 30); });
        if (t > 0.32) BURST.elec(g, m.x, my, m.s, t - 0.32, 0);
        vignette(g, 0.4);
      }
    },
    'trail_p.magma': {
      enhanced: true, line: 'Магма, вперёд!', d: 0.95, sfx: [[0.02, 'rumble'], [0.36, 'swing'], [0.46, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), hx0 = 84, order = blastOrder(P), jump = seg(t, 0.28, 0.42), hy = 214 - Math.sin(jump * Math.PI) * 30;
        ST.backdrop(S, P, 0.6, '#1a0600');
        ST.foes(S, P, { flash: t > 0.46 && t < 0.66 ? 0.6 : 0 });
        const pull = eIn(seg(t, 0.05, 0.28));
        lighter(g, () => { for (let i = 0; i < 4; i++) { const an = i / 4 * Math.PI * 2 + T * 3, r = 40 * (1 - pull); if (pull < 1) { glow(g, hx0 + Math.cos(an) * r, hy - 80 + Math.sin(an) * r * 0.7, 6, '#ff8a20', 0.9); ell(g, '#ffe0a0', hx0 + Math.cos(an) * r, hy - 80 + Math.sin(an) * r * 0.7, 2, 2); } } if (pull > 0.5 && t < 0.45) glow(g, hx0 + 26, hy - 110, 16, '#ffb040', 0.7); });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: jump * 0.15 });
        line(g, '#3a2a20', 3, hx0 + 26, hy - 140, hx0 + 26, hy - 10 + jump * 20);
        if (t > 0.44) {
          const k = seg(t, 0.44, 0.62), a = 1 - seg(t, 0.75, 0.95);
          lighter(g, () => { let x = hx0 + 30, y = FLOOR - 2; for (let i = 0; i < 8; i++) { const nx = lerp(hx0 + 30, m.x, (i + 1) / 8 * k), ny = FLOOR - 2 + (i % 2 ? -4 : 4); line(g, rgba('#ffb040', a), 3, x, y, nx, ny); line(g, rgba('#fff0c0', a), 1, x, y, nx, ny); x = nx; y = ny; } });
          order.forEach((f, i) => { const t0 = f === m ? 0.52 : 0.58; if (t > t0) { lighter(g, () => { for (let j = 0; j < 4; j++) poly(g, rgba('#ff7a20', 0.6 * a), [f.x - 12 + j * 8, f.y + 4, f.x - 9 + j * 8, f.y - f.s * (0.6 + 0.3 * Math.sin(T * 12 + j)), f.x - 6 + j * 8, f.y + 4]); }); BURST.fire(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1 : 0.7), t - t0, i); } });
        }
        if (t > 0.7) K.embers(g, T, 20, 11, 0, LW, FLOOR, '#ffd070');
        vignette(g, 0.4);
      }
    },
    'darkness.ecstasy': {
      enhanced: true, line: 'Ой! Попала?!', d: 0.95, sfx: [[0.02, 'swing'], [0.3, 'swing'], [0.42, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 104, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.55, '#0c0c14');
        ST.foes(S, P, { flash: t > 0.42 && t < 0.62 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.8, rot: t < 0.42 ? Math.sin(T * 20) * 0.08 : 0 });
        const sw1 = seg(t, 0.02, 0.2), sw2 = seg(t, 0.3, 0.42), rot = t < 0.25 ? lerp(-2.5, -0.2, eOut(sw1)) : lerp(-2.5, 0.4, eOut(sw2));
        g.save(); g.translate(hx0 + 14, hy - 96); g.rotate(rot); rect(g, '#d0b040', -4, -2, 8, 4); poly(g, '#c8c8d8', [4, -3, 46, -2, 52, 0, 46, 2, 4, 3]); g.restore();
        if (t < 0.25) lighter(g, () => line(g, rgba('#ffffff', 0.5 * (1 - sw1)), 3, hx0 + 20, BAR + 20, hx0 + 70, BAR + 6));
        if (t > 0.42) { const k = seg(t, 0.42, 0.6), a = 1 - seg(t, 0.6, 0.8); lighter(g, () => { line(g, rgba('#ffffff', a), 4, hx0 + 40, hy - 120, m.x, my); for (const f of order) if (f !== m) ring(g, rgba('#ffe0a0', a), 2, f.x, f.y - f.s * 0.4, 10 + k * 20); }); order.forEach((f, i) => BURST.phys(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1.1 : 0.7), t - 0.42 - (f === m ? 0 : 0.06), i)); }
        if (t > 0.65) { const k = seg(t, 0.65, 0.95); lighter(g, () => { for (let i = 0; i < 3; i++) { const an = i / 3 * Math.PI * 2 + T * 6; A.star5(g, hx0 + Math.cos(an) * 14, hy - 150 + Math.sin(an) * 5, 3, T * 4, '#fff0b0'); } }); for (const dx of [-6, 6]) ell(g, rgba('#ff7a9a', 0.6 * k), hx0 + dx, hy - 132, 3, 1.5); }
        vignette(g, 0.35);
      }
    },
    'miyabi.shimo3': {
      enhanced: true, line: 'Иней, падай.', d: 1.0, sfx: [[0.02, 'glint'], [0.36, 'swing'], [0.48, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.65, '#04101e');
        ST.foes(S, P, { flash: t > 0.4 && t < 0.62 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        for (let i = 0; i < 6; i++) { const on = seg(t, 0.02 + i * 0.04, 0.06 + i * 0.04), a = 1 - seg(t, 0.4, 0.6); rect(g, rgba(on ? '#bfefff' : '#2a3a4a', on ? a : 0.6 * a), hx0 - 25 + i * 9, hy - 162, 7, 3); }
        lighter(g, () => { for (let i = 0; i < 3; i++) { const an = i / 3 * Math.PI, k = seg(t, 0.34 + i * 0.04, 0.4 + i * 0.04), a = 1 - seg(t, 0.5, 0.8), r = m.s * 0.9; if (k <= 0) continue; line(g, rgba('#e8fbff', a), 2, m.x - Math.cos(an) * r, my - Math.sin(an) * r, m.x - Math.cos(an) * r + Math.cos(an) * 2 * r * k, my - Math.sin(an) * r + Math.sin(an) * 2 * r * k); } });
        order.forEach((f, i) => { const t0 = f === m ? 0.46 : 0.54; if (t > t0) { BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1.1 : 0.8), t - t0, i); lighter(g, () => flake(g, f.x, f.y - f.s * 0.4, f.s * 0.5 * eOut(seg(t, t0, t0 + 0.2)), T, rgba('#ffffff', 0.8 * (1 - seg(t, 0.8, 1))))); } });
        if (t > 0.75) { const k = seg(t, 0.75, 0.82); line(g, '#2a2a34', 2, hx0 + 10, hy - 66, hx0 + 10 + 22 * (1 - k), hy - 70); }
        K.snowfall(g, T, 30 + Math.floor(40 * seg(t, 0.5, 1)), 9, { a: 0.6 });
        vignette(g, 0.45);
      }
    },
    'luka.fist': {
      enhanced: true, line: 'Нокаут!', d: 0.95, sfx: [[0.02, 'hit'], [0.14, 'hit'], [0.4, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = Math.min(110, m.x - 70), hy = 214;
        ST.backdrop(S, P, 0.6, '#140808');
        const lift = t > 0.4 ? Math.sin(seg(t, 0.4, 0.85) * Math.PI) * 28 : 0;
        for (const f of P.foes) G.drawEnemy(g, f.u.data, f.x, f.y - (f === m ? lift : 0), f.s, { t: T, flash: f === m && ((t > 0.04 && t < 0.1) || (t > 0.16 && t < 0.22) || (t > 0.4 && t < 0.6)) ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: t < 0.3 ? Math.sin(t * 40) * 0.06 : t < 0.6 ? -0.15 : 0 });
        for (let i = 0; i < 2; i++) rect(g, rgba('#ff6a30', 1 - seg(t, 0.02 + i * 0.12, 0.1 + i * 0.12)), hx0 - 10 + i * 10, hy - 162, 7, 3);
        [0.04, 0.16].forEach((at, i) => { if (t > at && t < at + 0.12) lighter(g, () => glow(g, m.x - 10, my + (i ? -6 : 6), 10, '#ffffff', 1 - seg(t, at, at + 0.12))); });
        if (t > 0.4) { BURST.phys(g, m.x, my - lift, m.s * 1.2, t - 0.4, 0); if (t < 0.7) lighter(g, () => line(g, rgba('#ffd0a0', 1 - seg(t, 0.4, 0.7)), 8, m.x, m.y, m.x, my - lift - 50)); }
        if (t > 0.45) lighter(g, () => { for (let i = 0; i < 4; i++) ell(g, rgba('#e8e8e8', 0.3 * (1 - seg(t, 0.6, 0.95))), hx0 + 24 + i * 4, hy - 90 - i * 8 - seg(t, 0.45, 0.95) * 10, 4 + i, 3 + i); });
        vignette(g, 0.4);
      }
    },
    'qingque.cherry': {
      enhanced: true, line: 'Четыре одинаковых!', d: 0.95, sfx: [[0.02, 'snap'], [0.32, 'whoosh'], [0.46, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, hx0 = 84, hy = 214, order = blastOrder(P);
        ST.backdrop(S, P, 0.55, '#0a1410');
        ST.foes(S, P, { flash: t > 0.46 && t < 0.64 ? 0.6 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.76 });
        for (let i = 0; i < 4; i++) { const k = eOut(seg(t, 0.02 + i * 0.04, 0.12 + i * 0.04)), a = 1 - seg(t, 0.72, 0.9); if (k > 0) { tile(g, hx0 - 30 + i * 18, hy - 160 + (1 - k) * 20, 14, 20, 1, a); if (t > 0.2 && t < 0.4) lighter(g, () => glow(g, hx0 - 30 + i * 18, hy - 160, 10, '#7affc8', 0.5)); } }
        const fly = seg(t, 0.3, 0.46);
        if (fly > 0 && fly < 1) { const x = lerp(hx0 + 30, m.x, eIn(fly)), y = lerp(hy - 110, my, eIn(fly)); g.save(); g.translate(x, y); g.rotate(fly * 8); tile(g, 0, 0, 22, 30, 1, 1); g.restore(); }
        order.forEach((f, i) => { const t0 = f === m ? 0.46 : 0.54; if (t > t0) BURST.quant(g, f.x, f.y - f.s * 0.4, f.s * (f === m ? 1.1 : 0.7), t - t0, i); });
        if (t > 0.72) for (let i = 0; i < 4; i++) { const q = seg(t, 0.72, 0.95); tile(g, hx0 - 30 + i * 18 + (i - 1.5) * 10 * q, hy - 160 + q * 40 + i * 4 * q, 14, 20, 1, 1 - q); }
        vignette(g, 0.35);
      }
    },
    'anby.thunder': {
      enhanced: true, line: 'Гром.', d: 0.9, sfx: [[0.02, 'whoosh'], [0.36, 'crit'], [0.5, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), my = m.y - m.s * 0.4, up = eOut(seg(t, 0.05, 0.3)), down = eIn(seg(t, 0.3, 0.38));
        const hx = t < 0.3 ? lerp(80, m.x - 34, up) : m.x - 34, hyy = t < 0.3 ? lerp(214, 150, up) : lerp(150, m.y + 30, down);
        ST.backdrop(S, P, 0.6, '#0e0a18');
        for (let i = 0; i < 3; i++) rect(g, rgba('#c07aff', 1 - seg(t, 0.2, 0.35)), 64 + i * 10, 52, 7, 3);
        ST.foes(S, P, { flash: t > 0.36 && t < 0.58 ? 0.7 : 0 });
        if (t > 0.6) S.fig(P.look, Math.min(LW - 40, m.x + 60), 214, { k: 2, s: 0.74, flip: true, a: seg(t, 0.6, 0.7) });
        else S.fig(P.look, hx, hyy, { k: 2, s: 0.7, rot: t > 0.3 ? 0.3 : -0.1 });
        if (t > 0.34 && t < 0.6) lighter(g, () => { A.bolt(g, m.x, BAR, m.x, m.y, Math.floor(T * 30), '#e0c0ff', 3); A.bolt(g, m.x + 6, BAR, m.x + 4, m.y, Math.floor(T * 30) + 3, '#c07aff', 1); glow(g, m.x, my, 40, '#c07aff', 0.7 * (1 - seg(t, 0.36, 0.6))); });
        if (t > 0.36) BURST.elec(g, m.x, my, m.s * 1.2, t - 0.36, 0);
        if (t > 0.6) K.sparks(g, T, m.x, m.y, 12, 4, '#e0c0ff', 30);
        vignette(g, 0.45);
      }
    },
    'imbibitor.leap': {
      enhanced: true, line: 'Прочь с дороги.', d: 1.05, sfx: [[0.02, 'whoosh'], [0.34, 'splash'], [0.5, 'crit'], [0.7, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), order = blastOrder(P), rise = eOut(seg(t, 0.05, 0.3)), land = eIn(seg(t, 0.8, 0.92));
        ST.backdrop(S, P, 0.6, '#04121a');
        for (let i = 0; i < 3; i++) rect(g, rgba('#7affff', 1 - seg(t, 0.15, 0.3)), 64 + i * 10, 52, 7, 3);
        ST.foes(S, P, { flash: t > 0.4 && t < 0.78 && Math.floor(t * 30) % 2 ? 0.5 : 0 });
        const hy = t < 0.8 ? lerp(214, 138, rise) : lerp(138, 214, land), hx = t < 0.8 ? 90 : lerp(90, 110, land);
        S.fig(P.look, hx, hy, { k: 2, s: 0.74, rot: t > 0.3 && t < 0.8 ? -0.2 : 0 });
        for (let i = 0; i < 7; i++) {
          const f = order.length ? order[i % order.length] : m, t0 = 0.36 + i * 0.06, k = eIn(seg(t, t0, t0 + 0.08)), fy = f.y - f.s * 0.4;
          if (k > 0 && k < 1) lighter(g, () => { const x = lerp(hx + 20, f.x + (i - 3) * 3, k), y = lerp(hy - 60, fy, k); line(g, rgba('#9ae8ff', 0.9), 3, lerp(hx + 20, f.x, Math.max(0, k - 0.3)), lerp(hy - 60, fy, Math.max(0, k - 0.3)), x, y); glow(g, x, y, 6, '#7affff', 0.8); });
          if (t > t0 + 0.08) BURST.imag(g, f.x, fy, f.s * 0.6, t - t0 - 0.08, i);
        }
        if (t > 0.88) { const k = seg(t, 0.88, 1.05); lighter(g, () => { g.strokeStyle = rgba('#9ae8ff', 1 - k); g.lineWidth = 2; g.beginPath(); g.ellipse(110, FLOOR - 2, 20 + k * 80, 4 + k * 10, 0, 0, Math.PI * 2); g.stroke(); }); }
        vignette(g, 0.45);
      }
    },
    march: {
      line: 'Я тебя прикрою!', d: 0.9, sfx: [[0.02, 'swing'], [0.46, 'shield'], [0.7, 'sparkle']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, mx = 84, fy = 214;
        const mate = P.allies.find(a => a.u !== P.u), tx = mate ? 232 : mx, ty = fy;
        ST.backdrop(S, P, 0.45, '#06223a');
        K.snowfall(g, T, 30, 13, { a: 0.5 });
        const raise = eOut(seg(t, 0, 0.25));
        S.fig(P.look, mx, fy, { k: 2, s: 0.74, rot: lerp(0.05, -0.08, raise) });
        if (mate) S.fig(mate.look, tx, ty, { k: 2, s: 0.66, flip: true });
        const fl = eOut(seg(t, 0.05, 0.3)) * (1 - seg(t, 0.4, 0.55));
        if (fl > 0) lighter(g, () => { glow(g, mx + 4, fy - 150, 16 * fl, '#bfefff', 0.6 * fl); flake(g, mx + 4, fy - 150, 11 * fl, T * 1.5, rgba('#ffffff', fl)); });
        const fly = seg(t, 0.3, 0.46);
        if (fly > 0 && fly < 1) {
          const k = eIn(fly), ax = lerp(mx + 20, tx, k), ay = lerp(fy - 70, ty - 70, k) - Math.sin(k * Math.PI) * 26;
          lighter(g, () => { line(g, rgba('#bfefff', 0.5), 2, lerp(mx + 20, tx, Math.max(0, k - 0.25)), lerp(fy - 70, ty - 70, Math.max(0, k - 0.25)) - Math.sin(Math.max(0, k - 0.25) * Math.PI) * 26, ax, ay); glow(g, ax, ay, 8, '#ffffff', 0.9); });
        }
        if (t >= 0.46) {
          const k = eOut(seg(t, 0.46, 0.62)), r = 40 * k, cy = ty - 62, a = 0.85 - 0.35 * seg(t, 0.7, 0.9);
          lighter(g, () => {
            glow(g, tx, cy, r * 1.3, '#8adfff', 0.35 * a);
            ring(g, rgba('#bfefff', a), 2, tx, cy, r);
            ring(g, rgba('#ffffff', a * 0.6), 1, tx, cy, r * 0.8);
            flake(g, tx, cy, r * 0.62, 0.3 + T * 0.4, rgba('#ffffff', a * 0.55));
          });
          if (t < 0.6) K.shards(g, (t - 0.46) * 3, tx, cy, 10, 5, '#bfefff', 40, '#ffffff');
        }
        if (t > 0.7) {
          const k = seg(t, 0.7, 0.9);
          lighter(g, () => { for (let i = 0; i < 4; i++) { const q = i / 4 * Math.PI * 2 + k * 2; glow(g, mx + Math.cos(q) * 30, fy - 90 + Math.sin(q) * 20, 4, '#ffffff', 0.9 * (1 - k)); } });
          K.sparks(g, T, mx, fy - 90, 8, 4, '#bfefff', 30);
        }
        vignette(g, 0.35);
      }
    }
  };

  function svarogCounter(strong) {
    return (c, F) => {
        const punch = eOut(cl((F.k - 0.05) * 4)), y = F.y + F.h * 0.62, hx = lerp(F.bx - 20, F.far + 30, punch);
        if (strong) { c.fillStyle = rgba('#ff2040', 0.18); c.fillRect(F.x, F.y, F.w, F.h); }
        lighter(c, () => line(c, rgba('#ff6a8a', 0.5), strong ? 10 : 6, F.bx - 10, y, hx, y));
        c.save(); c.translate(hx, y + 8); c.rotate(Math.PI / 2 * F.dir); A.svarogHand(c, 0, 0, strong ? 0.3 : 0.24); c.restore();
        const q = cl((F.k - 0.3) * 3);
        if (q > 0 && q < 1) lighter(c, () => { for (let i = 0; i < (strong ? 3 : 1); i++) { const fx = F.far + i * 22 * -F.dir; glow(c, fx, y - 6, 8 + q * 16, '#ff6a8a', 1 - q); ring(c, rgba('#ffffff', 1 - q), 2, fx, y - 6, 4 + q * 18); } });
    };
  }

  const FOLLOW = {
    gentle: {
      charId: 'kafka', name: 'Жестокая нежность', mark: 'follow',
      act(c, F) {
        const pull = eOut(cl((F.k - 0.05) * 3)), y = F.y + F.h * 0.55, x0 = F.bx + 70 * F.dir, x1 = lerp(x0, F.far, pull);
        c.strokeStyle = rgba('#d8c8ff', 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y - 14 + pull * 10, x1, y); c.stroke();
        const q = cl((F.k - 0.35) * 3);
        if (q > 0 && q < 1) lighter(c, () => { A.bolt(c, F.far, F.y + 4, F.far, y, Math.floor(F.t * 30), '#c07aff', 2); glow(c, F.far, y, 10 + q * 12, '#c07aff', 1 - q); });
      }
    },
    shuhu: {
      charId: 'blade', name: 'Дар Шуху', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.5;
        lighter(c, () => { for (let i = 0; i < 3; i++) { const k = cl((F.k - 0.08 - i * 0.06) * 5), x = lerp(F.bx + 90 * F.dir, F.far, 0.25 + i * 0.3); if (k <= 0) continue; const a = 1 - cl((F.k - 0.5) * 3); line(c, rgba('#2affa0', 0.8 * a), 3, x - 14, y - 16 * k, x + 14, y + 16 * k); line(c, rgba('#ffffff', a), 1, x - 14, y - 16 * k, x + 14, y + 16 * k); } });
        const sheath = cl((F.k - 0.55) * 4), sx = F.bx + 60 * F.dir;
        line(c, '#3a3a44', 2, sx, F.y + F.h - 8, sx + 30 * F.dir, F.y + F.h - 8);
        line(c, rgba('#c8f0e0', 1 - sheath), 1, sx + 30 * F.dir, F.y + F.h - 8, sx + 30 * F.dir + 18 * (1 - sheath) * F.dir, F.y + F.h - 8);
      }
    },
    cogito: {
      charId: 'ratio', name: 'Я мыслю, следовательно, я существую', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.62, x0 = F.free, draw = cl(F.k * 3.5);
        lighter(c, () => {
          line(c, rgba('#ffe080', 0.9), 1, x0, y - 6, x0 + 30 * draw * F.dir, y - 6);
          line(c, rgba('#ffe080', 0.9), 1, x0, y + 2, x0 + 30 * draw * F.dir, y + 2);
          if (draw >= 1) line(c, rgba('#ffd860', 0.8), 2, x0 - 4 * F.dir, y + 8, x0 + 36 * F.dir, y + 8);
          const q = cl((F.k - 0.35) * 3);
          if (q > 0 && q < 1) { line(c, rgba('#ffd860', 1 - q), 3, x0 + 36 * F.dir, y, F.far, y - 4); glow(c, F.far, y - 4, 8 + q * 14, '#ffe080', 1 - q); }
        });
      }
    },
    numby: {
      charId: 'topaz', name: 'Счетовод', mark: 'follow',
      act(c, F) {
        const k = eOut(cl((F.k - 0.05) * 3)), y = F.y + F.h * 0.6, x = lerp(F.free, F.far, k), hop = Math.sin(k * Math.PI) * 14;
        lighter(c, () => line(c, rgba('#ff8a20', 0.6), 4, lerp(F.free, F.far, Math.max(0, k - 0.3)), y, x, y - hop));
        numby(c, x, y - hop, 1.5, k * 6);
        rect(c, '#ffd060', x + 10 * F.dir, y - hop - 3, 4, 4);
        const q = cl((F.k - 0.4) * 3);
        if (q > 0 && q < 1) lighter(c, () => { glow(c, F.far, y, 10 + q * 16, '#ffb040', 1 - q); ring(c, rgba('#ffd060', 1 - q), 2, F.far, y, 4 + q * 18); });
      }
    },
    soulsteel: {
      charId: 'yanqing', name: 'Ледяной клинок', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.6, fall = eIn(cl((F.k - 0.05) * 3.5)), sx = F.far, sy = lerp(F.y - 30, y, fall);
        if (fall < 1) A.sword(c, sx, sy, Math.PI / 2, 26, 1);
        lighter(c, () => { if (fall > 0 && fall < 1) line(c, rgba('#bfefff', 0.6), 2, sx, F.y, sx, sy); const q = cl((F.k - 0.32) * 3); if (q > 0 && q < 1) { glow(c, sx, y, 10 + q * 14, '#8adfff', 1 - q); for (let i = 0; i < 5; i++) A.crystal(c, sx + (i - 2) * 5, y + 6, 8 * (1 - q * 0.5), -Math.PI / 2 + (i - 2) * 0.35, 1 - q); } });
      }
    },
    karmic: {
      charId: 'xueyi', name: 'Кармическое искупление', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.55, base = { x: F.free, y };
        for (let i = 0; i < 3; i++) {
          const t0 = 0.08 + i * 0.1, k = cl((F.k - t0) * 6), back = cl((F.k - t0 - 0.12) * 6), reach = k * (1 - back);
          const tip = { x: lerp(base.x, F.far, reach), y: y + (i - 1) * 10 };
          line(c, '#3a2a4a', 3, base.x, base.y, tip.x, tip.y);
          ell(c, '#c07aff', tip.x, tip.y, 2, 2);
          if (k >= 1 && back < 1) lighter(c, () => glow(c, F.far, tip.y, 10, '#c07aff', 1 - back));
        }
      }
    },
    abyss: {
      charId: 'luocha', name: 'Молитва цветка бездны', mark: 'action',
      act(c, F) {
        const y = F.y + F.h * 0.6, x = Math.min(F.free + 16, F.far), k = eOut(cl((F.k - 0.05) * 3)), a = 1 - cl((F.k - 0.7) * 3);
        lighter(c, () => {
          ring(c, rgba('#ffe080', a), 1, x, y, 16 * k); ring(c, rgba('#ffd060', a * 0.7), 1, x, y, 10 * k);
          for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + F.t * 3; ell(c, rgba('#fff0b0', a), x + Math.cos(an) * 16 * k, y + Math.sin(an) * 6 * k, 1.5, 1.5); }
          for (let i = 0; i < 4; i++) { const q = (F.k * 2 + i / 4) % 1; ell(c, rgba('#fff0b0', a * (1 - q)), x + (i - 1.5) * 10, y - q * 24, 1.5, 1.5); }
          glow(c, x, y, 20 * k, '#ffe080', 0.4 * a);
        });
      }
    },
    elysium: {
      charId: 'scar', name: 'Разрыв Элизиума', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.58;
        lighter(c, () => {
          for (let i = 0; i < 3; i++) {
            const x = lerp(F.free, F.far, 0.2 + i * 0.35), k = cl((F.k - 0.05) * 4), q = cl((F.k - 0.3 - i * 0.05) * 4);
            ring(c, rgba('#ff5040', k * (1 - q)), 1, x, y, 6);
            if (q > 0 && q < 1) { glow(c, x, y, 8 + q * 18, '#ff7a30', 1 - q); ring(c, rgba('#ffd0a0', 1 - q), 2, x, y, 6 + q * 18); }
          }
        });
      }
    },
    yosuke: {
      charId: 'yosuke', name: 'Атака Ёсуке', mark: 'follow',
      act(c, F) {
        const y = F.y + F.h * 0.6, jump = eOut(cl((F.k - 0.05) * 3)), x = lerp(F.free, F.far, jump), hy = y - Math.sin(jump * Math.PI) * 20;
        poly(c, '#c8c8d0', [x - 4, hy, x + 6 * F.dir, hy - 2, x + 10 * F.dir, hy, x + 6 * F.dir, hy + 2]);
        lighter(c, () => line(c, rgba('#7affc8', 0.6), 2, lerp(F.free, F.far, Math.max(0, jump - 0.3)), y, x, hy));
        const q = cl((F.k - 0.38) * 3);
        if (q > 0 && q < 1) lighter(c, () => { glow(c, F.far, y, 10 + q * 16, '#ffe080', 1 - q); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; line(c, rgba('#ffffff', 1 - q), 1, F.far + Math.cos(an) * 4, y + Math.sin(an) * 4, F.far + Math.cos(an) * (8 + q * 16), y + Math.sin(an) * (8 + q * 16)); } });
      }
    },
    svarog: { charId: 'clara', name: 'Ответный удар Сварога', mark: 'counter', act: svarogCounter(false) },
    svarogP: { charId: 'clara', name: 'Сварог: Обещание', mark: 'counter', act: svarogCounter(true) },
    victory: {
      charId: 'himeko', name: 'Победный порыв', mark: 'follow',
      act(c, F) {
        const run = eOut(cl(F.k * 2.4)), x0 = F.bx + 70 * F.dir, x1 = lerp(x0, F.far, run), y = F.y + F.h * 0.62;
        lighter(c, () => {
          line(c, rgba('#ff6a20', 0.55), 5, x0, y, x1, y);
          line(c, rgba('#fff0c8', 0.9), 2, x0, y, x1, y);
          glow(c, x1, y, 12, '#ffb060', 0.9 * (1 - cl((F.k - 0.42) * 4)));
          for (let i = 0; i < 3; i++) {
            const at = 0.38 + i * 0.07, q = cl((F.k - at) * 5);
            if (q <= 0 || q >= 1) continue;
            const fx = lerp(x0, F.far, 0.55 + i * 0.18);
            glow(c, fx, y - 10, 10 + q * 18, '#ff7a20', 1 - q);
            ring(c, rgba('#ffd080', 1 - q), 2, fx, y - 10, 4 + q * 20);
          }
        });
      }
    },
    doll: {
      charId: 'herta', name: 'Кукла Герты', mark: 'follow',
      act(c, F) {
        const spin = Math.cos(F.t * 11), dx = F.free, dy = F.y + F.h * 0.55, y = dy;
        c.save(); c.translate(dx, dy); c.scale(Math.max(0.5, Math.abs(spin)), 1);
        poly(c, '#5a3a7a', [-9, 16, 0, -4, 9, 16]);
        ell(c, '#f4e4dc', 0, -9, 6, 6);
        poly(c, '#7a5aa0', [-7, -10, 0, -17, 7, -10, 6, -6, -6, -6]);
        rect(c, spin > 0 ? '#3a2a4a' : '#7a5aa0', -3, -9, 2, 2); rect(c, spin > 0 ? '#3a2a4a' : '#7a5aa0', 1, -9, 2, 2);
        c.restore();
        lighter(c, () => {
          glow(c, dx, dy, 14, '#8adfff', 0.4);
          for (let i = 0; i < 6; i++) {
            const t0 = 0.12 + i * 0.05, k = eIn(cl((F.k - t0) * 4));
            if (k <= 0 || k >= 1) continue;
            const x = lerp(dx, F.far, k), yy = y - 14 + (i % 3) * 14;
            needle(c, x, lerp(dy, yy, k), 14, F.dir > 0 ? 0 : Math.PI, 1 - k * 0.3);
          }
          const q = cl((F.k - 0.45) * 3);
          if (q > 0 && q < 1) for (let i = 0; i < 3; i++) glow(c, F.far - i * 18 * F.dir, y - 14 + i * 14, 6 + q * 10, '#bfefff', 1 - q);
        });
      }
    },
    girlpower: {
      charId: 'march', name: 'Контратака', mark: 'counter',
      act(c, F) {
        const fly = eIn(cl((F.k - 0.08) * 3)), x0 = F.bx + 70 * F.dir, x1 = lerp(x0, F.far, fly), y = F.y + F.h * 0.6;
        lighter(c, () => {
          line(c, rgba('#bfefff', 0.5), 2, lerp(x0, x1, 0.4), y, x1, y);
          for (const s of [-1, 1]) line(c, rgba('#ffffff', 0.9), 1, x1, y, x1 - 7 * F.dir, y + 4 * s);
          glow(c, x1, y, 8, '#8adfff', 0.8);
          if (fly >= 1) {
            const q = cl((F.k - 0.42) * 3);
            glow(c, F.far, y, 10 + q * 16, '#bfefff', 0.8 * (1 - q));
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; line(c, rgba('#ffffff', 1 - q), 1, F.far, y, F.far + Math.cos(a) * (6 + q * 18), y + Math.sin(a) * (6 + q * 18)); }
          }
        });
      }
    }
  };

  function followCut(ui, e) {
    const bt = ui.bt, live = (bt.fcuts || []).filter(f => f.t < f.life), d = live.length ? CHAIN_D : FOLLOW_D;
    const who = e.u.summon && e.u.owner ? e.u.owner : e.u;
    const cut = { def: FOLLOW[e.fid], u: who, name: e.name, t: 0, d, life: d + LINGER, look: G.lookOf(who.charId, ui.game) };
    bt.fcuts = live.slice(1 - PANEL_MAX).concat(cut);
    return cut;
  }

  function drawFollow(ui, c, cuts) {
    cuts.forEach((cut, slot) => {
      const def = cut.def, counter = def.mark === 'counter', dir = counter ? -1 : 1, el = H.ELEMENTS[cut.u.elem] || H.ELEMENTS.phys, col = el.col;
      const k = cl(cut.t / cut.life), into = eOut(cl(cut.t / 0.1)), out = cl((cut.life - cut.t) / 0.15), w = Math.round(W * 0.6), h = PANEL_H, slant = 22;
      const y = PANEL_Y - (cuts.length - 1 - slot) * PANEL_STEP, edge = counter ? ui.right : ui.left + ORDER_W, x = counter ? edge - w + (1 - into) * w : edge - (1 - into) * w;
      const bx = counter ? x + w - 84 : x + 14, far = counter ? x + 40 : x + w - 40;
      c.save();
      c.globalAlpha = out;
      c.beginPath();
      if (counter) { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + slant, y + h); }
      else { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - slant, y + h); c.lineTo(x, y + h); }
      c.closePath();
      c.fillStyle = 'rgba(4,6,20,0.84)'; c.fill();
      c.strokeStyle = rgba(col, 0.9); c.lineWidth = 1; c.stroke();
      c.clip();
      c.fillStyle = rgba(col, 0.18); c.fillRect(bx - 6, y, 76, h);
      G.drawBust(c, cut.look, bx, y + h - 64, 1);
      const tx = counter ? bx - 12 : bx + 78, al = counter ? 'right' : 'left';
      const same = String(cut.name).toUpperCase() === MARKS[def.mark], title = same ? cut.u.name : cut.name;
      const tw = ui.measure ? ui.measure(title, 14, true, true) : 120, free = tx + (tw + 22) * dir;
      def.act(c, { x, y, w, h, k, t: cut.t, dir, bx, far, col, free: counter ? Math.min(free, bx - 150) : Math.max(free, bx + 226) });
      ui.text(MARKS[def.mark], tx, y + 6, { align: al, size: 10, bold: true, col: G.light(col, 0.3) });
      ui.text(title, tx, y + 20, { align: al, size: 14, bold: true, serif: true, col: C.gold });
      c.restore();
    });
  }

  function interp(g, x, y, a) {
    ring(g, rgba('#bfefff', a), 1, x, y, 5);
    line(g, rgba('#bfefff', a), 1, x - 3, y, x + 3, y);
    line(g, rgba('#bfefff', a), 1, x, y - 3, x, y + 3);
  }

  function signDoll(g, x, y, k) {
    poly(g, '#5a3a7a', [x - 7, y + 12, x, y - 3, x + 7, y + 12]);
    ell(g, '#f4e4dc', x, y - 7, 5, 5);
    poly(g, '#7a5aa0', [x - 6, y - 8, x, y - 14, x + 6, y - 8, x + 5, y - 5, x - 5, y - 5]);
    line(g, '#8a6a4a', 1, x + 6, y, x + 10, y - 18 * k);
    rect(g, '#f0ecd8', x + 3, y - 18 * k - 12, 14, 12);
    rect(g, '#d03030', x + 9, y - 18 * k - 10, 2, 5); rect(g, '#d03030', x + 9, y - 18 * k - 4, 2, 2);
  }

  const LAB_SHOWS = {
    theherta: {
      line: 'Смотрите и учитесь.', d: 1.0, sfx: [[0.02, 'scan'], [0.36, 'crit'], [0.52, 'hit'], [0.68, 'hit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, m = mainFoe(P), hx0 = 80, hy = 214, rest = P.foes.filter(f => f !== m);
        const waves = [[m], rest.filter((f, i) => i < 2), rest.slice(2).length ? rest.slice(2) : []], at = [0.34, 0.5, 0.66];
        ST.backdrop(S, P, 0.55, '#061424');
        ST.foes(S, P, { flash: waves.some((w, i) => w.length && t > at[i] && t < at[i] + 0.1) ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78, rot: -0.04 * seg(t, 0.85, 1) });
        const raise = eOut(seg(t, 0.02, 0.25));
        line(g, '#c8c0d8', 2, hx0 + 18, hy - 60, hx0 + 22, hy - 100 - 20 * raise);
        lighter(g, () => glow(g, hx0 + 22, hy - 104 - 20 * raise, 8 * raise, '#bfefff', 0.8));
        if (t > 0.15) lighter(g, () => interp(g, m.x, m.y - m.s - 6, seg(t, 0.15, 0.3)));
        waves.forEach((w, i) => w.forEach((f, j) => {
          if (t <= at[i]) return;
          const k = seg(t, at[i], at[i] + 0.2), a = 1 - seg(t, at[i] + 0.2, at[i] + 0.35);
          for (let q = 0; q < 5; q++) A.crystal(g, f.x + (q - 2) * 6, f.y, f.s * 0.3 * eOut(k), -Math.PI / 2 + (q - 2) * 0.3, 0.85 * a);
          BURST.ice(g, f.x, f.y - f.s * 0.4, f.s * 0.7, t - at[i], i + j);
        }));
        vignette(g, 0.35);
      }
    },
    'theherta.idea': {
      line: 'Есть идея!', d: 1.1, sfx: [[0.02, 'glint'], [0.4, 'crit'], [0.6, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hx0 = 80, hy = 214;
        ST.backdrop(S, P, 0.6, '#040e1c');
        ST.foes(S, P, { flash: t > 0.4 && t < 0.7 ? 0.5 : 0 });
        S.fig(P.look, hx0, hy, { k: 2, s: 0.78 });
        signDoll(g, 30, FLOOR - 14, eOut(seg(t, 0.02, 0.3)) * (1 - seg(t, 0.9, 1.1) * 0.5));
        P.foes.forEach((f, i) => {
          const y = f.y - f.s - 6, a = 1 - seg(t, 0.85, 1.05);
          if (t < 0.45) lighter(g, () => interp(g, f.x, y, seg(t, 0.1 + i * 0.05, 0.25 + i * 0.05)));
          const t0 = 0.38 + i * 0.05, k = eIn(seg(t, t0, t0 + 0.1));
          if (k > 0 && k < 1) lighter(g, () => { const x = f.x, yy = lerp(BAR, f.y - f.s * 0.4, k); for (let q = 0; q < 3; q++) A.crystal(g, x + (q - 1) * 6, yy, 12, Math.PI / 2, 0.9); });
          if (t > t0 + 0.1) BURST.ice(g, f.x, f.y - f.s * 0.4, f.s, t - t0 - 0.1, i);
          if (t > 0.6) lighter(g, () => glow(g, f.x, f.y - f.s * 0.4, f.s * 0.8, '#8adfff', 0.4 * a * (1 - seg(t, 0.6, 0.9))));
        });
        vignette(g, 0.45);
      }
    },
    tribbie: {
      line: 'Подарки где-то тут!', d: 0.95, sfx: [[0.02, 'sparkle'], [0.4, 'buff'], [0.7, 'snap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, hy = 214;
        ST.backdrop(S, P, 0.45, '#1a1406');
        const shrug = Math.sin(seg(t, 0.02, 0.3) * Math.PI);
        for (let i = 0; i < 3; i++) S.fig(P.look, 44 + i * 40, hy, { k: 2, s: 0.6, rot: (i - 1) * 0.06 + shrug * 0.05 * (i % 2 ? -1 : 1) });
        const mates = P.allies.filter(a => a.u !== P.u).slice(0, 3);
        mates.forEach((a, i) => S.fig(a.look, 190 + i * 44, hy, { k: 2, s: 0.54, a: 0.85 }));
        for (let i = 0; i < 5; i++) {
          const t0 = 0.3 + i * 0.05, k = eIn(seg(t, t0, t0 + 0.22)), x = 180 + i * 28;
          if (k <= 0) continue;
          const y = lerp(BAR - 10, FLOOR - 10, k), land = k >= 1;
          A.gift(g, x, land ? FLOOR - 8 : y, land ? 6 : 5, land ? 0 : T * 6 + i);
          if (land) lighter(g, () => glow(g, x, FLOOR - 12, 14, '#ffe080', 0.4 * (1 - seg(t, t0 + 0.22, t0 + 0.5))));
        }
        if (t > 0.72) { const k = seg(t, 0.72, 0.95); for (let i = 0; i < 3; i++) lighter(g, () => A.star5(g, 60 + i * 40, hy - 120 - k * 6, 3, T * 4 + i, rgba('#fff0b0', 1 - k * 0.5))); }
        vignette(g, 0.35);
      }
    }
  };
  for (const [key, sh] of Object.entries(LAB_SHOWS)) H.labPut(SHOWS, key, sh, key.split('.')[0]);
  H.labPut(FOLLOW, 'busy', {
    charId: 'tribbie', name: 'Трибби и её заботы', mark: 'follow',
    act(c, F) {
      const y = F.y + F.h * 0.62, run = cl(F.k * 1.6);
      for (let i = 0; i < 3; i++) {
        const x = lerp(F.free, F.far, cl(run - i * 0.12)), hop = Math.abs(Math.sin(F.t * 18 + i)) * 4;
        ell(c, '#f0d8a0', x, y - 10 - hop, 4, 4); poly(c, '#e0a040', [x - 5, y - hop, x, y - 8 - hop, x + 5, y - hop]);
        A.gift(c, x + 6 * F.dir, y - 14 - hop, 2.5, 0);
      }
      const q = cl((F.k - 0.4) * 3);
      if (q > 0 && q < 1) lighter(c, () => { for (let i = 0; i < 3; i++) glow(c, F.far - i * 20 * F.dir, y - 6, 8 + q * 12, '#ffe080', 1 - q); });
    }
  }, 'tribbie');

  const strictKey = (charId, cut) => (cut && SHOWS[charId + '.' + cut] ? charId + '.' + cut : null);

  const recordKey = (charId, cut) => (cut && SHOWS[charId + '.' + cut] ? charId + '.' + cut : SHOWS[charId] ? charId : null);

  function keyOf(u, cut, game, outfit) {
    const worn = outfit !== undefined ? outfit : H.wornOutfit(u.charId, game);
    if (worn && H.outfitCutOf(worn, 'skill')) return 'outfit:' + worn;
    return recordKey(u.charId, cut);
  }

  class SkillShow {
    constructor(ui, u, o = {}) {
      this.ui = ui; this.game = ui.game; this.u = u;
      const forced = o.outfit !== undefined, kit = H.CHARS[u.charId] || {}, el = H.ELEMENTS[u.elem] || H.ELEMENTS.phys;
      this.outfit = forced ? o.outfit : H.wornOutfit(u.charId, this.game);
      const own = this.outfit && !o.strict ? H.outfitCutOf(this.outfit, 'skill') : null;
      this.key = own ? 'outfit:' + this.outfit : o.strict ? strictKey(u.charId, o.cut) : recordKey(u.charId, o.cut);
      this.def = own || SHOWS[this.key];
      this.line = !own && o.line && this.def.line ? this.def.line : '';
      const lookOf = a => (a !== u ? G.lookOf(a.charId, this.game) : own ? H.outfitLook(this.outfit, this.game.state.gender) : G.lookOf(u.charId, forced ? null : this.game));
      this.P = {
        u, id: u.charId, elem: u.elem, col: el.col, name: o.name || (kit.skill && kit.skill.name) || '', look: lookOf(u), label: o.strict || (this.def && this.def.enhanced) ? 'УСИЛЕННАЯ АТАКА' : 'НАВЫК',
        foes: o.foes || [], allies: (o.allies || []).map(a => ({ u: a, look: lookOf(a) })), bg: o.bg || 'station'
      };
      this.beats = [{ id: 'act', d: this.def.d, sfx: this.def.sfx }];
      this.i = 0; this.t = 0; this.T = 0; this.cue = 0; this.fade = 0; this.done = false;
    }

    get length() { return this.def.d + FADE; }
    get beat() { return this.beats[0]; }
    get fading() { return this.fade > 0; }

    tick(dt) {
      if (this.done) return;
      if (this.fade > 0) { this.fade += dt; if (this.fade >= FADE) this.done = true; return; }
      this.t += dt; this.T += dt;
      const cues = this.def.sfx || [];
      while (this.cue < cues.length && cues[this.cue][0] <= this.t) this.ui.sfx(cues[this.cue++][1]);
      if (this.t >= this.def.d) this.fade = 0.001;
    }

    skip() { if (!this.fade) this.fade = 0.001; }

    render() {
      const rw = this.ui && this.ui.wide && this.ui.wide() ? 427 : LW, ox = (rw - LW) >> 1;
      const cv = buf.cv && buf.cv.width === rw ? buf.cv : (buf.cv = G.mkCanvas(rw, LH)), g = cv.getContext('2d');
      g._wide = rw > LW;
      g.save();
      g.imageSmoothingEnabled = false;
      if (ox) g.translate(ox, 0);
      const S = H.Cine.stage(g, this.game, this.T);
      S.t = Math.min(this.t, this.def.d); S.d = this.def.d;
      this.def.act(S, this.P);
      g.restore();
      if (this.t < 0.08) flash(g, '#ffffff', 0.6 * (1 - this.t / 0.08));
      H.Cine.dither(g);
      return cv;
    }

    draw(c) {
      const ui = this.ui, P = this.P, cv = this.render(), barH = BAR * 2;
      c.save();
      c.globalAlpha = this.fade > 0 ? 1 - cl(this.fade / FADE) : 1;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, ui.left, 0, ui.vw, HGT);
      c.fillStyle = '#000000'; c.fillRect(ui.left, 0, ui.vw, barH); c.fillRect(ui.left, HGT - barH, ui.vw, barH);
      c.fillStyle = rgba(P.col, 0.7); c.fillRect(ui.left, barH - 1, ui.vw, 1); c.fillRect(ui.left, HGT - barH, ui.vw, 1);
      const k = eOut(cl(this.t / 0.25)), base = c.globalAlpha;
      c.globalAlpha = base * k;
      ui.text(P.label, ui.left + 14 - (1 - k) * 60, 14, { size: 10, bold: true, col: G.light(P.col, 0.3) });
      ui.text(P.name, ui.left + 14 - (1 - k) * 60, 28, { size: 14, bold: true, serif: true, col: C.gold });
      if (this.line && this.t > LINE_AT) {
        const s = eOut(cl((this.t - LINE_AT) / 0.15));
        c.globalAlpha = base * s;
        ui.text(P.u.name, ui.left + 14 - (1 - s) * 40, HGT - barH + 14, { size: 11, bold: true, serif: true, col: C.gold });
        ui.text(this.line, ui.left + 14 - (1 - s) * 40, HGT - barH + 31, { size: 13, col: C.cream });
      } else {
        ui.text(P.u.name, ui.right - 14, HGT - barH + 16, { align: 'right', size: 11, bold: true, col: C.cream });
      }
      c.restore();
      if (!this.fade) {
        ui.hints([['Esc', 'Пропустить']], ui.right - 12, 20, { align: 'right' });
        ui.hit(ui.left, 0, ui.vw, HGT, () => this.skip());
      }
    }
  }

  H.SkillCuts = { SHOWS, Show: SkillShow, keyOf, recordKey, strictKey, FADE, FOLLOW, MARKS, FOLLOW_D, CHAIN_D, LINGER, followCut, drawFollow, Art: { flake, mainFoe, blastOrder } };
  H.SkillShow = SkillShow;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
