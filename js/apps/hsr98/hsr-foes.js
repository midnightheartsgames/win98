(function (H) {
  'use strict';
  const G = H.Gfx;
  const SS = 4;
  const cache = new Map();
  const dark = G.dark, light = G.light;

  const FAMILY = {
    voidranger: ['#2a1640', '#7a4ac0'], spawn: ['#3a1018', '#c04a3a'], automaton: ['#14264a', '#4a7ad0'], silvermane: ['#141c3a', '#5a7ac8'],
    shade: ['#10303a', '#4ab0c0'], swarm: ['#102a3a', '#40e0d0'], ethereal: ['#2a1008', '#e0602a'], trotter: ['#3a2c10', '#d0a848'], boss: ['#3a0c10', '#e05050']
  };

  function bez(x0, y0, cx, cy, x1, y1, n) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); } return out; }
  function curve(p, col, pts, w0, w1) { for (let i = 1; i < pts.length; i++) { const t0 = (i - 1) / (pts.length - 1), t1 = i / (pts.length - 1); seg(p, col, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w0 + (w1 - w0) * t0, w0 + (w1 - w0) * t1); } }
  function ringBand(p, col, cx, cy, rx, ry, w, a0, a1) { const n = 40, pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; pts.push(cx + Math.cos(a) * (rx - w), cy + Math.sin(a) * (ry - w)); } p.poly(col, pts); }

  function seg(p, col, x0, y0, x1, y1, w0, w1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const a = w0 / 2, b = (w1 == null ? w0 : w1) / 2;
    p.poly(col, [x0 + nx * a, y0 + ny * a, x1 + nx * b, y1 + ny * b, x1 - nx * b, y1 - ny * b, x0 - nx * a, y0 - ny * a]);
  }

  function shard(p, col, hi, x, y, len, ang, w) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = x + dx * len, ty = y + dy * len;
    p.poly(col, [x + nx * w, y + ny * w, tx, ty, x - nx * w, y - ny * w, x - dx * w * 0.7, y - dy * w * 0.7]);
    if (hi) p.poly(hi, [x + nx * w * 0.15, y + ny * w * 0.15, tx, ty, x + nx * w * 0.9, y + ny * w * 0.9]);
  }

  function star(p, col, x, y, r, t) { p.poly(col, [x, y - r, x + t, y - t, x + r, y, x + t, y + t, x, y + r, x - t, y + t, x - r, y, x - t, y - t]); }
  function gem(p, core, ring, x, y, r) { p.ell(ring, x, y, r * 1.7, r * 1.7); p.ell(core, x, y, r, r); }
  function circle(cx, cy, rx, ry, n) { const out = []; for (let i = 0; i < (n || 20); i++) { const a = i / (n || 20) * Math.PI * 2; out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * (ry || rx)); } return out; }
  function foot(p, col, x, y, w, dir) { p.poly(col, [x - w / 2, y - 3, x + w / 2, y - 3, x + w / 2 + (dir > 0 ? 3 : 0), y + 1, x - w / 2 - (dir < 0 ? 3 : 0), y + 1]); }

  function leaf(p, col, x0, y0, x1, y1, wa, wb) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, a = [], b = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, s = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.8), x = x0 + dx * t, y = y0 + dy * t; a.push(x + nx * wa * s, y + ny * wa * s); b.unshift(x - nx * wb * s, y - ny * wb * s); }
    for (let i = 0; i < b.length; i += 2) a.push(b[i], b[i + 1]);
    p.poly(col, a);
  }

  function spawn(p, f, kind) {
    const u = f ? -4 : 0;
    if (kind === 'fire') {
      const D = '#6a1a2c', M = '#b8283a', E = '#ff9a40', Pk = '#ff62c8', R = '#9c0a14', Rh = '#ff5a40';
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        leaf(p, D, X(5), 52, X(40), 6 + u, 8, 4.4); leaf(p, M, X(6), 50, X(38), 8 + u, 5.4, 2);
        shard(p, D, M, X(30), 24 + u * 0.6, 12, s < 0 ? Math.PI + 0.5 : -0.5, 3); shard(p, D, null, X(22), 36 + u * 0.4, 10, s < 0 ? Math.PI + 0.2 : -0.2, 2.6);
        leaf(p, E, X(9), 44, X(37), 9 + u, 1.2, 0.2);
        leaf(p, Pk, X(32), 14 + u * 0.8, X(48), 4 + u, 2, 1);
        leaf(p, D, X(6), 56, X(30), 20 + u * 0.6, 5, 3); leaf(p, M, X(7), 54, X(29), 22 + u * 0.6, 3, 1.2);
        leaf(p, E, X(14), 30, X(22), 12 + u * 0.4, 1.6, 1.6);
      }
      ringBand(p, D, 50, 36, 10, 15, 5, Math.PI * 0.9, Math.PI * 2.1); ringBand(p, M, 50, 36, 9, 14, 2.6, Math.PI * 1.0, Math.PI * 2.0); ringBand(p, E, 50, 36, 10, 15, 1, Math.PI * 1.15, Math.PI * 1.5);
      leaf(p, D, 50, 56, 52, 92, 4, 4); leaf(p, M, 50, 58, 52, 90, 2, 1.4);
      p.ell(D, 50, 53, 11, 11); p.ell(R, 50, 53, 9, 9); p.ell(Rh, 47, 50, 4, 4); p.ell('#ffd0a0', 46.4, 49.4, 1.6, 1.6);
      ringBand(p, E, 50, 53, 11, 11, 1.6, Math.PI * 0.15, Math.PI * 0.95);
    } else if (kind === 'ice') {
      const D = '#2244b8', M = '#5a92f0', Hh = '#bcdcff';
      shard(p, D, M, 46, 56, 46, -2.25 + u * 0.01, 5); shard(p, M, Hh, 47, 54, 44, -2.2 + u * 0.01, 4);
      shard(p, D, M, 56, 54, 42, -0.62 - u * 0.01, 5); shard(p, M, Hh, 55, 53, 40, -0.65 - u * 0.01, 4);
      shard(p, M, Hh, 50, 54, 32, -1.62, 4.4); shard(p, D, null, 53, 52, 26, -1.2, 3.6); shard(p, M, Hh, 44, 52, 22, -1.9, 3.4);
      shard(p, M, Hh, 58, 56, 28, -0.25, 3.4); shard(p, D, M, 44, 60, 30, 2.75, 4); shard(p, M, Hh, 50, 62, 30, 1.68, 4); shard(p, D, null, 54, 60, 18, 1.1, 3);
      p.poly(D, [50, 46, 58, 56, 50, 66, 42, 56]); p.poly(M, [50, 48, 56, 56, 50, 64, 44, 56]); p.poly(Hh, [50, 48, 56, 56, 50, 56, 46, 52]);
      p.ell('#ffffff', 50, 56, 2, 2);
    } else if (kind === 'elec') {
      const D = '#3c2c9a', M = '#9278f0', Hh = '#cfc2ff', W = '#f4f0ff';
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        leaf(p, D, X(8), 44, X(42), 28 + u, 4, 2.6); leaf(p, M, X(9), 43, X(40), 29 + u, 2.6, 1); leaf(p, Hh, X(12), 41, X(36), 31 + u, 1, 0.2);
        leaf(p, M, X(8), 50, X(30), 54 + u * 0.4, 3, 2); leaf(p, Hh, X(9), 49, X(28), 53 + u * 0.4, 1.2, 0.4);
        shard(p, D, M, X(4), 42, 14, -Math.PI / 2 - s * 0.35, 2.6);
        shard(p, M, Hh, X(4), 58, 13, Math.PI / 2 - s * 0.7, 2.4);
      }
      shard(p, M, Hh, 50, 58, 16, Math.PI / 2, 2.6);
      p.poly(D, [50, 36, 60, 46, 56, 58, 50, 62, 44, 58, 40, 46]); p.poly(M, [50, 38, 58, 46, 55, 57, 50, 60, 45, 57, 42, 46]);
      p.poly(Hh, [50, 38, 58, 46, 50, 48, 42, 46]);
      ringBand(p, W, 50, 44, 3, 3.4, 1.4, 0, Math.PI * 2); seg(p, W, 50, 47.4, 50, 56, 1.6); seg(p, W, 46, 52, 54, 52, 1.6);
    } else {
      const D = '#2a6040', M = '#6ab868', Hh = '#b6ec96', Si = '#d0d4d8', Ss = '#8e969c', C = '#40e8a8', Ch = '#d8fff0';
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        leaf(p, D, X(4), 60, X(38), 4 + u, 9, 4); leaf(p, M, X(5), 58, X(37), 6 + u, 6.4, 2); leaf(p, D, X(10), 50, X(30), 10 + u * 0.8, 1, 1); leaf(p, Hh, X(7), 52, X(35), 9 + u, 1.6, 0.2);
        leaf(p, Si, X(5), 60, X(22), 30 + u * 0.4, 3.6, 0.6); leaf(p, Ss, X(5), 62, X(20), 36 + u * 0.4, 2, 0.6);
      }
      p.poly(Ss, [50, 40, 60, 52, 55, 70, 50, 90, 45, 70, 40, 52]); p.poly(D, [50, 42, 58, 52, 54, 68, 50, 86, 46, 68, 42, 52]);
      p.poly(M, [50, 44, 56, 52, 53, 66, 50, 80, 47, 66, 44, 52]);
      p.poly(C, [50, 50, 54.6, 56, 50, 66, 45.4, 56]); p.poly(Ch, [50, 51.6, 53, 56, 50, 58, 47.4, 55]);
    }
  }

  function glaive(p, x, y, ang, len, I, Ih, Id) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    seg(p, Id, x - dx * len, y - dy * len, x + dx * len, y + dy * len, 2.6);
    seg(p, I, x - dx * len, y - dy * len, x + dx * len, y + dy * len, 1.4);
    const tx = x + dx * len, ty = y + dy * len;
    p.poly(I, [tx + dx * 7, ty + dy * 7, tx + nx * 2.6, ty + ny * 2.6, tx - dx * 1.4, ty - dy * 1.4, tx - nx * 2.6, ty - ny * 2.6]);
    p.poly(Ih, [tx + dx * 7, ty + dy * 7, tx + nx * 1.2, ty + ny * 1.2, tx, ty]);
    for (const sd of [-1, 1]) {
      const gx = x + dx * len * 0.35, gy = y + dy * len * 0.35;
      p.poly(I, [gx, gy, gx + nx * sd * 7 + dx * 3, gy + ny * sd * 7 + dy * 3, gx + nx * sd * 5.4 - dx * 1.6, gy + ny * sd * 5.4 - dy * 1.6]);
      p.poly(Ih, [gx, gy, gx + nx * sd * 7 + dx * 3, gy + ny * sd * 7 + dy * 3, gx + nx * sd * 3 + dx * 0.6, gy + ny * sd * 3 + dy * 0.6]);
    }
    p.poly(Id, [x - dx * len - dx * 3, y - dy * len - dy * 3, x - dx * len + nx * 1.6, y - dy * len + ny * 1.6, x - dx * len - nx * 1.6, y - dy * len - ny * 1.6]);
  }

  function voidBlade(p, x0, y0, cx, cy, x1, y1, w, sd) {
    const n = 16, c = bez(x0, y0, cx, cy, x1, y1, n);
    const at = (i, k) => {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const hw = w * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * i / n)), 0.7);
      return [c[i][0] - dy / L * sd * hw * k, c[i][1] + dx / L * sd * hw * k];
    };
    const strip = (col, i0, i1, k0, k1) => { const pts = []; for (let i = i0; i <= i1; i++) pts.push(...at(i, k0)); for (let i = i1; i >= i0; i--) pts.push(...at(i, k1)); p.poly(col, pts); };
    const K = '#121219', Sp = '#2e2e3e', Sh = '#70728a', Pu = '#36287e', Pl = '#5646bc', Au = '#eea43a', Ag = '#ffd46a', Ah = '#fff4c4', Ru = '#7cc4ff';
    const back = at(0, -1.2), front = at(0, 1.1), d0 = [c[0][0] - c[1][0], c[0][1] - c[1][1]], dl = Math.hypot(d0[0], d0[1]) || 1, ux = d0[0] / dl, uy = d0[1] / dl;
    p.poly(K, [...front, front[0] + ux * w * 1.3 - uy * sd * w * 0.2, front[1] + uy * w * 1.3 + ux * sd * w * 0.2, ...at(0, 0)]);
    p.poly(K, [...at(0, 0), back[0] + ux * w * 0.8 + uy * sd * w * 1.1, back[1] + uy * w * 0.8 - ux * sd * w * 1.1, ...back]);
    for (const [i, len] of [[2, 1.5], [4, 1.1], [6, 0.7]]) p.poly(K, [...at(i, -0.9), ...at(i + 1, -0.9), ...at(i - 1, -1.2 - len)]);
    strip(K, 0, n, 1.15, -1.15);
    strip(Sp, 0, n - 1, -0.55, -0.95);
    strip(Sh, 1, n - 4, -0.8, -0.93);
    strip(Pu, 0, 8, 0.95, -0.55);
    strip(Pl, 1, 6, 0.75, -0.1);
    strip(Au, 7, n, 0.95, -0.55);
    strip(Ag, 8, n, 0.95, 0);
    strip(Ah, 10, n - 1, 0.92, 0.55);
    const r = at(3, 0.35);
    p.ell(Ru, r[0], r[1], w * 0.55, w * 0.55); p.ell(Pu, r[0], r[1], w * 0.3, w * 0.3); p.ell(Ru, r[0], r[1], w * 0.12, w * 0.12);
    for (const [i, k] of [[1, 0.3], [5, 0.55], [6, -0.05], [11, 0.1], [13, 0.4]]) { const s = at(i, k); p.snap(i > 8 ? '#fffbe8' : '#d8d0ff', s[0] - 0.5, s[1] - 0.5, 1, 1); }
  }

  function motherArt(p, f) {
    const I = '#9ad0f8', Ih = '#e8f6ff', Id = '#4a7ac8', Ia = '#c8e4ff', H2 = '#eef2fa', Hs = '#b8c8e8', Hb = '#7a9ae0';
    const R1 = '#3a4ab8', R2 = '#6a4ad0', R3 = '#8ab0f0', Gx = '#2a1458', Gm = '#5a2a9a', Gp = '#e070c0', Bk = '#14121c', Au = '#d8bc78';
    const b = f ? 1.4 : 0, w = f ? 1.6 : 0, mix2 = (a, c) => G.mix(a, c, 0.5);
    for (const sd of [-1, 1]) {
      curve(p, dark(R1, 0.2), bez(50 + sd * 4, 50, 50 + sd * 32, 60 + w, 50 + sd * 42, 97, 10), 9, 3);
      curve(p, R1, bez(50 + sd * 4, 50, 50 + sd * 30, 60 + w, 50 + sd * 40, 97, 10), 7, 2.4);
      curve(p, R2, bez(50 + sd * 3, 54, 50 + sd * 16, 72 - w, 50 + sd * 22, 98, 10), 6, 2);
      curve(p, mix2(R2, R3), bez(50 + sd * 3, 56, 50 + sd * 10, 80 - w, 50 + sd * 12, 98, 10), 3.6, 1.4);
      curve(p, R3, bez(50 + sd * 6, 48, 50 + sd * 36, 50 + w, 50 + sd * 47, 72, 10), 5, 1.6);
      curve(p, Hs, bez(50 + sd * 4, 16, 50 + sd * 28, 26 - w, 50 + sd * 46, 50, 10), 10, 3);
      curve(p, H2, bez(50 + sd * 4, 15, 50 + sd * 24, 24 - w, 50 + sd * 40, 44, 10), 7, 2);
      curve(p, Hb, bez(50 + sd * 4, 20, 50 + sd * 22, 38 + w, 50 + sd * 34, 64, 10), 7, 2);
      curve(p, H2, bez(50 + sd * 3, 20, 50 + sd * 16, 34 - w, 50 + sd * 24, 58, 10), 5, 1.4);
      curve(p, Ih, bez(50 + sd * 5, 15, 50 + sd * 22, 22 - w, 50 + sd * 36, 40, 10), 1.6, 0.6);
    }
    glaive(p, 15, 13 - b, -0.75, 12, I, Ih, Id);
    glaive(p, 85, 13 + b, -2.4, 12, I, Ih, Id);
    glaive(p, 8, 46 + b, 3.14, 7, I, Ih, Id);
    glaive(p, 92, 44 - b, 0, 7, I, Ih, Id);
    glaive(p, 20, 82 - b, 1.9, 10, I, Ih, Id);
    glaive(p, 80, 82 + b, 1.25, 10, I, Ih, Id);
    p.poly(Id, [45, 48, 55, 48, 55.6, 64, 53, 80, 50.6, 97, 49.4, 97, 47, 80, 44.4, 64]);
    p.poly(I, [45.8, 48, 54.2, 48, 54.6, 63, 52.4, 79, 50, 95, 47.6, 79, 45.4, 63]);
    p.poly(Ia, [46.4, 49, 49.6, 49, 49.6, 92, 47.8, 78, 46, 63]);
    for (const [y, l] of [[56, 6], [66, 5], [76, 4.4]]) for (const sd of [-1, 1]) shard(p, I, Ih, 50 + sd * 4, y, l, Math.PI / 2 + sd * 0.9, 1.4);
    p.rect(Id, 46, 64, 8, 0.8); p.rect(Id, 47, 76, 6, 0.8);
    for (const sd of [-1, 1]) {
      seg(p, Bk, 50 + sd * 7, 27, 50 + sd * 14, 40, 2.6, 2);
      seg(p, Bk, 50 + sd * 14, 40, 50 + sd * 18, 46, 2, 1.6);
      for (const k of [-1, 0, 1]) seg(p, Bk, 50 + sd * 18, 46, 50 + sd * (21 + k * 0.6), 48.6 + k * 1.6, 0.8, 0.3);
      seg(p, '#3a3650', 50 + sd * 8, 28, 50 + sd * 13, 37, 0.8);
    }
    p.poly(Gx, [43, 25, 57, 25, 56, 38, 54.4, 48, 45.6, 48, 44, 38]);
    p.poly(Gm, [46, 30, 52, 27, 55, 34, 52, 44, 47, 42]);
    for (const [x, y] of [[47, 29], [53, 33], [49, 38], [51.6, 43], [46, 44], [54, 27.6]]) p.snap(Gp, x, y, 0.8, 0.8);
    for (const [x, y] of [[50, 31], [48, 35], [52, 40]]) p.snap('#ffffff', x, y, 0.6, 0.6);
    for (const sd of [-1, 1]) {
      p.poly(I, [50 + sd * 1, 26, 50 + sd * 6, 25, 50 + sd * 7.4, 30, 50 + sd * 3, 38, 50 + sd * 1.4, 32]);
      p.poly(Ih, [50 + sd * 2, 26, 50 + sd * 5, 25.6, 50 + sd * 3, 30]);
      p.poly(I, [50 + sd * 4.4, 40, 50 + sd * 6, 44, 50 + sd * 5, 48.4, 50 + sd * 3.4, 46]);
      shard(p, I, Ih, 50 + sd * 7, 25, 7, -Math.PI / 2 + sd * 0.7, 1.6);
      shard(p, Id, null, 50 + sd * 8, 26, 5, -Math.PI / 2 + sd * 1.1, 1.3);
    }
    p.poly(I, [48.4, 30, 50, 27.4, 51.6, 30, 50, 36]);
    p.poly(Au, [44, 12, 47, 9, 47, 22, 45, 24]); p.poly(Au, [56, 12, 53, 9, 53, 22, 55, 24]);
    p.rect('#e8d8d8', 48.4, 20, 3.2, 5);
    p.ell(Bk, 50, 15, 4.4, 5.6);
    p.ell('#2a2838', 49, 13.6, 1.6, 2);
    p.poly(Ia, [44.6, 12, 55.4, 12, 54, 8.4, 46, 8.4]);
    for (const [x, h, wd] of [[50, 11, 1.8], [46.6, 6, 1.4], [53.4, 6, 1.4], [43.6, 4, 1.2], [56.4, 4, 1.2]]) { p.poly(I, [x - wd, 8.8, x, 8.8 - h, x + wd, 8.8]); p.poly(Ih, [x - wd * 0.3, 8.6, x, 8.8 - h + 1, x + wd * 0.4, 8.6]); }
    for (const sd of [-1, 1]) { shard(p, I, Ih, 50 + sd * 5, 11, 6, sd < 0 ? Math.PI + 0.3 : -0.3, 1.2); }
  }

  const AUTO = { K: '#1e2026', Kh: '#3e424c', Kl: '#62666f', Kd: '#0e0f12', B: '#6a7ad0', Bh: '#9ca8ec', Bs: '#4a58a8', Bd: '#2c3674' };

  function autoLeg(p, pts, claws) {
    const { K, Kh, Kl, B, Bh, Bs, Bd } = AUTO;
    for (let i = 1; i < pts.length; i++) { seg(p, K, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 5); seg(p, Kh, pts[i - 1][0], pts[i - 1][1] - 1.2, pts[i][0], pts[i][1] - 1.2, 1.2); }
    for (const [x, y] of pts) { p.ell(K, x, y, 3.4, 3.4); p.ell(Kl, x, y, 1.7, 1.7); p.ell(K, x, y, 0.7, 0.7); }
    const [x, y] = pts[pts.length - 1];
    for (const [a, l, w, c] of claws) shard(p, c === 1 ? B : Bs, c === 1 ? Bh : null, x, y + 1, l, a, w);
    for (const [a, l] of claws) p.snap(Bd, x + Math.cos(a) * l * 0.92 - 0.6, y + 1 + Math.sin(a) * l * 0.92 - 0.6, 1.2, 1.2);
  }

  function autoDome(p, x, y) {
    p.ell(AUTO.K, x, y, 14.6, 12.4); p.ell('#3a3c44', x, y - 1, 13.2, 11); p.ell('#5a5e6a', x - 5.4, y - 5.4, 6.6, 4);
    p.poly(AUTO.Kd, [x - 13, y - 4, x + 13, y - 4, x + 11, y, x - 11, y]);
  }

  function autoBulb(p, x, y) {
    seg(p, '#b8bcc8', x - 4.6, y - 4, x - 4.2, y + 4, 1.3); seg(p, '#b8bcc8', x + 4.4, y - 4, x + 4, y + 4, 1.3); seg(p, '#b8bcc8', x - 4.2, y + 4, x + 4, y + 4, 1.3);
    p.ell('#9ea2ae', x, y + 0.4, 3.8, 3.4); p.ell('#f2f2f6', x, y, 3.2, 2.8); p.ell('#ffffff', x - 1, y - 1, 1.2, 1);
  }

  const GUARD = { J: '#2f6ad8', Jh: '#5c96ee', Js: '#1e4a9e', Jl: '#a4c6f6', K: '#16161c', Kh: '#363640', W: '#eceef4', Ws: '#b4b8c8', Wd: '#7a7e8e', P: '#3c3742', Ps: '#26222a', Ag: '#c8ccd8', Rd: '#8a1a24' };

  function guardBody(p, o) {
    const g = Object.assign({}, GUARD, o), { J, Jh, Js, Jl, K, Kh, W, Ws, P, Ps, Ag } = g;
    seg(p, P, 46, 55, 41, 72, 7.4, 6.4); seg(p, P, 54, 55, 59, 72, 7.4, 6.4); seg(p, Ps, 55.6, 56, 60.6, 71, 2.4, 2);
    for (const [kx, fx, s] of [[41, 38.4, -1], [59, 61.6, 1]]) {
      p.poly(K, [kx - 3.6, 72, kx + 3.4, 72, fx + 3, 91, fx + s * 6.4, 93.4, fx + s * 6.4, 96.6, fx - 4, 96.6, fx - 3.4, 91]);
      p.poly(Kh, [kx - 2.6, 73, kx - 0.6, 73, fx - 1, 91, fx - 2.6, 91]);
      p.poly(W, [kx - 4, 70.4, kx + 4, 70.4, kx + 3, 74, kx, 78.6, kx - 3, 74]); p.poly(Ws, [kx + 0.6, 70.4, kx + 4, 70.4, kx + 3, 74, kx, 78.6]);
    }
    p.poly(g.Hms || Js, [41, 47, 59, 47, 61.4, 58, 56, 60, 44, 60, 38.6, 58]); p.poly(g.Hm || J, [41.6, 47, 58.4, 47, 60.4, 57, 55.6, 58.6, 44.4, 58.6, 39.6, 57]);
    p.poly(J, [38.4, 27.6, 61.6, 27.6, 59.6, 49, 40.4, 49]); p.poly(Jh, [39, 28.4, 45, 28.4, 43.4, 48, 40.8, 48]);
    for (const x of [41.6, 57.6]) seg(p, Jl, x, 29, x + (x < 50 ? 0.6 : -0.6), 48, 0.8);
    seg(p, Jl, 40, 38, 60, 38, 0.7);
    if (g.vest !== false) { p.poly(g.V || K, [43.4, 29, 56.6, 29, 57.4, 49.6, 42.6, 49.6]); p.poly(g.Vh || Kh, [44, 29.6, 47, 29.6, 46, 49, 43.2, 49]); p.poly(J, [46.6, 29, 53.4, 29, 50, 36]); p.snap(W, 49.2, 41.6, 1.8, 1.8); }
    p.rect(K, 40.6, 49, 18.8, 2.6); p.snap(Ag, 48.8, 49.4, 2.4, 1.8);
  }

  function guardHead(p, hat, o) {
    const { J, Js, K, Kh, W, Ws, Wd, Ag, Rd } = Object.assign({}, GUARD, o), lt = hat === 'tallw';
    p.poly(lt ? '#2a2c36' : Js, [44, 23.4, 56, 23.4, 57, 29.4, 43, 29.4]); p.poly(lt ? '#4a4e5c' : J, [44.6, 24, 55.4, 24, 56, 28.6, 44, 28.6]);
    if (!lt) { p.ell(W, 56.6, 25.6, 3.4, 2.8); p.ell(Ws, 57.6, 26.6, 2, 1.6); p.poly(Rd, [53.6, 26, 56.4, 25, 56, 28, 54.4, 28.6]); }
    if (hat === 'cap') {
      p.poly(Ws, [44.4, 14.6, 55.6, 14.6, 55.6, 21.4, 50, 27.4, 44.4, 21.4]); p.poly(W, [44.4, 14.6, 51, 14.6, 51, 26.4, 50, 27.4, 44.4, 21.4]);
      seg(p, Wd, 50.4, 16.4, 50.4, 22.4, 0.7); seg(p, Wd, 47.4, 23.4, 50.2, 24.8, 0.6);
      p.poly(K, [43, 7, 57, 7, 56.4, 15.6, 43.6, 15.6]); p.poly(Kh, [43.6, 7.4, 56.4, 7.4, 56.2, 9, 43.8, 9]);
      p.rect(Ag, 43.6, 13.6, 12.8, 2); for (const x of [45, 48, 51, 54]) p.snap(K, x, 14.2, 1, 0.8);
      return;
    }
    const back = hat === 'tallw' ? Ws : K;
    p.poly(back, [42.6, 5.6, 57.4, 5.6, 57.6, 21.6, 42.4, 21.6]); p.poly(hat === 'tallw' ? Wd : Kh, [55.6, 5.6, 57.4, 5.6, 57.6, 21.6, 55.6, 21.6]);
    p.poly(Ws, [44.2, 6.4, 55.8, 6.4, 55.8, 21.4, 50, 27.6, 44.2, 21.4]); p.poly(W, [44.2, 6.4, 51, 6.4, 51, 26.6, 50, 27.6, 44.2, 21.4]);
    if (lt) for (const x of [47.4, 52.6]) seg(p, '#c8a850', x, 7.6, x, 22, 0.8);
    else { seg(p, Wd, 45, 7.8, 55, 16.4, 0.7); seg(p, Wd, 55, 7.8, 45, 16.4, 0.7); seg(p, Wd, 45, 17.6, 50, 21.2, 0.6); seg(p, Wd, 55, 17.6, 50, 21.2, 0.6); }
    seg(p, Wd, 50.4, 21.6, 50.4, 25.4, 0.6);
  }

  function glowPen(p, col, dx, dy) {
    return { poly: (c, a) => p.poly(col, a.map((v, i) => v + (i % 2 ? dy : dx))), ell: (c, x, y, rx, ry, r) => p.ell(col, x + dx, y + dy, rx, ry, r), rect: (c, x, y, w, h) => p.rect(col, x + dx, y + dy, w, h), snap: (c, x, y, w, h) => p.snap(col, x + dx, y + dy, w, h) };
  }

  function glowing(p, col, w, fn) {
    for (const [dx, dy] of [[-w, 0], [w, 0], [0, -w], [0, w]]) fn(glowPen(p, col, dx, dy));
    fn(p);
  }

  function halberdier(p, c) {
    const { J, Jl, K, W, Ws, Wd } = GUARD;
    const H = Object.assign({ sleeve: J, sleeveL: Jl, guard: W, guardS: Ws, fore: W, foreS: Ws, cuff: K, arm: K, hand: W, handS: Ws, handD: Wd, wood: '#4e3626', woodL: '#7a5a3e', pole: Wd, poleL: W, butt: Ws, iron: K, edge: Wd, blade: Ws, bladeL: W, tip: '#ffa62a', tipL: '#ffe27a', hat: 'cap' }, c);
    guardBody(p, H.body);
    seg(p, H.sleeve, 60, 29.4, 64, 42, 5, 4.4); seg(p, H.sleeveL, 61.6, 30, 64.6, 40.6, 0.7); p.ell(H.guard, 64, 42.6, 3.2, 3); p.ell(H.guardS, 64.8, 43.4, 1.8, 1.6);
    seg(p, H.fore, 64, 43, 59.6, 57, 4.2, 3.6); seg(p, H.foreS, 65, 44, 61, 56, 1.4); p.rect(H.cuff, 57.4, 55.4, 5, 2.6); p.snap(H.guard, 59.4, 55.8, 1.2, 1.2);
    seg(p, H.arm, 40, 29.6, 34, 38.6, 5, 4.4); seg(p, H.arm, 34, 38.6, 35.6, 29.6, 4.4, 3.8); p.ell(H.arm, 34.2, 38.4, 2.6, 2.6);
    if (H.hat) guardHead(p, H.hat, H.head);
    seg(p, H.wood, 23.4, 10.6, 50, 51.4, 2.2); seg(p, H.woodL, 23, 10.8, 49.6, 51.6, 0.8); seg(p, H.pole, 50, 51.4, 77, 93, 2.2); seg(p, H.poleL, 49.6, 51.6, 76.6, 93.2, 0.8); p.poly(H.butt, [75.4, 90.4, 78.4, 89.6, 79, 95.6, 76.4, 95.6]);
    shard(p, H.iron, null, 25.6, 12.4, 7, -0.45, 1.6);
    if (H.crescent) {
      const cr = [17, 0.4, 9, 2.4, 4.4, 7.6, 4, 13.4, 6.4, 19, 12.6, 23.4, 13.4, 19.4, 12.6, 16.4, 12.4, 12.8, 12.8, 9.2, 14.6, 6, 17.4, 3.8];
      p.poly(H.edge, cr); p.poly(H.blade, cr.map((v, i) => v + (i % 2 ? 0 : 0.9))); curve(p, H.bladeL, [[9.6, 3.4], [6, 8], [5.6, 13.2], [7.6, 18.2]], 1.2, 0.8);
      p.poly(H.edge, [12, 9.4, 19.4, 8.6, 19.8, 14.6, 12, 14.4]);
    } else { p.poly(H.edge, [20.6, 7, 11, 5, 6.4, 12.6, 9.4, 20.6, 20.6, 17.6]); p.poly(H.blade, [20, 7.8, 11.4, 5.8, 7.4, 12.6, 10, 19.6, 20, 16.8]); p.poly(H.bladeL, [11.4, 5.8, 7.4, 12.6, 9, 16.4, 10.2, 12.4, 13, 6.6]); }
    seg(p, H.iron, 18.4, 8, 18.4, 17, 1);
    p.poly(H.iron, [19.4, 7.4, 24.6, 8.6, 25.6, 14.6, 21.6, 16.6, 19.2, 13]);
    shard(p, H.edge, null, 21.4, 8.4, 9.4, -2.16, 1.8); shard(p, H.blade, H.bladeL, 21.4, 8.4, 8.8, -2.16, 1.2); p.poly(H.tip, [16.6, 0.4, 18.6, 2, 17.4, 3.8]); p.snap(H.tipL, 17.2, 1, 0.8, 0.8);
    p.ell(H.handD, 35.6, 27.6, 2.8, 2.6); p.ell(H.hand, 35.4, 27.2, 2.3, 2.1); p.snap(H.handS, 34, 27.6, 3, 1);
    p.ell(H.handD, 57.8, 58.6, 2.8, 2.6); p.ell(H.hand, 57.6, 58.2, 2.3, 2.1); p.snap(H.handS, 56.4, 58.8, 3, 1);
  }

  function crystal(p, E, x0, y0, x1, y1, w, lit, dim, t) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = t == null ? 0.4 : t, mx = x0 + dx * k, my = y0 + dy * k;
    const ex = dx / L * 0.8, ey = dy / L * 0.8, wo = w / 2 + 0.7;
    p.poly(E, [x0 - ex, y0 - ey, mx + nx * wo, my + ny * wo, x1 + ex, y1 + ey, mx - nx * wo, my - ny * wo]);
    p.poly(lit, [x0, y0, mx + nx * w / 2, my + ny * w / 2, x1, y1]);
    p.poly(dim, [x0, y0, x1, y1, mx - nx * w / 2, my - ny * w / 2]);
  }

  function outSpaceArt(p, f, c) {
    const { B, Bh, Bd, E, glow, glowH, spike, spikeH, core, coreH, mark, blade } = c, up = f ? -1.4 : 0;
    const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
    kite(61.4, 38 + up, 76.4, 37 + up, 9.6, Bh, Bd, 0.35);
    kite(55.6, 33.6, 70.6, 18.4, 5.6, B, Bd); kite(60, 34.6, 71.4, 22.6, 4.2, Bd, E);
    kite(53, 22, 55.2, 8.4, 2.8, Bh, B);
    kite(40.4, 25, 29.4, 16.4, 6.4, Bh, B); kite(38.6, 31, 26.4, 26.6, 5.4, B, Bd);
    kite(44.6, 39.4, 44, 18.4, 12, Bh, B, 0.5); kite(51, 35, 56.4, 17.4, 6.6, B, Bd);
    kite(37.6, 31.4, 37.6, 3, 5.8, spikeH, spike, 0.25);
    kite(46.6, 34, 67.8, 3.6, 5.8, spikeH, spike, 0.25);
    kite(38, 36.6, 38.2, 24.4, 5, spikeH, spike, 0.5);
    kite(33.6, 31.4, 16.6, 32.6, 7, Bh, B); kite(31.6, 36.4, 19.6, 38.6, 5, B, Bd);
    kite(30, 42.6, 11.6, 44.6, 10.4, B, Bd, 0.45);
    kite(16.4, 45.4, 10.4, 50.4, 5, glowH, glow, 0.5);
    for (const [x, y, l, a] of [[13.6, 48.6, 7.4, 1.78], [18.6, 49, 7, 1.44], [26.4, 45.6, 6, 1.18]]) kite(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 3, glowH, glow, 0.3);
    kite(26.6, 45.8, 53, 31.4, 4, blade === glow ? glowH : Bh, blade, 0.6);
    kite(52.4, 35.6, 51, 57.6, 7.4, B, Bd); kite(54.4, 44.6, 61.4, 51.6, 5, Bh, B);
    kite(41.6, 43, 33.4, 69.6, 11, coreH, core, 0.4);
    for (const [x, y] of [[36.6, 52.6], [38.6, 58], [39.6, 48], [36, 62.6], [34.6, 57]]) p.snap(mark, x, y, 0.9, 0.9);
    kite(32.6, 70.6, 52.6, 67.6, 7.4, B, Bd, 0.5);
    for (const [x, y, l, a] of [[33.6, 66.4, 10, 3.05], [32.6, 64.6, 7.6, -2.7], [32.6, 68.4, 7, 2.55]]) kite(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 3.6, glowH, glow, 0.3);
    kite(52.4, 54, 49.8, 96.6, 12.4, B, Bd, 0.32);
    kite(54.6, 54.6, 49.4, 64.6, 7.4, coreH, core, 0.4);
    kite(46.2, 73, 58.8, 71.8, 8, glowH, glow, 0.45);
    kite(71, 45.6 + up, 72.6, 79 + up, 19, B, Bd, 0.35);
    kite(59.4, 52.4 + up, 80.6, 46 + up, 9.6, Bh, B, 0.45);
    kite(85.6, 46.6 + up, 85.2, 72.6 + up, 8.4, Bh, B, 0.35);
    kite(80.6, 49 + up, 82.6, 41.4 + up, 3, Bd, E);
    p.poly(E, [75, 44.6 + up, 77.2, 51.2 + up, 80, 53.4 + up, 77.2, 55.6 + up, 75, 63 + up, 72.8, 55.6 + up, 70, 53.4 + up, 72.8, 51.2 + up]);
    p.poly(glow, [75, 45.6 + up, 76.6, 51.6 + up, 79, 53.4 + up, 76.6, 55 + up, 75, 62 + up, 73.4, 55 + up, 71, 53.4 + up, 73.4, 51.6 + up]);
    p.poly(glowH, [75, 45.6 + up, 76.6, 51.6 + up, 79, 53.4 + up, 75, 53.4 + up]);
    kite(67, 62 + up, 58.6, 60.2 + up, 4, glowH, glow, 0.3);
    kite(65, 70 + up, 72, 82 + up, 6, B, Bd);
    for (const [x0, y0, x1, y1] of [[67.6, 80.4, 79.6, 78.6], [68.6, 85, 80.6, 83.2]]) kite(x0, y0 + up, x1, y1 + up, 4.6, glowH, glow, 0.6);
  }

  function shadeLady(p, f, g) {
    const E = '#0a0a10', K = '#18161c', Kh = '#3c3844', Au = '#c8b282', Auh = '#f0e2b8', Aud = '#6c5c3c', Bz = '#2a2620', B = '#2c5ad6', Bh = '#5e8cf2', Bd = '#1a3a9a';
    const Wc = '#eef0f6', Ws = '#b6bacc', Hr = '#dcd6f2', Hs = '#a29ccc', Cp = '#2c271e', Cph = '#6a5c40', Cl = '#4a2832', Gm = '#4ab8ff', Gmh = '#d2f2ff', Tg = '#3a2c32';
    const Wt = '#f4f6fc', Wts = '#c4c6e0', Wtl = '#3a3c48', Tl = '#1aa6c8', Tld = '#0e5a78', Tlh = '#5ad4ee';
    const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const fl = f ? 1.4 : 0;
    if (g) {
      mass([56, 35, 61.6, 30, 66.6, 25.4, 71, 19.6 - fl, 73.2, 21.4 - fl, 76.6, 28, 80.4, 35.6, 79.4, 43, 70, 44, 61, 41], Tl);
      p.poly(Tld, [60, 37.4, 70, 36.6, 80.4, 35.6, 79.4, 43, 70, 44, 61, 41]); p.poly('#137e9c', [60, 37.4, 70, 36.6, 80.4, 35.6, 78, 31, 70, 33, 62, 35]);
      p.poly(Tlh, [61.6, 30, 66.6, 25.4, 71, 19.6 - fl, 72, 21.8 - fl, 68, 27.6, 62.6, 32.4]);
      mass([50, 35, 60, 37.6, 70, 40.6, 80, 44, 90, 46.6 - fl, 99, 46 - fl, 99, 52 - fl, 90, 52.6, 80, 51, 70, 48.6, 60, 45.6, 52, 42], B);
      p.poly('#1a3478', [76, 43, 90, 46.6 - fl, 99, 46 - fl, 99, 52 - fl, 90, 52.6, 78, 50.6]);
      p.poly('#0e1a2c', [88, 46.4 - fl, 99, 46 - fl, 99, 52 - fl, 90, 52.6]);
      p.poly(Bh, [52, 36, 60, 38, 70, 41, 68, 42.4, 58, 40, 52, 38.4]);
      mass([40, 52, 46, 50, 52, 54, 60, 60, 68, 68, 74, 76, 80, 86, 85, 94.6, 78, 94.6, 70, 90, 62, 84, 55, 76, 49, 68, 44, 60], Wt);
      p.poly(Wts, [56, 57.6, 64, 64, 72, 74, 78, 84, 85, 94.6, 81, 94.6, 74, 86, 66, 74, 60, 66]);
      curve(p, Wtl, bez(44, 57, 52, 74, 76, 93, 12), 0.8, 0.7); curve(p, Wtl, bez(46.6, 55.4, 55.4, 71.4, 79.4, 91.4, 12), 0.7, 0.6);
      const furEdge = bez(51.6, 52.6, 75, 63, 86.6, 95, 12);
      curve(p, Wts, furEdge.map(([x, y]) => [x + 0.6, y - 0.4]), 5, 3.8); curve(p, '#ffffff', furEdge.map(([x, y]) => [x + 0.2, y - 0.6]), 3, 2.2);
      furEdge.slice(1).forEach(([x, y], i) => shard(p, i % 2 ? Wts : '#ffffff', null, x + 2.2, y - 1, 2.4, -0.6 + (i % 3) * 0.3, 1.1));
    } else {
      mass([51, 28, 60, 29.6, 70, 31.4, 80, 33.6, 92.6, 39.6 - fl, 90, 41.4 - fl, 99, 46 - fl, 99, 52.4 - fl, 88, 50.6, 76, 48.6, 64, 45.4, 54, 42, 50, 38], Cp);
      p.poly(Cph, [66, 31.2, 80, 33.8, 92, 39.8 - fl, 89.4, 41.2 - fl, 76, 40.4, 66, 37.6]);
      p.poly(Cl, [52, 33, 64, 36, 74, 40, 64, 44, 54, 41.4]);
      curve(p, Au, bez(64, 45.4, 80, 48.4, 98.4, 51.8 - fl, 10), 0.9, 0.7); curve(p, Au, bez(66, 37.8, 78, 40.4, 89.4, 41.4 - fl, 8), 0.7, 0.6);
      mass([45, 44, 49, 46, 55, 54, 62, 64, 70, 76, 78, 86, 84.6, 94.4, 80, 94, 72, 90, 64, 84, 57, 76, 51, 66, 47, 56, 44, 50], B);
      p.poly(Bd, [55, 54, 62, 64, 70, 76, 78, 86, 84.6, 94.4, 80, 94, 76, 88, 70, 80, 63, 70, 57, 60]);
      for (const [x0, y0, x1, y1] of [[50, 52, 60, 70], [56, 64, 68, 80], [64, 78, 74, 88]]) seg(p, Bh, x0, y0, x1, y1, 1, 0.6);
      curve(p, Au, bez(46, 47, 52, 62, 76, 91, 12), 0.8, 0.6);
    }
    p.poly(Wc, [44.6, 40, 50, 41, 50.6, 50, 47, 56, 44.6, 50]); p.poly(Ws, [48, 41, 50, 41, 50.6, 50, 48.6, 52]);
    seg(p, E, 49.6, 74, 55.6, 84, 5.2, 4.4); seg(p, K, 49.6, 74, 55.6, 84, 4, 3.2); seg(p, '#5c5868', 49.4, 75.4, 54.4, 83.4, 0.9, 0.7);
    p.poly(E, [53, 81.2, 58.6, 80.6, 60.6, 87, 57.4, 88.6, 54.4, 87.2]); p.poly(K, [53.8, 81.8, 58, 81.4, 59.6, 86.6, 57.4, 87.6, 55, 86.6]);
    p.snap(Au, 55.6, 82, 1.6, 1);
    if (g) {
      seg(p, E, 31, 54.6, 8.6, 25.6, 3.2); seg(p, '#24222a', 31, 54.6, 8.6, 25.6, 2.2); seg(p, Au, 30.4, 54.6, 8.4, 25.8, 0.6);
      for (const t of [0.22, 0.46]) { const x = 31 - 22.4 * t, y = 54.6 - 29 * t; p.ell(E, x, y, 1.8, 1.6); p.ell(Au, x, y, 1.2, 1); }
      const blade = [6.6, 4.6, 2, 9.6, -0.6, 17.6, -0.6, 26.4, 1.6, 33.6, 5.4, 38.4, 4.6, 32, 3.6, 25.4, 3.8, 17.4, 5.4, 10.6];
      glowing(p, E, 0.8, q => q.poly(Wt, blade)); p.poly(Ws, [3.6, 25.4, 4.6, 32, 5.4, 38.4, 1.6, 33.6, -0.6, 26.4]); seg(p, '#ffffff', 2, 11, 0.6, 22, 0.8);
      const fan = [6.4, 23.4];
      for (let k = 0; k <= 8; k++) { const a = -0.62 + k * 0.155; fan.push(6.4 + Math.cos(a) * (k % 2 ? 10.4 : 12.4), 23.4 + Math.sin(a) * (k % 2 ? 10.4 : 12.4)); }
      glowing(p, E, 0.8, q => q.poly(Au, fan));
      for (let k = 0; k <= 8; k += 2) { const a = -0.62 + k * 0.155; seg(p, Auh, 7.4 + Math.cos(a) * 2, 23.4 + Math.sin(a) * 2, 6.4 + Math.cos(a) * 11.6, 23.4 + Math.sin(a) * 11.6, 0.9, 0.5); }
      kite(6.4, 12.4, 6.4, 35.4, 3, Auh, Au, 0.5);
      p.ell(E, 6.4, 23.4, 2.6, 2.6); p.ell(Aud, 6.4, 23.4, 2, 2); p.ell(Auh, 6, 23, 1, 1);
    } else {
      seg(p, E, 31, 54.6, 14.6, 37, 3.2); seg(p, '#24222a', 31, 54.6, 14.6, 37, 2.2); seg(p, Au, 30.4, 54.6, 14.4, 37.4, 0.6);
      kite(7.4, 16.6, 6.2, 8.4, 3.8, Auh, Au, 0.3); kite(10.6, 21.2, 20.4, 21.6, 4, Auh, Au, 0.25);
      kite(15.4, 38.2, 3.6, 15.4, 10.4, Au, Aud, 0.55);
      seg(p, Bz, 5.8, 19.6, 12.8, 26.8, 0.6); seg(p, Bz, 9.4, 18, 13.8, 29.6, 0.6); seg(p, Auh, 4.6, 17.4, 8.6, 25.6, 0.7);
      p.ell(E, 2.6, 23, 3.6, 3.4); p.ell(Au, 2.6, 23, 2.8, 2.6); p.ell(Auh, 2.2, 22.6, 1.4, 1.2);
      p.poly(E, [11, 27.8, 14.8, 32.6, 11, 37.6, 7.2, 32.6]); p.poly(Gm, [11, 28.8, 13.8, 32.6, 11, 36.6, 8.2, 32.6]); p.poly(Gmh, [11, 28.8, 8.2, 32.6, 10.2, 32]);
      seg(p, Au, 11, 28.8, 11, 36.6, 0.7); seg(p, Au, 8.2, 32.6, 13.8, 32.6, 0.7);
    }
    p.poly(Tg, [33.6, 50.4, 45, 49.6, 46, 57.6, 34, 58.4]);
    mass([32.6, 56, 40, 53.6, 47.6, 56, 49.4, 64, 48, 72, 44, 75.4, 38, 74, 34, 68], K);
    const Kg = '#5c5868';
    kite(34, 57, 39.4, 70, 4.6, Kg, K, 0.4); kite(40, 56.6, 44.6, 68.6, 4, Kg, K, 0.4); kite(44.6, 59.6, 48.4, 70.6, 3.4, Kg, K, 0.4); kite(36.4, 66.6, 43.6, 74, 3.6, Kh, K, 0.5);
    kite(42.6, 57, 45.4, 64, 1.8, Auh, Au, 0.5); p.snap(Au, 39.6, 63.6, 1.2, 1);
    seg(p, E, 44.4, 73, 46.6, 88, 5.4, 4.6); seg(p, K, 44.4, 73, 46.6, 88, 4.2, 3.6); seg(p, '#5c5868', 43.6, 74.6, 45.4, 87, 1, 0.8);
    for (const y of [78.4, 80.4]) seg(p, Au, 44.6, y, 46.6, y + 1, 0.5);
    p.poly(E, [43.6, 86.6, 49.6, 86.6, 48.6, 93.6, 46.6, 98, 44.4, 93.6]); p.poly(K, [44.4, 87.4, 48.8, 87.4, 48, 93.4, 46.6, 96.8, 45.2, 93.4]);
    kite(46.2, 87, 47.4, 92, 1.6, Auh, Au, 0.5);
    mass([36, 34, 41, 33, 42, 48, 39, 54, 35.6, 48], B); p.poly(Bh, [36.6, 34.6, 38.6, 34.2, 38, 50, 36.4, 48]); seg(p, Wc, 41.6, 33.4, 42, 48, 0.8);
    mass([37, 28, 44, 26.6, 47, 30, 48, 40, 50.4, 52, 46, 56, 42, 50, 40, 42, 37, 34], Wc);
    p.poly(Ws, [45.6, 29, 47, 30, 48, 40, 50.4, 52, 48.4, 53, 46.6, 40]);
    mass([40.4, 30.4, 46, 30, 46.6, 37.6, 43.4, 39.6, 40.6, 37.4], K); p.poly(Kh, [41, 31, 43, 30.8, 42, 37, 41, 36.6]);
    p.poly(B, [40, 39, 47, 38.4, 47.4, 40.6, 40.4, 41.2]);
    p.poly(Wc, [34.4, 30.8, 38, 27, 42, 26.6, 44, 28.4, 41, 30.6, 37, 32.2]); p.poly(Ws, [34.4, 30.8, 37, 32.2, 39, 31.2, 36.6, 30.8]);
    for (const [x, y, r] of [[46.6, 24.6, 3], [49.6, 26.4, 3], [48.6, 28.8, 2.4]]) p.ell(E, x, y, r + 0.7, r + 0.6);
    for (const [x, y, r] of [[46.6, 24.6, 3], [49.6, 26.4, 3], [48.6, 28.8, 2.4]]) { p.ell(K, x, y, r, r); p.snap(Kh, x - r * 0.4, y - r * 0.5, 1, 0.8); }
    seg(p, E, 38, 31, 31, 39.6, 5, 4.4); seg(p, K, 38, 31, 31, 39.6, 3.6, 3.2);
    seg(p, E, 31, 39.6, 26.6, 44.4, 4.4, 3.8); seg(p, K, 31, 39.6, 26.6, 44.4, 3.2, 2.8);
    p.poly(Au, [27.6, 41.2, 30.2, 43, 29.2, 44.4, 26.8, 42.8]);
    p.ell(E, 25.2, 45.2, 2.6, 2.4); p.ell(K, 25.2, 45.2, 1.8, 1.6); p.snap(Kh, 24.2, 44.2, 1, 0.8);
    const muff = g ? Wt : K, fur = g ? Wts : Kh;
    p.ell(E, 51.6, 41.4, 5.8, 5.4); p.ell(muff, 51.6, 41.4, 5, 4.6); for (const [x, y] of [[49.6, 38.4], [52.6, 39.4], [50.4, 42.6], [53.6, 43.4]]) p.snap(fur, x, y, 1.2, 0.8);
    p.poly(E, [46, 32, 52.4, 31.6, 52.8, 37.8, 46.4, 38.2]); p.poly(B, [46.6, 32.6, 51.8, 32.2, 52.2, 37.2, 47, 37.6]); p.poly(Bh, [46.6, 32.6, 51.8, 32.2, 51.8, 33.6, 46.8, 34]);
    if (g) {
      glowing(p, E, 0.8, q => q.poly(Au, [45.6, 28.4, 52, 27.4, 58.6, 26.2, 57, 28.4, 60.4, 29.2, 58.4, 31, 60, 32.6, 56.4, 34, 46.4, 34.4]));
      p.poly(Auh, [45.6, 28.4, 52, 27.4, 58.6, 26.2, 57, 28.4, 51, 29.6, 46, 30.2]);
      seg(p, Aud, 49, 31, 58.4, 30.6, 0.6); seg(p, Aud, 48.6, 32.8, 57.6, 33.2, 0.6);
    }
    else for (const x of [47.8, 49.6, 51.2]) kite(x, 36.6, x + 0.2, 40.6, 1.2, Auh, Au, 0.3);
    kite(51.6, 45.4, 49, 49.4, 2, Kh, K, 0.4); kite(52.8, 45.6, 52, 49.6, 1.8, Kh, K, 0.4);
    mass([39.2, 20.4, 49.6, 20.2, 50.6, 22.8, 46.6, 26.2, 42.4, 27.4, 38.4, 27.8, 38.8, 23.6], Hr);
    p.poly(Hs, [46, 20.4, 49.6, 20.2, 50.6, 22.8, 46.6, 26.2, 44.2, 24.4]); seg(p, Hs, 41.4, 21.4, 39.6, 26.4, 0.6); seg(p, Hs, 43.6, 21.4, 42.6, 25.6, 0.6);
    kite(40.4, 27.4, 43, 28.6, 1.6, Auh, Au); p.snap(Gm, 41.2, 27.6, 0.8, 0.8);
    if (g) {
      mass([38.4, 4.6, 42.6, 5.4, 46, 8, 50, 11, 54.6, 13.2, 52.4, 15.4, 47, 17.4, 41, 20.6, 38, 18, 37.6, 11], Wc);
      p.poly(Ws, [46, 11.6, 50, 11.4, 54.6, 13.2, 52.4, 15.4, 47, 17.4, 44.6, 15.6]); p.poly('#ffffff', [38.4, 4.6, 42.6, 5.4, 44, 7, 39.6, 7.6]);
      seg(p, B, 38.6, 6, 38, 17, 1.2);
      for (const [x1, y1, w] of [[35.6, 8.4, 2.8], [38.8, 6.4, 2.8], [44.6, 8.2, 2.4], [48.6, 12.4, 2.2], [34.6, 14.4, 2.2]]) kite(42, 17.6, x1, y1, w, Auh, Au, 0.35);
      p.ell(E, 42, 17.6, 2.4, 2.4); p.ell(Au, 42, 17.6, 1.8, 1.8); p.ell(Auh, 41.6, 17.2, 0.9, 0.9);
    } else {
      mass([38.6, 8, 49.6, 7.6, 50.2, 20.4, 38.4, 20.6], K);
      for (const [x, y] of [[40, 9.4], [43, 8.8], [46.4, 9.2], [41.6, 12.8], [45.4, 13.2], [48, 16.6], [43.6, 17]]) p.snap(Kh, x, y, 1.2, 0.8);
      p.ell(E, 51.4, 15, 2.8, 3.8); p.ell(K, 51.4, 15, 2.2, 3.2); p.snap(Kh, 50.6, 13, 1, 0.8);
      for (const [x1, y1, w] of [[40.6, 10.4, 2.6], [45, 12.4, 2.4], [46.4, 17.4, 2.2], [37.4, 15, 2], [39, 20.4, 1.8]]) kite(41, 17, x1, y1, w, Auh, Au, 0.35);
      p.ell(Au, 41, 17, 2.2, 2.2); p.ell(Auh, 40.6, 16.6, 1.2, 1.2); p.snap(Gm, 40.6, 16.8, 0.8, 0.8);
    }
  }

  function lotusArt(p, f, c) {
    const o = f ? 1.6 : 0, cx = 50, cy = 54;
    const out = (x, y) => { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy) || 1; return [x + dx / L * o, y + dy / L * o]; };
    const petal = (x0, y0, x1, y1, w, fill, shade, rim, mark) => {
      const [tx, ty] = out(x1, y1), dx = tx - x0, dy = ty - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = w / 2;
      leaf(p, c.ink, x0 - ux, y0 - uy, tx + ux, ty + uy, h + 0.9, h + 0.9);
      leaf(p, rim, x0, y0, tx, ty, h, h);
      leaf(p, fill, x0, y0, tx - ux * 1.8, ty - uy * 1.8, h - 1.5, h - 1.5);
      leaf(p, shade, x0, y0, tx - ux * 1.8, ty - uy * 1.8, 0, h - 1.5);
      if (mark) {
        const bx = x0 + ux * L * mark[0], by = y0 + uy * L * mark[0], ex = tx - ux * L * mark[1], ey = ty - uy * L * mark[1];
        leaf(p, c.mark, bx, by, ex, ey, h * 0.5, h * 0.5);
        leaf(p, c.markL, bx + ux * L * 0.06, by + uy * L * 0.06, ex - ux * L * 0.08, ey - uy * L * 0.08, h * 0.26, h * 0.26);
      }
    };
    for (const [x0, y0, x1, y1, w] of [[50, 48, 51, 22, 11], [47, 50, 24, 30, 14], [55, 48, 66, 17, 13], [56, 55, 96, 37, 16], [44, 59, 3, 65, 15], [53, 62, 80, 80, 16], [46, 63, 27, 95, 16]]) petal(x0, y0, x1, y1, w, c.back, c.backD, c.backR);
    if (c.glow) { p.ell(c.glow, 50, 56, 23, 17); p.ell(c.glowL, 50, 56, 16, 12); p.ell(c.glow2, 50, 57, 10, 7.6); }
    for (const [x0, y0, x1, y1, w] of [[46, 52, 37, 14, 15], [55, 52, 69, 16, 14], [44, 56, 10, 37, 14], [46, 62, 12, 64, 11], [58, 57, 82, 42, 11], [56, 63, 73, 77, 12], [50, 63, 44, 82, 12]]) petal(x0, y0, x1, y1, w, c.fill, c.fillD, c.rim, c.markAt);
    if (c.glow) for (const [col, R, w] of [[c.glowL, 18, 4.4], ['#f0602a', 13, 3.4], [c.glow2, 9, 2.6]]) for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + Math.PI / 10; leaf(p, col, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.78, w, w); }
    const starPts = (x, y, R, r) => { const a = []; for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; a.push(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * 0.84); } return a; };
    glowing(p, c.ink, 0.9, q => q.poly(c.star, starPts(cx, cy - 1, 13, c.round ? 8.6 : 6.6)));
    p.poly(c.starD, starPts(cx + 0.8, cy, 11.4, c.round ? 7.6 : 5.6).map((v, i) => (i % 2 ? v + 1.4 : v)).slice(4, 14).concat([cx, cy + 1]));
    p.poly(c.starL, starPts(cx - 0.8, cy - 2, 8, c.round ? 5.4 : 4));
    if (c.round) {
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 0.4 + Math.PI / 5; p.ell(c.dot, cx + Math.cos(a) * 5.2, cy - 1 + Math.sin(a) * 4.4, 1.2, 1.1); }
      p.ell(c.dot, cx, cy - 1, 1.6, 1.4);
    }
  }

  function ipcArt(p, c) {
    const A = '#545867', Ah = '#7d8193', Ad = '#33353f', K = '#1c1a22', Kh = '#34323e', P = '#c42a5c', Ph = '#ff5a8a', Au = '#d8b060', Auh = '#f4dc98';
    const N = '#2e2c42', Nh = '#4c4a64', F = '#bebcca', Fs = '#7e7c8e', E = '#0e0e14', Bt = '#18161e', Bth = '#3c3a48';
    const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const boot = (x0, y0, x1, y1, toe) => {
      mass([x0, y0, x1, y0, x1 + 0.6, y1 - 3, x1 + (toe > 0 ? 3 : 0.6), y1 - 1, x1 + (toe > 0 ? 3 : 0.6), y1, x0 - (toe < 0 ? 3 : 0), y1, x0 - (toe < 0 ? 3 : 0), y1 - 1.4], Bt);
      p.poly(Bth, [x0 + 0.6, y0 + 0.6, x0 + 3, y0 + 0.6, x0 + 2.6, y1 - 2, x0 + 0.6, y1 - 2]);
      const ex = (x0 + x1) / 2 + toe * 1.4, ey = y1 - 3.4; p.ell(Bth, ex, ey, 1.8, 1.6); p.ell(Bt, ex, ey, 0.9, 0.8);
    };
    seg(p, E, 46, 42, 40.6, 56, 8.6, 7.6); seg(p, K, 46, 42, 40.6, 56, 7, 6);
    seg(p, E, 41.4, 58, 45, 76, 8, 6.4); seg(p, A, 41.4, 58, 45, 76, 6.6, 5); seg(p, Ah, 39.4, 59, 42.8, 74, 1.6, 1.2); seg(p, Ad, 43.6, 58, 47, 75, 1.4, 1);
    p.poly(P, [41.4, 64.4, 46.4, 63.6, 46.8, 65.4, 41.8, 66.2]); p.snap(Ph, 45.4, 64.2, 1, 0.8);
    kite(37, 56.6, 46.6, 53.4, 6.6, Ah, Ad, 0.45);
    boot(38.6, 75.4, 49, 82.4, -1);
    mass([44, 34, 62, 33, 63.6, 42, 60, 50, 50, 50, 44.6, 44], K); p.poly(Kh, [45, 35, 50, 34.6, 48.6, 46, 45.4, 43]);
    mass([43.6, 17.4, 54, 15.6, 61, 18.6, 63.4, 28, 59.6, 35, 45.4, 35.2, 42.4, 26], A);
    p.poly(Ah, [43.6, 17.4, 52, 16.2, 50, 24, 43, 25]); p.poly(Ad, [56, 22, 61, 18.6, 63.4, 28, 59.6, 35, 55, 30]);
    seg(p, E, 43, 25, 50, 24, 0.5); seg(p, E, 50, 24, 52, 16.2, 0.5);
    seg(p, P, 49.4, 19.6, 51.8, 33.4, 1.6, 1.4); seg(p, P, 49.6, 33.2, 62.6, 31.6, 1.4); p.snap(Ph, 50.4, 24, 1, 1);
    seg(p, Au, 44.8, 26.2, 50, 33.8, 0.7);
    p.poly(E, [49.6, 34.4, 66.4, 33.4, 66.6, 37.6, 49.8, 38.4]); p.poly(Kh, [50.4, 35, 65.8, 34, 65.8, 35.4, 50.4, 36.2]); p.snap(Au, 54.6, 35, 2, 1.8);
    mass([64, 35, 68.4, 34.6, 69, 42, 64.6, 42.6], K); p.poly(Kh, [64.6, 35.6, 68, 35.2, 68, 37, 64.6, 37.4]);
    mass([50, 46, 61, 45, 63, 52, 61, 60, 51.6, 60.4, 49.6, 53], A); p.poly(Ah, [50.6, 46.6, 56, 46, 54.4, 56, 50.4, 53]); p.poly(Ad, [58, 46, 61, 45, 63, 52, 61, 60, 58.4, 56]);
    kite(57.4, 48, 60.6, 44.6, 1.6, Auh, Au, 0.5); seg(p, Au, 57.6, 44.6, 60.6, 48.6, 0.8);
    p.poly(P, [51.2, 58.6, 61.4, 58.2, 61.2, 60.4, 51.4, 60.8]);
    seg(p, E, 56, 60.4, 63, 85, 11, 8.4); seg(p, A, 56, 60.4, 63, 85, 9.6, 7); seg(p, Ah, 53.2, 62, 59.8, 84, 2, 1.4); seg(p, Ad, 59.6, 61, 66, 84, 2.4, 1.6);
    kite(52.6, 62.4, 60, 59, 4.6, Ah, Ad, 0.5);
    for (const [y, w] of [[70, 5.4], [77, 4.8]]) { const x = 56 + (63 - 56) * (y - 60.4) / 24.6; p.poly(P, [x - w / 2 - 0.4, y, x + w / 2 + 0.4, y - 0.6, x + w / 2 + 0.4, y + 1.2, x - w / 2 - 0.4, y + 1.8]); p.snap(Ph, x + w / 2 - 1, y - 0.2, 1, 0.8); }
    boot(58.6, 84.4, 69.4, 96.4, 1);
    if (c.staff) {
      seg(p, E, 46, 23, 41, 25.6, 5.2, 4.6); seg(p, A, 46, 23, 41, 25.6, 3.8, 3.4); seg(p, E, 41, 25.6, 36.4, 24.4, 4.4, 4); seg(p, Ad, 41, 25.6, 36.4, 24.4, 3.2, 2.8);
      p.poly(P, [39.6, 23.4, 41.4, 23.6, 41.6, 27.4, 39.6, 27.2]);
      seg(p, E, 25.4, 11.2, 77.4, 78.4, 3.2); seg(p, '#26222a', 25.4, 11.2, 77.4, 78.4, 2.2); seg(p, Bth, 25, 11.4, 77, 78.6, 0.6);
      for (const t of [0.12, 0.3, 0.76]) { const x = 25.4 + 52 * t, y = 11.2 + 67.2 * t; p.snap(Au, x - 0.7, y - 0.7, 1.4, 1.4); }
      for (const [x1, y1, w] of [[13.6, 1.2, 3.8], [11.4, 10.4, 3.2], [25.6, 0.2, 3.4], [31.4, 4.6, 2.8], [16.4, 15.6, 2.6]]) kite(22.6, 8.4, x1, y1, w, '#fff0b4', '#f0b040', 0.3);
      p.ell(E, 22.6, 8.4, 3.6, 3.6); p.ell('#7a1420', 22.6, 8.4, 2.8, 2.8); p.ell('#e83a3a', 22, 7.8, 1.4, 1.4);
      kite(76, 76.8, 80.6, 81.6, 2.6, Bth, Bt, 0.4); kite(76.4, 79.4, 73.6, 82.6, 2, Bth, Bt, 0.4); p.snap(Au, 76.6, 77.6, 1, 1);
      p.ell(E, 36, 24.2, 2.6, 2.4); p.ell(Ad, 36, 24.2, 1.9, 1.7); p.snap(Ah, 35, 23.2, 1, 0.8);
    }
    if (c.gun) {
      seg(p, E, 46, 22.4, 40.4, 29.6, 5.2, 4.6); seg(p, A, 46, 22.4, 40.4, 29.6, 3.8, 3.4); seg(p, E, 40.4, 29.6, 41.6, 33.4, 4.4, 4); seg(p, Ad, 40.4, 29.6, 41.6, 33.4, 3.2, 2.8);
      mass([24.6, 30.6, 42, 28.4, 45.4, 31.2, 45, 37.4, 31, 39.6, 25.2, 38.8], K);
      p.poly(Kh, [25.4, 31.4, 42, 29.2, 44.4, 31.6, 26, 33.4]); p.poly(E, [36, 37.8, 41, 37.2, 41.4, 41.4, 37.6, 41.8]);
      p.rect('#3a2a10', 30.4, 33.4, 8.4, 3.6);
      for (let k = 0; k < 4; k++) { const x = 31 + k * 2; seg(p, Au, x, 33.8, x + 1, 36.6, 0.7); seg(p, Au, x + 1, 36.6, x + 2, 33.8, 0.7); }
      p.poly('#fff0b4', [25.6, 31.8, 27.8, 31.4, 28.2, 38.4, 26, 38.6]); p.poly('#f0b040', [26.6, 31.6, 27.8, 31.4, 28.2, 38.4, 27, 38.6]);
      seg(p, Au, 29, 30.6, 42, 29, 0.6); p.snap(Au, 42.4, 31.4, 1.4, 1.4);
      p.ell(E, 42, 33.6, 2.6, 2.4); p.ell(Ad, 42, 33.6, 1.9, 1.7);
    }
    mass([49.6, 21, 54, 18, 60, 17.6, 64.4, 21, 65, 27.6, 61.6, 31.4, 54, 31, 50, 27], A);
    p.poly(Ah, [49.6, 21, 54, 18, 60, 17.6, 58.6, 21.6, 52.4, 25.4]); p.poly(Ad, [58.6, 21.6, 64.4, 21, 65, 27.6, 61.6, 31.4, 58.4, 27]);
    seg(p, E, 52.4, 25.4, 58.6, 21.6, 0.5); seg(p, E, 58.6, 21.6, 58.4, 27, 0.5);
    seg(p, Au, 51.6, 29.4, 61, 31.2, 0.8); p.poly(P, [63.6, 22.4, 65, 22.6, 65, 27.4, 63.6, 27.6]); p.snap(Ph, 63.8, 24, 1, 1);
    if (c.staff) {
      seg(p, E, 58.4, 29.6, 56.6, 39.4, 5, 4.4); seg(p, A, 58.4, 29.6, 56.6, 39.4, 3.6, 3.2); seg(p, E, 56.6, 39.4, 54.6, 46.4, 4.4, 4); seg(p, Ad, 56.6, 39.4, 54.6, 46.4, 3.2, 2.8);
      p.poly(P, [55.4, 37.6, 58.4, 38, 58.2, 39.6, 55.2, 39.2]);
      p.ell(E, 54.4, 47.4, 2.8, 2.6); p.ell(Ad, 54.4, 47.4, 2.1, 1.9); p.snap(Ah, 53.4, 46.4, 1, 0.8);
    }
    if (c.gun) {
      seg(p, E, 58.4, 29.6, 55.4, 35.4, 5, 4.4); seg(p, A, 58.4, 29.6, 55.4, 35.4, 3.6, 3.2); seg(p, E, 55.4, 35.4, 48, 36.2, 4.4, 4); seg(p, Ad, 55.4, 35.4, 48, 36.2, 3.2, 2.8);
      p.poly(P, [52.6, 34.4, 54.2, 34.4, 54.4, 37.6, 52.8, 37.6]);
      p.ell(E, 47, 36.4, 2.6, 2.4); p.ell(Ad, 47, 36.4, 1.9, 1.7);
    }
    p.poly(E, [45.6, 16, 52.8, 15.6, 53.6, 19.6, 46.4, 20.2]); p.poly(K, [46.2, 16.6, 52.2, 16.2, 52.8, 19, 47, 19.4]);
    mass([44.6, 11.6, 53.2, 11.4, 53.4, 15.6, 50.4, 18.6, 46.6, 18.2, 44.4, 15], F);
    p.poly(Fs, [44.6, 11.6, 53.2, 11.4, 53.2, 13.6, 44.6, 13.8]); p.poly(Fs, [50.4, 14, 53.4, 15.6, 50.4, 18.6, 49.6, 15.6]);
    mass([42.4, 5, 47, 3.4, 53.6, 3.6, 56.2, 5.4, 55.8, 11, 43.4, 11.6], N); p.poly(Nh, [43, 5.2, 47, 3.8, 53.4, 4, 55.6, 5.6, 47, 6.6]);
    mass([40.2, 10.6, 50.4, 10, 49.2, 13, 41.4, 13.6], N); p.poly(Nh, [40.8, 10.8, 50, 10.4, 49.8, 11.4, 41.2, 11.8]);
    p.ell(Au, 46.6, 8.2, 1.6, 1.3); p.ell(N, 46.6, 8.6, 0.9, 0.7);
  }

  const ART = {
    reaver(p) {
      const A = '#3c3d4e', Ah = '#686c84', Al = '#a2a6bc', Ad = '#24242e', K = '#111117', Pu = '#48288e', Puh = '#7448cc', Au = '#ffc44a', Cl = '#d8dae4', Cs = '#8e90a2';
      voidBlade(p, 68, 4, 36, 9, 2, 28, 6, -1);
      seg(p, Pu, 54, 50, 66, 68, 8, 6);
      seg(p, A, 56, 50, 68, 67, 7, 6); seg(p, Ad, 68, 67, 78, 87, 6.4, 5); p.poly(Ah, [64, 62, 72, 64, 70, 72, 64, 70]);
      curve(p, Au, bez(56, 54, 63, 60, 67, 70, 6), 1.5, 1.5); curve(p, Au, bez(66, 71, 72, 78, 76, 86, 6), 1.5, 1.2); curve(p, Au, bez(59, 52, 66, 57, 70, 66, 6), 1.2, 1.2);
      p.poly(K, [72, 84, 81, 84, 83, 91, 92, 94, 92, 97, 71, 97, 72, 91]); p.poly(Ad, [73, 85, 80, 85, 81, 91, 73, 92]); p.poly(K, [80, 80, 85, 76, 83, 86]);
      p.poly(Pu, [41, 43, 59, 42, 61, 55, 53, 60, 46, 58, 39, 54]); p.poly(Puh, [43, 45, 50, 44, 48, 56, 42, 53]);
      seg(p, A, 46, 49, 28, 59, 10, 8); p.poly(Ah, [44, 45, 33, 51, 29, 55, 40, 53]);
      shard(p, Ah, Al, 38, 47, 8, -2.5, 2.6);
      seg(p, Ad, 28, 59, 22, 85, 7.4, 5.6); p.poly(Ah, [24, 55, 31, 56, 30, 64, 23, 63]); shard(p, Ah, Al, 26, 58, 9, -2.6, 2.6);
      p.poly(K, [17, 84, 27, 84, 28, 97, 8, 97, 8, 94, 16, 91]); p.poly(Ad, [19, 85, 26, 85, 26, 92, 19, 92]); shard(p, K, null, 25, 86, 7, -0.6, 2);
      p.poly(A, [37, 27, 61, 24, 63, 35, 59, 45, 45, 47, 38, 40]);
      p.poly(Ah, [38, 28, 50, 26, 48, 44, 44, 46, 39, 40]); p.poly(Ad, [57, 27, 61, 24, 63, 35, 59, 45, 55, 46]);
      curve(p, Au, bez(40, 31, 47, 33, 54, 41, 6), 1.6, 1.4); curve(p, Au, bez(42, 36, 48, 38, 52, 45, 6), 1.4, 1.2); curve(p, Au, bez(46, 28, 53, 30, 58, 37, 6), 1.2, 1);
      p.poly(A, [56, 22, 67, 21, 71, 29, 67, 36, 58, 33]); p.poly(Ah, [57, 22, 66, 21, 68, 26, 58, 27]); p.poly(Al, [58, 22, 64, 21.4, 65, 23, 58, 24]);
      p.ell(Ah, 39, 29, 5, 4); p.ell(Al, 38, 27.6, 3, 1.6);
      seg(p, A, 39, 30, 32, 23, 5.6, 4.6); seg(p, Ah, 32, 23, 31, 15, 4.6, 4); p.ell(Ad, 31, 15, 3, 2.6); p.snap(Cl, 29, 13.4, 1.6, 1.2); p.snap(Cl, 32, 13, 1.6, 1.2);
      p.rect(Ad, 43, 21, 7, 6);
      p.poly(A, [39, 22, 38, 14, 42, 8, 47, 5, 52, 9, 55, 16, 54, 23, 49, 29, 44, 30, 40, 27]);
      p.poly(Ah, [39, 14, 42, 8.6, 46.6, 6, 44, 13, 40, 18]);
      p.poly(Ah, [40, 12, 35, 0, 37, 0, 44, 9]); p.poly(Al, [39.4, 10, 35.6, 0.6, 36.6, 0.6, 41.4, 9]);
      p.poly(A, [49, 10, 55, 2, 56, 3, 53, 13]); p.poly(Ah, [50, 9.6, 54.6, 3, 55, 4, 51.6, 11]);
      p.poly(Ah, [41, 15, 51, 13, 53, 21, 48, 28, 43, 28, 40, 23]);
      p.poly(K, [42, 17.4, 50.2, 16.2, 50.6, 19.6, 46, 22.6, 42.4, 20.6]);
      seg(p, Au, 42.6, 21.8, 46, 24, 1.2); seg(p, Au, 46, 24, 50.8, 20.6, 1.2);
      seg(p, Al, 46.4, 24.2, 46.6, 27.6, 1);
      p.snap('#ffe060', 43.2, 18.2, 1.6, 1.4); p.snap('#ffe060', 47, 17.8, 1.6, 1.4);
      seg(p, A, 65, 31, 68, 43, 6, 5); seg(p, Ah, 68, 43, 60, 53, 5, 4.4);
      voidBlade(p, 97, 29, 70, 50, 22, 75, 6, -1);
      p.ell(Ad, 59, 55, 3.2, 3); p.poly(Cl, [55, 52, 61, 51, 62, 54, 59, 58, 55, 57]); p.poly(Cs, [55, 56, 59, 57, 58, 59, 55, 58]);
      for (const x of [55.4, 57.6, 59.8]) p.snap(Cl, x, 57.6, 1, 2);
    },
    eliminator(p) {
      const A = '#45475e', Ah = '#767a96', Al = '#a8acc6', Ad = '#25252f', K = '#111117', Pu = '#4a2a8e', Puh = '#7046c4', Au = '#ffc84a';
      const Bg = '#666a86', Bgh = '#9a9eba', Bl = '#5a6ee4', Blh = '#a4b6ff', Bd = '#2a2c9c', Cl = '#d8dae4';
      seg(p, A, 55, 40, 57, 62, 8, 6.6); seg(p, A, 57, 62, 55, 87, 6, 4.6); p.poly(Ah, [53.6, 58, 59, 58, 58.6, 66, 54, 66]); p.poly(Ad, [57, 66, 59.6, 66, 58, 86, 56.6, 86]);
      curve(p, Au, bez(57.4, 66, 58, 75, 55.6, 85, 6), 1.3, 1.1);
      p.poly(K, [52, 86, 58, 86, 59, 92, 62, 95, 62, 97, 51, 97]);
      seg(p, A, 46, 40, 39, 62, 8, 6.6); p.poly(Ah, [42, 44, 47, 46, 42, 58, 38, 56]); shard(p, Ah, Al, 39, 61, 8, -2.7, 2.6);
      seg(p, A, 39, 62, 37, 87, 6, 4.6); p.poly(Ad, [39.6, 66, 41.4, 66, 40, 86, 38.6, 86]); curve(p, Au, bez(39.4, 66, 40, 75, 38.4, 85, 6), 1.2, 1);
      p.poly(K, [33.6, 86, 40, 86, 40, 97, 29, 97, 29, 95, 34, 92]); shard(p, K, null, 39.6, 89, 6, 0.2, 1.8);
      p.poly(Pu, [41, 30, 60, 30, 62, 41, 52, 44, 41, 41]); p.poly(Puh, [42, 31, 50, 31, 48, 42, 42, 40]);
      p.poly(A, [41, 31, 60, 30, 60, 33, 41, 34]);
      p.poly(A, [45, 20, 60, 19, 61, 29, 58, 32, 47, 32, 44, 27]);
      p.poly(Ah, [45.6, 20.6, 52, 20, 50, 31, 47, 31, 44.6, 26.6]);
      curve(p, Au, bez(46.6, 23, 51, 25, 53, 31, 6), 1.3, 1.1); curve(p, Au, bez(54, 20, 56, 24, 56.4, 31, 6), 1.2, 1);
      p.ell(Ah, 44, 22, 4, 3.4); p.ell(Al, 43.4, 20.8, 2.4, 1.2);
      seg(p, A, 43, 23, 39, 31, 5, 4.4); seg(p, Ah, 39, 31, 36, 36, 4.4, 4);
      seg(p, A, 62, 25, 64, 35, 5, 4.4); seg(p, Ah, 64, 35, 58, 43, 4.4, 4);
      p.poly(A, [57, 18, 66, 13, 71, 19, 68, 27, 59, 26]); p.poly(Ah, [58, 18, 66, 13.4, 69, 18, 59, 21]); p.poly(Al, [59, 18, 65.4, 14.2, 66, 15.6, 59.4, 19.4]);
      shard(p, A, Ah, 66, 15, 7, -0.9, 2.4);
      p.rect(Ad, 46, 18, 7, 4);
      p.poly(A, [44, 10, 42.6, 3.6, 46.6, 0, 54, 0, 60, 3.4, 62, 9, 60, 14, 58.6, 8, 55, 4.6, 50, 4, 47.4, 6, 48.4, 10]);
      p.poly(Ah, [43.4, 6, 46.6, 0.8, 54, 0.8, 59.6, 4, 61.4, 8, 58.4, 5.4, 54, 2.8, 48, 2.6, 45.4, 5]);
      p.poly(A, [43, 18, 43, 10, 47, 6.6, 53, 7.6, 56, 13, 55, 20, 51, 24, 46, 24]);
      p.poly(Ah, [43.6, 11, 47, 7.4, 50, 8, 46, 13, 44, 16]);
      p.poly(Ah, [43, 12, 36, 15, 43, 17]);
      p.poly(K, [44, 13, 52, 12, 51.4, 18, 46.4, 19.4]);
      p.snap('#ffe060', 45.6, 14.2, 1.8, 1.4);
      seg(p, Au, 52.8, 8, 52.6, 21, 1.2); seg(p, Au, 52.6, 21, 54, 24, 1.1);
      p.poly(Ad, [18, 31, 25, 34, 30, 36, 34, 35, 34, 42, 29, 42, 23, 45, 17, 44, 23, 41, 26, 39, 23, 36]); p.poly(Bg, [20, 32, 25, 34.6, 29, 37, 25, 37.4]);
      p.poly(Bl, [40, 45, 56, 52, 70, 59, 78, 67, 63, 71, 50, 65, 37, 54]);
      shard(p, Bl, Blh, 54, 60, 16, 0.75, 3); shard(p, Bd, null, 48, 58, 12, 1.05, 2.6); shard(p, Bl, Blh, 62, 62, 14, 0.5, 2.6);
      p.poly(Bg, [32, 34, 44, 36, 58, 44, 70, 55, 76, 64, 66, 64, 54, 60, 42, 52, 33, 45]);
      p.poly(Bgh, [32, 34, 44, 36, 58, 44, 70, 55, 72, 58, 57, 47, 43, 39, 33, 37]);
      p.poly(Bd, [43, 47, 57, 52, 68, 60, 61, 61, 48, 54]);
      curve(p, Au, bez(34, 38, 50, 41, 67, 56, 8), 1.3, 1.1); curve(p, Au, bez(36, 42.4, 50, 49, 62, 60, 8), 1.2, 1);
      p.ell(Ad, 36, 37, 2.8, 2.6);
      p.ell(Ad, 58, 43, 2.8, 2.6); p.poly(Cl, [55, 41, 60, 40.4, 61, 43, 58.6, 46, 55, 45]);
    },
    trampler(p) {
      const N = '#2e2c56', Nh = '#4c4a86', Nd = '#17152e', W = '#e2e2ee', Ws = '#a8a8c6', Wd = '#76769c', G = '#78f08a', Gh = '#e4ffe8', Bl = '#8a8aff';
      seg(p, Nd, 66, 60, 71, 76, 5, 3.6); seg(p, Nd, 71, 76, 68, 91, 3.4, 2.6); p.poly(Nd, [65, 90, 70, 90, 71, 95, 63, 95]);
      seg(p, Nd, 44, 62, 46, 79, 5, 4); seg(p, Nd, 46, 79, 45, 93, 4, 3); p.poly(Nd, [42, 92, 47, 92, 48, 97, 40, 97]);
      p.poly(N, [42, 46, 56, 42, 70, 43, 80, 50, 79, 61, 70, 66, 52, 64, 42, 57]);
      p.poly(N, [70, 50, 80, 50, 83, 60, 79, 67, 72, 66]);
      seg(p, N, 76, 63, 80, 76, 5.4, 3.8); seg(p, Nd, 80, 76, 78, 91, 3.6, 2.8); p.poly(Nd, [75, 89, 80, 89, 81, 95, 73, 95]);
      shard(p, W, Ws, 79, 73, 7, 0.5, 1.8);
      p.poly(W, [46, 44, 58, 40, 72, 42, 70, 47, 58, 45, 47, 49]); p.poly(Ws, [47, 49, 58, 45, 70, 47, 69, 49, 58, 48, 48, 52]);
      p.poly(W, [52, 52, 66, 49, 68, 54, 54, 57]); p.poly(Wd, [54, 57, 68, 54, 67, 57, 56, 59]);
      p.poly(W, [66, 48, 77, 47, 83, 53, 77, 56, 67, 53]); p.poly(Wd, [67, 53, 77, 56, 83, 53, 81, 57, 70, 58]);
      p.poly(W, [44, 56, 52, 58, 50, 63, 43, 60]);
      shard(p, W, Ws, 62, 43, 9, -1.3, 2.6); shard(p, W, Ws, 70, 44, 9, -0.9, 2.6); shard(p, W, Ws, 77, 48, 8, -0.4, 2.4);
      p.ell(Nd, 74, 58, 3, 4.6, -0.3); p.ell(G, 74, 58, 2, 3.6, -0.3); p.ell(Gh, 73.4, 57, 0.8, 1.6, -0.3);
      p.poly(N, [31, 42, 32, 28, 37, 20, 45, 19, 50, 26, 51, 42]);
      p.poly(Nh, [32.6, 30, 37, 22, 40, 22, 36, 32]);
      p.poly(W, [34, 25, 46, 21, 50, 25, 36, 29.6]); p.poly(Ws, [36, 29.6, 50, 25, 49.4, 27.6, 37, 32]);
      p.poly(W, [30.6, 31, 47, 27, 51.6, 32, 33, 36.4]); p.poly(Ws, [33, 36.4, 51.6, 32, 51, 34.6, 34, 38.6]);
      p.poly(W, [44, 21, 49, 20, 52, 26, 49, 27]);
      p.rect(N, 37, 16, 6, 5);
      p.poly(N, [34.6, 15, 35.6, 9.6, 40, 7, 44, 10.6, 43.4, 17.4, 38, 19.6]);
      p.poly(W, [36.4, 11.6, 40.6, 9, 41.8, 14.6, 38, 16.8]); p.poly(Ws, [38, 16.8, 41.8, 14.6, 42, 16, 38.6, 18]);
      p.snap(Bl, 37.4, 12.6, 1.8, 1.4);
      p.poly(N, [35.4, 10.6, 30, 0, 32.6, 0, 39, 8.6]); p.poly(W, [34.6, 8, 31, 0.8, 32.2, 0.8, 36.6, 8.4]);
      p.poly(N, [41, 9, 48.4, 0.6, 51, 2, 43.6, 11.6]); p.poly(W, [42.4, 8.8, 48.6, 1.8, 49.8, 2.6, 43.6, 10.2]);
      p.poly(N, [31, 40, 51, 36, 51, 46, 31, 46]);
      p.poly(W, [20, 62, 21, 50, 29, 42, 42, 41, 51, 47, 51, 58, 41, 66, 28, 67]);
      p.poly(Ws, [28, 66, 41, 65, 51, 57, 51, 61, 42, 68, 29, 69]);
      for (const [x0, y0, x1, y1] of [[24, 52, 36, 61], [30, 44, 40, 59], [38, 42, 44, 57], [46, 47, 46, 58], [22, 58, 34, 64]]) seg(p, Wd, x0, y0, x1, y1, 1.4, 0.8);
      shard(p, W, Ws, 27, 55, 15, -2.6, 3.6); shard(p, W, Ws, 30, 50, 17, -2.15, 4); shard(p, W, Ws, 27, 47, 12, -1.9, 3);
      shard(p, W, Ws, 47, 48, 10, -1.0, 2.6); shard(p, Ws, null, 23, 60, 12, 2.9, 3);
      p.ell(Bl, 47, 54, 2.2, 2.6); p.ell('#d8d8ff', 46.6, 53.4, 0.9, 1.2);
      p.poly(N, [28, 64, 41, 64, 39, 79, 35.4, 96, 33, 96, 30, 79]);
      p.poly(W, [28.4, 64.6, 40.6, 64.6, 39.4, 71, 29.6, 72.6]);
      p.poly(Nh, [30.6, 74, 33, 74, 33.4, 92, 32.4, 92]);
      shard(p, W, null, 39, 70, 8, 0.6, 2);
      p.ell(Nd, 34, 81, 2.6, 5, 0.12); p.ell(G, 34, 81, 1.7, 4, 0.12); p.ell(Gh, 33.6, 79.6, 0.7, 1.6, 0.12);
      p.poly(Nd, [31, 91, 37.4, 91, 37, 97, 30, 97]);
    },
    flamespawn(p, f) { spawn(p, f, 'fire'); },
    frostspawn(p, f) { spawn(p, f, 'ice'); },
    thunderspawn(p, f) { spawn(p, f, 'elec'); },
    windspawn(p, f) { spawn(p, f, 'wind'); },
    baryon(p, f) { baryonArt(p, f, { P: '#e2e2ee', Ph: '#ffffff', Ps: '#9a9ab8', V: '#24249a', Vh: '#4646d4', C: '#141458', Cs: '#3030ac' }); },
    antibaryon(p, f) { baryonArt(p, f, { P: '#5c5e6e', Ph: '#8e90a4', Ps: '#2e303c', V: '#1e1e6e', Vh: '#3838ac', C: '#12124a', Cs: '#3232a4', glow: '#ffe060', horn: true }); },
    beetle(p) {
      const { K, Kh, Kl, Kd, B, Bh, Bs, Bd } = AUTO, Pl = '#c4cbef', Rim = '#d0d2d8';
      autoLeg(p, [[68, 63], [76, 61.6], [84, 62]], [[1.15, 11, 3, 1], [0.55, 8, 2.2, 0]]);
      autoDome(p, 53, 66);
      autoLeg(p, [[39, 64], [30.6, 66.4], [22, 67]], [[1.95, 13, 3, 1], [2.45, 9.6, 2.4, 0]]);
      p.poly(B, [34, 15, 74, 15, 74.4, 56, 68, 60, 40, 60, 34, 56]);
      p.poly(Bs, [67, 15, 74, 15, 74.4, 56, 68, 60, 67, 58]); p.poly(Bh, [57.6, 17, 60, 17, 60, 57, 57.6, 58]);
      p.poly(Pl, [64, 43.6, 74.2, 43.6, 74.4, 55, 68.6, 58.6, 64.6, 54]); p.poly('#e2e6fa', [65, 44.4, 69, 44.4, 66.4, 50, 65.2, 48]);
      seg(p, Bd, 67, 16, 67, 58, 0.8); p.snap(Bd, 61, 26, 1.2, 1.2); p.snap(Bd, 70.6, 36, 1.2, 1.2);
      p.poly(K, [24, 8, 30, 3, 72, 3, 77, 8, 77, 17.4, 30, 18.4, 24, 15]);
      p.poly(Kh, [30, 3, 72, 3, 77, 8, 30.6, 8.8]); for (const x of [38, 47, 56, 65]) p.rect(Kd, x, 4.6, 5.6, 1.2);
      p.poly(Kd, [24, 8, 30.6, 8.8, 30, 18.4, 24, 15]); p.rect(Kl, 30.6, 8.8, 46, 1);
      p.ell(Kl, 71.6, 22, 2.6, 2.6); p.ell('#aeb2bc', 71.2, 21.6, 1.6, 1.6); p.rect(Kd, 64, 21, 4, 1.4);
      for (const [y0, y1, cy, L, Lh, Li] of [[18, 36, 27.6, '#ff5a3a', '#ffb898', '#c8281a'], [36, 55.6, 46.4, '#b8ff3a', '#f2ffc0', '#6ab01a']]) {
        p.poly(Kd, [29, y0 - 0.6, 58.4, y0 - 0.6, 58.4, y1 + 0.6, 32, y1 + 0.6, 29, y1 - 4]); p.poly(K, [30, y0, 57.6, y0, 57.6, y1, 33, y1, 30, y1 - 4]); p.rect(Kl, 30, y0, 27.6, 1); seg(p, Kl, 30.4, y0 + 0.6, 30.4, y1 - 4.2, 0.9);
        p.poly(Kh, [52, y0 + 1, 57.6, y0 + 1, 57.6, y1, 52, y1]);
        p.ell(Kd, 42.6, cy, 7.6, 7.6); p.ell(Rim, 42.6, cy, 6.6, 6.6); p.ell(Li, 42.6, cy, 5.4, 5.4); p.ell(L, 42, cy - 0.6, 4.4, 4.4); p.ell(Lh, 40.6, cy - 2, 1.8, 1.6);
        p.poly(Kd, [34, y0 + 1, 52, y0 + 1, 51, y0 + 3.4, 35, y0 + 3.4]);
      }
      autoLeg(p, [[60, 72], [62.4, 80.4]], [[1.5, 13, 3.4, 1], [1.95, 9.4, 2.4, 0], [1.08, 9, 2.2, 0]]);
      autoBulb(p, 42.6, 76);
    },
    hound(p) {
      const B = '#5a74c8', Bh = '#8ca4e8', Bs = '#3e54a0', Bd = '#26346e', K = '#1c1e24', Kh = '#3e424c', Gr = '#9a9ea8', Gl = '#d4d8e0', Y = '#ffe23a', Yh = '#fffbd0';
      p.ell(K, 14.4, 63.4, 7.4, 7.4); p.ell(Gl, 14.4, 63.4, 4.6, 4.6); p.ell(Gr, 14.4, 63.4, 3.4, 3.4); p.ell(K, 14.4, 63.4, 1.6, 1.6);
      curve(p, Bd, bez(5, 61, 13, 46, 36, 49, 10), 5.6, 4.6); curve(p, B, bez(5.4, 60, 13.4, 45.6, 36, 48.4, 10), 4.2, 3.4); curve(p, Bh, bez(6, 58.6, 13.6, 45.4, 35, 47.2, 10), 1.2, 1);
      shard(p, K, null, 6, 60, 6, 2.5, 2.2);
      p.poly(K, [13, 57.4, 23, 55, 21, 64.6]); p.snap(Gr, 17.4, 58.4, 1.2, 1.2); p.snap(Gr, 20, 58, 1.2, 1.2);
      seg(p, K, 22, 57.6, 40, 61, 4.8); seg(p, Kh, 22, 56.2, 40, 59.6, 1.2);
      for (const x of [29, 32]) seg(p, Gl, x, 56.6 + (x - 22) * 0.19, x - 0.6, 61.8 + (x - 22) * 0.19, 1.3);
      p.ell(K, 71, 52.6, 11.4, 11.4); p.ell('#2c2e36', 71, 52.6, 9.4, 9.4);
      p.ell(Bd, 62, 51, 13.6, 12.6); p.ell(B, 61.4, 50.4, 12.6, 11.6); p.ell(Bh, 57, 44, 6, 3.6);
      seg(p, Bd, 36, 51, 41, 59, 6, 5); seg(p, B, 36, 51, 41, 59, 4.6, 3.8); p.ell(B, 41, 59.6, 3, 3);
      p.ell('#5c6068', 64.4, 50, 8.4, 8.4); p.ell(Gr, 64.4, 50, 7, 7); p.ell('#7a7e88', 64.4, 50, 5.2, 5.2);
      for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4 + 0.3; seg(p, Gl, 64.4 + Math.cos(a) * 2.4, 50 + Math.sin(a) * 2.4, 64.4 + Math.cos(a) * 6.6, 50 + Math.sin(a) * 6.6, 1.3, 0.9); }
      p.ell('#4a4e58', 64.4, 50, 2.6, 2.6); p.ell(Gr, 64.4, 50, 1.4, 1.4);
      p.ell(Bd, 66, 38.4, 9, 6.6); p.ell(B, 66, 38, 8.2, 5.8); p.ell(Bh, 63.4, 36, 4, 2.2);
      seg(p, K, 67, 35, 70.6, 27.6, 5.4, 5); p.ell('#7a7e88', 70.6, 27.6, 2.6, 1.4); shard(p, K, null, 70.6, 27.4, 4.6, -1.1, 1.8);
      seg(p, K, 77.6, 55, 94.4, 30, 7.2, 6.6); seg(p, Kh, 76.4, 53.8, 92.8, 29.4, 2, 1.8);
      seg(p, Gl, 77.4, 51.6, 82.6, 55, 1.6); for (const t of [0.42, 0.56, 0.7]) p.snap('#0a0b0e', 77.6 + 16.8 * t - 0.7, 55 - 25 * t - 0.4, 1.4, 1.4);
      shard(p, K, null, 94.4, 30, 5, -0.98, 2.6);
      p.poly(Bd, [42, 40, 60, 42, 61.6, 58, 55, 82, 43, 96, 40, 80, 40.4, 57]);
      p.poly(B, [43, 41, 59, 42.8, 60.6, 58, 54.2, 81, 43.4, 94.4, 41, 80, 41.4, 57]);
      p.poly(Bh, [43.6, 42, 48, 42.4, 45.4, 80, 43.8, 92.6, 41.6, 80, 42.2, 57]); p.poly(Bs, [56, 43, 59, 42.8, 60.6, 58, 54.2, 81, 48, 90, 53, 77]);
      p.snap(Bd, 51, 64, 1.4, 1.4);
      p.ell(K, 50.4, 76.4, 4.8, 4); p.ell(Y, 50.4, 76.4, 3.6, 2.8); p.ell(Yh, 49.6, 75.8, 1.6, 1.2);
      p.poly(K, [45, 37.4, 56.4, 35.6, 58.6, 41.6, 52.6, 46, 45.6, 44]); p.poly(Kh, [46, 38, 55.6, 36.6, 56.6, 38.4, 46.4, 40]);
      p.snap(Y, 53.4, 49, 2, 1.6); p.snap(Yh, 53.8, 49.2, 0.8, 0.8);
    },
    spider(p) {
      const { K, Kh, Kl, Kd } = AUTO, B = '#6276cc', Bh = '#98a8ec', Bs = '#4456a8', Bd = '#28346e', Gl = '#c8ccd4', Y = '#ffc23a', Yd = '#c8820e', Yh = '#ffeaa0';
      autoLeg(p, [[58, 54], [72, 51.6], [84.6, 56.6]], [[1.1, 10, 3, 1], [0.5, 7.6, 2.2, 0]]);
      autoDome(p, 46.6, 62);
      autoLeg(p, [[35, 54], [24, 51.6], [15.6, 56.4]], [[2.05, 10, 3, 1], [2.6, 7.6, 2.2, 0]]);
      p.poly(K, [17, 20, 25, 8, 44, 3.4, 60, 3, 69, 8.6, 70, 22, 20, 26]); p.poly(Kh, [25, 8.4, 44, 4, 60, 3.6, 68.4, 8.8, 60, 6.4, 44, 6.8, 26, 10.6]);
      for (const [x0, x1, y0, y1] of [[46, 63, 9.6, 41.6], [32.4, 49.4, 11, 43], [19, 36, 13, 44.6]]) {
        p.poly(Bd, [x0 + 2, y0, x1 - 2, y0, x1, y0 + 3, x1, y1 - 4, x1 - 3, y1, x0 + 3, y1, x0, y1 - 4, x0, y0 + 3]);
        p.poly(B, [x0 + 2.4, y0 + 0.8, x1 - 2.4, y0 + 0.8, x1 - 0.8, y0 + 3.4, x1 - 0.8, y1 - 4.2, x1 - 3.2, y1 - 0.8, x0 + 3.2, y1 - 0.8, x0 + 0.8, y1 - 4.2, x0 + 0.8, y0 + 3.4]);
        p.poly(Bh, [x0 + 2.4, y0 + 0.8, x1 - 2.4, y0 + 0.8, x1 - 0.8, y0 + 3.4, x1 - 2, y0 + 6, x0 + 2, y0 + 6, x0 + 0.8, y0 + 3.4]); p.poly(Bh, [x0 + 0.8, y0 + 6, x0 + 4.6, y0 + 6, x0 + 3.4, y1 - 9, x0 + 0.8, y1 - 7]);
        p.poly(Bs, [x1 - 4, y0 + 2, x1 - 0.8, y0 + 3.4, x1 - 0.8, y1 - 4.2, x1 - 3.2, y1 - 0.8, x1 - 4, y1 - 1]);
        seg(p, Bd, x0 + 3, (y0 + y1) / 2 + 2, x1 - 3, (y0 + y1) / 2 + 1, 0.8);
        ringBand(p, Kd, (x0 + x1) / 2, y0 + 1.6, 5, 6.4, 2.4, Math.PI, Math.PI * 2); ringBand(p, Gl, (x0 + x1) / 2, y0 + 1.2, 4.6, 6, 1.6, Math.PI, Math.PI * 2);
        const nx = (x0 + x1) / 2 - 1, ny = y1 - 4.6;
        p.ell(Kd, nx, ny, 5.2, 5.2); p.ell(K, nx, ny, 4.6, 4.6); p.ell('#4e525c', nx, ny, 3.2, 3.2); p.ell(Kd, nx, ny, 1.6, 1.6); p.ell(Kl, nx - 1.8, ny - 2, 1, 0.8);
      }
      curve(p, K, bez(19, 45.4, 43, 55, 67, 46.4, 10), 3.6, 3.6); curve(p, Kh, bez(20, 44, 43, 53.4, 66, 45, 10), 0.9, 0.9);
      p.poly(K, [63, 23, 76, 25.6, 79, 30, 78, 44, 67, 48.6, 62, 44]); p.poly(Kh, [64, 23.6, 76, 26, 78.4, 30, 66, 28]);
      p.snap(Kd, 74, 33, 1.6, 1.6); p.snap(Kd, 74.6, 38.4, 1.6, 1.6);
      p.ell(Yd, 68.4, 36, 4.4, 6.4); p.ell(Y, 68, 35.6, 3.6, 5.6); p.ell(Yh, 67.2, 33.4, 1.3, 2.2);
      autoLeg(p, [[53, 64], [56.4, 72.4]], [[1.5, 13, 3.4, 1], [1.95, 9.4, 2.4, 0], [1.08, 9, 2.2, 0]]);
      autoBulb(p, 38.4, 70.6);
    },
    direwolf(p) { wolfArt(p, {}); },
    soldier(p) { halberdier(p, {}); },
    gunner(p) {
      const { J, Jl, K, Kh, W, Ws, Wd } = GUARD, M = '#7a2a26', Mh = '#a8443a', Md = '#4a1614';
      guardBody(p);
      seg(p, K, 40, 29.6, 37, 39.6, 5, 4.4); seg(p, K, 37, 39.6, 33, 46, 4.4, 3.8); p.ell(K, 37, 39.6, 2.6, 2.6);
      guardHead(p, 'cap');
      p.poly(Md, [57, 41.4, 66.4, 43.4, 67.6, 52, 60.6, 50.6]); p.poly(M, [57.6, 42, 65.8, 43.8, 66.8, 51, 60.8, 49.8]); p.rect(K, 64.6, 43.6, 2.6, 8);
      p.poly(Md, [33, 43, 59, 41.4, 60.6, 49.4, 35, 51]); p.poly(M, [33.6, 43.6, 58.4, 42, 59.8, 48.6, 35.4, 50.2]); p.poly(Mh, [34, 43.8, 58, 42.4, 58.2, 44, 34.2, 45.4]);
      seg(p, K, 24, 43.4, 57, 41.2, 2.2); p.poly(K, [46, 49.4, 51, 49, 50.4, 55, 46.6, 55.4]);
      seg(p, K, 13, 45.2, 36, 44.4, 3); seg(p, Kh, 13, 44.2, 36, 43.4, 0.8); seg(p, K, 13, 50, 36, 49.2, 3); seg(p, Kh, 13, 49, 36, 48.2, 0.8);
      p.poly(K, [8.6, 42.6, 15, 42.4, 15.4, 52.6, 9, 52.8]); p.poly(Kh, [9.2, 43.2, 14.4, 43, 14.4, 44.4, 9.2, 44.6]); p.snap('#0a0a0e', 9.6, 45, 1.6, 1.6); p.snap('#0a0a0e', 9.6, 49.4, 1.6, 1.6);
      seg(p, J, 60, 29.4, 64.4, 41, 5, 4.4); seg(p, Jl, 61.6, 30, 65, 39.6, 0.7); p.ell(W, 64.4, 41.6, 3.2, 3); p.ell(Ws, 65.2, 42.4, 1.8, 1.6);
      seg(p, W, 64, 42.6, 56.4, 46, 4.2, 3.6); seg(p, Ws, 64.4, 44, 57, 47, 1.2); p.rect(K, 56, 43.2, 2.8, 5); p.rect(J, 56.6, 43.8, 1.2, 3.8);
      p.ell(Wd, 53.4, 46.4, 2.8, 2.6); p.ell(W, 53.2, 46, 2.3, 2.1); p.snap(Ws, 52, 46.6, 3, 1);
      p.ell(Wd, 32.4, 47.6, 2.8, 2.6); p.ell(W, 32.2, 47.2, 2.3, 2.1); p.snap(Ws, 31, 47.8, 3, 1);
    },
    cannoneer(p) {
      const { J, Jh, Jl, K, Kh, W, Ws, Wd } = GUARD, C = '#4a4e5c', Ch = '#6e7486', Cd = '#2a2d36', Wo = '#7a4e2c', Wod = '#4e321c', Lt = '#6a4a2c', Ltl = '#9a7048', Au = '#d8a850', R = '#b82a30';
      const fur = (x, y, rx, ry) => { p.ell(Ws, x, y + 0.8, rx, ry); for (const [dx, dy, k] of [[-0.45, -0.1, 0.55], [0.1, -0.35, 0.6], [0.45, 0, 0.5]]) p.ell(W, x + dx * rx, y + dy * ry, rx * k, ry * k * 1.1); };
      guardBody(p);
      seg(p, Lt, 42.4, 27.6, 58.6, 49.4, 2.6); seg(p, Ltl, 42.6, 27, 58.8, 48.8, 0.8); p.ell(Au, 58.2, 31, 1.8, 1.8);
      seg(p, J, 39.4, 30, 35.6, 41, 5, 4.4); seg(p, Jl, 38, 30.6, 34.6, 40, 0.7); seg(p, J, 35.6, 41, 38.4, 48.4, 4.4, 4);
      seg(p, J, 60.6, 30, 64.6, 41.6, 5, 4.4); p.poly(R, [61.4, 34.4, 66, 33.6, 66.8, 38.4, 62.4, 39.2]); p.snap(Au, 63, 35.6, 1, 1); p.snap(Au, 64.8, 35.4, 1, 1);
      seg(p, J, 64.6, 41.6, 61, 50.6, 4.4, 4);
      guardHead(p, 'tall');
      fur(38.6, 28.4, 6.4, 4.6); fur(61.4, 28.4, 6.4, 4.6);
      p.poly(Wod, [17.4, 42.4, 22, 41.6, 23.4, 53.6, 18.6, 54.4]); p.poly(Wo, [21, 41.8, 40, 45, 41, 53, 22.6, 53.4]); p.poly('#a06a3e', [22, 42.6, 39.6, 45.6, 39.8, 47.4, 22.2, 44.6]);
      p.poly(K, [37, 44, 48, 45, 49.4, 58, 38.4, 58]); p.ell(Kh, 41.6, 49.4, 2.4, 2.4); p.ell(K, 41.6, 49.4, 1, 1);
      seg(p, '#c8ccd4', 54, 66.6, 79, 77, 5, 4.4); seg(p, '#e8eaf0', 54, 65.4, 79, 75.8, 1.4); p.ell('#9ea2ae', 79.6, 77.4, 2.6, 2.8); p.ell('#e8eaf0', 79.4, 77, 1.6, 1.8);
      seg(p, Cd, 44, 52, 82, 68, 15, 14); seg(p, C, 44, 51, 82, 67, 13, 12); seg(p, Ch, 45, 47.2, 81, 62.4, 3.6, 3.2);
      for (const t of [0.34, 0.66]) { const x = 44 + 38 * t, y = 51 + 16 * t; seg(p, Ch, x + 2.4, y - 5.8, x - 2.4, y + 5.8, 1.2); }
      seg(p, K, 55, 59, 57.4, 66, 2.4); p.snap(Kh, 52, 49.6, 6, 1.4);
      p.ell(Cd, 83.6, 68.4, 6.4, 7.8, -0.4); p.ell(Ch, 83.4, 68, 5.4, 6.8, -0.4); p.ell(Cd, 84.4, 68.8, 3.8, 5, -0.4); p.ell(K, 85, 69.2, 2.4, 3.4, -0.4);
      fur(38.6, 47.6, 3.6, 2.6); p.ell(Wd, 40.4, 50, 2.6, 2.4); p.ell(W, 40.2, 49.6, 2.1, 1.9);
      fur(61.4, 50.6, 3.6, 2.6); p.ell(Wd, 59.6, 53, 2.6, 2.4); p.ell(W, 59.4, 52.6, 2.1, 1.9);
    },
    dunn(p) { ART.lieutenant(p); },
    lieutenant(p) {
      const { K, Kh, W, Ws, Wd } = GUARD, Au = '#d8b860', Aul = '#f0d890', I = '#4aa8f0', Ih = '#c8ecff', Id = '#1e5ec8', Rb = '#d8b878', Rbd = '#a8884c';
      guardBody(p, { J: '#e6e8f0', Jh: '#ffffff', Js: '#a8acbe', Jl: '#cfd2de', P: '#d4d6e0', Ps: '#a0a4b4', vest: false });
      for (const x of [41, 59]) { p.rect('#2f6ad8', x - 3.4, 68.6, 6.8, 2); p.snap(Au, x - 1, 80, 2, 1.6); }
      guardHead(p, 'tallw');
      seg(p, Ws, 40, 29.6, 34.6, 37.6, 5, 4.4); seg(p, W, 34.6, 37.6, 31.6, 33.4, 4.4, 3.8); p.ell(Ws, 34.6, 37.6, 2.6, 2.6);
      const rib = [...bez(27.4, 29.8, 21, 33, 23, 40, 6), ...bez(23, 40, 25, 47, 17, 51, 6).slice(1)];
      curve(p, Rbd, rib, 3, 1.8); curve(p, Rb, rib.map(([x, y]) => [x - 0.3, y - 0.3]), 2, 1.1);
      seg(p, '#3a3c46', 31, 33.6, 18.6, 21, 2.4); seg(p, Au, 27, 29.6, 25, 27.6, 2.8);
      star(p, Id, 16.6, 18.6, 15, 3.8); star(p, I, 16.6, 18.6, 13.4, 3); star(p, Ih, 16.6, 18.6, 6.4, 1.4);
      for (const a of [-0.78, 0.78, 2.36, -2.36]) shard(p, I, Ih, 16.6, 18.6, 9.6, a, 2.2);
      p.ell(Au, 16.6, 18.6, 2.2, 2.2); p.ell(Aul, 16, 18, 0.9, 0.9);
      p.ell(Wd, 31.4, 33, 2.8, 2.6); p.ell(W, 31.2, 32.6, 2.3, 2.1);
      p.poly(Wd, [54, 26, 72, 19, 85, 29, 91, 50, 89, 77, 80, 95, 70, 87, 59, 70, 53, 48]);
      p.poly(W, [55, 27, 72, 20, 84, 30, 89.6, 50, 87.6, 76, 80, 92.6, 71, 85.6, 60.4, 69.6, 54.4, 48]);
      p.poly(Ws, [76, 24, 84, 30, 89.6, 50, 87.6, 76, 80, 92.6, 77, 88, 82, 70, 83, 46]);
      seg(p, Au, 60, 29, 66.4, 54, 2.6, 2); seg(p, Aul, 59.6, 29.2, 65.6, 52, 0.8); seg(p, Au, 70, 25, 76, 46, 2.2, 1.6); seg(p, Au, 57, 58, 71, 84, 1.6);
      seg(p, Ws, 64, 74, 79, 84, 3, 2.4); seg(p, W, 64.6, 73, 79, 83, 1.6, 1.2);
      for (const [x, y, l, a, w] of [[74, 34, 20, -0.9, 4.6], [80, 38, 9, -1.4, 3], [78, 42, 13, -0.4, 4], [76, 46, 10, 0.2, 3.6], [84, 58, 8, -0.6, 3], [80, 56, 12, -0.15, 4.2], [82, 62, 12, 0.25, 4.4], [78, 64, 10, 0.7, 3.6], [68, 76, 9, 2.3, 3], [80, 80, 10, 0.8, 3.4], [72, 80, 12, 1.75, 4], [76, 78, 13, 1.2, 4.2]]) { shard(p, Id, null, x, y, l + 1.2, a, w + 0.8); shard(p, I, Ih, x, y, l, a, w); }
    },
    vagrant(p) {
      const K = '#2c2c34', Kh = '#4e4e5a', Kl = '#84848f', Kd = '#141418', Wo = '#6a3424', Woh = '#8e4e36', T = '#ecedf2', Ts = '#a8aab6';
      const Sk = '#f0c8a8', Sh = '#eeeef2', Shs = '#babcc8', Kk = '#b8a886', Kkh = '#d6caa6', Kks = '#8a7a5a', Br = '#7a4c2e', Brh = '#a06a42', Brd = '#4a2c1a';
      const Hd = '#4a4a54', Fu = '#f2f2f6', Fus = '#c4c4d0', V = '#8a8c78', Vh = '#b4b6a0', Vd = '#4c4e42';
      seg(p, Kk, 52, 49, 55.6, 64, 9, 7.6); seg(p, Kks, 54.6, 50, 57.6, 63, 3, 2.4);
      p.poly(Brd, [51, 62.4, 59.6, 62.2, 60.2, 68.4, 55.6, 70.6, 51.6, 68]);
      p.poly(Br, [52.6, 68.4, 59.4, 68.4, 59.6, 90, 62.4, 92.6, 62.4, 96.4, 52.8, 96.4, 53.2, 88]); p.poly(Brh, [53.2, 69, 55.2, 69, 55, 88, 53.6, 88]);
      p.rect(Brd, 52.8, 95, 9.6, 1.4); for (const y of [71.6, 75]) { seg(p, Kkh, 54.8, y, 57.6, y + 2.2, 0.6); seg(p, Kkh, 57.6, y, 54.8, y + 2.2, 0.6); }
      seg(p, Kk, 44, 49, 34, 60, 10.4, 8.6); seg(p, Kkh, 42, 47, 33.4, 57.4, 2.6, 2); seg(p, Kks, 45, 53, 37, 62, 2.4, 2);
      p.poly(Brd, [29.4, 59.2, 37.8, 58.8, 38, 63.4, 29.6, 63.8]);
      seg(p, Br, 33.6, 63, 31.6, 87, 5.6, 5); seg(p, Brh, 32, 64, 30.4, 85, 1.4, 1.2);
      p.poly(Br, [28.4, 85.4, 34.2, 85.4, 34.8, 91, 24, 91, 24.2, 88.4]); p.rect(Brd, 24, 90, 10.8, 1.4);
      p.poly(Kk, [40.6, 45, 56.4, 44.4, 58, 52, 52, 55.4, 44, 55.4, 40, 51.6]); p.poly(Kks, [52, 44.6, 56.4, 44.4, 58, 52, 52, 55.4, 53, 50]);
      p.poly(Sh, [40.6, 28, 52, 26.6, 56, 31, 55.6, 46.4, 43, 47.2, 41, 38]); p.poly(Shs, [52, 27, 56, 31, 55.6, 46.4, 52.4, 46.6, 53.6, 35]);
      p.poly(Kk, [44, 31, 50.6, 30.4, 52, 47, 45, 47.6]); p.poly(Kkh, [44.4, 31.4, 47, 31.2, 46.4, 47.2, 45, 47.4]);
      seg(p, Br, 46.2, 30.8, 46.8, 42.4, 1.3); p.poly(Kks, [48.4, 40.4, 55, 39.8, 55.4, 45, 48.8, 45.4]); p.snap(Kkh, 49.4, 41.2, 4.6, 0.8);
      seg(p, Sh, 52.4, 29.4, 57.4, 37.6, 5, 4.6); seg(p, Shs, 54.4, 30, 58.6, 37, 1.6);
      p.poly(Kk, [53.4, 33.2, 59.6, 35.4, 58.8, 40.6, 52.8, 38.6]); p.poly(Kks, [53, 37.4, 59, 39.2, 58.8, 40.6, 52.8, 38.6]); p.ell(Kks, 56.2, 37, 0.9, 0.9);
      p.poly(Kk, [42.2, 24.4, 50, 22.6, 53.8, 27, 51.4, 31.6, 44, 30.6]); p.poly(Kkh, [42.6, 24.8, 47.6, 23.6, 46, 28, 43.4, 28.6]);
      p.ell(Hd, 41.6, 19, 6.8, 5.8); p.ell('#6a6a76', 39.4, 16.4, 3, 1.8);
      p.ell(Fus, 35.8, 20.4, 2.6, 3.8); p.ell(Fu, 35.4, 19.8, 2, 3.2); p.ell(Fus, 47.4, 19.6, 2.8, 4); p.ell(Fu, 47, 19, 2.2, 3.4);
      seg(p, Fus, 36, 19, 47.4, 18.2, 2.8); seg(p, Fu, 36, 18.4, 47.4, 17.6, 1.8);
      p.poly(Vd, [34.8, 20, 46.8, 19.2, 47, 25.6, 43.2, 28, 37.4, 27.6, 34.6, 24]);
      p.poly(V, [35.4, 20.4, 46.2, 19.8, 46.4, 25.2, 43, 27.2, 37.8, 26.8, 35.2, 23.8]); p.poly(Vh, [35.6, 20.6, 41, 20.2, 40.4, 22.2, 35.6, 22.6]);
      seg(p, Vd, 36, 23.2, 46.2, 22.6, 1); p.ell(Vd, 45.4, 24.6, 0.9, 0.9); p.snap(Vd, 38.6, 25.4, 5, 0.8);
      seg(p, Sh, 42.4, 29, 34.6, 28.6, 4.8, 4.2); seg(p, Shs, 42.4, 26.8, 34.6, 26.6, 0.9); seg(p, T, 35, 28.6, 30.6, 27.6, 3.8, 3.4);
      for (const x of [31.8, 34]) seg(p, Br, x, 26, x + 0.4, 30, 1);
      seg(p, Kd, 22, 20.6, 61, 68, 3); seg(p, Wo, 22, 20.6, 61, 68, 2); seg(p, Woh, 21.6, 20.4, 60.4, 67.6, 0.6);
      seg(p, T, 34.6, 35.8, 39, 41.2, 2.8); for (const t of [0.34, 0.37, 0.4]) seg(p, Ts, 22 + 39 * t - 1, 20.6 + 47.4 * t + 0.8, 22 + 39 * t + 1, 20.6 + 47.4 * t - 0.8, 0.5);
      p.poly(K, [5.2, 2.2, 8, 1.6, 14.4, 3.4, 18, 7, 21.4, 14, 22.4, 18.4, 20.6, 19.8, 21.8, 25.4, 16.8, 21.8, 15.4, 18.8, 12.4, 18.4, 8.4, 17.8, 7.2, 12, 5.4, 6]);
      p.poly(Kh, [6.6, 3.6, 13.6, 4.6, 17, 8, 19.6, 15, 16, 17.2, 9.6, 16.4, 8.2, 11]); seg(p, Kl, 5.6, 2.4, 14.2, 3.8, 0.8); seg(p, Kl, 8.6, 17.4, 15.4, 18.4, 0.7);
      p.poly(Kd, [10.4, 9.6, 21.6, 6.8, 23.2, 10.6, 12, 13.4]); p.poly(K, [10.6, 9.4, 21.4, 6.6, 22.8, 10, 11.8, 12.8]); p.poly(Kh, [10.6, 9.4, 21.4, 6.6, 21.8, 7.8, 11, 10.6]);
      p.ell(Kl, 18.4, 9.2, 1.3, 1.3); seg(p, Kd, 17.6, 9.8, 19.2, 8.6, 0.4);
      p.poly(K, [16.6, 13.4, 20.2, 12.6, 21.8, 17.4, 18.4, 18.2]); p.snap(Kl, 18.2, 14.4, 0.8, 0.8); p.snap(Kl, 19.2, 16.2, 0.8, 0.8);
      p.poly(Kd, [19.6, 19.2, 23.6, 17.8, 25, 21.8, 21, 23.2]); p.poly(Kh, [20, 19.4, 23.4, 18.2, 23.8, 19.4, 20.4, 20.6]);
      p.poly(Kd, [58.4, 66, 62.6, 64.6, 63.8, 69.2, 59.6, 70.6]);
      seg(p, K, 60.4, 69, 67.4, 87.4, 3.2, 2.6); seg(p, K, 62.4, 68.6, 75.6, 81.6, 3, 2.4); seg(p, Kh, 60.4, 69.6, 66.4, 85.4, 0.8);
      p.poly(K, [65.4, 86.6, 79.2, 78.6, 80.4, 81.6, 67, 90]); p.poly(Kh, [65.6, 86.8, 79.2, 78.8, 79.4, 79.8, 66, 87.8]);
      p.poly(T, [72.4, 82.8, 77.4, 80, 78.6, 82.8, 73.6, 85.6]); for (const x of [74.6, 76.6]) seg(p, Ts, x, 81.4, x + 0.8, 84, 0.5);
      p.ell(Sk, 28.4, 26.6, 2.6, 2.4); p.snap('#c49474', 27, 27.6, 2.4, 0.8);
      seg(p, Sk, 57.8, 39.4, 54.4, 46.6, 4, 3.6); seg(p, T, 56.2, 43.2, 54.8, 46.4, 4); seg(p, Ts, 56.6, 43.4, 55.4, 46.4, 0.6);
      p.poly(Brd, [49, 46.6, 55.8, 46.2, 56.6, 51.8, 52.8, 55.6, 48.6, 53.4]); p.poly(Br, [49.6, 47, 55.2, 46.6, 55.8, 51.4, 52.6, 54.8, 49.2, 52.8]); p.poly(Brh, [49.8, 47.4, 52.6, 47.2, 51.4, 51, 49.6, 50.4]);
    },
    shadewalker(p) {
      const I = '#3a86f0', Ih = '#bce6ff', Id = '#1a46b0', Ic = '#62c8ff';
      halberdier(p, { body: { V: '#b4b8c6', Vh: '#dcdee8' }, head: { K: '#8a8e9c', Kh: '#b8bcc8', Ag: '#d8dce6', Rd: '#2a4ab0' }, arm: I, hand: Ic, handS: Ih, handD: Id, fore: '#3c3e4a', foreS: '#5a5c6a', wood: '#1c2440', woodL: '#3a5ad0', pole: '#3ac8ff', poleL: '#d8f6ff', butt: '#9ae8ff', iron: '#121a30', edge: '#1a3a8a', blade: '#5ab8ff', bladeL: '#d8f4ff', tip: Ih, tipL: '#ffffff', crescent: true });
      shard(p, Id, null, 37.4, 30.6, 9, -2.5, 3); shard(p, I, Ih, 37.4, 30.6, 8, -2.5, 2.2);
      shard(p, Id, null, 61, 31, 19, -1.32, 4.8); shard(p, I, Ih, 61, 31, 18, -1.32, 3.8); shard(p, Id, null, 63.4, 32, 10, -0.7, 3); shard(p, I, Ih, 63.4, 32, 9, -0.7, 2.2);
      shard(p, Id, null, 50, 28.4, 15, -1.95, 4.6); shard(p, I, Ih, 50, 28.4, 14, -1.95, 3.8);
      shard(p, Id, null, 50.6, 28.4, 13, -1.2, 4.2); shard(p, I, Ih, 50.6, 28.4, 12, -1.2, 3.4); shard(p, Ic, null, 50, 27, 6, -1.57, 1.6);
      p.poly(Id, [37, 75, 44.6, 75, 43, 90, 44.6, 96.6, 31.4, 96.6, 36, 90]); p.poly(I, [37.6, 75.6, 44, 75.6, 42.4, 90, 43.6, 95.8, 33, 95.8, 36.8, 90]);
      p.poly(Ih, [37.8, 76, 40, 76, 38.8, 89, 37, 90]); seg(p, Id, 37, 90, 43, 90, 0.7); seg(p, Ic, 38.4, 92.6, 42.6, 93.4, 0.8);
    },
    incinerator(p) {
      const C = '#2e272b', Ch = '#4a4045', Cs = '#1c1619', Cd = '#140f12', O = '#ff7a2a', Oh = '#ffd08a', R = '#d8341c', Ln = '#a8a6c4';
      const pal = { body: { J: C, Jh: Ch, Js: Cs, Jl: Ln, V: '#241e22', Vh: '#3a3236', Hm: '#2f6ad8', Hms: '#1e4a9e', W: '#4a4246', Ws: '#2e2629', P: '#352c30', Ps: '#211a1d' }, hat: null, sleeve: C, sleeveL: Ln, guard: '#4a4246', guardS: '#2e2629', fore: '#3a3438', foreS: '#56505a', cuff: R, arm: R, hand: O, handS: Oh, handD: R, wood: '#2a1c1c', woodL: O, pole: O, poleL: Oh, butt: Oh, iron: '#1a1214', edge: '#6a1008', blade: '#ff5a2a', bladeL: '#ffc890', tip: Oh, tipL: '#ffffff', crescent: true };
      glowing(p, O, 1.3, q => {
        halberdier(q, pal);
        for (const [x0, y0, x1, y1] of [[42, 58, 40, 70], [57, 58, 59.6, 66], [39, 80, 41, 88], [60, 79, 59, 88]]) seg(q, R, x0, y0, x1, y1, 0.8);
        q.poly(C, [43, 26, 40.6, 14, 39.4, 0.4, 47, 10.6, 54, 10, 70.4, 7.2, 60.6, 16.6, 57.4, 26, 50, 31.4]);
        q.poly(Ch, [40.4, 2.6, 45.8, 11.2, 43.8, 14.4, 41.4, 10]); q.poly(Ch, [68.6, 8, 60.4, 15.6, 59, 13.8]); seg(q, Ln, 43.4, 5.4, 46.4, 12, 0.6);
        q.poly(Cd, [45.4, 15.4, 55.2, 14.4, 54.8, 23, 50.2, 28.2, 46, 23.6]); seg(q, Ch, 45.6, 15, 55, 14, 0.8);
      });
    },
    stormbringer(p) {
      const G = '#3e7058', Gh = '#62967c', Gd = '#2a4a40', Gk = '#1a302a', E = '#0d1f18', W = '#d4d8de', Ws = '#9ea4b0', Wd = '#747a88', M = '#62d6a4', Mh = '#bdf2dc';
      const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
      const mass = (pts, col) => glowing(p, E, 0.9, q => q.poly(col, pts));
      const limb = (x0, y0, x1, y1, w0, w1, col) => { seg(p, E, x0, y0, x1, y1, w0 + 1.6, w1 + 1.6); seg(p, col, x0, y0, x1, y1, w0, w1); };
      const band = (pts, w0, w1, col, sh) => { curve(p, E, pts, w0 + 1.4, w1 + 1.2); curve(p, col, pts, w0, w1); if (sh) curve(p, sh, pts.map(([x, y]) => [x + 0.2, y + w0 * 0.3]), w0 * 0.4, w1 * 0.4); };
      const hoof = (x, y, w) => { p.poly(E, [x - w / 2 - 0.4, y - 3.4, x + w / 2 + 0.4, y - 3.4, x + w / 2 + 0.8, y + 0.4, x - w / 2 - 0.8, y + 0.4]); p.poly(Gk, [x - w / 2 + 0.4, y - 2.6, x + w / 2 - 0.4, y - 2.6, x + w / 2, y - 0.4, x - w / 2, y - 0.4]); };
      kite(79.6, 64.8, 96.4, 68.6, 2.8, G, Gd, 0.5);
      limb(76, 62, 77.4, 72, 4.4, 3.2, Gd); limb(77.4, 72, 79, 86, 2.8, 2.4, Gd);
      kite(78.4, 74, 79, 78.4, 1.4, Mh, M, 0.5); kite(75.6, 70, 72.6, 67, 1.4, W, Ws);
      kite(79.4, 83.4, 78.6, 94, 3.8, W, Ws, 0.35); kite(80.4, 85.4, 83.6, 82.2, 1.6, W, Ws); hoof(79, 96.6, 4.4);
      mass([44, 46, 50, 45.6, 56, 45, 61, 44.2, 66, 45, 71, 47.6, 75, 52, 77.6, 58, 80, 63.6, 83.6, 65.4, 80, 67, 74, 66.4, 68, 64.6, 62, 63, 56, 62.4, 50, 61.6, 45, 60, 43, 54], G);
      p.poly(Gd, [45, 57.6, 52, 59.4, 60, 60.4, 68, 62, 74, 64, 80, 65, 83.6, 65.4, 80, 67, 74, 66.4, 68, 64.6, 62, 63, 56, 62.4, 50, 61.6, 45, 60]);
      curve(p, Gh, bez(49, 47.4, 58, 45.4, 66, 47.6, 10), 1.6, 1.1); curve(p, Gh, bez(64, 51, 70, 50.6, 73.4, 56, 8), 1.2, 0.8); kite(46, 58.6, 54, 56, 2.6, Gh, G, 0.5); kite(70.6, 60, 77, 62.6, 2.4, Gh, G, 0.5);
      limb(66, 61, 66.4, 70, 4.4, 3.2, G); limb(66.4, 70, 64.6, 82, 2.8, 2.4, Gd);
      kite(67, 71, 66.4, 75, 1.4, Mh, M, 0.5); kite(65.6, 67.6, 62.6, 64.4, 1.6, W, Ws);
      kite(65.4, 80, 64, 86.6, 3, W, Ws, 0.4); kite(65.6, 81.4, 68.6, 78.6, 1.4, W, Ws); hoof(64, 90.4, 4);
      kite(59.8, 54.2, 71.4, 58.2, 7.2, Gd, Gk, 0.3); kite(60.6, 54.6, 70.4, 57.8, 5.6, Mh, M, 0.3);
      band(bez(56, 46.4, 66, 42.6, 73.6, 50, 10), 3.8, 2.8, W, Ws); band(bez(73.6, 50, 76.4, 54, 75.6, 59, 6), 2.2, 1.2, W, Ws);
      band(bez(56.6, 58.6, 68, 64.6, 80, 66, 10), 3.6, 2.2, W, Ws);
      band(bez(59.4, 49.6, 57.4, 54, 59.8, 58.2, 6), 2, 1.4, W, Ws);
      band(bez(44, 55.6, 50, 51, 55.6, 50.6, 8), 3.4, 2.2, W, Ws); band(bez(51.6, 47.6, 58, 52, 56.4, 60.6, 8), 3, 2, W, Ws);
      kite(44.4, 46, 49, 36.2, 4, W, Ws, 0.35); kite(47.4, 47, 55.6, 37.4, 4, W, Ws, 0.35); kite(51.4, 48.4, 58.4, 38.8, 3.8, W, Ws, 0.35);
      limb(40, 58, 42.6, 68, 4.6, 3.6, G); limb(42.6, 68, 45, 78.6, 3.2, 2.6, Gd);
      p.poly(E, [43.2, 77.4, 46.8, 76.8, 47.2, 80.8, 43.8, 81.2]); p.poly(Gk, [44, 78, 46.2, 77.6, 46.4, 80, 44.4, 80.2]);
      kite(38.4, 66.2, 43.8, 71.4, 2.8, W, Ws, 0.4);
      kite(11.2, 57, 13.6, 30.6, 3, Mh, M, 0.25); kite(11.2, 61.4, 13.6, 88.6, 3, Mh, M, 0.25);
      kite(12.6, 51, 9.6, 67, 3.8, W, Ws, 0.5); kite(11.6, 53.4, 17, 48.6, 1.8, W, Ws); kite(11.4, 65, 16.6, 69.4, 1.8, W, Ws);
      mass([27, 40, 34, 37.4, 41, 39, 43, 45, 41, 54, 37, 62, 33, 70, 29, 72, 25.6, 67, 24.4, 56, 25, 46], G);
      limb(29, 66, 28.4, 82, 5, 4, G); limb(28.4, 82, 28.8, 93, 3.8, 3.2, Gd); hoof(28.8, 96.6, 5);
      kite(29.4, 79.4, 30.6, 90, 4, W, Ws, 0.4); kite(31, 81, 34, 77.4, 1.6, W, Ws);
      kite(28.6, 50, 29.4, 74, 3.2, Mh, M, 0.45);
      kite(36.6, 54.4, 40.4, 56.6, 3, Mh, M, 0.5);
      kite(34.6, 58.6, 44, 64, 3, W, Ws, 0.4);
      kite(26.4, 36.4, 27.8, 62, 6, W, Ws, 0.3); kite(34, 40.4, 24.6, 52.4, 4.6, W, Ws, 0.45);
      kite(39.6, 42.4, 29.4, 66.4, 5.6, W, Ws, 0.4);
      kite(45.6, 40, 27, 60.6, 8, W, Ws, 0.35);
      kite(33, 44.6, 46, 38.6, 5, W, Ws, 0.5);
      kite(41, 38.4, 47.4, 42.6, 2.6, W, Ws);
      kite(30.4, 63, 14, 57.6, 7, W, Ws, 0.35); seg(p, Wd, 28, 61.6, 17, 58.4, 0.7);
      limb(38.4, 35, 38.8, 42, 5.4, 5, G);
      kite(39.6, 22.4, 40.6, 13.6, 2.6, Gh, G, 0.45);
      band(bez(37.2, 20.4, 35.8, 13, 37.8, 6.6, 8), 2.6, 1, W, Ws);
      band(bez(42.6, 20.8, 47.8, 15.4, 45.4, 8.8, 8), 2.6, 1, W, Ws);
      kite(43.6, 23, 49.6, 17, 2.8, W, Ws, 0.4); kite(45, 26, 51, 22.4, 2.4, Ws, Wd, 0.4);
      kite(35, 27, 27, 21.6, 2.6, G, Gd, 0.4); kite(35.4, 25, 25, 17.8, 3.8, W, Ws, 0.45);
      mass([33, 23.6, 37.6, 20.6, 42.6, 20.6, 46.4, 23.6, 46.6, 29.4, 43.4, 34, 38, 36.4, 32.4, 36, 28.4, 34, 27.4, 31.6, 30, 28], G);
      p.poly(Gh, [33, 23.6, 37.6, 20.6, 42.6, 20.6, 40, 23.4, 34.6, 26.4, 31, 28.6]); p.poly(Gd, [46.4, 23.6, 46.6, 29.4, 43.4, 34, 44, 28]);
      p.poly(Gd, [37, 27.4, 40.4, 26.8, 38.6, 30]); p.snap(M, 36.6, 26.6, 1.4, 1);
      band(bez(41.6, 24.4, 49.4, 27, 45.4, 34, 8), 3, 2, W, Ws); kite(43.6, 28.4, 46.2, 31.6, 1.6, G, Gd);
      kite(41.6, 31, 26.6, 33.2, 5.4, W, Ws, 0.6);
      kite(40.6, 34.6, 29, 36.4, 3.2, Ws, Wd, 0.55);
      kite(38.8, 36.4, 40.8, 38.6, 1.8, Mh, M);
    },
    prowler(p) {
      const D = '#2a2a86', Pu = '#7a4ad6', Bl = '#4c5ad8', Cy = '#56d6f0', Lc = '#bff4ff';
      const L = '#5458b0', Lh = '#7a7ed0', Ld = '#33357a', G = '#3a3a42', Gh = '#64646e', Gd = '#1e1e24';
      const O = '#bcecf4', Oh = '#e4fbff', Os = '#8ed0e4', N = '#4a4ea4', Nd = '#2e3070', S = '#b6ecf5', Sl = '#e0fbff', Ss = '#6ac4e2', Sd = '#3e56b0', Am = '#e8883a';
      const ice = (x, y, l, a, w, c) => { shard(p, D, null, x, y, l + 1.2, a, w + 1); shard(p, c, Cy, x, y, l, a, w); };
      const finger = pts => {
        for (let i = 1; i < pts.length; i++) seg(p, Gd, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 2.6);
        for (let i = 1; i < pts.length; i++) seg(p, G, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 1.6);
        for (const [x, y] of pts.slice(1)) p.ell(Gh, x, y, 1.1, 1.1);
      };
      const shield = (outer, inner, cuts) => {
        const pts = [...outer, ...inner].flat();
        p.poly(Sd, pts.map((v, i) => v + (i % 2 ? 0 : 0)));
        p.clipPoly(pts, () => {
          p.poly(S, pts);
          p.poly(Ss, [...outer.slice(3), ...inner.slice(0, 3)].flat());
          p.poly(Sl, [...outer.slice(0, 2), [inner[inner.length - 1][0] - 1, inner[inner.length - 1][1] + 3]].flat());
          for (const [x0, y0, x1, y1] of cuts) seg(p, Sd, x0, y0, x1, y1, 0.9);
        });
      };
      p.poly(D, [79, 56.4, 87.4, 54.6, 93.6, 59.6, 98.4, 70, 97.4, 81.6, 93, 79, 88, 72, 81.6, 65]);
      p.poly(Bl, [80, 57, 87, 55.4, 92.8, 60, 97.6, 70, 96.8, 80.2, 93.2, 77.6, 88.4, 71, 82.4, 64.4]);
      p.poly(Cy, [87, 55.4, 92.8, 60, 97.6, 70, 92.6, 66, 86.4, 59.6]); p.poly(Pu, [82.4, 64.4, 88.4, 71, 93.2, 77.6, 90, 69.6, 84.6, 62.6]);
      seg(p, Lc, 87.4, 55.6, 97.4, 69.8, 0.8);
      p.poly(D, [25.4, 57.6, 13, 60.6, 2.2, 67.6, 0.6, 76.8, 10.4, 75.2, 19.6, 72, 26.4, 67.6]);
      p.poly(Bl, [24.8, 58.4, 13.4, 61.4, 3, 68.2, 1.6, 75.6, 10.2, 74.2, 19, 71.2, 25.6, 67.2]);
      p.poly(Cy, [24.8, 58.4, 13.4, 61.4, 3, 68.2, 12.6, 65.6, 22.6, 62.4]); p.poly(Pu, [12.6, 65.6, 3, 68.2, 1.6, 75.6, 9.6, 71.6]);
      seg(p, Lc, 24.4, 58.6, 3.4, 68.2, 0.8);
      seg(p, Ld, 62, 60, 77, 58.6, 7.4, 6.4); seg(p, L, 62, 59.4, 77, 58, 6, 5.2); p.ell(Ld, 74.4, 57.4, 5.6, 4.8); p.ell(L, 74, 56.8, 5, 4.2); p.ell(Lh, 72.6, 55.4, 2.6, 1.6);
      seg(p, Gd, 76, 61, 84.6, 75.4, 3.2); seg(p, G, 76, 61, 84.6, 75.4, 2); p.ell(Gd, 84.6, 75.6, 2.2, 2.2); p.ell(Gh, 84.6, 75.6, 1.1, 1.1);
      finger([[84.6, 75.6], [88.2, 81.4], [87.6, 88]]); finger([[85.6, 74.6], [91, 78.4], [92.4, 85]]);
      seg(p, Ld, 36, 61, 24, 63.4, 7.4, 6.4); seg(p, L, 36, 60.4, 24, 62.8, 6, 5.2); p.ell(Ld, 30.4, 60.6, 5.4, 4.6); p.ell(L, 30, 60, 4.8, 4); p.ell(Lh, 28.6, 58.8, 2.4, 1.4);
      seg(p, Gd, 24, 64, 18.6, 74, 3.2); seg(p, G, 24, 64, 18.6, 74, 2);
      finger([[15.6, 75.6], [10.6, 77.6], [8.4, 84]]); finger([[16.6, 78], [13.6, 83.6], [12.6, 88.4]]);
      seg(p, Gd, 34, 82, 30.6, 92.4, 5.4, 4.6); seg(p, G, 33.6, 82, 30.4, 91.6, 3.6, 3);
      p.poly(Gd, [25, 91.6, 36, 91.6, 38, 96.8, 22.6, 96.8]); p.poly(G, [25.6, 92.2, 35.4, 92.2, 36.6, 94.6, 24.6, 94.6]); shard(p, Gd, null, 25, 95, 6, 3.0, 1.4);
      seg(p, Gd, 64, 82, 68.6, 92.4, 5.4, 4.6); seg(p, G, 64.4, 82, 68.8, 91.6, 3.6, 3);
      p.poly(Gd, [63, 91.6, 74, 91.6, 76.4, 96.8, 61, 96.8]); p.poly(G, [63.6, 92.2, 73.4, 92.2, 74.6, 94.6, 62.6, 94.6]); shard(p, Gd, null, 74.6, 95, 6, 0.1, 1.4);
      p.poly(Gd, [40, 88, 58, 88, 60, 92.6, 38, 92.6]); p.ell(Gh, 41.6, 90.4, 1.4, 1.4); p.ell(Gh, 56.6, 90.4, 1.4, 1.4);
      p.poly(Ld, [30, 60, 38, 53.4, 58, 53, 67, 58.4, 66.4, 67, 33.4, 67]); p.poly(L, [31, 60.4, 38.4, 54.4, 57.4, 54, 66, 58.8, 65.4, 66, 34.4, 66]);
      p.ell(Nd, 48.6, 81.4, 13.8, 6.8); p.ell(N, 48.6, 81, 13, 6);
      for (let y = 63; y < 80; y += 2.6) { p.rect(Gd, 61.6, y, 3.6, 2.2); p.rect(Gh, 62.4, y + 0.5, 2.2, 1.2); }
      p.ell(Nd, 48, 70.2, 14.6, 13); p.ell(Os, 48, 70.2, 13.8, 12.2); p.ell(O, 47.6, 69.6, 13, 11.4); p.ell(Oh, 45.6, 67.4, 8, 6.8);
      p.ell(Nd, 36.6, 71.8, 2.8, 3); p.ell(N, 36.6, 71.8, 2, 2.2); p.ell('#8a8ed8', 36.2, 71.2, 0.9, 0.9);
      p.ell(Nd, 55, 72.4, 3, 3.1); p.ell(N, 55, 72.4, 2.2, 2.3); p.ell('#2a2c64', 55.2, 72.6, 1.2, 1.2); p.ell('#8a8ed8', 54.4, 71.6, 0.8, 0.8);
      p.ell(Gd, 33.8, 82.4, 2.6, 2.6); p.ell(Gh, 33.8, 82.4, 2, 2); p.rect(Gd, 32.6, 82, 2.4, 0.8);
      ice(43, 47.4, 15.2, -1.92, 3.6, Pu); ice(43.8, 47, 12.8, -1.2, 3, Bl); ice(63.2, 46.8, 11.8, -1.75, 3, Pu); ice(64, 47.4, 14.4, -1.06, 3.6, Bl);
      ice(39, 50, 9, -2.7, 2.8, Bl); ice(66.6, 48.6, 9, -0.35, 2.8, Pu);
      p.poly(D, [35.4, 53, 37.6, 47.6, 42, 45, 47, 46.4, 50.6, 44.6, 54.6, 46.2, 60, 43.8, 65, 44.4, 70, 48, 70.6, 54, 64.4, 57.6, 56.6, 56.2, 50.4, 58, 44, 56.6, 36.6, 56.6]);
      p.poly(Pu, [36.4, 53, 38.4, 48, 42, 45.8, 46.4, 47, 46, 52.6, 42.6, 55.6, 37.4, 55.6]);
      p.poly(Bl, [55.4, 46.6, 60, 44.6, 64.6, 45.2, 69.2, 48.4, 69.6, 53.4, 64, 56.6, 56.8, 55.2]);
      p.poly(Cy, [38.4, 48, 42, 45.8, 44.4, 47.6, 40.6, 50]); p.poly(Cy, [64.6, 45.2, 69.2, 48.4, 65.4, 48.6]);
      p.poly(Lc, [38.4, 48, 42, 45.8, 42.6, 46.8, 39.2, 48.8]); p.poly(Lc, [64.6, 45.2, 69.2, 48.4, 67.8, 48.6]);
      p.poly(Bl, [37.4, 55.6, 44, 55.6, 42.4, 51.6]); p.poly(Pu, [64, 56.6, 69.6, 53.4, 66, 51.6]);
      p.poly(D, [51, 42.6, 56.6, 48.6, 51, 55.6, 45.4, 48.6]); p.poly(Bl, [51, 43.8, 55.4, 48.6, 51, 54.4, 46.6, 48.6]);
      p.poly(Lc, [51, 43.8, 55.4, 48.6, 51, 47.8]); p.poly(Pu, [46.6, 48.6, 51, 54.4, 51, 49.2]);
      p.poly(D, [44.4, 54.4, 55.6, 54.4, 52.4, 61.6, 47.6, 61.6]); p.poly(Pu, [45.4, 55, 54.6, 55, 51.8, 60.8, 48.2, 60.8]); p.poly(Bl, [45.4, 55, 54.6, 55, 50, 57.6]);
      for (const [cx, cy] of [[37.8, 60.4], [55.4, 60.8]]) {
        p.poly(Gd, [cx - 4.4, cy - 4, cx + 3.4, cy - 5.4, cx + 4.8, cy - 1.4, cx + 4.4, cy + 4.6, cx - 3.2, cy + 5.6, cx - 4.8, cy + 1.6]);
        p.poly('#4c4c56', [cx - 3.8, cy - 3.4, cx + 3, cy - 4.6, cx + 4, cy - 1.2, cx + 3.6, cy + 3.8, cx - 2.8, cy + 4.8, cx - 4, cy + 1.4]);
        p.poly('#7a7a86', [cx - 3.8, cy - 3.4, cx + 3, cy - 4.6, cx + 3.6, cy - 2.8, cx - 3.4, cy - 1.6]); seg(p, Gd, cx - 4, cy + 0.2, cx + 3.8, cy - 0.6, 0.7);
        for (const dy of [-2, 2.2]) { p.ell(Gd, cx, cy + dy, 1.9, 1.8); p.ell(Am, cx, cy + dy, 1.3, 1.2); p.snap('#ffd8a0', cx - 0.7, cy + dy - 0.7, 0.7, 0.7); }
      }
      shield([[21.4, 65.4], [19, 70.6], [18.4, 77], [19.8, 83.6], [23.4, 89.6], [28, 94]], [[30.4, 89.4], [27.8, 84], [27, 78], [27.8, 72.4], [30.2, 67.6], [33, 64.8]], [[18.6, 73.6, 28.4, 71], [18.8, 81.4, 27.6, 80.4]]);
      shield([[71.6, 60.6], [74.8, 65], [76.2, 71.4], [75.8, 78.4], [73.6, 85.4], [69.6, 93.4]], [[68.4, 88.6], [69.6, 82.6], [69.8, 76.4], [68.6, 70.4], [66.6, 66], [65.4, 62.6]], [[67, 68.6, 75.4, 67], [69.6, 78.2, 76, 77.4]]);
      p.ell(Gd, 17.6, 76, 3.4, 3.4); p.ell(Gh, 17.6, 76, 2.8, 2.8); p.ell(Am, 17.6, 76, 2, 2); p.ell('#7a3a12', 17.6, 76, 0.8, 0.8);
    },
    searing(p) { wolfArt(p, { rust: '#e8384a', crystal: ['#e8384a', '#ffa0a8', '#7a1424'] }); },
    iceout(p, f) { outSpaceArt(p, f, { B: '#3a5ae0', Bh: '#6a9cff', Bd: '#1e2a8a', E: '#0e1240', glow: '#4ae0ff', glowH: '#c8f6ff', spike: '#5aa8ff', spikeH: '#c8eeff', core: '#1a1e5e', coreH: '#2c3488', mark: '#9ad8ff', blade: '#4ae0ff' }); },
    blazeout(p, f) { outSpaceArt(p, f, { B: '#4a3c5c', Bh: '#6e5e86', Bd: '#2a2034', E: '#120c18', glow: '#ff4a5a', glowH: '#ffb0b8', spike: '#e83a52', spikeH: '#ff9aa8', core: '#e8384a', coreH: '#ff7a86', mark: '#3a1018', blade: '#3a2e4a' }); },
    iceedge(p) {
      const T = '#7ad8e2', Th = '#d4fbff', Ts = '#46aecb', Bl = '#3a6ad0', Bd = '#1e3c8a', E = '#12304e';
      const rod = (x0, y0, x1, y1, w) => { seg(p, E, x0, y0, x1, y1, w + 0.9); seg(p, T, x0, y0, x1, y1, w); seg(p, Th, x0 - 0.4, y0, x1 - 0.4, y1, w * 0.45); };
      const knob = (x, y, r) => { p.poly(E, [x, y - r - 0.7, x + r + 0.7, y, x, y + r + 0.7, x - r - 0.7, y]); p.poly(Ts, [x, y - r, x + r, y, x, y + r, x - r, y]); p.poly(Th, [x, y - r, x - r, y, x, y]); };
      const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
      rod(40.4, 12, 50.4, 68, 2.6);
      kite(38.4, 1.6, 39.6, 13, 4.4, Th, T, 0.7);
      knob(39.8, 13.2, 2.4); knob(48.8, 55.4, 2.2);
      rod(29.4, 60.6, 46, 79, 2.4); rod(70.6, 59.8, 54.4, 79, 2.4);
      knob(38.4, 71.2, 2); knob(61.8, 71, 2);
      kite(52.2, 81, 56, 97.4, 6.4, Th, Ts, 0.1);
      kite(52, 60.6, 52.2, 77, 7, Th, Ts, 0.45);
      kite(50.4, 69, 43.8, 78.6, 4.6, Bl, Bd); kite(54.6, 69, 61, 77.6, 4.6, Bl, Bd);
      kite(46.6, 74.6, 57.6, 74.2, 4.6, Th, T, 0.5);
      kite(49, 77.6, 52.6, 84, 3.6, Bl, Bd); kite(55.2, 77.4, 53.4, 84.4, 3.6, T, Ts);
    },
    distorter(p, f) {
      const S = '#d6d6e2', Sh = '#f4f4fa', Ss = '#9c9cb6', Sd = '#5e5e7a', K = '#22222c', Pu = '#4a2a9a', Pl = '#7a52d8', Gw = '#f4eeff', L = '#dcc6ff', Ls = '#a688e8', Lh = '#fcf6ff', b = f ? 1.6 : 0;
      const leaf = (x, y, s) => {
        p.poly(L, [x - 4 * s, y - s, x + s, y - 3 * s, x + 4 * s, y - 0.4 * s, x, y + 2.6 * s]);
        p.poly(Ls, [x - 4 * s, y - s, x, y + 2.6 * s, x - 0.6 * s, y + 0.4 * s]);
        p.poly(Lh, [x - 2 * s, y - 1.4 * s, x + s, y - 2.6 * s, x + 2 * s, y - 1.2 * s]);
      };
      leaf(12, 22 + b, 1.5); leaf(88, 30 + b, 1.6);
      seg(p, S, 55, 60, 61, 68, 6, 5); seg(p, Ss, 61, 68, 63, 82, 5, 3.4); p.poly(Sd, [61, 80, 65, 80, 66, 86, 62, 85]);
      p.ell(Pu, 59.4, 65.6, 2.4, 2.8); shard(p, S, Sh, 61, 68, 8, -0.55, 2.2);
      seg(p, S, 49, 62, 50, 80, 6.4, 5); seg(p, S, 50, 80, 50, 94, 5, 3.6); p.poly(Ss, [47.4, 92, 52.6, 92, 51.6, 99, 49, 99]);
      p.poly(Sh, [47, 64, 49.6, 64, 49.4, 92, 48, 92]); p.ell(Pu, 50.4, 74, 2.4, 3.2); shard(p, S, Sh, 52, 72, 7, -0.3, 2);
      p.poly(K, [46, 45, 58, 45, 58, 49, 46, 49]);
      p.poly(S, [44, 48, 59, 48, 61, 57, 58, 64, 53, 60, 47, 63, 43, 57]); p.poly(Sh, [44.6, 49, 50, 49, 47.4, 59, 44, 56]); p.poly(Ss, [54, 49, 59, 48, 61, 57, 58, 64, 55, 58]);
      p.poly(K, [48, 56, 53, 55, 52, 60, 49, 61]);
      shard(p, S, Sh, 45, 54, 11, 2.7, 2.2); shard(p, Ss, null, 45, 59, 9, 2.1, 2); shard(p, S, Sh, 47, 50, 8, -2.4, 1.8); shard(p, Ss, null, 59, 56, 9, 0.3, 2);
      p.poly(S, [45, 25, 61, 24, 63, 32, 60, 46, 47, 47, 45, 36]);
      p.poly(Sh, [45.6, 26, 52, 25, 48, 32, 46, 34]); p.poly(Ss, [58, 25, 61, 24, 63, 32, 60, 46, 58, 46]);
      p.ell(Pu, 52.6, 39.6, 5.4, 7.4); p.ell(Pl, 50, 38, 2.2, 5.4);
      curve(p, Gw, bez(49, 35, 57, 38.4, 50, 42.4, 6), 1.5, 1.2); curve(p, Gw, bez(55.4, 34.4, 47.4, 39.4, 54.6, 45.4, 6), 1.4, 1.1);
      p.ell(Ss, 46.4, 26.6, 3, 2.4); p.ell(Ss, 60.4, 25.6, 3.4, 2.6);
      seg(p, S, 46, 27, 41, 30, 4, 3.4); seg(p, Ss, 41, 30, 36.4, 30, 3.4, 3); p.ell(Sd, 35.6, 30, 1.8, 1.6);
      for (const [x, y] of [[33.2, 28.4], [32.6, 30], [33.2, 31.6]]) seg(p, K, 35, 30, x, y, 0.9, 0.5);
      p.poly(Ss, [56, 9, 71, 8.4, 61, 14]);
      p.poly(S, [42, 23, 45, 14, 50, 9, 56, 8, 62, 12, 59, 19, 54, 24, 47, 25]);
      p.poly(Sh, [43.4, 21, 46, 14, 50.4, 10, 55, 9, 48, 16]); p.poly(Ss, [54, 13, 61, 11.4, 60, 13, 58, 19, 54, 23]);
      p.poly(S, [46.6, 11.6, 43, 1, 51.4, 8.6]); p.poly(Sh, [46, 10, 43.6, 2.4, 47.6, 8.6]);
      p.poly(K, [43.4, 22, 48, 18.4, 53.4, 17.6, 52, 20, 47, 23]); p.snap('#e4ccff', 50.4, 18.4, 1.6, 1.2);
      seg(p, K, 62, 28, 62, 37, 4.6, 4); for (const [x, y] of [[59.4, 25], [61.6, 24], [64, 25]]) seg(p, K, 62, 28.4, x, y, 1, 0.5);
      p.poly(Ss, [64, 36, 69, 44, 71.4, 54, 69, 64, 67, 55, 65, 46, 61.6, 40]); p.poly(Pl, [64.6, 40, 68, 47, 69.4, 56, 67.4, 51, 64.4, 44]);
      leaf(25, 32 - b, 1.7); leaf(76, 37 - b, 1.5);
    },
    ipc_field(p) { ipcArt(p, { gun: true }); },
    ipc_security(p) { ipcArt(p, { staff: true }); },
    ipc_leader(p) {
      const L = '#7a7aaa', Lh = '#a6a6d0', Ld = '#46467c', K = '#22222c', Kh = '#40404e', Kd = '#121218', E = '#0c0c14', T = '#e8a868', Th = '#ffd0a0', Td = '#a8683a', Rs = '#8a2a3a', R = '#ff3a3a', Rh = '#ffb0a0';
      const kite = (x0, y0, x1, y1, w, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, w, lit, dim, t);
      const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
      seg(p, E, 12, 48.6, 4, 46, 3.6, 3); seg(p, K, 12, 48.6, 4, 46, 2.4, 2); seg(p, E, 4, 46, 2, 51, 3, 2.4); seg(p, K, 4, 46, 2, 51, 2, 1.4);
      seg(p, E, 11.6, 57, 4, 58.6, 3.6, 3); seg(p, K, 11.6, 57, 4, 58.6, 2.4, 2); seg(p, E, 4, 58.6, 3, 63.4, 3, 2.4); seg(p, K, 4, 58.6, 3, 63.4, 2, 1.4);
      mass([9.4, 47, 16, 44, 21, 50, 22.4, 62, 20.4, 72, 15, 74.4, 10, 66, 8.6, 56], L);
      p.poly(Lh, [9.4, 47, 16, 44, 15, 52, 11.6, 62, 9, 56]); p.poly(Ld, [21, 50, 22.4, 62, 20.4, 72, 15, 74.4, 17.6, 62]);
      mass([19, 70, 46, 69.4, 50.6, 75, 45, 80.6, 22, 80.6, 17.6, 76], K);
      p.poly(Kh, [20, 71, 45, 70.4, 46.6, 72.6, 20.6, 73.4]); p.snap(R, 30, 73.6, 2.2, 1.2);
      mass([22, 40, 28, 33, 38, 31, 48, 34, 54, 42, 56, 54, 54, 66, 48, 74, 38, 78, 28, 76, 22, 68, 19, 56], L);
      p.poly(Lh, [22.4, 42, 28.6, 34.4, 35, 33.4, 29, 48, 23.4, 55]); p.poly(Ld, [50, 40, 54, 42, 56, 54, 54, 66, 48, 74, 44, 71, 50.4, 60]);
      seg(p, Ld, 36, 70, 46, 64, 0.8); p.snap('#d8dcff', 40, 60.6, 1.2, 1.2);
      mass([26.6, 45, 31.4, 44, 32.6, 66, 29.4, 69, 25.6, 60], T); p.poly(Th, [26.6, 45, 28.6, 44.6, 28.4, 62, 26, 58]); p.poly(Td, [31.4, 44, 32.6, 66, 29.4, 69, 30.4, 58]);
      seg(p, R, 32, 66, 34.4, 67.6, 1); p.snap(Rh, 32.6, 66, 1, 0.8);
      seg(p, E, 23.4, 37.6, 44.6, 55, 2.6); seg(p, Rs, 23.4, 37.6, 44.6, 55, 1.6); seg(p, E, 43, 36.4, 28, 53, 2.6); seg(p, Rs, 43, 36.4, 28, 53, 1.6);
      mass([30.6, 38, 43.4, 37, 44.4, 47.6, 31.6, 48.6], K); p.poly(Kh, [31.2, 38.6, 42.8, 37.6, 42.8, 39.6, 31.4, 40.4]); seg(p, Kd, 37.4, 38, 37.8, 48, 0.6);
      mass([20.6, 35.4, 27.6, 34.4, 28.6, 41.4, 21.6, 42.4], K); p.poly(Kh, [21, 36, 27, 35, 27.2, 36.8, 21.2, 37.6]);
      mass([26, 34.6, 26.6, 26.6, 30, 21.4, 35.6, 19.4, 40.4, 22.4, 46, 26, 53.6, 24, 62.4, 22.6, 60.4, 26.4, 54.4, 31.4, 46, 34.4, 36, 36.4, 28, 36.6], L);
      p.poly(Lh, [26.6, 26.6, 30, 21.4, 35.6, 19.4, 33.6, 23.6, 29, 30]); p.poly(Lh, [46, 26, 53.6, 24, 62.4, 22.6, 61, 24.4, 52, 27.2]);
      p.poly(Ld, [28, 36.6, 36, 36.4, 46, 34.4, 54.4, 31.4, 52, 30.4, 42, 32.4, 32, 33.6]);
      seg(p, E, 52.6, 24.4, 58.4, 7.6, 1.6, 0.9); seg(p, Kh, 52.6, 24.4, 58.4, 7.6, 0.8, 0.5);
      mass([35.6, 20.4, 39.6, 16.6, 46, 15.2, 51, 16.8, 53.4, 21, 52.4, 24.4, 37, 25], '#3c3c48');
      p.poly('#5e5e6c', [36.6, 19.6, 40, 17.2, 46, 16, 45, 18.6, 38.6, 21]); seg(p, '#9a9aac', 41.4, 18.4, 47, 18, 0.7);
      p.poly(E, [34.6, 22.4, 51.4, 21.4, 51.4, 24.6, 35.4, 25.8]); p.poly(Kh, [35.4, 22.8, 50.8, 22, 50.8, 23, 35.6, 23.8]);
      mass([37.6, 25.6, 46.4, 25, 46, 29.8, 41.4, 31.4, 37.8, 29.4], T); p.poly(Th, [37.6, 25.6, 42, 25.4, 40, 29.4, 37.8, 28.6]);
      seg(p, Td, 38.6, 27.6, 45, 27, 0.6); seg(p, '#fff4e0', 43.6, 25.8, 41.4, 30.4, 0.6);
      p.ell(E, 62, 37.4, 8.6, 7.6); p.ell(K, 62, 37.4, 7.8, 6.8); p.ell(Kh, 59.6, 34.6, 3.6, 2.4); p.ell(Kd, 64, 40, 3.6, 3.2); p.ell(Kh, 63.4, 39.4, 1.2, 1);
      mass([65.6, 30, 74, 30.6, 79.4, 35, 80.4, 44, 76.4, 47.4, 70.4, 44.4, 67.4, 38], L);
      p.poly(Lh, [65.6, 30, 74, 30.6, 77, 33.4, 69, 33.6]); p.poly(Ld, [79.4, 35, 80.4, 44, 76.4, 47.4, 76, 40]);
      mass([73.4, 45, 79.6, 44, 81, 51.4, 75.6, 53], K);
      mass([49.6, 50, 56, 48.4, 64, 49.2, 68.4, 54, 68.4, 72, 66, 84, 60, 88.4, 54, 86.4, 50, 76.4, 48.8, 62], L);
      p.poly(Lh, [49.6, 50, 56, 48.4, 55, 56, 52.6, 70, 50, 74, 48.8, 62]); p.poly(Ld, [64, 49.2, 68.4, 54, 68.4, 72, 66, 84, 63.6, 76, 65.4, 60]);
      seg(p, Ld, 52.4, 66, 62, 65.4, 0.6); seg(p, '#d8dcff', 56.4, 52.4, 59.6, 52.4, 0.7);
      for (const x of [54.4, 61.6]) { p.poly(E, [x - 0.6, 69.4, x + 4.6, 69, x + 4.8, 74.4, x - 0.4, 74.8]); p.poly(R, [x + 0.4, 70.4, x + 3.6, 70.2, x + 3.8, 73.4, x + 0.6, 73.6]); p.snap(Rh, x + 0.8, 70.6, 1.2, 1); }
      for (const [x, y] of [[50.6, 72.6], [66, 72.4], [52.4, 81], [64.6, 80.6]]) { p.poly(E, [x - 2, y - 1.6, x + 2, y - 1.8, x + 2.2, y + 1.6, x - 1.8, y + 1.8]); p.poly(Kh, [x - 1.4, y - 1, x + 1.4, y - 1.2, x + 1.4, y + 0.4, x - 1.4, y + 0.6]); }
      mass([54.4, 86.4, 65.4, 86, 66.6, 94.4, 64, 96.6, 55.6, 96.6, 53.6, 94], K); p.poly(Kh, [55.2, 87, 64.6, 86.6, 64.8, 88.6, 55.4, 89]); p.snap(R, 58.4, 92, 2, 1);
      seg(p, E, 66, 60.4, 77, 61.4, 3.6); seg(p, K, 66, 60.4, 77, 61.4, 2.4); seg(p, E, 66.4, 74.4, 77, 75, 3.6); seg(p, K, 66.4, 74.4, 77, 75, 2.4);
      seg(p, E, 72, 80.6, 77.6, 85, 3.4); seg(p, K, 72, 80.6, 77.6, 85, 2.2);
      mass([85, 45, 94.6, 46.6, 96, 68.6, 87.6, 69], '#2a2a36'); p.poly('#4a4a5a', [85.6, 45.6, 94, 47, 94, 49, 85.8, 48]);
      for (const y of [50, 56, 62]) { p.ell(E, 91, y, 2.4, 2.2); p.ell('#5a5a6a', 91, y, 1.6, 1.4); }
      const sh = [74.4, 24.4, 92.4, 26.4, 96.6, 50, 96.4, 96.4, 90.6, 97, 73.6, 90, 72.6, 58];
      p.poly('rgba(246,222,150,0.56)', sh);
      p.poly('rgba(255,248,222,0.72)', [74.4, 24.4, 92.4, 26.4, 93, 31, 80, 36, 74.2, 42]); p.poly('rgba(255,248,222,0.72)', [73.6, 84, 82, 80.4, 76, 91, 73.8, 90]);
      for (let k = 0; k < sh.length; k += 2) { const n = (k + 2) % sh.length; seg(p, '#f2d466', sh[k], sh[k + 1], sh[n], sh[n + 1], 1.3); }
      for (const [x0, y0, x1, y1] of [[75, 34, 92.6, 30], [73.4, 64, 96.4, 70], [84, 25.8, 82, 93.8]]) seg(p, '#e8c45a', x0, y0, x1, y1, 0.7);
      for (const [x, y] of [[80.6, 29.6], [86, 34.8], [80.8, 48], [86.4, 69], [80.6, 88]]) { seg(p, '#fff0b0', x - 1.4, y - 1.4, x + 1.4, y + 1.4, 0.7); seg(p, '#fff0b0', x - 1.4, y + 1.4, x + 1.4, y - 1.4, 0.7); }
    },
    mask(q, f) {
      const up = f ? -2 : 0, p = { poly: (c, a) => q.poly(c, a.map((v, i) => (i % 2 ? v + up : v))), ell: (c, x, y, rx, ry, r) => q.ell(c, x, y + up, rx, ry, r) };
      const W = '#f0f0f4', Ws = '#b8bccc', K = '#16161e', Kh = '#3a3a4a', Au = '#e8b830', Auh = '#ffe27e', Aud = '#a07818', O = '#14121c', Ey = '#6e94b8', Eh = '#c0d8f0';
      p.poly(Au, [37, 38, 39, 22, 50, 13, 62, 14, 69, 24, 67, 38]); p.poly(Aud, [58, 15, 62, 14, 69, 24, 67, 38, 60, 38]); p.poly(Auh, [40, 24, 50, 15, 52, 17, 43, 26]);
      p.poly(K, [57, 28, 59, 11, 68, 3, 66, 14, 71, 23, 64, 32]); p.poly(Kh, [59, 12, 67, 4.6, 65.6, 12, 61, 18]);
      p.ell(Au, 44, 47, 19.4, 19.4); p.ell(O, 44, 47, 17.4, 17.4); p.ell(Kh, 38, 41, 8, 6, -0.6); p.ell(O, 40, 43, 7, 6, -0.6);
      p.ell(Ey, 45, 44, 6.4, 6.4); p.ell(Eh, 43.6, 42.4, 2.4, 2.2);
      p.poly(W, [16, 11, 27, 15, 36, 29, 38, 44, 34, 58, 26, 68, 14, 66, 6, 54, 3, 36, 7, 21]); p.poly(Ws, [3, 36, 7, 21, 9, 24, 7, 40, 10, 54, 6, 54]);
      p.poly(K, [29, 33, 38, 44, 34, 58, 26, 68, 15, 66, 22, 56, 28, 46]); p.poly(Kh, [30, 37, 35, 45, 31, 56, 27, 50]);
      curve(p, Au, bez(12, 41, 20, 35, 29, 41, 8), 1.8, 1.2); curve(p, Au, bez(17, 12, 30, 20, 37, 36, 8), 1.4, 1.2);
      p.poly(W, [62, 31, 72, 25, 84, 30, 94, 43, 96, 57, 90, 68, 76, 70, 66, 62, 62, 48]); p.poly(Ws, [90, 68, 96, 57, 96, 62, 92, 70, 78, 72, 76, 70]);
      p.poly(K, [62, 31, 70, 26, 76, 34, 69, 41, 63, 40]);
      p.poly(K, [70, 49, 78, 43, 87, 47, 84, 50, 77, 48, 72, 52]); curve(p, Au, bez(70, 48, 78, 42, 87, 46, 8), 1.4, 1.2);
      curve(p, Au, bez(63, 41, 63, 56, 70, 66, 8), 1.6, 1.2); curve(p, Au, bez(76, 33, 86, 36, 92, 46, 8), 1.2, 1);
      curve(p, Au, bez(42, 62, 33, 65, 38, 73, 8), 3.4, 2.4); curve(p, Au, bez(49, 63, 56, 67, 51, 73, 8), 3, 2); p.poly(Auh, [37, 64, 41, 62, 40, 65]);
      p.poly(W, [27, 75, 50, 71, 71, 72, 67, 79, 50, 83, 31, 86, 25, 81]); p.poly(K, [29, 82, 48, 79, 67, 78, 64, 83, 48, 88, 31, 91]);
      p.poly(Au, [25, 81, 31, 86, 31, 91, 27, 88]); seg(p, Au, 50, 71, 71, 72, 1.2);
    },
    weaver(q, f) {
      const up = f ? -1.4 : 0, sp = f ? 1.6 : 0, p = { poly: (c, a) => q.poly(c, a.map((v, i) => (i % 2 ? v + up : v))), ell: (c, x, y, rx, ry, r) => q.ell(c, x, y + up, rx, ry, r), rect: (c, x, y, w, h) => q.rect(c, x, y + up, w, h) };
      const G = '#e4c9a0', Gh = '#f8ead0', Gs = '#c29c74', Gd = '#8e6040', N = '#5a5ea8', Nh = '#8a8ed4', Ns = '#3e4084', Nd = '#24265a';
      const blade = (pts, w) => {
        const n = pts.length - 1;
        for (let i = 1; i <= n; i++) seg(p, Gd, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w + 1.4, i === n ? 0.8 : w + 1.4);
        for (let i = 1; i <= n; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ox = -dy / L * w * 0.24, oy = dx / L * w * 0.24;
          seg(p, Gs, x0, y0, x1, y1, w, i === n ? 0 : w); seg(p, Gh, x0 + ox, y0 + oy, x1 + ox, y1 + oy, w * 0.5, i === n ? 0 : w * 0.5);
        }
      };
      const claw = (x, y, a0) => {
        p.ell(Gd, x, y, 2.3, 2.1); p.ell(G, x, y, 1.7, 1.5);
        for (let k = 0; k < 4; k++) { const a = a0 + k * 0.34; shard(p, Gd, null, x, y, 7, a, 1.2); shard(p, Gh, null, x, y, 6.4, a, 0.75); }
      };
      const sleeve = (sx, sy, ex, ey, wx, wy) => {
        seg(p, Nd, sx, sy, ex, ey, 6.2, 5.6); seg(p, N, sx, sy, ex, ey, 5, 4.4);
        seg(p, Nd, ex, ey, wx, wy, 5.6, 5); seg(p, N, ex, ey, wx, wy, 4.4, 3.8); p.ell(N, ex, ey, 2.4, 2.4);
        const dx = wx - ex, dy = wy - ey, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, bx = wx - ux * 2, by = wy - uy * 2, tx = wx + ux * 2.4, ty = wy + uy * 2.4;
        p.poly(Nd, [bx + nx * 3.2, by + ny * 3.2, tx + nx * 6.2, ty + ny * 6.2, tx - nx * 6.2, ty - ny * 6.2, bx - nx * 3.2, by - ny * 3.2]);
        p.poly(N, [bx + nx * 2.4, by + ny * 2.4, tx + nx * 5.4, ty + ny * 5.4, tx - nx * 5.4, ty - ny * 5.4, bx - nx * 2.4, by - ny * 2.4]);
        for (const k of [-2.8, 0, 2.8]) seg(p, Nh, bx + nx * k * 0.5, by + ny * k * 0.5, tx + nx * k, ty + ny * k, 0.7);
        return [tx + ux * 1.6, ty + uy * 1.6];
      };
      blade([[54, 58], [57, 72], [58.6, 72.6], [62 + sp, 88], [62.6 + sp, 93]], 2.8);
      seg(p, Gd, 48, 60, 47, 76, 4, 3.4); seg(p, G, 48, 60, 47, 76, 3, 2.4); seg(p, Gd, 47, 76, 48.6, 91, 3.4, 2.4); seg(p, Gs, 47, 76, 48.6, 91, 2.4, 1.6);
      seg(p, Gd, 52, 60, 55, 74, 4, 3.4); seg(p, G, 52, 60, 55, 74, 3, 2.4); seg(p, Gd, 55, 74, 53, 83, 3.4, 2.4); seg(p, Gs, 55, 74, 53, 83, 2.4, 1.6);
      shard(p, G, Gh, 47, 75, 5, -2.4, 1.4); shard(p, G, Gh, 55, 73, 5, -0.6, 1.4);
      p.poly(Nd, [47.2, 89, 50, 89, 48.8, 97]); p.poly(N, [47.8, 89.6, 49.4, 89.6, 48.7, 95]);
      p.poly(Nd, [51.6, 81, 54.2, 81, 52.6, 88]); p.poly(N, [52.2, 81.6, 53.6, 81.6, 52.6, 86.4]);
      blade([[44, 60], [41, 74], [42.6, 75], [37 - sp, 91], [36.4 - sp, 95]], 2.8);
      p.poly(Nd, [42, 40, 58, 40, 62, 51, 38, 51]); p.poly(N, [43, 41, 57, 41, 60.6, 50, 39.4, 50]); p.poly(Ns, [52, 41, 57, 41, 60.6, 50, 54, 50]);
      const petal = (c, pts) => { p.poly(Gd, pts.map((v, k) => v + (k % 2 ? 0.9 : 0.6))); p.poly(c, pts); };
      petal(Gs, [55, 42, 64, 45, 71, 53, 63, 53, 56, 48]);
      petal(G, [46, 44, 31, 49, 9 - sp, 56, 25, 58.4, 40, 57]);
      petal(Gh, [45, 45.4, 30, 50.2, 13 - sp, 55.6, 28, 53.6]);
      petal(G, [46, 46, 37, 57, 33, 67, 42, 63, 47.4, 53]);
      petal(Gs, [53, 44, 62, 52, 67, 65, 58.4, 62, 54, 53]);
      petal(Gh, [47, 43, 53.4, 43, 56.6, 58, 51, 69, 45, 60]); p.poly(G, [50.6, 44, 53.4, 43, 56.6, 58, 51, 69, 50.4, 58]);
      blade([[57, 50], [65, 64], [67.4, 64.4], [79 + sp, 90], [81 + sp, 96]], 3.6);
      p.rect(Nd, 45.6, 36.4, 8.8, 4.4); p.rect(N, 46.2, 37, 7.6, 3.2);
      const lh = sleeve(42.6, 27.6, 34.4, 33.4, 28, 27), rh = sleeve(57.4, 27.6, 66, 31.4, 71, 22.4);
      claw(lh[0], lh[1], -2.25); claw(rh[0], rh[1], -1.95);
      p.poly(Nd, [39.4, 23.4, 60.6, 23.4, 58.6, 34, 54.6, 38, 45.4, 38, 41.4, 34]); p.poly(N, [40.4, 24, 59.6, 24, 57.8, 33.6, 54, 37.4, 46, 37.4, 42.2, 33.6]);
      p.poly(Gd, [43, 24, 57, 24, 56.2, 30.4, 53.8, 37.6, 46.2, 37.6, 43.8, 30.4]);
      p.poly(G, [43.8, 24.6, 56.2, 24.6, 55.4, 30, 53.2, 37, 46.8, 37, 44.6, 30]);
      p.poly(Gh, [44.4, 25.2, 50, 25.2, 48.4, 30, 45, 29.6]); p.poly(Gs, [52, 30, 55.6, 25.2, 55, 30, 53, 36.4, 52, 36.4]);
      seg(p, Gs, 45.4, 27.6, 54.6, 27.6, 0.7); seg(p, Gs, 46, 31, 54, 31, 0.7);
      for (const s of [-1, 1]) { shard(p, Gd, null, 50 + s * 6.6, 25.6, 8, s < 0 ? -2.65 : -0.49, 2.8); shard(p, G, Gh, 50 + s * 6.6, 25.6, 7.2, s < 0 ? -2.65 : -0.49, 2); }
      p.rect(Nd, 47, 20, 6, 5); p.rect(N, 47.6, 20.4, 4.8, 4); for (const y of [21.4, 23]) p.rect(Ns, 47.6, y, 4.8, 0.6);
      shard(p, Nd, N, 46, 12, 9, -1.95, 2.4); shard(p, Nd, N, 54, 11.6, 9, -1.15, 2.4);
      p.poly(Nd, [43.4, 22.4, 42.4, 14.6, 46, 8.4, 54, 8.4, 57.6, 14.6, 56.6, 22.4, 50, 26]);
      p.poly(N, [44.2, 22, 43.2, 14.6, 46.6, 9.2, 53.4, 9.2, 56.8, 14.6, 55.8, 22, 50, 25.2]); p.poly(Nh, [44, 14.6, 46.8, 9.8, 48.6, 10, 45.6, 17]);
      shard(p, Gd, null, 44.6, 22.6, 14, -0.72, 2.6); shard(p, G, Gh, 44.8, 22.4, 13, -0.72, 2);
      shard(p, Gd, null, 46.4, 24.4, 12, -0.82, 2.2); shard(p, Gs, G, 46.6, 24.2, 11, -0.82, 1.6);
      blade([[46.6, 16], [44.4, 0.4]], 2.2); blade([[48.6, 14.6], [47.6, 1.6]], 1.8);
      blade([[52, 15], [60, 10.4], [72, 3]], 2.2); blade([[60, 10.6], [62.4, 3.4]], 1.4); blade([[66.4, 6.6], [69, 0.8]], 1.2); blade([[56, 13.6], [67, 13]], 1.4);
    },
    decaying(p, f) { shadeLady(p, f, false); },
    guardian(p, f) { shadeLady(p, f, true); },
    juvsting(p, f) {
      const G = '#8e8992', Gh = '#b4b0b8', Gl = '#e8e6ec', Gm = '#7a7580', Gd = '#5a5562', Gk = '#3e3644', E = '#141218', R = '#d8303e', Rd = '#8a2632', Mo = '#e07a7a';
      const Pk = '#b65a8e', Pkh = '#e6a2c8', Pkd = '#6a2a4c', w = f ? -2.6 : 0;
      const kite = (x0, y0, x1, y1, wd, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, wd, lit, dim, t);
      const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
      const limb = (pts, w0, col, hi) => { for (let i = 1; i < pts.length; i++) { seg(p, E, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w0 + 1.4, w0 + 0.6); seg(p, col, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w0, w0 - 0.8); if (hi) seg(p, hi, pts[i - 1][0] - 0.5, pts[i - 1][1], pts[i][0] - 0.5, pts[i][1], w0 * 0.3, w0 * 0.2); } };
      const wing = (pts, veins) => { mass(pts, Pk); p.poly(Pkd, pts.slice(pts.length / 2)); for (const v of veins) curve(p, Pkh, v, 0.6, 0.4); };
      wing([61, 48, 66, 41, 74, 32, 82, 25 + w * 0.6, 87.4, 21.4 + w, 86, 26 + w, 80, 33 + w * 0.5, 72, 41, 66, 48, 63, 51], [bez(63, 49, 74, 36, 86, 23 + w, 8), bez(68, 44, 74, 40, 80, 32 + w * 0.5, 6)]);
      wing([61, 51, 70, 48.4, 80, 46.6 + w * 0.3, 90, 46 + w * 0.6, 96, 46.6 + w, 92, 48.6 + w * 0.6, 82, 50.6, 72, 52.4, 63, 54], [bez(63, 52, 80, 48.6, 94, 47 + w, 8), bez(70, 51.4, 78, 50, 86, 50, 6)]);
      wing([46.6, 35, 48.6, 22, 50.8, 15 + w, 51.2, 22, 50, 35], [bez(48.4, 33, 49.4, 24, 50.6, 17 + w, 6)]);
      limb([[62, 75], [61, 84], [62.4, 91]], 2.6, Gk); p.poly(E, [60.6, 89.6, 63.6, 90, 61.6, 95]);
      mass([25.6, 14.4, 29.4, 11.4 + w, 33.6, 17, 36.6, 24, 37.8, 31, 39, 40, 41, 48, 36, 50.4, 31.6, 45, 27.6, 36, 25.6, 26], G);
      p.poly(Gh, [26.4, 15, 29.4, 12.4 + w, 31.4, 15.6, 29, 24, 28, 34, 26.6, 28]); p.poly(Gl, [27, 16, 29, 13.6 + w, 29.4, 16, 27.6, 22]);
      p.poly(Gd, [31.6, 45, 36, 50.4, 38.4, 46, 34.4, 38, 30.4, 37]);
      curve(p, R, bez(34.4, 19, 32.6, 30, 36.6, 42, 8), 1.2, 0.7); curve(p, R, bez(33.4, 30, 35, 32, 36.6, 33.6, 4), 0.8, 0.5);
      mass([43, 54, 50, 52.6, 58, 53.4, 65, 56, 69, 61, 69, 68, 65, 73, 58, 75, 50, 74, 45, 70, 43, 62], G);
      p.poly(Gm, [58, 53.4, 65, 56, 69, 61, 69, 68, 65, 73, 60, 70, 62, 62]); seg(p, Gl, 49.6, 55, 51.6, 63, 1.4, 0.8);
      mass([49, 70, 58, 71, 66, 69, 69.6, 72, 66, 78, 58, 80, 50, 78], Gk);
      p.poly(R, [54.6, 75, 63, 74, 66, 76.4, 58, 78.4]); p.poly('#f07a84', [56, 75.4, 61, 74.8, 59, 76.4]);
      p.poly(R, [59.4, 52.4, 62.6, 52.8, 61.6, 55]);
      mass([42, 49, 42, 41, 44.6, 35.6, 48, 32.6, 51, 33.4, 51.6, 40, 49.6, 46, 46, 50], G);
      p.poly(Gh, [42.8, 47, 43, 41, 45.4, 36.4, 48, 34, 46.4, 41, 44.4, 46]); seg(p, Gl, 48.4, 35.6, 46.4, 44, 1.2, 0.6);
      mass([51, 52, 51.6, 44, 54.6, 37, 59, 32, 66, 28.6, 72, 27 + w, 70.6, 31, 66, 37, 62, 43, 58.6, 49, 55, 54], G);
      p.poly(Gh, [52.4, 45, 55, 38, 59, 33.4, 66, 29.6, 69, 29 + w, 64, 33, 58, 40, 54, 47]); p.poly(Gl, [53.6, 42, 56.6, 36.6, 60.4, 33.4, 57, 38.6]);
      p.poly(Gd, [70.6, 31, 66, 37, 62, 43, 58.6, 49, 55, 54, 57, 49, 60.6, 43, 65.6, 36]);
      curve(p, R, bez(56, 36, 53.4, 43, 54.4, 50, 8), 1.2, 0.7); curve(p, R, bez(54, 44, 55.6, 46, 57, 47, 4), 0.8, 0.5);
      limb([[54, 74], [55.4, 82], [54.6, 87]], 2.8, Gk); p.poly(E, [53, 86, 56.4, 86.4, 54.6, 91]);
      mass([5, 54.6, 10, 53.6, 18, 52.6, 26, 51.6, 34, 50.6, 42, 50, 46, 52, 44, 56, 36, 57.4, 28, 58.4, 20, 59.4, 12, 60.4, 6, 60.4], G);
      p.poly(Gh, [6, 55, 10, 54.4, 18, 53.4, 26, 52.4, 34, 51.4, 42, 50.8, 44.6, 52.6, 34, 54, 22, 55.4, 10, 56.6]); seg(p, Gl, 14, 54, 38, 51.6, 0.8);
      p.poly(Rd, [9, 57, 18, 56, 28, 55, 28.6, 57.2, 18, 58.4, 10, 59.2]); p.poly(R, [11, 57.2, 18, 56.6, 26, 55.8, 18, 57.6]);
      kite(6, 57, 2.6, 54.4, 1.8, Gh, Gd, 0.4); kite(6.6, 59.6, 3.6, 63, 1.8, Gh, Gd, 0.4);
      mass([19, 64, 22, 61.4, 28, 61, 36, 59.4, 44, 57.6, 48, 60, 49, 66, 46, 72, 40, 76, 33, 78.6, 27, 78, 22, 75, 19.4, 70], G);
      p.poly(Gh, [22, 61.6, 28, 61.4, 36, 60, 44, 58.4, 46.6, 61, 38, 63, 28, 64, 22, 65]);
      p.poly(Gd, [22, 75, 27, 78, 33, 78.6, 40, 76, 46, 72, 42, 72, 34, 74, 26, 73]);
      seg(p, Gl, 40, 61, 44.6, 65, 1, 0.6);
      kite(20.4, 66, 15.4, 63.4, 2.2, Gh, Gd, 0.4); kite(21, 72, 16.4, 74.6, 2, Gh, Gd, 0.4);
      p.poly(E, [31, 71.4, 38.6, 70.4, 39.4, 75.4, 32, 76]); p.poly(Mo, [31.8, 72, 38, 71.2, 38.6, 74.6, 32.6, 75.2]);
      kite(33.4, 73, 34.2, 79.4, 1.6, Gl, Gh, 0.3); kite(37, 72.6, 38.4, 78.4, 1.6, Gl, Gh, 0.3);
      limb([[42, 72], [40.6, 80], [40.6, 88]], 3.4, G, Gh); p.poly(E, [38.6, 86.6, 42.8, 87, 40.6, 92.4]);
    },
    gnawsting(p, f) {
      const Pu = '#7a6cae', Puh = '#a89ad6', Pul = '#d4cce6', Pum = '#6c6190', Pud = '#4a4472', Pk = '#2e2852', E = '#100c1c', Mg = '#d48ad4', Mgh = '#f4ccf4', Mgd = '#9c56aa', Wg = '#8c86b4', Wv = '#5ad0f0', Vs = '#3e4252', Vsh = '#7c8496', w = f ? -2.6 : 0;
      const kite = (x0, y0, x1, y1, wd, lit, dim, t) => crystal(p, E, x0, y0, x1, y1, wd, lit, dim, t);
      const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
      const limb = (pts, w0, col, hi) => { for (let i = 1; i < pts.length; i++) { seg(p, E, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w0 + 1.4, w0 + 0.6); seg(p, col, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w0, w0 - 0.8); if (hi) seg(p, hi, pts[i - 1][0] - 0.6, pts[i - 1][1], pts[i][0] - 0.6, pts[i][1], w0 * 0.3, w0 * 0.2); } };
      mass([49.4, 46, 50, 34, 52.6, 20, 56, 9 + w, 55, 20, 53.4, 34, 52, 46], Wg);
      curve(p, Wv, bez(50.8, 44, 52, 28, 55.2, 13 + w, 8), 0.6, 0.4); p.poly('#6c66a0', [52, 46, 53.4, 34, 55, 20, 53.4, 30, 52.6, 40]);
      mass([60, 52, 64, 44, 72, 33, 84, 22.6 + w * 0.6, 93.4, 15.6 + w, 88.6, 22 + w * 0.6, 80, 32, 72, 42, 66, 50, 62, 55], Wg);
      p.poly('#6c66a0', [62, 55, 66, 50, 72, 42, 80, 32, 88.6, 22 + w * 0.6, 82, 30, 72, 40, 64, 52]);
      curve(p, Wv, bez(63, 51, 74, 36, 90, 18.6 + w, 8), 0.7, 0.4); curve(p, Wv, bez(66, 48, 74, 42, 80, 33, 6), 0.6, 0.4);
      ringBand(p, Wv, 66.4, 46.6, 2.6, 2.2, 0.7, 0, Math.PI * 2);
      kite(37.6, 45.6, 27.6, 18, 5.4, Mgh, Mg, 0.6); p.poly(Mgh, [31, 41, 34.6, 39.4, 37, 46, 33, 47]);
      limb([[70, 69], [74.6, 78], [72.6, 89]], 4.4, Pud, Pum); p.poly(E, [70.6, 87.4, 75, 88, 72.4, 93.6]);
      mass([33, 50, 36, 44, 42, 41, 50, 40, 56, 41, 62, 44, 64, 50, 60, 56, 50, 58, 40, 57], Pu);
      p.poly(Puh, [34.6, 46, 38, 42.6, 44, 41, 50, 40.6, 46, 43, 39, 45.4]); seg(p, Pul, 40, 42.4, 46, 41.4, 0.8);
      mass([54, 58, 62, 55, 72, 53, 80, 52.4, 86.6, 51, 85, 58, 82, 65, 76, 70, 66, 71.4, 58, 70, 54, 65], Pum);
      p.poly(Puh, [56, 57, 62, 55.6, 72, 53.6, 80, 53, 85.6, 52, 84.6, 55, 76, 56.6, 66, 58, 58, 60]);
      p.poly(Pud, [58, 70, 66, 71.4, 76, 70, 82, 65, 74, 65.6, 64, 66.4]); seg(p, Pk, 62, 60.4, 64, 70, 0.7); seg(p, Pk, 72, 57, 74, 68, 0.7);
      kite(57.6, 60.4, 87.4, 50.4, 4.6, Mgh, Mg, 0.25);
      mass([45, 51, 48, 47.4, 56, 46, 60.4, 48, 58.6, 52.4, 52, 53, 48.6, 57, 45.6, 56], Vs);
      p.poly(Vsh, [47.6, 49, 50, 47.6, 56, 46.8, 59, 48.2, 54, 49, 49, 50.6]);
      p.ell(E, 61, 54.6, 2.2, 2); p.ell(Wv, 61, 54.6, 1.6, 1.4); p.ell('#e8faff', 60.6, 54.2, 0.7, 0.6);
      limb([[57, 72], [60, 81], [61.4, 88]], 4, Pud, Pum); p.poly(E, [59.4, 86.6, 63.4, 87.4, 61.4, 92.4]);
      mass([21.4, 61, 27, 57, 35, 54, 42, 52.6, 48, 56, 51, 62, 49, 68.6, 44, 72.4, 36, 74, 29, 72.6, 24, 69, 21.4, 65], Pu);
      p.poly(Puh, [22.6, 60.6, 27.6, 57.6, 35, 55, 41, 54, 38, 58, 30, 60.6, 24, 63.4]);
      p.poly(Pud, [24, 69, 29, 72.6, 36, 74, 44, 72.4, 49, 68.6, 42, 69.4, 34, 70, 28, 68]);
      seg(p, Pk, 36, 55, 34, 67, 0.7); seg(p, Pk, 44, 57, 46.4, 68, 0.7);
      seg(p, Pul, 41, 63.4, 46.4, 66.6, 1.2, 0.6); seg(p, Pul, 49.4, 58.4, 51.4, 61.6, 1, 0.6);
      mass([5.4, 53.6, 10, 56.4, 12.6, 61, 16, 65.6, 20, 67.6, 24.4, 66, 30.6, 66, 27, 70, 30, 72.6, 25, 74, 22.6, 77, 21, 81.6, 14, 78, 8.6, 72, 5.4, 64], Mg);
      p.poly(Mgh, [6, 55.2, 8.6, 60, 10.4, 66, 14.6, 73, 19.6, 79.4, 15, 75.4, 10, 69, 6.6, 61]);
      p.poly(Mgd, [12, 62, 16, 66.4, 20, 68.6, 24.4, 66.8, 22, 69.6, 17, 69.4]);
      kite(44, 73.4, 33.6, 86, 3.6, Mgh, Mg, 0.35); kite(29.6, 75, 29, 83.4, 2.6, Mgh, Mg, 0.3);
      limb([[41, 72], [44, 84], [46, 92]], 4.4, Pud, Pum); p.poly(E, [43.6, 90.6, 48.4, 91, 46.4, 96.6]);
    },
    skaracabaz(p, f) {
      const N = '#141c3a', Nh = '#2c3a68', Nd = '#080c1c', Au = '#e0b040', Auh = '#fff0a0', T = '#40e0d0', Th = '#d0fff8', V = '#8a5aff', Wm = '#4a7ab8', Wh = '#a0d8ff', wy = f ? -6 : 0;
      for (const s of [-1, 1]) {
        p.poly(Nd, [50, 40, 50 + s * 44, 4 + wy, 50 + s * 50, 22 + wy, 50 + s * 22, 46]); p.poly(Wm, [50, 40, 50 + s * 42, 8 + wy, 50 + s * 46, 21 + wy, 50 + s * 22, 43]);
        seg(p, Wh, 50 + s * 6, 40, 50 + s * 40, 10 + wy, 1);
        p.poly(Nd, [50, 48, 50 + s * 40, 40 - wy, 50 + s * 46, 56 - wy, 50 + s * 18, 58]); p.poly(Wm, [50, 48, 50 + s * 38, 43 - wy, 50 + s * 42, 54 - wy, 50 + s * 18, 55]);
        for (const k of [0, 1, 2]) { seg(p, Nd, 50 + s * 12, 54 + k * 6, 50 + s * (30 + k * 3), 62 + k * 8, 3); seg(p, Au, 50 + s * (30 + k * 3), 62 + k * 8, 50 + s * (28 + k * 4), 80 + k * 6, 2); }
      }
      p.ell(Nd, 50, 72, 16, 24); p.ell(N, 50, 70, 14, 22); p.ell(Nh, 45, 62, 5, 11);
      for (const y of [60, 68, 76, 84]) seg(p, Au, 37, y, 63, y, 1.4);
      gem(p, Th, T, 50, 70, f ? 5 : 4);
      p.poly(Nd, [44, 90, 56, 90, 50, 100]); p.poly(V, [46, 90, 54, 90, 50, 99]);
      p.ell(Nd, 50, 42, 16, 12); p.ell(N, 50, 41, 14, 10); p.ell(Nh, 45, 38, 5, 4);
      gem(p, Th, T, 50, 43, 2.6);
      p.ell(Nd, 50, 26, 11, 10); p.ell(N, 50, 25, 10, 9);
      for (const s of [-1, 1]) { p.poly(Au, [50 + s * 3, 18, 50 + s * 12, 2, 50 + s * 9, 18]); p.poly(Auh, [50 + s * 4, 18, 50 + s * 11, 5, 50 + s * 8, 17]); p.poly(Au, [50 + s * 8, 20, 50 + s * 22, 10, 50 + s * 13, 24]); }
      p.poly(Au, [47, 18, 50, 6, 53, 18]);
      gem(p, Th, V, 45, 25, 2.4); gem(p, Th, V, 55, 25, 2.4);
      p.poly(Nd, [44, 31, 50, 37, 56, 31, 54, 35, 50, 39, 46, 35]);
    },
    phantylia2(p, f) { ART.phantylia(p, f, true); },
    skaracabaz_e(p, f) { ART.skaracabaz(p, f); },
    skaracabaz_e2(p, f) { ART.skaracabaz(p, f); },
    phantylia(q, f, dark) {
      const sy = 6, p = { poly: (k, a) => q.poly(k, a.map((v, i) => (i % 2 ? v + sy : v))), ell: (k, x, y, rx, ry, r) => q.ell(k, x, y + sy, rx, ry, r), rect: (k, x, y, w, h) => q.rect(k, x, y + sy, w, h), snap: (k, x, y, w, h) => q.snap(k, x, y + sy, w, h), clipPoly: (a, fn) => q.clipPoly(a.map((v, i) => (i % 2 ? v + sy : v)), fn) };
      const c = dark ? { T: '#4c1c5c', Th: '#7c3c8c', Tl: '#8c4c9c', Td: '#2c0e3a', Pr: '#c02c64', Dk: '#3a2438', Dkd: '#24142a', Y: '#f8a8e0', Ye: '#e070c0', Yh: '#fff0fa', Yg: '#b860a8', Sk: '#d6cce8', Sks: '#a698c8', Lip: '#c03a7a', Hb: '#7a3aa0' }
        : { T: '#127484', Th: '#3c9ca4', Tl: '#5aa8ac', Td: '#0a4654', Pr: '#5a48a6', Dk: '#3a463c', Dkd: '#262e28', Y: '#fce050', Ye: '#f0b830', Yh: '#fffbd8', Yg: '#c8d088', Sk: '#d4d6ea', Sks: '#a4a6c8', Lip: '#3c9cae', Hb: '#4a54a4' };
      const E = '#0c0c16', Au = '#b0a24e', Auh = '#d8cc7c', Aul = '#f6eeb4', Aud = '#6c6232', Rim = '#b8ae88', K = '#15171f', Kh = '#323844', Hk = '#211f2c', Skh = '#f0f0fa';
      const Fn = '#e8e6da', Fnh = '#fbfaf2', Fny = '#d6c47a', Fr = '#c8a440', Bo = '#827e3c', Boh = '#a8a452', Bog = '#6c9a56', Bod = '#4c4a26', Ol = '#5a5644', sw = f ? 0.7 : 0;
      const mass = (pts, col) => glowing(p, E, 0.8, g => g.poly(col, pts));
      const lens = (x0, y0, x1, y1, wd) => { const dx = x1 - x0, dz = y1 - y0, L = Math.hypot(dx, dz) || 1, nx = -dz / L, ny = dx / L, a = [], b = []; for (let i = 0; i <= 14; i++) { const t = i / 14, k = Math.pow(Math.sin(Math.PI * (0.16 + 0.84 * t)), 0.62) * wd, x = x0 + dx * t, y = y0 + dz * t; a.push(x + nx * k, y + ny * k); b.unshift(x - nx * k, y - ny * k); } return a.concat(b); };
      const petal = (x0, y0, x1, y1, wd, fill, shade, ring) => {
        const m = lens(x0, y0, x1, y1, wd), dx = x1 - x0, dz = y1 - y0, L = Math.hypot(dx, dz) || 1, nx = -dz / L * 40, ny = dx / L * 40;
        p.poly(E, lens(x0, y0, x1, y1, wd + 1.7)); p.poly(c.Pr, lens(x0, y0, x1, y1, wd + 1)); p.poly(Rim, lens(x0, y0, x1, y1, wd + 0.4)); p.poly(fill, m);
        p.clipPoly(m, () => { p.poly(shade, [x0, y0, x1, y1, x1 - nx, y1 - ny, x0 - nx, y0 - ny]); if (ring) { ringBand(p, c.Tl, ring[0], ring[1], ring[2], ring[2], 0.75, 0, 6.3); if (ring[3]) for (let k = 0; k < 12; k++) { const t = k / 12 * 6.283; p.ell(c.Tl, ring[0] + Math.cos(t) * ring[3], ring[1] + Math.sin(t) * ring[3], 0.45, 0.45); } } });
      };
      const flame = (x0, y0, cx, cy, x1, y1, wd) => { const cl = bez(x0, y0, cx, cy, x1, y1, 16), A = [], B = []; for (let i = 0; i < cl.length; i++) { const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, k = wd * Math.pow(1 - i / (cl.length - 1), 0.55); A.push(cl[i][0] - dz / l * k, cl[i][1] + dx / l * k); B.unshift(cl[i][0] + dz / l * k, cl[i][1] - dx / l * k); } return { all: A.concat(B), half: A.concat(cl.slice().reverse().flat()), cl }; };
      const flames = list => { const sh = list.map(v => flame(...v)); for (const o of sh) glowing(p, E, 0.9, g => g.poly(E, o.all)); for (const o of sh) { p.poly(Au, o.all); p.poly(Auh, o.half); curve(p, Aul, o.cl.slice(2, 11), 0.6, 0.3); } };
      const branch = (x0, y0, cx, cy, x1, y1, n) => {
        const cl = bez(x0, y0, cx, cy, x1, y1, 10); curve(p, E, cl, 2.8, 1.4); curve(p, Au, cl, 1.7, 0.6); curve(p, Aul, cl.slice(0, 7), 0.5, 0.3);
        for (let k = 1; k <= n; k++) { const i = Math.round(k * 10 / (n + 1)), [x, y] = cl[i], [xa, ya] = cl[i - 1], a = Math.atan2(y - ya, x - xa) + (k % 2 ? -0.75 : 0.75); shard(p, E, null, x, y, 3.6, a, 1.2); shard(p, Au, Auh, x, y, 2.9, a, 0.75); }
      };
      const strand = (x0, y0, cx, cy, x1, y1, wd) => { const o = flame(x0, y0, cx, cy, x1, y1, wd); mass(o.all, '#1c1e30'); p.poly('#343c6a', o.half); };
      curve(p, c.Pr, bez(6.6, 43.6, 3.8, 66, 12.6 + sw, 80, 14), 0.9, 0.6); curve(p, Rim, bez(5, 46, 2.4, 64, 7, 77, 10), 0.6, 0.4);
      petal(60, 30, 69, 8.6, 6.4, c.Dk, c.Dkd);
      petal(66, 44, 93.4, 42, 6, c.T, c.Td);
      petal(66, 36, 89.6, 18.2, 6.2, c.T, c.Td, [79.6, 27.4, 3.6]);
      petal(80, 62, 82.4, 95.6, 7, c.T, c.Td);
      petal(88, 68, 97.6, 88, 4, c.T, c.Td);
      petal(62, 56, 96.4, 64.6, 9.6, c.T, c.Td, [80.6, 58.4, 5.6]);
      petal(50, 36, 50.4, 3.4, 7.6, c.T, c.Td, [50.6, 21, 5.8]);
      petal(40, 58, 12, 57, 11, c.T, c.Td);
      petal(36, 61, 19.4, 60.6, 6.6, c.T, c.Td, [27.6, 60.6, 4]);
      petal(31, 71, 13, 71.4, 2.6, c.T, c.Td);
      petal(37, 42, 18.8, 28.4, 5, c.T, c.Td, [27.4, 35.6, 3]);
      branch(64, 27.6, 76, 24, 88.6, 19 - sw * 0.4, 3); branch(62, 33, 70, 32, 80.4, 30.6, 2); branch(56, 38, 70, 34.6, 85, 35.6 + sw * 0.3, 3); branch(58, 42.6, 68, 41, 79, 41.4, 2); branch(58, 57, 66, 55, 76, 54, 2);
      mass([35, 46, 38.6, 42.4, 47, 41, 55, 42, 60, 46, 61.6, 52, 60, 58, 56, 61, 50, 62, 46, 62, 41, 61, 36.6, 56], Hk);
      for (const [x0, y0, cx, cy, x1, y1] of [[52, 46.6, 57, 48.6, 58.8, 56], [50.6, 49.6, 54.4, 52.6, 55, 59.4], [54, 45, 59.4, 47, 60.6, 52.4], [49.6, 53, 51.6, 57, 51.4, 61]]) curve(p, c.Hb, bez(x0, y0, cx, cy, x1, y1, 8), 0.8, 0.3);
      mass([50.4, 62, 55.6, 58, 62, 58.6, 67, 62.6, 68, 70, 62, 72.4, 54, 72.6, 50, 68], '#76787f'); p.poly('#9a9ca4', [52, 62, 55.6, 59.2, 61.4, 59.8, 57.6, 62.6, 53.4, 65]);
      for (const [rx, ry] of [[9.4, 10.6], [7.2, 8.4]]) { ringBand(p, E, 59, 68.4, rx + 0.5, ry + 0.5, 2.6, 0.6 * Math.PI, 1.98 * Math.PI); ringBand(p, Au, 59, 68.4, rx, ry, 1.6, 0.62 * Math.PI, 1.96 * Math.PI); ringBand(p, Aul, 59, 68.4, rx, ry, 0.5, 1.1 * Math.PI, 1.6 * Math.PI); }
      mass([30.6, 73, 34, 66.6, 40, 64.4, 44, 64.4, 49.6, 66, 51.6, 72, 51.6, 82, 50.6, 92, 26.4, 92, 25.4, 85], Ol);
      p.poly(c.Sk, [47.2, 67, 50.6, 67.6, 51.6, 74, 51.4, 86, 50.6, 92, 47.6, 92, 48.4, 84, 48, 74]); p.poly(c.Sks, [49.8, 68, 51.6, 74, 51.4, 86, 50.6, 92, 49.6, 84, 49.8, 74]);
      mass([25.6, 84, 30, 80.6, 36, 79.4, 42, 79.6, 47.6, 81, 48.8, 85, 48.6, 92, 25, 92], Bo); p.poly(Bog, [41, 79.8, 47.6, 81, 48.8, 85, 48.6, 90, 46, 87, 44, 83]); p.poly(Boh, [28, 83, 33, 80.8, 38, 80.6, 33.6, 82.6, 29.4, 85]); seg(p, Bod, 37, 81, 36, 92, 0.6);
      mass([41.6, 59.4, 46, 58, 47.4, 62, 48, 66.4, 42.4, 66.6, 42, 62], c.Sk); p.poly(c.Sks, [45, 58.4, 46.6, 58.6, 47.4, 62, 48, 66.4, 46, 66.4, 46.2, 62]);
      mass([43.4, 63.4, 50.4, 61.8, 51.4, 65.2, 47.4, 67.6, 44, 66.8], K); seg(p, Au, 44, 63.6, 50.4, 62.2, 0.6); for (const x of [45.6, 47.4, 49.2]) seg(p, Au, x, 63.6, x + 0.8, 65.2, 0.5);
      glowing(p, E, 0.6, g => g.poly(Au, [40.4, 67.4, 39.4, 63.6, 40.6, 59.6, 42, 63.4, 42.4, 67])); p.poly(Auh, [40.6, 66.4, 40.2, 63.6, 40.8, 61, 41.2, 64]);
      for (const [x, y] of [[36.4, 67.6], [38.4, 68.8], [40.6, 69.4], [42.8, 68.8]]) { glowing(p, E, 0.5, g => g.ell(Au, x, y, 1.1, 1.1)); p.ell(Aul, x - 0.4, y - 0.4, 0.4, 0.4); }
      mass([50.4, 72.6, 55, 70.4, 60.4, 70.2, 64.6, 72.4, 66.8, 79, 67, 86, 66.4, 92, 51, 92, 51.6, 84], K);
      p.poly(Kh, [60.6, 71.6, 64.6, 72.4, 66.8, 79, 67, 88, 64.6, 88, 63.6, 78]); p.poly('#4a5260', [63.4, 74, 65, 74.6, 66.2, 80, 66.2, 86, 65, 86, 64.4, 79]); curve(p, Au, bez(51, 72.6, 56, 69.8, 63.4, 71.2, 8), 0.8, 0.6); curve(p, '#9aa0ac', bez(64.6, 73, 66.8, 80, 66.6, 90, 8), 0.5, 0.4);
      const tilt = (v, i, a) => i % 2 ? v - (a[i - 1] - 31.4) * 0.08 : v, fan = circle(31.4, 79.2, 12.8, 6.4, 28).map(tilt), fanIn = circle(31.4, 79.2, 11.8, 5.5, 28).map(tilt);
      glowing(p, E, 0.9, g => g.poly(Fr, fan)); p.poly(Fn, fanIn);
      p.clipPoly(fanIn, () => { p.ell(Fny, 33, 85, 14, 4.6); p.ell(Fnh, 28, 75.6, 7, 2.6); curve(p, '#c8b46c', bez(24, 79, 31, 76, 38, 79.4, 8), 0.6, 0.4); curve(p, '#c8b46c', bez(27, 82, 33, 80.4, 39, 82, 8), 0.5, 0.3); });
      for (const [x0, y0, x1, y1] of [[21, 79, 15.4, 74.4], [20.6, 80.4, 14.6, 80.6], [21.4, 78, 19.6, 72.6]]) { leaf(p, E, x0, y0, x1, y1, 2, 2); leaf(p, '#2ab0a0', x0, y0, x1, y1, 1.3, 1.3); leaf(p, '#7ee0c8', x0, y0, x1, y1, 1.3, 0); }
      seg(p, E, 19, 81.4, 12.4, 84.6, 2.6); seg(p, Au, 19, 81.4, 12.4, 84.6, 1.4);
      mass([2.6, 86, 6, 82.6, 10.6, 80.4, 15.6, 80, 19.4, 81.6, 20.4, 84.6, 18, 87.6, 13, 89.6, 7, 90.8, 3, 90.2], '#0f1c26');
      p.poly('#1e3e4c', [6, 83, 10.6, 81.2, 15.4, 80.8, 12.6, 83, 8, 84.6]); for (const [x0, y0, x1, y1] of [[12.6, 83, 16.6, 86.4], [9.6, 84.2, 13, 88.4], [15.4, 82, 19, 84.6]]) seg(p, '#2a5866', x0, y0, x1, y1, 0.5); curve(p, Au, bez(3.4, 89.6, 8, 86, 13.6, 87.8, 8), 0.5, 0.4);
      strand(31.6, 66, 29.4, 72.6, 40.6 + sw, 75.6, 2.2); strand(40, 68, 45.6, 72, 47 + sw, 81, 2);
      const face = [39.4, 44.6, 43, 44, 46.6, 44.4, 48.4, 46.6, 48.8, 50.6, 48, 54.4, 46.4, 57.8, 44.4, 60.2, 42.6, 61.2, 41, 60.6, 39.4, 58.4, 38.4, 55, 38, 51, 38.2, 47.2];
      mass(face, c.Sk);
      p.clipPoly(face, () => { p.poly(c.Sks, [46, 44, 50, 44, 50, 62, 44, 62, 46.4, 56, 47, 50]); p.poly(Skh, [39.6, 46.6, 42.6, 45.8, 41.6, 50, 40, 54, 39.2, 50]); p.poly(c.Sks, [38, 57, 41.4, 59.6, 44.4, 60, 42.6, 62, 38, 62]); });
      p.poly(E, [43.6, 45.4, 44.8, 48, 43.6, 51.2, 42.4, 48]); p.poly(Au, [43.6, 45.9, 44.4, 48, 43.6, 50.6, 42.8, 48]); p.ell(c.Yg, 43.6, 48.2, 0.5, 0.8); seg(p, Au, 40.4, 46.6, 42.8, 47.4, 0.5); seg(p, Au, 44.4, 47.4, 46.8, 46.6, 0.5);
      curve(p, E, bez(39.4, 51, 40.6, 52.2, 42.2, 51.4, 6), 0.8, 0.6); seg(p, c.Th, 39.6, 50.2, 41.8, 50.4, 0.5);
      curve(p, E, bez(45.4, 52.4, 46.6, 53, 47.8, 52, 6), 0.7, 0.5); seg(p, '#c8909c', 45.6, 53.4, 47.4, 53.2, 0.4);
      seg(p, c.Sks, 44.4, 55, 44, 56.2, 0.5); p.poly(c.Lip, [40.4, 57.6, 41.6, 57.2, 42.8, 57.6, 41.8, 58.6]); seg(p, E, 40.6, 57.7, 42.6, 57.7, 0.3);
      mass([36, 45, 38.4, 42.6, 43, 42, 50, 42.4, 55, 44, 57, 47, 55, 48.4, 52, 46.4, 48.6, 45.6, 46.8, 45.2, 44.6, 44.2, 41.6, 44.6, 39.6, 47.6, 38.8, 52, 38.8, 57, 39.2, 62, 38.2, 66.4, 36.8, 67, 36.4, 62, 36.2, 56, 35.8, 50], Hk);
      mass([48.8, 46.6, 50.2, 47.2, 51.6, 50, 51.4, 55, 50, 59, 48.2, 61.8, 48.4, 58, 49.4, 54, 49.4, 50], Hk);
      curve(p, c.Hb, bez(38.6, 44.4, 41.6, 43, 45.4, 43.4, 8), 0.9, 0.4); curve(p, c.Hb, bez(47, 43.6, 51, 43.6, 54.6, 45.8, 8), 0.9, 0.4); curve(p, c.Hb, bez(37.4, 48, 37, 56, 37.8, 63, 8), 0.7, 0.3); curve(p, c.Hb, bez(49.6, 47.6, 50.6, 52, 50, 57, 8), 0.6, 0.3);
      for (const [x0, y0, x1, y1] of [[54.6, 44.4, 62, 41.4], [56, 47.6, 62.4, 48.6]]) { seg(p, E, x0, y0, x1, y1, 1.8, 1); seg(p, Au, x0, y0, x1, y1, 1, 0.4); shard(p, Au, Auh, (x0 + x1) / 2, (y0 + y1) / 2, 2.2, -1.9, 0.5); }
      for (let k = 0; k < 4; k++) { p.ell(E, 57.4, 49 + k * 2, 0.9, 0.9); p.ell(Au, 57.4, 49 + k * 2, 0.55, 0.55); }
      for (const [x, y, l, a] of [[30.6, 15, 2.6, 3.4], [30, 21.4, 2.4, 3.1], [30.4, 25.6, 5.4, 3.12], [30.8, 32.8, 4, 2.9], [32.4, 37.2, 4, 2.8]]) { shard(p, E, null, x, y, l + 0.8, a, 1.2); shard(p, Au, Aud, x, y, l, a, 0.75); }
      const crownL = [35.4, 44, 32.4, 40, 30.6, 34, 29.8, 27, 29.8, 20, 30.4, 14.4, 31.6, 11.8, 32.8, 14.2, 34.6, 9.2, 35.8, 11.2, 37.4, 7.6, 40.4, 3.2, 41, 6.8, 42.2, 10.6, 43, 16, 43.6, 22, 44, 30, 43, 38, 41, 43];
      const crownR = [47, 42, 46.8, 36, 47.6, 32, 49.6, 27.4, 52.6, 21, 55.6, 16, 58.4, 12, 61, 9, 62.8, 6.2, 63.6, 9.4, 65.6, 9.4, 64.4, 12.2, 67.6, 12.4, 70, 13 - sw * 0.3, 68.6, 17, 71.2, 18.6, 74, 20.2 - sw * 0.3, 71.4, 23.6, 69.6, 26.6, 73.8, 29.4, 78.6, 32.2, 83.2, 34.8 + sw * 0.3, 78.4, 36.4, 72, 37.8, 65, 39.8, 58.4, 41.4, 52, 42.6];
      glowing(p, E, 0.9, g => { g.poly(Au, crownL); g.poly(Au, crownR); });
      p.clipPoly(crownL, () => {
        p.poly('#857a40', [28, 0, 46, 0, 46, 17, 40, 14, 34, 17, 28, 19]);
        for (const [x0, y0, cx, cy, x1, y1] of [[34.8, 41.4, 33.2, 26, 34.4, 10.6], [40.2, 38.6, 39, 22, 40.4, 9.6]]) { curve(p, E, bez(x0, y0, cx, cy, x1, y1, 10), 1.1, 0.5); curve(p, Aud, bez(x0 + 0.6, y0, cx + 0.6, cy, x1 + 0.6, y1, 10), 0.7, 0.4); }
        for (const [x0, y0, cx, cy, x1, y1] of [[31.2, 38, 30.2, 25, 31.4, 13.6], [35.8, 39, 34.6, 24, 35.6, 11], [36.4, 12, 38, 7, 40.2, 4], [41, 36, 40.4, 22, 40.8, 10]]) curve(p, Aul, bez(x0, y0, cx, cy, x1, y1, 10), 0.8, 0.3);
      });
      p.clipPoly(crownR, () => {
        p.poly('#857a40', [50, 0, 90, 0, 90, 18, 70, 15, 60, 20, 50, 28]);
        for (const [x0, y0, cx, cy, x1, y1] of [[51.6, 39.6, 59.6, 27, 68.6, 15.4], [56.6, 41.4, 66.6, 33, 73, 22.6]]) { curve(p, E, bez(x0, y0, cx, cy, x1, y1, 12), 1.2, 0.6); curve(p, Aud, bez(x0 + 0.6, y0 + 0.6, cx + 0.6, cy + 0.6, x1 + 0.4, y1 + 0.4, 12), 0.8, 0.4); }
        for (const [x0, y0, cx, cy, x1, y1] of [[48, 35, 51.6, 24, 61, 8.4], [53.6, 38.6, 61.6, 28.4, 69.4, 14.6], [58.4, 41, 68.6, 34.4, 81.6, 35]]) curve(p, Aul, bez(x0, y0, cx, cy, x1, y1, 12), 0.8, 0.3);
      });
      p.ell(E, 36.6, 13.6, 0.8, 1.6); p.ell(E, 32, 21, 0.6, 1.4); curve(p, E, bez(60, 19.4, 62.6, 15, 65.6, 17, 6), 1.1, 0.6);
      curve(p, E, bez(33.4, 45.4, 44, 40.6, 55.6, 43.6, 14), 2.8, 2.4); curve(p, Au, bez(33.4, 45.4, 44, 40.6, 55.6, 43.6, 14), 1.8, 1.4); curve(p, Auh, bez(34, 44.8, 44, 40.2, 55, 43, 14), 0.5, 0.4);
      const fx = 43.4, fy = 33.6, PET = [[-1.55, 9], [-0.3, 9.4], [0.77, 9], [2.1, 8.4], [3.46, 8.8]].map(([a, l]) => [fx, fy, fx + Math.cos(a) * l, fy + Math.sin(a) * l]);
      for (const [x0, y0, x1, y1] of PET) leaf(p, E, x0, y0, x1, y1, 5, 5);
      for (const [x0, y0, x1, y1] of PET) { leaf(p, c.Ye, x0, y0, x1, y1, 4.4, 4.4); leaf(p, c.Y, x0, y0, x1, y1, 3.6, 3.6); leaf(p, c.Yg, x0, y0, x0 + (x1 - x0) * 0.55, y0 + (y1 - y0) * 0.55, 1.5, 1.5); }
      p.ell(c.Yh, fx, fy, f ? 2.3 : 2, f ? 2.3 : 2);
    },
    lotus_ab(p, f) { lotusArt(p, f, { ink: '#7a3315', back: '#f1bb97', backD: '#dba272', backR: '#f79e5b', fill: '#f9c89a', fillD: '#f0af7e', rim: '#f79e5b', mark: '#f4c85c', markL: '#fefd8f', markAt: [0.24, 0.2], star: '#fce287', starD: '#f4b85d', starL: '#fefd8f', dot: '#e9905b', round: true }); },
    lotus_de(p, f) { lotusArt(p, f, { ink: '#1e0806', back: '#53150f', backD: '#3a0e0a', backR: '#cd9f78', fill: '#84130d', fillD: '#53150f', rim: '#eebc7c', mark: '#fea05b', markL: '#f9d79b', markAt: [0.12, 0.32], glow: '#84130d', glowL: '#ce1e0f', glow2: '#fea05b', star: '#f6d2bc', starD: '#e0a080', starL: '#fff0e4' }); },
    trotter(q, f) {
      const dy = f ? -1.6 : 0, p = { poly: (c, a) => q.poly(c, a.map((v, i) => (i % 2 ? v + dy : v))), ell: (c, x, y, rx, ry, r) => q.ell(c, x, y + dy, rx, ry, r), rect: (c, x, y, w, h) => q.rect(c, x, y + dy, w, h), snap: (c, x, y, w, h) => q.snap(c, x, y + dy, w, h), clipPoly: (a, fn) => q.clipPoly(a.map((v, i) => (i % 2 ? v + dy : v)), fn) };
      const E = '#0c0c10', Bk = '#17161a', Bh = '#2c2a2e', W = '#ececf2', Wl = '#ffffff', Ws = '#bcbccc', Wd = '#8a8aa0', Au = '#d2aa58', Auh = '#f0d690', Aud = '#8e6c2c';
      const C = '#f4e6c4', Cl = '#fff8e6', Cs = '#cdb88a', Cd = '#8e7c56', Hf = '#2a221c';
      const mass = (pts, col) => glowing(p, E, 0.8, r => r.poly(col, pts));
      const leg = (pts, lit, sh, claw) => {
        mass(pts, C); p.poly(Cl, lit); p.poly(Cs, sh);
        p.poly(Hf, claw); seg(p, Cd, claw[0] + (claw[2] - claw[0]) * 0.5, claw[1] + (claw[3] - claw[1]) * 0.5, claw[4], claw[5], 0.6);
      };
      mass([15.6, 38, 15.8, 25, 18.6, 13, 22.6, 5.6, 27.6, 3.4, 31, 4.8, 32, 12, 31, 20, 26, 28, 20, 36], W);
      p.poly(Wl, [17.4, 30, 18.6, 17, 22, 8.6, 25.6, 6.4, 22.6, 14, 20, 26]); p.poly(Ws, [31, 6, 32, 12, 31, 20, 26.4, 27.6, 28.6, 18, 30, 10]);
      leg([64.6, 50.4, 76, 49.4, 81, 57, 82, 68, 79.6, 78, 75.6, 86.4, 72, 82, 69.4, 73, 66.6, 63], [69, 53.4, 76, 52, 79, 60, 78.4, 70, 74, 63.6], [66.6, 63, 69.4, 73, 72, 82, 73.6, 76.6, 70.6, 67], [72.4, 81.4, 78.6, 80.4, 75.6, 86.4]);
      mass([10.4, 40, 22, 44, 34, 46.4, 48, 47.4, 60, 47.6, 68, 49, 67.4, 58, 63.4, 68, 56.6, 77, 46.6, 82, 35, 82.4, 25.4, 78.4, 17.6, 70.4, 12, 58], Bk);
      curve(p, Bh, bez(22, 50, 32, 47.6, 44, 49.4, 8), 2, 1.2); curve(p, Bh, bez(60, 56, 64, 62, 62, 70, 6), 1.6, 1);
      leg([9.8, 46, 16, 45.6, 21.4, 52, 25.4, 63, 27.4, 75, 27, 84.6, 22.6, 91.4, 18.4, 86, 14.2, 74, 10.8, 60], [11.6, 49, 16, 48, 19.4, 56, 21.6, 68, 16.6, 62], [21.4, 52, 25.4, 63, 27.4, 75, 27, 82, 23.6, 72, 21.6, 60], [17.6, 84, 26.8, 84, 22.6, 91.4]);
      leg([46.6, 51.4, 54.4, 48.6, 61.6, 51.4, 61.4, 62, 59, 72, 55.6, 82, 50.6, 90, 46.4, 95.6, 43.6, 89.4, 43.8, 80, 45.4, 70, 46.6, 60], [48.8, 53.4, 56, 50.6, 58.6, 57, 55.6, 66, 50.6, 64], [59, 72, 55.6, 82, 50.6, 90, 52.6, 80, 56.6, 70.6, 58.4, 62], [43.4, 87.6, 51, 89.4, 46.4, 95.6]);
      const hood = [10, 39.6, 14.4, 37.4, 18.6, 31, 24, 24, 29, 19.6, 36, 16.6, 44, 17.4, 52, 20.4, 58, 25, 62, 30.4, 65.6, 37.6, 69.4, 45, 71.6, 52.4, 69.4, 53.6, 66.4, 48.6, 56, 47.6, 42, 47, 28, 45.8, 18, 42.6];
      mass(hood, W);
      p.clipPoly(hood, () => {
        p.poly(Ws, [56, 47.6, 66.4, 48.6, 69.4, 53.6, 71.6, 52.4, 69.4, 45, 65.6, 37.6, 62, 41, 58, 44.6]);
        for (const [x0, y0, cx, cy, x1, y1] of [[16, 41, 20, 30, 30, 21], [22, 43.4, 27, 32, 36, 21.6], [30, 45.6, 36, 34, 44, 24], [38, 46.6, 46, 36, 54, 27]]) curve(p, Ws, bez(x0, y0, cx, cy, x1, y1, 8), 0.7, 0.5);
        curve(p, Au, bez(23.6, 30, 27, 24, 31.6, 20.4, 6), 1.6, 1);
        curve(p, Au, bez(40.6, 30.6, 46, 26, 53.4, 23.4, 8), 2, 1.4); curve(p, Au, bez(44.6, 34.4, 51, 30, 58.6, 28.4, 8), 1.8, 1.2);
        curve(p, Auh, bez(41, 30, 46, 25.6, 53, 23, 8), 0.6, 0.4);
      });
      seg(p, Au, 18, 43.4, 56, 48.2, 1, 0.8);
      p.ell(E, 39.4, 22.6, 7, 3.4, -0.32); p.ell(Au, 39.4, 22.6, 6.2, 2.7, -0.32); p.ell(Auh, 38.6, 21.8, 4.8, 1.4, -0.32); p.ell(Hf, 39.8, 23.2, 4.6, 1.3, -0.32);
      mass([32, 46, 38, 41, 46, 35, 55, 28.6, 64, 23.4, 73, 19.4, 82, 17.4, 90.6, 16.4, 87.6, 21, 83.4, 28, 79.6, 34.6, 74, 39.2, 66, 41.4, 56, 42.6, 44, 44.6], Au);
      p.poly(Wl, [38, 41, 46, 35, 55, 28.6, 64, 23.4, 73, 19.4, 82, 17.4, 90.6, 16.4, 89, 17.8, 80, 19.4, 70, 23.4, 60, 28.8, 50, 34.8, 40.6, 41.2]);
      p.poly(Auh, [44, 39.6, 52, 34.4, 62, 28.4, 72, 23.6, 82, 20.2, 89, 17.8, 86.4, 21.6, 76, 25.4, 64, 30.6, 52, 37]);
      p.poly(Aud, [44, 44.6, 56, 42.6, 66, 41.4, 74, 39.2, 79.6, 34.6, 74, 37.4, 62, 40, 50, 42.4]);
      curve(p, Aud, bez(50, 40.6, 64, 35.6, 82, 27.6, 8), 0.6, 0.4);
      seg(p, E, 13.8, 41.4, 14.4, 34.4, 2.2, 0.4); seg(p, Au, 13.8, 41, 14.4, 35.2, 1.2, 0.3);
      mass([21, 47.4, 26, 38.6, 31.2, 47.6], Au); p.poly(Auh, [22.6, 46.6, 26, 40.4, 27, 46.8]);
    },
    doomsday(p, f) {
      const W = '#e2e2ee', Ws = '#9c9cba', Wd = '#6a6a8a', D = '#231a3a', Dd = '#120c20', Gv = '#a060ff', Gh = '#ecd8ff', E = '#ffe0ff';
      p.poly(W, [40, 22, 26, 10, 15, 0, 22, 0, 32, 6, 44, 16]); p.poly(Ws, [26, 10, 15, 0, 20, 0, 30, 8]);
      p.poly(W, [60, 22, 74, 10, 85, 0, 78, 0, 68, 6, 56, 16]); p.poly(Ws, [74, 10, 85, 0, 80, 0, 70, 8]);
      shard(p, Ws, null, 22, 40, 26, -2.4, 6); shard(p, Ws, null, 78, 40, 26, -0.75, 6); shard(p, Wd, null, 30, 34, 22, -2.0, 5); shard(p, Wd, null, 70, 34, 22, -1.15, 5);
      p.poly(D, [16, 50, 30, 34, 50, 30, 70, 34, 84, 50, 80, 78, 62, 90, 38, 90, 20, 78]);
      seg(p, Gv, 30, 50, 40, 72, 2); seg(p, Gv, 70, 50, 60, 72, 2); seg(p, Gv, 50, 66, 50, 88, 2);
      p.poly(Dd, [30, 86, 42, 86, 44, 97, 28, 97]); p.poly(Dd, [58, 86, 70, 86, 72, 97, 56, 97]);
      p.poly(Ws, [29, 86, 43, 86, 42, 90, 30, 90]); p.poly(Ws, [57, 86, 71, 86, 70, 90, 58, 90]);
      seg(p, D, 20, 58, 14, 80, 10, 8); seg(p, D, 80, 58, 86, 80, 10, 8);
      p.poly(W, [5, 78, 23, 78, 25, 90, 19, 86, 16, 96, 12, 86, 7, 94]); p.poly(W, [95, 78, 77, 78, 75, 90, 81, 86, 84, 96, 88, 86, 93, 94]);
      p.poly(W, [9, 42, 26, 31, 38, 40, 34, 56, 18, 60, 7, 52]); p.poly(Ws, [7, 52, 18, 60, 34, 56, 32, 61, 16, 65]);
      p.poly(W, [91, 42, 74, 31, 62, 40, 66, 56, 82, 60, 93, 52]); p.poly(Ws, [93, 52, 82, 60, 66, 56, 68, 61, 84, 65]);
      p.poly(W, [36, 40, 64, 40, 60, 62, 50, 68, 40, 62]); p.poly(Ws, [50, 40, 64, 40, 60, 62, 50, 68]);
      gem(p, Gh, Gv, 50, 52, f ? 6 : 5);
      p.poly(W, [38, 14, 62, 14, 66, 26, 58, 36, 42, 36, 34, 26]); p.poly(Ws, [50, 14, 62, 14, 66, 26, 58, 36, 50, 36]);
      p.poly(W, [47, 14, 50, 2, 53, 14]);
      p.poly(Dd, [42, 30, 58, 30, 55, 38, 45, 38]); p.snap(W, 44, 31, 2, 2.5); p.snap(W, 49, 31, 2, 2.5); p.snap(W, 54, 31, 2, 2.5);
      gem(p, E, Gv, 43, 23, 2.4); gem(p, E, Gv, 57, 23, 2.4);
    },
    grizzly(p, f) {
      const Bo = '#6474b8', Bh = '#9aaae8', Bd = '#343e76', J = '#1c1e2c', M = '#8a90a4', Y = '#ffe040', Or = '#ff7a30';
      p.poly(J, [52, 0, 58, 2, 60, 24, 52, 24]); p.poly('#5c6072', [53, 1.5, 56, 2.5, 57, 22, 54, 22]);
      p.poly(Bd, [30, 80, 44, 80, 46, 97, 26, 97]); p.poly(Bd, [58, 80, 72, 80, 76, 97, 56, 97]);
      p.ell(Bd, 52, 54, 36, 30); p.ell(Bo, 52, 52, 34, 28); p.ell(Bh, 44, 40, 20, 11);
      seg(p, Bd, 30, 30, 26, 70, 2); seg(p, Bd, 52, 24, 52, 78, 2); seg(p, Bd, 74, 30, 78, 70, 2);
      p.poly(J, [60, 24, 76, 18, 80, 26, 64, 32]); p.ell(M, 66, 26, 8, 5); seg(p, J, 70, 22, 93, 10, 5); p.ell('#3a3e4e', 93, 10, 3, 3);
      p.poly(J, [27, 47, 47, 45, 49, 61, 29, 63]); p.poly('#2c3044', [29, 49, 45, 47, 46, 51, 30, 53]);
      gem(p, '#fff8c0', Y, 34, 55, 2.6); gem(p, '#fff8c0', Y, 42, 54, 2.6);
      seg(p, Bd, 22, 56, 14, 78, 12, 10); p.poly(Bh, [4, 60, 20, 54, 26, 74, 12, 82]); p.poly(Bo, [12, 82, 26, 74, 24, 80, 14, 86]);
      p.poly(J, [5, 82, 21, 82, 23, 92, 17, 88, 12, 97, 9, 88]);
      seg(p, Bd, 82, 56, 88, 78, 12, 10); p.poly(Bo, [96, 60, 80, 54, 76, 74, 90, 82]); p.poly(Bd, [90, 82, 76, 74, 78, 80, 88, 86]);
      p.poly(J, [95, 82, 79, 82, 77, 92, 83, 88, 88, 97, 91, 88]);
      gem(p, '#ffe0b0', Or, 58, 64, f ? 5 : 4);
    },
    svarog_b(p, f) { svarogArt(p, f); },
    cocolia2(p, f) { motherArt(p, f); },
    ethereal(p) {
      const A = '#18151c', Ah = '#36303e', Ad = '#0a080c', O = '#ff5a2a', Oh = '#ffc080', Od = '#9a2a10';
      seg(p, A, 42, 62, 36, 80, 9, 7); seg(p, A, 36, 80, 38, 93, 7, 5); foot(p, Ad, 37, 96, 10, -1);
      seg(p, A, 58, 62, 64, 80, 9, 7); seg(p, A, 64, 80, 62, 93, 7, 5); foot(p, Ad, 63, 96, 10, 1);
      shard(p, O, Oh, 42, 38, 18, -2.0, 4); shard(p, O, Oh, 52, 36, 22, -1.6, 5); shard(p, Od, null, 60, 38, 14, -1.1, 4);
      p.poly(A, [34, 38, 66, 36, 70, 56, 58, 66, 42, 66, 30, 56]);
      p.poly(Ah, [36, 39, 52, 37, 50, 52, 38, 50]);
      seg(p, O, 46, 46, 54, 60, 1.6); seg(p, O, 54, 52, 60, 56, 1.2);
      seg(p, A, 34, 42, 22, 60, 8, 6); seg(p, A, 22, 60, 20, 78, 6, 4); p.poly(Ad, [16, 78, 24, 78, 22, 86, 18, 84]);
      seg(p, A, 66, 42, 78, 58, 8, 6); seg(p, A, 78, 58, 82, 76, 6, 4); p.poly(Ad, [78, 76, 86, 76, 84, 84, 80, 82]);
      p.ell(A, 50, 34, 10, 9); p.ell(Ah, 47, 31, 5, 3);
      p.snap(O, 43, 34, 14, 2.2); p.snap(Oh, 47, 34.4, 6, 1);
    },
    etherhound(p) {
      const A = '#18151c', Ah = '#36303e', Ad = '#0a080c', O = '#ff7a3a', Oh = '#ffd0a0';
      seg(p, A, 72, 58, 78, 76, 7, 6); seg(p, A, 78, 76, 74, 92, 6, 5); foot(p, Ad, 74, 95, 10, 1);
      seg(p, A, 64, 60, 62, 78, 7, 6); seg(p, A, 62, 78, 64, 92, 6, 5); foot(p, Ad, 64, 95, 9, 1);
      seg(p, A, 32, 58, 26, 76, 7, 6); seg(p, A, 26, 76, 28, 92, 6, 5); foot(p, Ad, 27, 95, 10, -1);
      seg(p, A, 40, 60, 40, 78, 7, 6); seg(p, A, 40, 78, 38, 92, 6, 5); foot(p, Ad, 38, 95, 9, -1);
      shard(p, O, Oh, 40, 42, 14, -1.9, 3.5); shard(p, O, Oh, 52, 40, 18, -1.6, 4); shard(p, O, Oh, 64, 41, 14, -1.3, 3.5); shard(p, O, null, 74, 44, 10, -1.0, 3);
      p.poly(A, [24, 50, 36, 40, 64, 38, 82, 46, 84, 58, 66, 64, 36, 64, 24, 60]);
      p.poly(Ah, [36, 41, 64, 39, 80, 46, 62, 44, 38, 46]);
      seg(p, O, 44, 50, 58, 54, 1.4);
      seg(p, A, 82, 50, 94, 40, 5, 2);
      p.poly(A, [6, 52, 14, 40, 28, 40, 32, 52, 24, 60, 10, 60]);
      p.poly(Ah, [14, 41, 26, 41, 24, 46, 15, 47]);
      p.poly(Ad, [6, 54, 22, 56, 20, 60, 8, 59]);
      p.poly(Ad, [16, 41, 18, 31, 22, 41]);
      p.snap(O, 10, 47, 9, 2); p.snap(Oh, 12, 47.4, 3, 1);
    },
    mimic(p, f) {
      const V = '#1c1230', Vh = '#3a2858', Vd = '#0c0816', Mk = '#efe8e4', Ms = '#b8aeb0', O = '#ff7a3a', Oh = '#ffd0a0', sw = f ? 2 : 0;
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; shard(p, i % 2 ? O : '#ff5a2a', Oh, 50 + Math.cos(a) * 10, 20 + Math.sin(a) * 10, 14 + (i % 2) * 6, a, 3); }
      p.poly(Vd, [36, 18, 64, 18, 80 + sw, 96, 20 - sw, 96]);
      p.poly(V, [38, 20, 62, 20, 76 + sw, 94, 24 - sw, 94]);
      p.poly(Vh, [40, 22, 50, 22, 42, 94, 28 - sw, 94]);
      seg(p, Vd, 50, 40, 50, 92, 2); seg(p, Vd, 58, 44, 64, 92, 1.6); seg(p, Vd, 42, 44, 36, 92, 1.6);
      seg(p, V, 40, 36, 24, 56, 7, 5); seg(p, V, 24, 56, 18, 70 - sw, 5, 3); p.poly(Mk, [14, 70 - sw, 20, 68 - sw, 22, 76 - sw, 16, 78 - sw]); p.poly(Ms, [14, 76 - sw, 16, 82 - sw, 18, 76 - sw]);
      seg(p, V, 60, 36, 76, 54, 7, 5); seg(p, V, 76, 54, 84, 66 + sw, 5, 3); p.poly(Mk, [80, 66 + sw, 86, 64 + sw, 88, 72 + sw, 82, 74 + sw]); p.poly(Ms, [84, 72 + sw, 86, 78 + sw, 88, 72 + sw]);
      gem(p, Oh, O, 50, 48, 4);
      seg(p, O, 50, 52, 46, 62, 1.4); seg(p, O, 50, 52, 54, 64, 1.4);
      p.ell(Vd, 50, 20, 11, 12); p.ell(V, 50, 21, 9.5, 10.5);
      p.ell(Mk, 50, 22, 6.5, 8); p.ell(Ms, 52.5, 23, 3, 6.5);
      seg(p, '#3a3040', 48, 15, 51, 28, 0.9);
      p.snap('#1a1420', 46, 21, 2.5, 1); p.snap('#1a1420', 51.5, 21, 2.5, 1);
    },
    gynoid(q, f) {
      const wx = x => 50 + (x - 50) * 1.3;
      const p = { poly: (c, a) => q.poly(c, a.map((v, i) => (i % 2 ? v : wx(v)))), ell: (c, x, y, rx, ry) => q.ell(c, wx(x), y, rx * 1.3, ry), rect: (c, x, y, w, h) => q.rect(c, wx(x), y, w * 1.3, h) };
      const W = '#e2e5fa', Ws = '#bbc8e7', Wd = '#8e9cc4', K = '#16203c', J = '#14161e', F = '#1d3074', Fh = '#3a52a8', B = '#1a2236', Br = '#2c3650', S = '#6ccefb';
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x, c = s < 0 ? W : Ws;
        p.poly(F, [X(7.6), 13, X(12.6), 1.4, X(10.8), 0.6, X(5.4), 10]);
        p.poly(Fh, [X(7.4), 11.4, X(11.4), 2.2, X(10.6), 1.8, X(6.4), 9.6]);
        p.ell(F, X(9.2), 16, 2, 3.2);
        p.poly(Wd, [X(17.4), 31.6, X(12.4), 31.2, X(12.8), 44.6, X(17.6), 44.6]);
        p.poly(c, [X(17), 31.8, X(12.8), 31.6, X(13.2), 44, X(17.2), 44]);
        p.ell(J, X(15.2), 45.4, 2.4, 2.1);
        p.poly(Wd, [X(17.8), 46.4, X(12.8), 46.4, X(13.2), 57.4, X(17.4), 57.4]);
        p.poly(c, [X(17.4), 46.6, X(13.2), 46.6, X(13.6), 57, X(17), 57]);
        p.poly(J, [X(17.4), 57, X(13), 57, X(12.6), 62.6, X(15.2), 64.2, X(17.6), 62]);
        p.ell(Wd, X(13.6), 30.8, 5.4, 4.6);
        p.ell(c, X(13.4), 30.2, 4.8, 3.9);
        p.poly(c, [X(10), 55.6, X(1.6), 57, X(2.4), 72, X(8), 72]);
        p.ell(J, X(5.4), 73.6, 3, 2.4);
        p.poly(F, [X(8.6), 72.4, X(11.6), 69.8, X(9.8), 75.6]);
        p.poly(c, [X(8), 75, X(2.6), 75, X(3), 88.6, X(7), 88.6]);
        p.poly(Wd, [X(8), 75, X(7), 75, X(6.6), 88.6, X(7), 88.6]);
        p.poly(c, [X(7.4), 88.4, X(2.6), 88.4, X(1.2), 94.6, X(6.8), 95.2]);
        p.rect(J, s < 0 ? X(7.6) : X(6.4), 91.6, 1.2, 4.6);
      }
      p.rect(J, 47, 22.6, 6, 5);
      p.rect(Br, 47.6, 24, 4.8, 0.8);
      p.poly(W, [40, 27.6, 60, 27.6, 62, 33, 58.4, 40.6, 50, 42, 41.6, 40.6, 38, 33]);
      p.poly(Ws, [52, 27.6, 60, 27.6, 62, 33, 58.4, 40.6, 52, 41.8]);
      p.poly(Wd, [49.4, 29, 50.6, 29, 50.6, 41.6, 49.4, 41.6]);
      for (const s of [-1, 1]) p.poly(Wd, [50 + s * 3, 36.6, 50 + s * 9.6, 33.4, 50 + s * 9.8, 34.4, 50 + s * 3.2, 37.6]);
      p.rect('#2a3a66', 46.6, 31.4, 6.8, 4.4);
      p.rect(f ? S : '#4a8ab8', 47.6, 32.4, 4.8, 2.4);
      p.rect('#e4f8ff', 48, 32.6, 1.4, 0.8);
      p.poly(B, [42, 41, 58, 41, 56.6, 50, 43.4, 50]);
      for (const y of [43.4, 45.8, 48.2]) p.rect(Br, 43.4, y, 13.2, 0.7);
      p.poly(B, [44, 55, 56, 55, 53, 60, 47, 60]);
      p.poly(W, [39.6, 49.4, 60.4, 49.4, 61.4, 55, 55, 58.4, 50, 55.4, 45, 58.4, 38.6, 55]);
      p.poly(Ws, [52, 49.4, 60.4, 49.4, 61.4, 55, 55, 58.4, 52, 56.6]);
      p.poly(K, [47.4, 51.6, 52.6, 51.6, 50, 54.6]);
      p.ell(Ws, 50, 14.6, 9.2, 10.2);
      p.ell(W, 48.8, 13.6, 8, 9.2);
      p.poly(K, [41.2, 11.6, 58.8, 11.6, 59.2, 19.6, 54.4, 23.4, 45.6, 23.4, 40.8, 19.6]);
      p.poly('#3a4a78', [43.4, 13, 49.6, 13, 45.8, 19.4, 42.6, 18.2]);
      if (f) p.rect(S, 53, 14, 3.2, 0.8);
    },
    hecate(p, f) {
      const D = '#1c141e', V = '#3a2a40', Vh = '#5e4a66', Cr = '#c81e40', Cd = '#7a1028', Cp = '#ff5a8a', Mk = '#f2eaee', Ms = '#b8a8b6', St = '#eaf6ff', Hl = '#ff4aa8', sw = f ? 1.4 : 0;
      ringBand(p, Hl, 50, 15, 19, 15, 1.4, 0, Math.PI * 2);
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        for (let k = 0; k < 7; k++) {
          const ang = -1.25 + k * 0.36, len = 30 - Math.abs(k - 3) * 2.6, bx = 13, by = 35;
          const tx = bx + Math.cos(ang) * len, ty = by + Math.sin(ang) * len + (k > 3 ? sw : -sw);
          const cxp = bx + Math.cos(ang - 0.55) * len * 0.62, cyp = by + Math.sin(ang - 0.55) * len * 0.62;
          const pts = bez(X(bx), by, X(cxp), cyp, X(tx), ty, 8);
          const ex = X(tx + Math.cos(ang + 1.9) * 3.6), ey = ty + Math.sin(ang + 1.9) * 3.6;
          pts.push([ex, ey]);
          curve(p, k % 2 ? Cd : Cr, pts, 3.6, 0.8);
          curve(p, Cp, pts.slice(1, 6), 0.7, 0.3);
        }
        for (let k = 0; k < 4; k++) {
          const ang = -0.9 + k * 0.45, len = 36 - k;
          const pts = bez(X(14), 34, X(14 + Math.cos(ang - 0.35) * len * 0.6), 34 + Math.sin(ang - 0.35) * len * 0.6, X(14 + Math.cos(ang) * len), 34 + Math.sin(ang) * len, 6);
          curve(p, Cp, pts, 0.5, 0.4);
          const t = pts[pts.length - 1];
          p.ell('#ffd0e0', t[0], t[1], 0.9, 0.9);
        }
        seg(p, Cr, X(16), 54, X(29 + sw), 95, 2.2, 1.2);
        seg(p, Cp, X(17), 56, X(29.6 + sw), 91, 0.7, 0.4);
      }
      p.poly(D, [36, 31, 64, 31, 76, 96, 24, 96]);
      p.poly(V, [38, 32, 62, 32, 73, 95, 27, 95]);
      p.poly(Vh, [40, 33, 47, 33, 39, 95, 30, 95]);
      for (const x of [44, 50, 56]) seg(p, D, x, 42, x + (x - 50) * 0.8, 94, 0.8, 1.2);
      p.poly(Cr, [27, 89, 73, 89, 76, 96, 24, 96]);
      for (let i = 0; i < 7; i++) p.poly(Cp, [29 + i * 6.6, 89, 32.6 + i * 6.6, 89, 30.8 + i * 6.6, 85.6]);
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        seg(p, D, X(11), 34, X(21), 50, 4, 3);
        seg(p, D, X(21), 50, X(26), 64 + sw, 3, 2);
        p.ell(Mk, X(26.4), 65 + sw, 2, 2.2);
        const bx = X(29), by = 66 + sw;
        p.poly(Ms, [bx, by - 22, bx + s * 7, by - 12, bx + s * 8, by, bx + s * 4, by + 10, bx + s * 1.6, by + 14, bx + s * 4.6, by + 2, bx + s * 4, by - 10]);
        p.poly(Mk, [bx, by - 22, bx + s * 5.6, by - 12, bx + s * 6.4, by, bx + s * 3.4, by + 9, bx + s * 2.4, by + 10, bx + s * 4.2, by + 1, bx + s * 3.4, by - 10]);
      }
      for (let i = 0; i < 11; i++) { const a = Math.PI * (0.05 + i * 0.09); p.poly(i % 2 ? Cr : Cp, [50 + Math.cos(a) * 6, 32 - Math.sin(a) * 1.6, 50 + Math.cos(a) * 14, 34 - Math.sin(a) * 8.6, 50 + Math.cos(a + 0.1) * 7, 32 - Math.sin(a) * 1.6]); }
      p.poly(D, [35, 32, 37, 14, 50, 0, 63, 14, 65, 32, 58, 35, 42, 35]);
      p.poly(V, [37, 31, 39, 15, 50, 3, 61, 15, 63, 31, 57, 33, 43, 33]);
      for (const s of [-1, 1]) {
        const x = 50 + s * 10.4;
        p.ell(Ms, x, 22.4, 4.4, 6, s * 0.45);
        p.ell(Mk, x - s * 0.4, 22, 3.8, 5.4, s * 0.45);
        p.poly(D, [x - 2, 21.4 - s * 0.6, x + 2, 21.4 + s * 0.6, x + 2, 22.2 + s * 0.6, x - 2, 22.2 - s * 0.6]);
        p.snap(Cr, x - 0.8, 25.4, 1.6, 0.8);
      }
      p.ell(Ms, 50, 22.4, 6, 7.8);
      p.ell(Mk, 50, 21.8, 5.4, 7.2);
      p.poly(D, [45.2, 20.4, 48.6, 21.2, 48.6, 22, 45.2, 21.2]);
      p.poly(D, [54.8, 20.4, 51.4, 21.2, 51.4, 22, 54.8, 21.2]);
      p.snap(Cr, 48.6, 26.2, 2.8, 1);
      p.snap('#ff8aa8', 49.4, 26.2, 1.2, 0.5);
      p.ell(Hl, 50, 9, 5, 5);
      p.ell(St, 50, 9, 3, 3);
      star(p, St, 50, 9, 8, 1.3);
      star(p, '#ffffff', 50, 9, 3.6, 0.7);
    },
    scar_nightmare(p, f) {
      const Sk = '#dcd6d0', Skd = '#8e8884', Mz = '#3e383c', Hn = '#1c1a20', Hh = '#5a5664', Fu = '#eeeae6', Fd = '#b6aeb6', Pt = '#8a5ad8', Ey = '#ffe040', Jk = '#c8242e', Jd = '#741218', Bd = '#2a2428', Bh = '#423a42', Bn = '#e6dccc', sw = f ? 1.4 : 0;
      p.poly(Fd, [38, 8, 62, 8, 72, 30, 70, 58 + sw, 60, 50, 50, 46, 40, 50, 30, 58 + sw, 28, 30]);
      p.poly(Fu, [40, 8, 60, 8, 69, 30, 67, 54 + sw, 59, 47, 50, 44, 41, 47, 33, 54 + sw, 31, 30]);
      for (let i = 0; i < 5; i++) { p.poly(Pt, [30 + i * 2.4, 52 + sw - i * 1.2, 33 + i * 2.4, 52 + sw - i * 1.2, 31.6 + i * 2.4, 60 + sw - i * 1.2]); p.poly(Pt, [70 - i * 2.4, 52 + sw - i * 1.2, 67 - i * 2.4, 52 + sw - i * 1.2, 68.4 - i * 2.4, 60 + sw - i * 1.2]); }
      seg(p, Bd, 43, 60, 37, 90, 9, 7); seg(p, Bd, 57, 60, 63, 90, 9, 7);
      for (const y of [68, 73, 78, 83]) { p.rect(Bn, 40.6 - (y - 68) * 0.4 - 4.2, y, 8.4, 1.5); p.rect(Bn, 59.4 + (y - 68) * 0.4 - 4.2, y, 8.4, 1.5); }
      p.poly(Hn, [29, 90, 44, 90, 46, 97, 27, 97]); p.poly(Hn, [56, 90, 71, 90, 73, 97, 54, 97]);
      p.poly(Bd, [26, 34, 74, 34, 68, 50, 62, 62, 38, 62, 32, 50]);
      p.poly(Bh, [28, 35, 46, 35, 42, 60, 38, 60, 33, 48]);
      for (const s of [-1, 1]) {
        const X = x => 50 + s * x;
        p.poly(Jd, [X(26), 33, X(12), 34, X(12), 48, X(15), 66 + sw, X(20), 64, X(19), 46]);
        p.poly(Jk, [X(25), 34, X(13.4), 35, X(13.6), 47, X(16), 63 + sw, X(19), 62, X(18.6), 45]);
        for (const [x0, x1, y1] of [[14.4, 12.6, 72], [17.4, 17, 70]]) seg(p, Jk, X(x0), 62, X(x1), y1 + sw, 1.6, 0.8);
        seg(p, Fu, X(18), 36, X(25), 54, 7, 5.4);
        seg(p, Bd, X(25), 54, X(29), 76 + sw, 4.6, 3.6);
        for (const y of [60, 64, 68]) p.rect(Bn, X(27.2) - 3.4, y, 6.8, 1.3);
        for (let k = 0; k < 4; k++) seg(p, Hn, X(28 + k * 0.8 - 1.2), 76 + sw, X(28 + k * 1.6 - 2.6), 84 + sw, 1, 0.4);
        const horn = [[X(5.4), 12], [X(11), 6], [X(19), 4.6], [X(25.6), 9], [X(27), 17], [X(23), 24], [X(17.6), 24.4], [X(15.4), 19.4], [X(18.6), 16]];
        curve(p, Hn, horn, 7, 3.2);
        for (let i = 1; i < 7; i++) { const [x, y] = horn[i]; seg(p, Hh, x - s * 1.6, y - 1.4, x + s * 1.2, y + 1.2, 0.8, 0.8); }
      }
      p.ell(Fu, 50, 34, 14, 5);
      p.poly(Sk, [41, 10, 59, 10, 61.4, 18, 59, 28, 56, 38, 53, 45, 50, 47, 47, 45, 44, 38, 41, 28, 38.6, 18]);
      p.poly(Skd, [53, 10, 59, 10, 61.4, 18, 59, 28, 56, 38, 53, 45, 50, 47, 52.6, 30]);
      p.poly(Mz, [46, 36, 54, 36, 53, 45, 50, 47, 47, 45]);
      p.poly(Hn, [48.2, 40, 51.8, 40, 51, 43, 49, 43]);
      p.poly(Skd, [47.8, 12, 52.2, 12, 51.4, 30, 48.6, 30]);
      for (const [x, y] of [[44.6, 19], [46.2, 24.4], [45.6, 30], [55.4, 19], [53.8, 24.4], [54.4, 30]]) { p.ell(Hn, x, y, 2, 1.6); p.ell(Ey, x, y, 1.3, 1); p.snap('#ffffff', x - 0.4, y - 0.4, 0.6, 0.6); }
      p.poly(Fu, [40, 11, 60, 11, 58, 5, 50, 2, 42, 5]);
      for (let i = 0; i < 4; i++) p.poly(Pt, [41.6 + i * 5, 9, 44.6 + i * 5, 9, 43.2 + i * 5, 13]);
      for (const s of [-1, 1]) { p.ell('#d8b040', 50 + s * 12, 32, 1.4, 2.4); p.poly('#d8b040', [50 + s * 12 - 1.4, 34, 50 + s * 12 + 1.4, 34, 50 + s * 12, 37]); }
    }
  };

  const SVAROG = {
    P: '#5a5ca0', Ph: '#8a8cd0', Pd: '#3a3b70', Pk: '#25264a', W: '#ecebf2', Ws: '#b2b0c6',
    C: '#3a3532', Ch: '#544c47', Cd: '#221e1c', L: '#e6e2e8', Ls: '#b0aab8', Rd: '#8c1e2c', Rk: '#5a1420',
    T: '#2e2a28', Td: '#1c1918', Sh: '#121216', Fu: '#161416', Fh: '#34303a', Gr: '#8a8690', Grh: '#c4c0c8',
    E: '#ff2e8e', Eh: '#ffd6f0', Er: '#a8246a', EYE: [50, 10.5]
  };

  function svarogArt(p, f) {
    const { P, Ph, Pd, Pk, W, Ws, C, Ch, Cd, L, Ls, Rd, Rk, T, Td, Sh, Fu, Fh, Gr, Grh, E, Eh, Er } = SVAROG;
    p.poly(C, [36, 16, 64, 16, 74, 22, 79, 40, 81, 58, 84, 70, 70, 72, 60, 64, 40, 64, 30, 72, 16, 70, 19, 48, 23, 30, 27, 21]);
    p.poly(Cd, [64, 16, 74, 22, 79, 40, 81, 58, 84, 70, 75, 71, 73, 50, 68, 30]);
    p.poly(Ch, [27, 21, 36, 17, 32, 34, 27, 62, 19, 66, 19, 48, 23, 30]);
    p.poly(Gr, [72, 64, 83, 62, 85, 71, 73, 73]); p.poly(Grh, [72, 64, 83, 62, 83.5, 64.5, 72.5, 66.5]); seg(p, Cd, 78, 63, 79, 72, 1.2);
    p.poly(Gr, [15, 64, 25, 65, 26, 72, 15, 71]); p.poly(Grh, [15, 64, 25, 65, 25, 67, 15, 66.5]);
    seg(p, T, 45, 54, 40.5, 91, 11, 8.5); seg(p, T, 56, 54, 59.5, 90, 11, 8.5);
    seg(p, Td, 48.6, 56, 44.2, 90, 3, 2.4); seg(p, Td, 60.2, 56, 63, 89, 2.4, 2);
    p.poly(T, [43, 50, 58, 50, 58, 60, 50, 64, 43, 60]);
    p.poly(Sh, [34, 89, 45.5, 89, 46.5, 97, 32, 97, 32.5, 93]); p.poly(Sh, [55, 88, 65, 88, 67.5, 92, 67.5, 96, 54.5, 96]);
    p.rect('#3c3c48', 35, 91, 5, 1.4); p.rect('#3c3c48', 57, 90, 5, 1.4);
    p.poly(L, [28, 24, 32, 24, 28.4, 70, 21, 70]); p.poly(Ls, [30.2, 24, 32, 24, 28.4, 70, 26.4, 70]);
    p.poly(Rd, [22.7, 64, 28.9, 64, 28.4, 70, 21, 70]); p.poly(Rk, [21.9, 67, 28.6, 67, 28.4, 70, 21, 70]);
    p.poly(L, [53, 17, 57.5, 17, 64.5, 44, 72, 70, 63, 70, 59.6, 44]); p.poly(Ls, [53, 17, 55, 17, 61.6, 44, 65.4, 70, 63, 70, 59.6, 44]);
    p.poly(Rd, [62.2, 64, 70.3, 64, 72, 70, 63, 70]); p.poly(Rk, [62.6, 67, 71.1, 67, 72, 70, 63, 70]);
    p.poly(Pd, [43, 46, 57, 46, 56, 50, 44, 50]);
    p.poly(Pk, [37.4, 43.4, 44, 43.4, 44.6, 52, 40.6, 60, 37.8, 52.4]); p.poly(P, [38.2, 44.2, 43.4, 44.2, 43.8, 52, 40.6, 58.6, 38.6, 52.2]); p.poly(Ph, [38.2, 44.2, 40.4, 44.2, 40.6, 58.6, 38.6, 52.2]);
    p.poly(Pk, [56, 43.4, 62.6, 43.4, 62.2, 52.4, 59.4, 60, 55.4, 52]); p.poly(P, [56.6, 44.2, 61.8, 44.2, 61.4, 52.2, 59.4, 58.6, 56.2, 52]); p.poly(Pd, [59.6, 44.2, 61.8, 44.2, 61.4, 52.2, 59.4, 58.6]);
    p.poly(P, [42, 18, 58, 18, 59.5, 27, 56.6, 30, 43.4, 30, 40.5, 27]);
    p.poly(Ph, [43, 19, 49.5, 19, 48.6, 25, 42.2, 25.8]); p.poly(Pd, [54.6, 19, 58, 18.5, 59.5, 27, 56.6, 30, 55.2, 27]);
    p.poly(Pk, [44.4, 26.5, 55.6, 26.5, 54.8, 30, 45.2, 30]);
    for (const x of [45.8, 48.8, 51.8]) p.snap(W, x, 27.2, 2.4, 2);
    p.poly(Pd, [43, 30, 57, 30, 56.2, 37.4, 43.8, 37.4]); p.poly(P, [44, 31, 56, 31, 55.2, 36.4, 44.8, 36.4]);
    p.poly(W, [48, 31.4, 52, 31.4, 51.4, 35.8, 48.6, 35.8]); p.poly(Ws, [50.4, 31.4, 52, 31.4, 51.4, 35.8, 50.4, 35.8]);
    p.poly(P, [43.8, 37.4, 56.2, 37.4, 55.6, 46, 50, 55, 44.4, 46]);
    p.poly(Ph, [44.6, 38.2, 49.6, 38.2, 49.6, 53.4, 45, 45.6]); p.poly(Pd, [53.4, 38.2, 56, 38, 55.6, 46, 50.6, 54]);
    p.poly(W, [46.8, 40.2, 53.2, 40.2, 50, 44]); seg(p, Pk, 50, 44.6, 50, 53, 1.2);
    p.poly(Pd, [40.5, 11, 46.5, 8.5, 47, 19, 39.5, 21]); p.poly(Pd, [59.5, 11, 53.5, 8.5, 53, 19, 60.5, 21]);
    p.poly(Pk, [41.6, 12, 46, 10.4, 46.2, 18, 41, 19.4]); p.poly(Pk, [58.4, 12, 54, 10.4, 53.8, 18, 59, 19.4]);
    for (const s of [-1, 1]) svarogArm(p, s);
    for (const [x, y, rx, ry] of [[35, 20.6, 4.6, 3.6], [39.4, 17.6, 5.4, 4.4], [43.6, 14.6, 3.8, 4.2], [65.6, 20.4, 5, 3.8], [61, 16.6, 6, 5], [56.6, 13, 4, 4.4]]) p.ell(Fu, x, y, rx, ry);
    p.poly(Fu, [32, 19, 34.6, 15.4, 36.6, 17.6]); p.poly(Fu, [42.6, 11.6, 45, 10, 45.4, 14]); p.poly(Fu, [68.6, 18.4, 68, 13.6, 65.2, 16.4]); p.poly(Fu, [58.4, 9.6, 61.4, 9.6, 60, 12.6]);
    for (const [x, y] of [[37.6, 15.8], [42.4, 13], [59.8, 13.4], [64.8, 17.4]]) p.ell(Fh, x, y, 2, 1.3, -0.5);
    p.poly(Pk, [50, 2.6, 56.2, 8, 56.6, 14.2, 53.4, 18, 46.6, 18, 43.4, 14.2, 43.8, 8]);
    p.poly(P, [50, 3.8, 55.2, 8.4, 55.6, 13.8, 52.8, 17, 47.2, 17, 44.4, 13.8, 44.8, 8.4]);
    p.poly(Ph, [50, 3.8, 50, 7.4, 46.6, 9.2, 45.6, 13.4, 47.2, 17, 44.4, 13.8, 44.8, 8.4]);
    p.poly(Pd, [52.6, 6.2, 55.2, 8.4, 55.6, 13.8, 52.8, 17, 53.2, 12.6]);
    p.ell(Pk, 50, 10.6, 3, 2.7);
    p.ell(Er, 50, 10.5, f ? 2.4 : 2.1, f ? 2.2 : 1.9);
    p.ell(E, 50, 10.5, f ? 1.7 : 1.4, f ? 1.6 : 1.3);
    p.snap(Eh, 49.4, 9.8, 1.2, 1.2);
    p.snap(Pd, 49.4, 13.4, 1.2, 2.6); p.poly(W, [48, 15.6, 52, 15.6, 51.2, 17, 48.8, 17]);
  }

  function svarogArm(p, s) {
    const { P, Ph, Pd, Pk, Ws, W } = SVAROG;
    const M = pts => pts.map((v, i) => (i % 2 ? v : 50 + s * (v - 50)));
    const inner = s > 0 ? Ph : Pd, outer = s > 0 ? Pd : Ph, X = x => 50 + s * (x - 50);
    seg(p, Pk, X(67), 27, X(69.6), 37.4, 8, 7); seg(p, P, X(67), 27, X(69.6), 37.4, 6.4, 5.4);
    seg(p, outer, X(69.4), 27.6, X(71.6), 36.6, 1.8, 1.4); seg(p, Pd, X(66.8), 32.2, X(71), 31.6, 1.2);
    p.poly(W, M([66.8, 36.6, 72.6, 36.6, 73, 39.8, 66.4, 39.8])); p.poly(Ws, M([66.6, 38.4, 72.8, 38.4, 73, 39.8, 66.4, 39.8]));
    p.poly(Pk, M([64.4, 40.4, 76.2, 40.4, 75.6, 49.8, 65, 49.8])); p.poly(P, M([65.2, 41.2, 75.4, 41.2, 74.8, 49, 65.8, 49]));
    p.poly(inner, M([65.2, 41.2, 67.8, 41.2, 68, 49, 65.8, 49])); p.poly(outer, M([72.6, 41.2, 75.4, 41.2, 74.8, 49, 72.4, 49]));
    p.poly(Ws, M([65.4, 45, 75.2, 45, 75.1, 46.8, 65.5, 46.8]));
    p.poly(Pk, M([63.8, 49.2, 76.8, 49.2, 76.6, 56.8, 74.2, 59, 66.2, 59, 63.8, 56.6])); p.poly(P, M([64.6, 50, 76, 50, 75.8, 56.4, 73.8, 58.2, 66.6, 58.2, 64.6, 56.2]));
    p.poly(Ph, M([64.6, 50, 76, 50, 76, 51.8, 64.6, 51.8]));
    for (const x of [67.4, 70.4, 73.2]) p.snap(Pd, X(x) - 0.5, 53, 1, 5);
    const x = X(66);
    p.poly(Pk, [x - 8.4, 27, x - 6.4, 18.6, x, 16.4, x + 6.4, 18.6, x + 8.4, 27, x + 6.4, 30.6, x - 6.4, 30.6]);
    p.poly(P, [x - 7.4, 26.6, x - 5.6, 19.4, x, 17.4, x + 5.6, 19.4, x + 7.4, 26.6, x + 5.8, 29.6, x - 5.8, 29.6]);
    p.poly(Ph, [x - 5.6, 19.4, x, 17.4, x + 1.4, 20.6, x - 4.4, 23.4]);
    p.poly(Pd, [x + 1.4, 20.6, x + 5.6, 19.4, x + 7.4, 26.6, x + 2.6, 24]);
    p.poly(Ws, [x - 7, 25.4, x + 7, 25.4, x + 7.2, 26.8, x - 7.2, 26.8]);
    p.poly(Pd, [x - 7, 26.8, x + 7, 26.8, x + 5.8, 29.6, x - 5.8, 29.6]);
  }

  function crescent(p, col, cx, cy, R, w, a0, a1, R2) {
    const n = 16, pts = [], Rt = t => R + ((R2 == null ? R : R2) - R) * t;
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + (a1 - a0) * t; pts.push(cx + Math.cos(a) * Rt(t), cy + Math.sin(a) * Rt(t)); }
    for (let i = n; i >= 0; i--) { const t = i / n, a = a0 + (a1 - a0) * t, r = Rt(t) - w * Math.pow(Math.sin(Math.PI * t), 0.6); pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    p.poly(col, pts);
  }

  function baryonArt(p, f, c) {
    const { P, Ph, Ps, V, Vh, C, Cs } = c, cx = 50, cy = 52, s = f ? 0.14 : 0;
    for (const a of [-2.2, -0.2, 1.75]) { crescent(p, V, cx, cy, 26, 11, a + s, a + 1.5 + s, 34); crescent(p, Vh, cx, cy, 26, 3.6, a + 0.2 + s, a + 1.2 + s, 31); }
    p.ell(C, cx, cy, 19, 19); p.ell(Cs, cx - 3, cy - 3, 13, 12);
    p.clipPoly(circle(cx, cy, 18.6), () => { ringBand(p, C, cx + 5, cy + 5, 14, 12, 3.4, 0, Math.PI * 2); });
    for (const [x, y, k] of [[44, 46, 1.4], [55, 49, 1], [48, 58, 1], [58, 57, 1.4], [42, 54, 0.8], [52, 42, 0.8]]) p.snap('#e8ecff', x, y, k, k);
    if (c.glow) { p.ell(c.glow, cx - 9, cy + 4, 4, 6, 0.4); p.ell('#fff8d0', cx - 9.4, cy + 4, 1.6, 3, 0.4); }
    const plates = c.horn ? [[-3.2, 1.35], [-1.6, 1.25], [-0.1, 1.3], [1.45, 1.35]] : [[-3.1, 1.55], [-1.2, 1.35], [0.6, 1.5]];
    for (const [a, sp] of plates) {
      crescent(p, Ps, cx, cy, 29, 16, a - s, a + sp - s, c.horn ? 33 : 38);
      crescent(p, P, cx, cy, 28, 14, a - s, a + sp - s, c.horn ? 32 : 37);
      crescent(p, Ph, cx, cy, 28.6, 4.4, a + sp * 0.1 - s, a + sp * 0.8 - s, c.horn ? 32 : 35.6);
    }
    if (c.horn) { shard(p, Ps, P, 40, 26, 24, -1.95, 5); shard(p, P, Ph, 41, 25, 21, -1.95, 3); }
  }

  function wolfArt(p, c) {
    const B = '#6a7cd2', Bh = '#9eaced', Bs = '#4a5aa8', Bd = '#2c3672', K = '#1c1d22', Kh = '#3c3e48', Kl = '#62656f', W = '#e8eaf2', R = c.rust || '#8a3a2e', Y = '#ffd84a', X = c.crystal;
    p.poly(Bd, [37.4, 54.4, 50.6, 52.4, 52.8, 62, 46.4, 68.8, 37.4, 65.6]); p.poly(B, [38.2, 55, 50, 53.2, 52, 62, 46, 68, 38.2, 65]); p.poly(Bh, [38.8, 55.6, 45, 54.4, 42, 63, 38.8, 63.4]);
    p.ell(K, 44, 58.6, 2.6, 2.6); p.ell(Kl, 44, 58.6, 1.6, 1.6); p.ell(K, 44, 58.6, 0.6, 0.6);
    p.poly(K, [44, 66, 50.4, 64, 49.4, 73.4, 45.4, 77, 37.6, 77, 40, 72]); p.poly(Kh, [45, 66.4, 49.6, 65, 48.6, 71, 45.4, 72]);
    p.poly(K, [34.6, 74.6, 46, 74.6, 46.4, 78.4, 33.6, 78.4]);
    p.poly(Bd, [46.4, 31.4, 63.8, 30.4, 65.8, 42, 60.6, 52.8, 49.6, 52.8, 45.4, 42]); p.poly(B, [47, 32, 63, 31, 65, 42, 60, 52, 50, 52, 46.2, 42]);
    p.poly(Bh, [47.6, 32.6, 54, 32, 52, 46, 47, 41.6]); p.poly(Bs, [59, 31.4, 63, 31, 65, 42, 60, 52, 58, 52]); seg(p, Bd, 50, 44, 61, 43, 0.8);
    p.rect(K, 49.4, 51, 11, 3.4);
    p.poly(K, [49.6, 53, 61, 53, 64, 58.6, 51, 59.6]); p.ell(K, 58.4, 56, 3.4, 3.2); p.ell(Kl, 58.4, 56, 1.8, 1.6); p.ell(K, 58.4, 56, 0.7, 0.7);
    p.poly(Bd, [54.2, 58.6, 63.4, 58, 66.4, 67, 60, 90.6, 52.6, 69]); p.poly(B, [55, 59.4, 62.8, 58.8, 65.4, 67, 60, 88.4, 53.6, 69]);
    p.poly(Bh, [55.4, 60, 58.4, 59.6, 57.4, 80, 54.2, 69]); p.poly(Bs, [61, 59.2, 62.8, 58.8, 65.4, 67, 60, 88.4, 60.6, 71]);
    p.poly(R, [57.4, 79.4, 62.6, 78.4, 60, 88.4]); seg(p, Bd, 54.6, 67.6, 65, 67, 0.8);
    p.poly(K, [55.6, 85, 59.8, 85, 60.6, 96, 54.6, 96]); p.poly(K, [60.2, 85, 64.2, 85, 66.4, 95.4, 61.2, 96]); seg(p, Kl, 56, 86, 55.4, 95, 0.8); seg(p, Kl, 60.8, 86, 61.6, 95, 0.8);
    seg(p, K, 72, 39.6, 74, 48, 4.6, 4); seg(p, B, 71.6, 40.6, 73.4, 46.6, 4, 3.4); p.ell(K, 74, 48.6, 2.6, 2.6); p.ell(Kl, 74, 48.6, 1.4, 1.4);
    seg(p, K, 74, 48.6, 75.2, 56.4, 4, 3.4); seg(p, Kh, 73.2, 49.4, 74.2, 55.4, 1.2);
    for (const a of [1.2, 1.57, 1.95]) shard(p, K, null, 75.2, 56.6, 5.4, a, 1.3);
    p.poly(K, [39, 23, 46.4, 21, 48.4, 30.6, 41, 33.4]); p.poly(Kl, [39.4, 23.4, 46, 21.6, 46.6, 23.4, 40, 25]);
    seg(p, K, 41, 30.4, 36.4, 37, 4.4, 4); seg(p, B, 40.4, 30.6, 37.2, 35.4, 3.6, 3.2); p.ell(K, 34.8, 42.8, 2.4, 2.4); p.ell(Kl, 34.8, 42.8, 1.3, 1.3);
    seg(p, K, 36.4, 37, 34.8, 42.8, 3.6); seg(p, K, 34.8, 42.8, 31, 50.8, 3.8, 3.4); seg(p, B, 34.2, 44.4, 32, 49.4, 3, 2.6);
    if (X) {
    shard(p, X[2], null, 36.4, 35.4, 66, 1.93, 5.4); shard(p, X[0], X[1], 36.4, 35.4, 64, 1.93, 4.2);
    for (const [t, a, l] of [[0.16, 2.7, 8], [0.3, 1.2, 7], [0.42, 2.6, 6], [0.24, 2.4, 9]]) shard(p, X[0], X[1], 36.4 - 22 * t, 35.4 + 60 * t, l, a, 2);
    p.poly(K, [33.6, 33, 39, 33.6, 38.4, 39, 33, 38.4]);
    } else {
      seg(p, K, 36.4, 35.4, 19.4, 85, 5.2, 4); seg(p, Kh, 36, 35.6, 19.6, 84, 3.8, 2.8); shard(p, Kh, null, 19.6, 84.4, 6, 1.9, 2);
      for (let k = 0; k < 9; k++) { const t = 0.12 + k * 0.095, x = 36 - 16.4 * t - 2, y = 35.6 + 48.4 * t; p.poly(W, [x + 0.6, y - 1.6, x - 1.4, y + 0.4, x + 1, y + 1.2]); }
    }
    p.ell(K, 30.6, 51.6, 2.8, 2.6); p.ell(Kh, 30, 51, 1.2, 1);
    p.poly(Bd, [58.6, 24.4, 76.4, 22.4, 79.4, 26.6, 78.4, 40.6, 60.6, 41.6, 58, 36.2]); p.poly(B, [59.2, 25, 76, 23, 78.6, 27, 77.6, 40, 61, 41, 58.6, 36]);
    p.poly(Bh, [59.2, 25, 76, 23, 78.6, 27, 61, 28.6]); p.poly(Bs, [73, 27.4, 78.6, 27, 77.6, 40, 73.4, 40.4]);
    p.rect(W, 60.4, 29.2, 1.8, 9.4); for (const [x, y] of [[67, 31], [69.4, 33.6], [71.8, 36.2]]) p.snap(K, x, y, 1.4, 1.4);
    p.poly(Bd, [45.4, 21.4, 58.6, 20.4, 57.8, 30.6, 52, 36, 47.4, 31.6]); p.poly(B, [46, 22, 58, 21, 57, 30, 52, 35, 48, 31]);
    p.poly(Bh, [46, 22, 58, 21, 57.8, 22.8, 46.4, 23.8]); seg(p, Bh, 46.4, 23, 48.6, 31, 0.9); seg(p, Bs, 57.6, 22, 56.8, 30, 0.9);
    p.poly(K, [48.4, 24.6, 55.6, 24, 54.8, 28, 51.6, 30.6, 49, 28]); p.snap(Y, 52.6, 25.4, 1.8, 1.4);
    if (X) {
    shard(p, X[2], null, 50, 23.4, 23, -1.9, 4.2); shard(p, X[0], X[1], 50, 23.4, 22, -1.9, 3.2);
    shard(p, X[2], null, 53.6, 22.6, 19, -0.95, 3.8); shard(p, X[0], X[1], 53.6, 22.6, 18, -0.95, 2.8);
    p.poly(X[0], [48.4, 24.6, 51, 24.4, 51.6, 35, 50, 35]);
    } else {
      p.poly(Kh, [48.4, 22.4, 54.6, 22, 50.6, 8.4, 46.2, 2.4, 46.8, 10]); p.poly(K, [51, 22.2, 54.6, 22, 50.6, 8.4, 47.4, 3.6]); seg(p, Kl, 47.6, 20, 46.8, 6, 0.9, 0.5);
    }
  }

  const PROPS = {
    bronyaRifle(p) {
      const M = '#3a4258', Mh = '#6a7898', Md = '#1c2030', Au = '#e8c870', W = '#9ae8ff';
      p.poly(Md, [58, 50, 96, 40, 98, 46, 62, 58]);
      p.poly(M, [56, 48, 94, 38, 96, 44, 60, 56]); p.poly(Mh, [56, 48, 94, 38, 94, 40, 57, 50]);
      p.poly(M, [56, 52, 64, 50, 66, 62, 58, 64]); p.poly(Md, [64, 50, 70, 49, 72, 58, 66, 60]);
      seg(p, Au, 70, 46, 90, 41, 1.4);
      p.ell(W, 96, 42, 3, 3); p.ell('#ffffff', 96, 42, 1.4, 1.4);
    },
    gepardShield(p) {
      const S = '#262a38', Sh = '#3e4458', Au = '#d8b050', Bl = '#4a8ae8';
      p.poly(S, [60, 28, 88, 24, 94, 46, 90, 90, 64, 96, 58, 62]);
      p.poly(Sh, [60, 28, 74, 26, 72, 94, 64, 96, 58, 62]);
      for (const [a, b, c, d] of [[60, 28, 88, 24], [88, 24, 94, 46], [94, 46, 90, 90], [90, 90, 64, 96], [64, 96, 58, 62], [58, 62, 60, 28]]) seg(p, Au, a, b, c, d, 2);
      seg(p, Au, 76, 30, 76, 88, 1.6);
      gem(p, '#d8f0ff', Bl, 76, 56, 5);
    },
    cocoliaSpear(p) {
      const I = '#7ad8f0', Ih = '#e0faff', Id = '#3a8ab8';
      seg(p, Id, 8, 92, 90, 8, 3.2); seg(p, I, 9, 91, 89, 9, 2); seg(p, Ih, 30, 70, 86, 12, 0.9);
      p.poly(I, [82, 14, 97, 0, 93, 16]); p.poly(Ih, [88, 8, 97, 0, 92, 7]);
      p.poly(Id, [3, 88, 16, 80, 14, 93]); p.poly(I, [6, 86, 14, 82, 12, 90]);
    }
  };


  const META = {
    reaver: { icon: [47, 19, 16] }, eliminator: { icon: [50, 13, 14] }, trampler: { icon: [40, 18, 17] },
    flamespawn: { icon: [50, 44, 28], anim: true, float: true, aura: '255,120,60' }, frostspawn: { icon: [50, 44, 28], anim: true, float: true, aura: '120,190,255' },
    thunderspawn: { icon: [50, 44, 28], anim: true, float: true, aura: '190,120,255' }, windspawn: { icon: [50, 44, 30], anim: true, float: true, aura: '100,240,170' },
    baryon: { icon: [50, 52, 25], anim: true, float: true }, antibaryon: { icon: [50, 52, 25], anim: true, float: true, aura: '255,180,80' },
    distorter: { icon: [53, 16, 15], anim: true, float: true, aura: '200,150,255' }, weaver: { icon: [52, 18, 18], anim: true, float: true, aura: '255,220,140' }, mask: { icon: [47, 44, 30], anim: true, float: true, aura: '240,200,110' }, ipc_field: { icon: [48, 13, 12] }, ipc_security: { icon: [48, 13, 12] }, ipc_leader: { icon: [43, 27, 15], aura: '255,200,110' }, guardian: { icon: [44, 19, 14], anim: true, float: true, aura: '170,200,255' }, decaying: { icon: [44, 22, 14], anim: true, float: true, aura: '240,200,90' },
    beetle: { icon: [48, 34, 26] }, hound: { icon: [56, 50, 24] }, spider: { icon: [47, 28, 27] }, direwolf: { icon: [53, 25, 16] },
    soldier: { icon: [50, 19, 13] }, gunner: { icon: [50, 19, 13] }, cannoneer: { icon: [50, 16, 15] }, lieutenant: { icon: [50, 17, 15] }, dunn: { icon: [50, 17, 15] },
    vagrant: { icon: [42, 22, 13] }, shadewalker: { icon: [50, 19, 15], aura: '110,230,255' }, incinerator: { icon: [52, 16, 16], aura: '255,150,60' },
    prowler: { icon: [49, 58, 22], aura: '120,210,255' }, searing: { icon: [52, 22, 17], aura: '255,90,100' }, iceout: { icon: [44, 30, 22], anim: true, float: true, aura: '140,210,255' }, stormbringer: { icon: [39, 26, 15], aura: '110,230,180' }, blazeout: { icon: [44, 30, 22], anim: true, float: true, aura: '255,80,100' }, iceedge: { icon: [50, 68, 18], size: 196, slot: 0.5 },
    ethereal: { icon: [50, 34, 18], aura: '255,110,60' }, etherhound: { icon: [22, 50, 20], aura: '255,130,70' }, mimic: { icon: [50, 22, 16], anim: true, aura: '255,110,60' },
    trotter: { icon: [42, 36, 26], anim: true }, juvsting: { icon: [32, 64, 19], anim: true, float: true, aura: '240,120,170' }, gnawsting: { icon: [36, 63, 20], anim: true, float: true, aura: '220,140,230' }, skaracabaz: { icon: [50, 28, 20], anim: true, aura: '80,230,210' }, phantylia: { icon: [44, 53, 14], anim: true, aura: '150,255,190' }, phantylia2: { icon: [44, 53, 14], anim: true, aura: '190,110,255' }, skaracabaz_e: { icon: [50, 28, 20], anim: true, aura: '80,230,210' }, skaracabaz_e2: { icon: [50, 28, 20], anim: true, aura: '140,120,255' }, lotus_ab: { icon: [50, 52, 26], anim: true, float: true, aura: '255,200,140' }, lotus_de: { icon: [50, 52, 26], anim: true, float: true, aura: '255,90,60' }, doomsday: { icon: [50, 24, 20], anim: true, aura: '170,110,255' },
    gepard_b: { figure: 'gepard', front: 'gepardShield' }, bronya_b: { figure: 'bronya', front: 'bronyaRifle', aura: '120,200,255' }, grizzly: { icon: [48, 46, 26], anim: true }, svarog_b: { icon: [50, 18, 15], anim: true, aura: '255,60,160' },
    cocolia1: { figure: 'cocolia', front: 'cocoliaSpear', aura: '150,220,255' }, cocolia_echo: { figure: 'cocolia', front: 'cocoliaSpear', aura: '190,170,255' }, cocolia2: { icon: [50, 17, 13], anim: true, aura: '150,200,255' },
    hecate: { icon: [50, 20, 17], anim: true, aura: '255,70,130' }, gynoid: { icon: [50, 16, 14], anim: true }, scar_nightmare: { icon: [50, 24, 20], anim: true, aura: '170,110,255' }
  };

  function lookFor(name) { return G.lookOf(name, null); }

  function idOf(data) {
    if (data && data.id && META[data.id]) return data.id;
    const byShape = { bronya: 'bronya_b', cocolia: 'cocolia1', cocolia2: 'cocolia2', gepard: 'gepard_b', doomsday: 'doomsday', grizzly: 'grizzly', svarog: 'svarog_b', swarmking: 'skaracabaz', phantylia: 'phantylia' };
    return (data && byShape[data.shape]) || 'reaver';
  }

  function layer(key, fn, n, f) {
    const k = 'l|' + key + '|' + n + '|' + f;
    let out = cache.get(k);
    if (out) return out;
    const src = G.mkCanvas(n * SS, n * SS);
    fn(G.pen(src.getContext('2d'), n / 100, 0, 0), f);
    out = G.downsample(src, n, n, true);
    cache.set(k, out);
    return out;
  }

  function foeCanvas(id, n, f) {
    const key = 'c|' + id + '|' + n + '|' + f;
    let out = cache.get(key);
    if (out) return out;
    const m = META[id] || {};
    if (m.figure) {
      out = G.mkCanvas(n, n);
      const g = out.getContext('2d'), k = n / 100;
      g.imageSmoothingEnabled = false;
      if (m.back) g.drawImage(layer(m.back, PROPS[m.back], n, f), 0, 0);
      g.drawImage(G.figureCanvas(lookFor(m.figure)), Math.round((50 - G.FIG_W / 2) * k), Math.round((97 - G.FIG_FOOT) * k), Math.round(G.FIG_W * k), Math.round(G.FIG_H * k));
      if (m.front) g.drawImage(layer(m.front, PROPS[m.front], n, f), 0, 0);
    } else out = layer(id, ART[id], n, f);
    cache.set(key, out);
    return out;
  }

  function frameAt(m, t) { return m.anim ? Math.floor((t || 0) * 2.2) % 2 : 0; }

  function drawEnemy(ctx, data, x, y, size, opts = {}) {
    const id = idOf(data), m = META[id] || {};
    const n = Math.max(12, Math.round(size / 2)), dw = n * 2;
    const c = foeCanvas(id, n, frameAt(m, opts.t));
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (m.aura && opts.aura !== false) {
      const k = 0.2 + 0.08 * Math.sin((opts.t || 0) * 3), cy = y - dw * 0.5;
      const gr = ctx.createRadialGradient(x, cy, dw * 0.08, x, cy, dw * 0.55);
      gr.addColorStop(0, 'rgba(' + m.aura + ',' + k + ')'); gr.addColorStop(1, 'rgba(' + m.aura + ',0)');
      ctx.fillStyle = gr; ctx.fillRect(x - dw * 0.55, cy - dw * 0.55, dw * 1.1, dw * 1.1);
    }
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(x - dw / 2), Math.round(y - dw), dw, dw);
    if (opts.flash) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = opts.flash; ctx.drawImage(c, Math.round(x - dw / 2), Math.round(y - dw), dw, dw); }
    ctx.imageSmoothingEnabled = was;
    ctx.restore();
  }

  function fieldEnemy(ctx, data, x, y, t, elite) {
    const id = idOf(data), m = META[id] || {}, boss = !!data.boss;
    const size = boss ? 64 : elite ? 56 : 44;
    const bob = m.float ? Math.sin(t * 3 + x * 0.1) * 3 - 5 : -Math.abs(Math.sin(t * 4 + x * 0.1)) * 1.5;
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,24,0.35)'; ctx.beginPath(); ctx.ellipse(x + 16, y + 28, size * 0.3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    const pulse = 0.45 + 0.3 * Math.sin(t * 4 + x);
    ctx.strokeStyle = elite || boss ? 'rgba(255,196,72,' + pulse + ')' : 'rgba(255,72,72,' + (pulse * 0.6) + ')';
    ctx.lineWidth = elite || boss ? 2 : 1;
    ctx.beginPath(); ctx.ellipse(x + 16, y + 28, size * 0.38, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawEnemy(ctx, data, x + 16, y + 30 + bob, size, { t, aura: false });
  }

  function foeIcon(ctx, data, x, y, size, opts = {}) {
    const id = idOf(data), m = META[id] || {};
    const fam = FAMILY[data.boss ? 'boss' : data.fam] || FAMILY.boss;
    x = Math.round(x); y = Math.round(y);
    ctx.save();
    if (opts.round) { ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip(); }
    const gr = ctx.createLinearGradient(x, y, x, y + size);
    gr.addColorStop(0, fam[1]); gr.addColorStop(1, fam[0]);
    ctx.fillStyle = gr; ctx.fillRect(x, y, size, size);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    if (m.figure) ctx.drawImage(G.bustCanvas(lookFor(m.figure), 64), x, y, size, size);
    else {
      const c = foeCanvas(id, 100, 0), [cx, cy, r] = m.icon || [50, 50, 30];
      ctx.drawImage(c, Math.max(0, cx - r), Math.max(0, cy - r), r * 2, r * 2, x, y, size, size);
    }
    ctx.imageSmoothingEnabled = was;
    ctx.restore();
    if (opts.border !== false) {
      ctx.strokeStyle = data.boss ? '#ff7070' : data.elite ? '#f2dc9a' : fam[1];
      ctx.lineWidth = 1;
      if (opts.round) { ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 - 0.5, 0, Math.PI * 2); ctx.stroke(); }
      else ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }

  Object.assign(G, { drawEnemy, fieldEnemy, foeIcon, foeCanvas, FOE_META: META, FOE_ART: ART, FOE_FAMILY: FAMILY, FOE_KIT: { bez, curve, seg, shard, leaf, crystal, glowing, ringBand }, foeId: idOf, svarogArt, SVAROG });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
