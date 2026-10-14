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

  function spawn(p, f, pal, kind) {
    const [core, main, dk, hi] = pal, cx = 50, cy = 46, up = f ? -0.14 : 0;
    const D = a => a * Math.PI / 180;
    const sets = {
      fire: [[-150, 34, 7, main, hi], [-30, 34, 7, main, hi], [-172, 24, 5, dk, null], [-8, 24, 5, dk, null], [-118, 24, 5, hi, null], [-62, 24, 5, hi, null], [128, 16, 4, dk, null], [52, 16, 4, dk, null]],
      ice: [[-155, 34, 7, main, hi], [-25, 34, 7, main, hi], [-112, 22, 5, hi, null], [-68, 22, 5, hi, null], [140, 16, 5, dk, null], [40, 16, 5, dk, null], [-178, 18, 4, dk, null], [-2, 18, 4, dk, null]],
      elec: [[-160, 32, 7, main, hi], [-20, 32, 7, main, hi], [-130, 26, 6, dk, hi], [-50, 26, 6, dk, hi], [150, 20, 5, main, null], [30, 20, 5, main, null]],
      wind: [[-162, 42, 6, main, hi], [-18, 42, 6, main, hi], [-142, 30, 5, dk, null], [-38, 30, 5, dk, null], [160, 16, 4, dk, null], [20, 16, 4, dk, null]]
    }[kind];
    for (const [a, len, w, col, h] of sets) {
      const wing = a < -90 ? -up : a > -90 && a < 0 ? up : 0;
      shard(p, col, h, cx + Math.cos(D(a)) * 5, cy + Math.sin(D(a)) * 5, len, D(a) + wing, w);
    }
    shard(p, main, hi, cx, cy + 6, kind === 'wind' ? 18 : 24, Math.PI / 2, 6);
    if (kind === 'elec') { p.poly(hi, [36, 62, 42, 58, 40, 64, 46, 60]); p.poly(hi, [64, 62, 58, 58, 60, 64, 54, 60]); }
    if (kind === 'fire') for (const s of [-1, 1]) p.poly(hi, [cx + s * 10, cy + 8, cx + s * 16, cy - 6 - (f ? 4 : 0), cx + s * 14, cy + 10]);
    p.poly(dk, [cx, cy - 13, cx + 10, cy, cx, cy + 13, cx - 10, cy]);
    p.poly(main, [cx, cy - 11, cx + 8, cy, cx, cy + 11, cx - 8, cy]);
    p.poly(hi, [cx, cy - 11, cx + 8, cy, cx, cy, cx - 4, cy - 5]);
    gem(p, core, light(main, 0.3), cx, cy + 1, 3);
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

  function silvermane(p, o) {
    const coat = o.armor ? '#dfe2ea' : '#1c2030', coatH = o.armor ? '#f6f7fb' : '#363c54', coatD = o.armor ? '#9ea4b6' : '#0e1018';
    const plaid = '#3a68c4', plaidHi = '#a4c4f4', pants = '#262830', boot = '#111115', mask = '#f2f2f6', maskS = '#c2c6d2';
    seg(p, pants, 44, 60, 41, 82, 8, 7); seg(p, pants, 56, 60, 60, 82, 8, 7);
    p.poly(boot, [36, 80, 46, 80, 46, 93, 48, 96, 33, 96, 36, 90]); p.poly(boot, [55, 80, 65, 80, 65, 90, 68, 96, 53, 96, 55, 93]);
    p.rect('#5c606c', 36, 80, 10, 1.8); p.rect('#5c606c', 55, 80, 10, 1.8);
    p.poly(coatD, [36, 50, 64, 50, 67, 66, 33, 66]);
    p.poly(coat, [38, 50, 62, 50, 65, 64, 35, 64]);
    p.poly(coat, [37, 27, 63, 27, 62, 52, 38, 52]);
    if (o.armor) { p.poly(coatD, [55, 28, 63, 27, 62, 52, 56, 52]); p.poly('#3a68c4', [44, 30, 56, 30, 55, 48, 45, 48]); p.poly('#8ab8f0', [46, 32, 50, 32, 50, 46, 46, 44]); }
    else {
      p.poly(plaid, [41, 30, 59, 30, 58, 50, 42, 50]);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if ((r + c) % 2 === 0) p.snap(plaidHi, 42.5 + c * 5.4, 31.5 + r * 6.2, 3.2, 3.2);
      p.rect(coatH, 49, 30, 2, 20);
    }
    p.rect('#0b0b0f', 38, 49, 24, 3); p.snap('#d0b470', 48.5, 49.5, 3.5, 2);
    if (o.fur) { p.ell('#ecedf2', 38, 29, 8, 5.5); p.ell('#ecedf2', 62, 29, 8, 5.5); p.ell('#c4c6d0', 40, 31, 5, 2.5); }
    else { p.ell(coatH, 38, 30, 6, 4.5); p.ell(coatH, 62, 30, 6, 4.5); }
    p.rect(coatD, 46, 22, 8, 6);
    p.ell(mask, 50, 18, 6.5, 7.5); p.ell(maskS, 53, 19, 3.2, 6);
    p.snap(maskS, 49.4, 15.5, 1.2, 4.5); p.snap('#8a8e9c', 46, 17.5, 2.5, 1); p.snap('#8a8e9c', 51.5, 17.5, 2.5, 1);
    if (o.tall) {
      p.poly('#e4e6ec', [43, 0, 57, 0, 57, 13, 43, 13]); p.poly('#b4b8c6', [53, 0, 57, 0, 57, 13, 53, 13]);
      p.rect('#8a8e9a', 42, 11, 16, 3); p.rect(plaid, 43, 4, 14, 1.8);
    } else {
      p.poly('#141519', [42, 5, 58, 5, 59, 13, 41, 13]); p.rect('#2c2e36', 40, 12, 20, 2.5); p.snap(plaid, 44, 8, 12, 1.2);
    }
  }

  const ART = {
    reaver(p) {
      const A = '#2c2a3a', Ah = '#4e4c66', Ad = '#15131d', Au = '#f2c24e', Auh = '#fff2b0';
      seg(p, A, 45, 56, 34, 70, 9, 7); seg(p, A, 34, 70, 31, 90, 7, 5); p.ell(Ah, 34, 70, 5, 4.5); foot(p, Ad, 30, 94, 10, -1);
      seg(p, A, 55, 56, 64, 72, 9, 7); seg(p, A, 64, 72, 68, 92, 7, 5); p.ell(Ah, 64, 72, 5, 4.5); foot(p, Ad, 69, 95, 10, 1);
      seg(p, Au, 44, 58, 36, 68, 2.2); seg(p, Au, 56, 58, 62, 69, 2.2);
      p.poly(Ad, [40, 50, 60, 50, 58, 58, 42, 58]);
      p.poly(A, [36, 28, 64, 28, 61, 46, 50, 54, 39, 46]);
      p.poly(Ah, [38, 29, 49, 29, 48, 44, 41, 42]);
      seg(p, Au, 41, 31, 50, 45, 2.4); seg(p, Au, 59, 31, 50, 45, 2.4);
      seg(p, A, 34, 34, 30, 44, 6, 5); seg(p, A, 66, 34, 70, 50, 6, 5);
      p.ell(Ah, 35, 31, 7, 5.5); p.ell(Ah, 65, 31, 7, 5.5); p.ell(Ad, 35, 35, 5, 2); p.ell(Ad, 65, 35, 5, 2);
      p.rect(Ad, 46, 23, 8, 6);
      p.ell(A, 50, 17, 7.5, 8.5);
      p.poly(Ah, [44, 14, 50, 1, 59, 5, 56, 13]); p.poly(Ad, [51, 4, 57, 6, 55, 12, 51, 12]);
      p.poly(Ad, [44, 18, 56, 18, 54, 25, 46, 25]);
      p.snap('#ffe070', 45, 18.5, 9.5, 2.4);
      p.poly(Au, [34, 42, 28, 30, 20, 20, 10, 13, 3, 9, 8, 16, 17, 24, 25, 32, 31, 43]);
      p.poly(Auh, [28, 30, 20, 20, 10, 13, 3, 9, 10, 15, 19, 22, 26, 31]);
      p.ell(Ad, 32, 44, 3.5, 3.5);
      p.poly(Au, [70, 50, 80, 58, 88, 68, 94, 79, 97, 91, 90, 84, 84, 74, 76, 64, 67, 56]);
      p.poly(Auh, [80, 58, 88, 68, 94, 79, 97, 91, 92, 82, 85, 71, 78, 62]);
      p.ell(Ad, 70, 51, 3.5, 3.5);
    },
    eliminator(p) {
      const A = '#262444', Ah = '#45417c', Ad = '#13112a', Au = '#f0b84a', Bl = '#4a7ae8', Blh = '#b0ccff';
      seg(p, Ad, 46, 60, 44, 92, 5, 4); seg(p, Ad, 54, 60, 57, 92, 5, 4); foot(p, Ad, 43, 95, 8, -1); foot(p, Ad, 58, 95, 8, 1);
      p.poly(A, [42, 48, 50, 50, 45, 70, 33, 88, 26, 85]); p.poly(A, [58, 48, 50, 50, 55, 70, 67, 88, 74, 85]);
      p.poly(Ah, [42, 48, 47, 49, 38, 74, 30, 86, 27, 85]);
      seg(p, Au, 44, 54, 30, 86, 2.2); seg(p, Au, 56, 54, 70, 86, 2.2);
      p.poly(A, [41, 26, 59, 26, 57, 48, 43, 48]); p.poly(Ah, [42, 27, 50, 27, 49, 46, 44, 46]);
      seg(p, Au, 50, 28, 50, 46, 2.2); p.rect(Au, 42, 46, 16, 2.2);
      seg(p, A, 60, 31, 62, 44, 5, 4.5); p.ell(Ad, 62, 45, 3, 3);
      p.ell(Ah, 40, 29, 5.5, 4.5); p.ell(Ah, 60, 29, 5.5, 4.5);
      p.rect(Ad, 46, 20, 8, 6);
      p.ell(A, 50, 15, 6.5, 7.5);
      p.poly(Ah, [45, 13, 47, 2, 62, 0, 67, 4, 56, 10, 56, 15]); p.poly(Ad, [52, 5, 62, 2, 64, 4, 55, 9]);
      p.snap('#ffe070', 45.5, 15, 8, 2.2);
      seg(p, A, 40, 31, 36, 42, 5, 4.5);
      p.poly(Bl, [38, 40, 22, 38, 8, 43, 2, 52, 13, 50, 25, 46, 39, 46]);
      p.poly(Blh, [38, 40, 22, 38, 9, 43, 7, 46, 21, 42, 37, 43]);
      p.ell(Ad, 37, 43, 3.5, 3.5);
    },
    trampler(p) {
      const B = '#2c2444', Bd = '#171226', W = '#e6e4f0', Ws = '#a6a4be', Gr = '#6af0a0', Pu = '#7a58c0';
      seg(p, Bd, 64, 60, 70, 78, 5, 4); seg(p, Bd, 70, 78, 66, 93, 4, 3); foot(p, Bd, 66, 95, 7, 1);
      seg(p, Bd, 40, 60, 36, 78, 5, 4); seg(p, Bd, 36, 78, 38, 93, 4, 3); foot(p, Bd, 38, 95, 7, -1);
      p.ell(B, 56, 54, 24, 13);
      seg(p, B, 72, 58, 80, 76, 6, 5); seg(p, B, 80, 76, 76, 93, 5, 3.5); p.ell(Ws, 80, 76, 4, 4); foot(p, Bd, 76, 95, 8, 1);
      seg(p, B, 46, 60, 42, 78, 6, 5); seg(p, B, 42, 78, 45, 93, 5, 3.5); p.ell(Ws, 42, 78, 4, 4); foot(p, Bd, 45, 95, 8, -1);
      p.poly(W, [38, 46, 52, 38, 70, 40, 80, 48, 76, 56, 60, 52, 44, 56]);
      p.poly(Ws, [44, 56, 60, 52, 76, 56, 72, 60, 48, 62]);
      p.poly(W, [64, 42, 76, 35, 84, 43, 80, 50]);
      p.poly(B, [78, 50, 92, 44, 96, 49, 84, 56]);
      p.poly(B, [30, 60, 34, 44, 38, 30, 44, 24, 50, 30, 48, 48, 42, 60]);
      p.poly(W, [32, 54, 35, 42, 40, 32, 46, 34, 44, 48, 38, 56]);
      p.poly(Ws, [38, 56, 44, 48, 46, 52, 42, 60]);
      p.poly(W, [40, 26, 32, 16, 30, 8, 36, 8, 44, 16, 46, 24]);
      p.poly(Ws, [32, 16, 30, 8, 34, 9, 36, 16]);
      p.poly(B, [35, 10, 29, 0, 33, 0, 40, 9]); p.poly(B, [41, 12, 44, 0, 48, 1, 45, 13]);
      p.poly(Pu, [30, 1, 32, 1, 37, 8, 35, 8]);
      gem(p, '#d8ffe8', Gr, 42, 46, 2.4); gem(p, '#d8ffe8', Gr, 74, 50, 2.4); p.snap(Gr, 32.5, 11.5, 2.2, 2.2);
    },
    flamespawn(p, f) { spawn(p, f, ['#fff4a0', '#ff5a28', '#9c2410', '#ffb060'], 'fire'); },
    frostspawn(p, f) { spawn(p, f, ['#ffffff', '#5aa8ff', '#1e4cae', '#bfe4ff'], 'ice'); },
    thunderspawn(p, f) { spawn(p, f, ['#fff0ff', '#a060ff', '#4c1ea0', '#e0baff'], 'elec'); },
    windspawn(p, f) { spawn(p, f, ['#eafff4', '#3fd08a', '#0e6a4a', '#aaffd4'], 'wind'); },
    baryon(p, f) { baryonArt(p, f, { S: '#e8e8f2', Ss: '#a4a4bc', C: '#161a44', Cg: '#6a78ff', Ch: '#d8dcff', Sp: '#b8c0ff' }); },
    antibaryon(p, f) { baryonArt(p, f, { S: '#3a3450', Ss: '#1c1828', C: '#f0e6ff', Cg: '#ffb040', Ch: '#fff2c0', Sp: '#ffd27a' }); },
    beetle(p) {
      const Bx = '#26282f', Bh = '#474b55', Bd = '#131418', L = '#5a70c8', Ld = '#2e3c7e';
      for (const [x0, x1, x2, y2] of [[40, 28, 24, 94], [46, 40, 36, 96], [54, 60, 64, 96], [60, 72, 76, 94]]) { seg(p, Ld, x0, 72, x1, 84, 4, 3); seg(p, Ld, x1, 84, x2, y2, 3, 2.4); p.ell(L, x1, 84, 2.4, 2.4); }
      p.poly(L, [30, 40, 38, 35, 38, 58, 30, 60]); p.poly(L, [70, 40, 62, 35, 62, 58, 70, 60]);
      p.poly(Ld, [30, 52, 38, 52, 38, 58, 30, 60]); p.poly(Ld, [70, 52, 62, 52, 62, 58, 70, 60]);
      p.poly(Bx, [38, 28, 62, 28, 62, 74, 38, 74]); p.poly(Bh, [38, 28, 43, 28, 43, 74, 38, 74]);
      p.poly(Bd, [35, 22, 65, 22, 65, 30, 35, 30]); p.poly(Bh, [35, 22, 65, 22, 64, 24.5, 36, 24.5]);
      [[37, '#ff4a3a'], [50, '#ffb020'], [63, '#5ae05a']].forEach(([y, col]) => {
        p.ell(Bd, 50, y, 7, 6); p.ell(col, 50, y + 0.5, 5, 4.4); p.ell(light(col, 0.5), 48, y - 1, 2, 1.5);
        p.poly(Bd, [42, y - 6.5, 58, y - 6.5, 56, y - 3, 44, y - 3]);
      });
      p.poly(Bd, [36, 72, 64, 72, 60, 78, 40, 78]);
    },
    hound(p) {
      const Bo = '#4c5ca6', Bh = '#8696de', Bd = '#262e62', J = '#1a1c2c', Y = '#ffe040';
      seg(p, J, 74, 40, 82, 24, 5, 4); seg(p, J, 81, 43, 91, 29, 5, 4); p.ell('#565a70', 82, 24, 3, 2); p.ell('#565a70', 91, 29, 3, 2);
      seg(p, Bd, 70, 56, 76, 74, 6, 5); seg(p, Bd, 76, 74, 70, 91, 5, 4); foot(p, J, 69, 94, 10, 1);
      p.poly(Bo, [18, 50, 30, 38, 58, 34, 80, 40, 82, 52, 66, 60, 36, 62, 22, 60]);
      p.poly(Bh, [30, 38, 58, 34, 78, 39, 74, 43, 56, 40, 34, 43]);
      p.poly(Bd, [22, 60, 36, 62, 66, 60, 82, 52, 80, 58, 64, 66, 34, 66]);
      p.poly(Bd, [44, 36, 52, 24, 57, 34]);
      seg(p, Bd, 31, 60, 29, 70, 6, 5);
      p.ell(J, 28, 78, 12, 12); p.ell('#565a70', 28, 78, 8, 8); p.ell(J, 28, 78, 3, 3);
      p.poly(Bo, [8, 52, 18, 44, 29, 46, 27, 58, 12, 58]); p.poly(Bh, [9, 51, 18, 45, 26, 47, 17, 49]);
      gem(p, '#fff8c0', Y, 16, 52, 3.2);
    },
    spider(p) {
      const Bo = '#4c58a8', Bh = '#8a96dc', Bd = '#262c60', T = '#3c4478', Th = '#6c76b4', Ho = '#12142a', O = '#ff9030';
      for (const [x0, y0, x1, y1, x2, y2] of [[38, 72, 24, 82, 20, 94], [44, 76, 38, 86, 35, 96], [56, 76, 62, 86, 65, 96], [62, 72, 76, 82, 80, 94]]) { seg(p, Bd, x0, y0, x1, y1, 4, 3); seg(p, Bd, x1, y1, x2, y2, 3, 2.4); p.ell(Bh, x1, y1, 2.2, 2.2); }
      p.ell(Bd, 50, 68, 22, 12); p.ell(Bo, 50, 66, 20, 11); p.ell(Bh, 44, 62, 10, 4);
      p.poly(T, [29, 40, 71, 40, 73, 64, 27, 64]); p.poly(Th, [29, 40, 71, 40, 70, 43, 30, 43]);
      for (const [x, y] of [[36, 48], [48, 48], [60, 48], [42, 58], [54, 58]]) { p.ell(Th, x, y, 6, 5.5); p.ell(Ho, x, y + 0.6, 3.4, 3); }
      gem(p, '#ffe0a0', O, 72, 58, 3);
    },
    direwolf(p) {
      const A = '#5a6490', Ah = '#8e9aca', Ad = '#353c5c', J = '#1e2236', E = '#50e8ff', Sb = '#c8d0e0', Bd = '#2a2e40';
      p.poly(Bd, [28, 56, 32, 55, 17, 96, 12, 95]); seg(p, Sb, 30, 57, 15, 94, 1.6);
      p.poly(Bd, [28, 56, 34, 40, 37, 41, 32, 57]);
      seg(p, A, 45, 60, 38, 74, 8, 6); seg(p, Ad, 38, 74, 42, 88, 6, 5); seg(p, Ad, 42, 88, 38, 94, 5, 4); p.ell(Ah, 38, 72, 5, 6);
      seg(p, A, 55, 60, 62, 74, 8, 6); seg(p, Ad, 62, 74, 58, 88, 6, 5); seg(p, Ad, 58, 88, 64, 94, 5, 4); p.ell(Ah, 62, 72, 5, 6);
      foot(p, J, 37, 96, 11, -1); foot(p, J, 64, 96, 11, 1);
      p.poly(Ad, [40, 54, 60, 54, 62, 62, 38, 62]);
      p.poly(A, [36, 30, 64, 30, 62, 48, 56, 56, 44, 56, 38, 48]);
      p.poly(Ah, [38, 31, 50, 31, 49, 46, 42, 44]);
      p.poly(Ad, [44, 48, 56, 48, 55, 56, 45, 56]); p.snap(Ah, 45, 50, 10, 1.2); p.snap(Ah, 45, 53, 10, 1.2);
      seg(p, Ad, 32, 40, 28, 50, 6, 5); seg(p, A, 28, 50, 30, 57, 5, 4.5); p.ell(J, 30, 57, 3.5, 3.5);
      seg(p, Ad, 68, 40, 74, 52, 6, 5); seg(p, A, 74, 52, 72, 62, 5, 4.5); p.poly(J, [67, 62, 77, 62, 79, 69, 75, 66, 73, 71, 70, 66, 66, 68]);
      p.poly(Ah, [25, 28, 38, 23, 42, 36, 30, 41]); p.poly(A, [28, 36, 40, 34, 40, 40, 30, 43]);
      p.poly(Ah, [75, 28, 62, 23, 58, 36, 70, 41]); p.poly(A, [72, 36, 60, 34, 60, 40, 70, 43]);
      p.rect(J, 46, 22, 8, 6);
      p.poly(A, [42, 12, 58, 12, 60, 24, 44, 26]); p.poly(Ah, [42, 12, 50, 12, 49, 24, 44, 25]);
      p.poly(Bd, [47, 12, 49, 0, 54, 0, 55, 12]); p.poly(Sb, [49.5, 1, 52, 1, 51.5, 11, 49.5, 11]);
      p.snap(E, 44.5, 16.5, 12, 2.2);
      p.snap('#e8ecf4', 53, 20.5, 1.6, 1.6); p.snap('#e8ecf4', 56, 20.5, 1.6, 1.6);
    },
    soldier(p) {
      seg(p, '#3a2e24', 24, 96, 70, 6, 2.8);
      silvermane(p, {});
      seg(p, '#1c2030', 62, 31, 55, 40, 5.5, 4.5); p.ell('#c8ccd8', 54, 41, 3, 3);
      seg(p, '#1c2030', 38, 31, 42, 50, 5.5, 4.5); p.ell('#c8ccd8', 43, 55, 3, 3); seg(p, '#1c2030', 42, 50, 43, 54, 4.5, 4);
      p.poly('#c8d0dc', [62, 10, 74, 3, 81, 16, 71, 21, 66, 16]); p.poly('#eef2f8', [74, 3, 81, 16, 78, 16, 73, 6]);
      p.poly('#8a92a4', [62, 10, 66, 16, 64, 17, 60, 12]);
      p.poly('#ffb040', [68, 6, 72, 0, 73, 7]);
    },
    gunner(p) {
      silvermane(p, {});
      seg(p, '#1c2030', 38, 31, 32, 42, 5.5, 4.5); seg(p, '#1c2030', 62, 31, 56, 43, 5.5, 4.5);
      p.poly('#1e1e24', [10, 40, 52, 37, 54, 44, 12, 46]); p.poly('#3a3a46', [10, 40, 52, 37, 52, 39, 10, 42]);
      p.poly('#5a3a26', [52, 37, 64, 39, 66, 48, 54, 45]); p.rect('#c83030', 24, 41, 12, 2); p.rect('#3a3a44', 6, 40.5, 5, 3);
      p.ell('#c8ccd8', 32, 44, 3, 3); p.ell('#c8ccd8', 55, 44, 3, 3);
    },
    cannoneer(p) {
      silvermane(p, { tall: true, fur: true });
      seg(p, '#1c2030', 38, 31, 38, 50, 5.5, 4.5); seg(p, '#1c2030', 62, 31, 58, 50, 5.5, 4.5);
      p.poly('#2c2e36', [6, 56, 56, 47, 60, 62, 11, 73]); p.poly('#4a4e5a', [6, 56, 56, 47, 57, 51, 7, 60]);
      p.ell('#101014', 9, 64.5, 5, 8.5); p.ell('#2c2e36', 9, 64.5, 2.5, 5);
      p.poly('#60646e', [21, 53, 25, 52, 28, 68, 24, 69]); p.poly('#60646e', [42, 49, 46, 48, 49, 63, 45, 64]);
      p.poly('#6a4228', [56, 47, 71, 49, 73, 64, 60, 62]); seg(p, '#b83030', 38, 30, 64, 60, 2);
      p.ell('#c8ccd8', 38, 52, 3.2, 3.2); p.ell('#c8ccd8', 58, 52, 3.2, 3.2);
    },
    lieutenant(p) {
      seg(p, '#3a2e24', 33, 82, 18, 20, 2.8);
      star(p, '#5aa8f0', 17, 17, 13, 3.4); star(p, '#e0f4ff', 17, 17, 6, 1.6);
      shard(p, '#8ad0ff', null, 17, 17, 11, -2.4, 2.5); shard(p, '#8ad0ff', null, 17, 17, 11, -0.8, 2.5);
      silvermane(p, { tall: true, armor: true });
      seg(p, '#dfe2ea', 38, 31, 30, 44, 5.5, 4.5); p.ell('#c8ccd8', 29, 45, 3, 3);
      p.poly('#eef0f6', [54, 28, 80, 23, 90, 44, 86, 80, 66, 94, 53, 70]);
      p.poly('#b6bac8', [72, 25, 80, 23, 90, 44, 86, 80, 76, 88]);
      seg(p, '#d8b050', 54, 28, 80, 23, 1.6); seg(p, '#d8b050', 53, 70, 66, 94, 1.6);
      shard(p, '#4a98f0', '#d8f0ff', 70, 52, 24, -0.55, 4.5); shard(p, '#4a98f0', '#d8f0ff', 68, 60, 20, 0.35, 4); shard(p, '#6ab8ff', null, 64, 44, 16, -1.6, 3.5);
      gem(p, '#e8f8ff', '#4a98f0', 68, 56, 4);
    },
    vagrant(p) {
      const Hm = '#ebe7de', Hs = '#bab4a8', V = '#34343c', Sh = '#e8dfca', Vs = '#6a4a2c', Pa = '#bba27a', Pd = '#8a7654', Bt = '#5a3a22', Sk = '#e2c2a0';
      seg(p, '#4a3e30', 72, 96, 30, 8, 3);
      p.poly('#3a3c44', [16, 6, 40, 0, 45, 6, 36, 9, 21, 12]); p.poly('#6a6e7a', [16, 6, 30, 3, 30, 5, 19, 8]);
      seg(p, Pa, 44, 60, 40, 84, 8, 7); seg(p, Pa, 56, 60, 62, 84, 8, 7); p.ell(Pd, 41, 72, 4, 3); p.ell(Pd, 60, 72, 4, 3);
      p.poly(Bt, [35, 82, 46, 82, 46, 93, 48, 96, 33, 96, 35, 90]); p.poly(Bt, [56, 82, 66, 82, 66, 90, 69, 96, 55, 96, 56, 93]);
      p.poly(Sh, [38, 28, 62, 28, 61, 55, 39, 55]); p.poly(dark(Sh, 0.15), [54, 29, 62, 28, 61, 55, 55, 55]);
      p.poly(Vs, [40, 30, 45, 30, 45, 55, 40, 55]); p.poly(Vs, [55, 30, 60, 30, 60, 55, 55, 55]);
      p.rect(Vs, 39, 53, 22, 3); p.poly(Pa, [39, 55, 61, 55, 62, 62, 38, 62]);
      seg(p, Sh, 38, 31, 34, 43, 6, 5); seg(p, Sk, 34, 43, 40, 50, 4.5, 4); p.ell(Sk, 41, 51, 3, 3);
      seg(p, Sh, 62, 31, 60, 38, 6, 5); seg(p, Sk, 60, 38, 50, 28, 4.5, 4); p.ell(Sk, 49, 27, 3, 3);
      p.rect(dark(Sh, 0.3), 45, 22, 10, 6);
      p.ell(Hm, 50, 15, 9, 8); p.ell(Hs, 54, 17, 4, 5);
      p.rect(Hs, 40.5, 16, 19, 2.6);
      p.poly(V, [43, 18, 57, 18, 56, 23, 44, 23]); p.snap('#8ab0c8', 45, 19.5, 3.4, 2); p.snap('#8ab0c8', 51.5, 19.5, 3.4, 2);
      p.ell('#8a8a92', 50, 26, 5, 3.5); p.ell('#5a5a62', 50, 26.5, 2, 1.6);
    },
    shadewalker(p) { knight(p, { A: '#2a4a9a', Ah: '#5a8ae0', Ad: '#16285a', Gl: '#70f0ff', St: '#bcd8f4' }); },
    incinerator(p) { knight(p, { A: '#6a2418', Ah: '#c0502a', Ad: '#3a100a', Gl: '#ffb040', St: '#f0d0a8' }); },
    prowler(p) { prowlerArt(p, { O: '#111a44', Oh: '#2c3c8e', Cr: '#3a78e8', Crh: '#a8dcff', Crd: '#1c3aa0', M: '#3c4056', Md: '#1e2030', E: '#ffa040', St: '#e0e8ff' }); },
    searing(p) { prowlerArt(p, { O: '#3a0e08', Oh: '#7a2410', Cr: '#e8542a', Crh: '#ffc080', Crd: '#9a2410', M: '#4a3a36', Md: '#241a18', E: '#ffe060', St: '#ffd8a0' }); },
    iceout(p) {
      const M = '#3a6ae0', Hh = '#9ad0ff', D = '#1a3a90', Gw = '#dff6ff';
      shard(p, D, null, 42, 62, 32, 1.75, 6); shard(p, D, M, 58, 62, 32, 1.4, 6);
      shard(p, M, Hh, 32, 36, 36, 1.9, 6); shard(p, M, Hh, 68, 36, 34, 1.2, 6);
      shard(p, D, null, 30, 60, 12, 2.4, 4); shard(p, D, null, 72, 60, 12, 0.7, 4);
      p.poly(M, [36, 30, 50, 24, 64, 30, 62, 54, 50, 62, 38, 54]);
      p.poly(Hh, [36, 30, 50, 24, 50, 44, 40, 46]); p.poly(D, [50, 44, 62, 40, 62, 54, 50, 62]);
      shard(p, M, Hh, 48, 26, 22, -1.8, 5); shard(p, M, Hh, 54, 26, 26, -1.3, 5); shard(p, D, null, 42, 28, 16, -2.4, 4);
      shard(p, Hh, null, 34, 32, 14, -2.8, 4); shard(p, Hh, null, 66, 32, 14, -0.3, 4);
      gem(p, '#ffffff', Gw, 50, 42, 3);
    },
    blazeout(p) {
      const M = '#e0602a', Hh = '#ffc070', D = '#8a2a10', Gw = '#fff4c8';
      shard(p, D, null, 42, 62, 30, 1.75, 6); shard(p, D, M, 58, 62, 30, 1.4, 6);
      shard(p, M, Hh, 32, 38, 34, 1.9, 6); shard(p, M, Hh, 68, 38, 32, 1.2, 6);
      p.poly(M, [36, 32, 50, 26, 64, 32, 62, 54, 50, 62, 38, 54]);
      p.poly(Hh, [36, 32, 50, 26, 50, 44, 40, 46]); p.poly(D, [50, 44, 62, 40, 62, 54, 50, 62]);
      p.poly('#ff8a3a', [40, 30, 44, 12, 48, 24, 52, 6, 56, 22, 60, 14, 62, 32, 50, 28]);
      p.poly('#ffd060', [45, 28, 48, 16, 51, 26, 54, 14, 57, 28, 50, 27]);
      shard(p, Hh, null, 34, 34, 14, -2.8, 4); shard(p, Hh, null, 66, 34, 14, -0.3, 4);
      gem(p, '#ffffff', Gw, 50, 42, 3);
    },
    iceedge(p) {
      const M = '#5aa0e0', Hh = '#dff4ff', D = '#2a5a9a';
      shard(p, D, null, 40, 96, 44, -1.9, 7); shard(p, M, Hh, 50, 96, 70, -1.57, 9); shard(p, D, Hh, 60, 96, 50, -1.25, 7);
      shard(p, M, null, 34, 96, 24, -2.3, 5); shard(p, M, null, 66, 96, 26, -0.8, 5);
    },
    distorter(p) {
      const A = '#24223a', Ah = '#45406e', Ad = '#110f1e', Au = '#e8b048', Cl = '#3a1c4e', Clh = '#6a3a8a', V = '#ff4ad8', Vh = '#ffd0f4';
      p.poly(Cl, [38, 30, 62, 30, 70, 70, 64, 92, 50, 84, 36, 92, 30, 70]);
      p.poly(Clh, [38, 30, 48, 30, 42, 70, 36, 90, 30, 70]);
      seg(p, Ad, 46, 60, 42, 92, 5, 4); seg(p, Ad, 54, 60, 58, 92, 5, 4); foot(p, Ad, 41, 95, 8, -1); foot(p, Ad, 59, 95, 8, 1);
      p.poly(A, [40, 26, 60, 26, 58, 50, 50, 56, 42, 50]); p.poly(Ah, [41, 27, 50, 27, 50, 52, 43, 48]);
      seg(p, Au, 50, 28, 50, 52, 2); seg(p, Au, 42, 30, 48, 46, 1.4); seg(p, Au, 58, 30, 52, 46, 1.4);
      p.ell(Ah, 39, 29, 6, 5); p.ell(Ah, 61, 29, 6, 5); shard(p, Au, null, 37, 26, 9, -2.6, 3); shard(p, Au, null, 63, 26, 9, -0.55, 3);
      p.rect(Ad, 46, 20, 8, 6);
      p.ell(A, 50, 14, 7, 8);
      p.poly(Ah, [43, 12, 40, 0, 47, 7, 50, 1, 53, 7, 60, 0, 57, 12]);
      p.snap(V, 44.5, 13.5, 11, 2.4); p.snap(Vh, 47, 14, 6, 1.2);
      seg(p, A, 62, 32, 70, 46, 5, 4.5); seg(p, A, 70, 46, 64, 58, 4.5, 4); p.ell(Ad, 64, 58, 3.2, 3.2);
      seg(p, Ad, 92, 4, 46, 92, 2.2); seg(p, V, 90, 7, 50, 84, 0.9);
      p.poly(Vh, [88, 0, 98, 2, 94, 14, 86, 10]); p.poly(V, [86, 10, 94, 14, 90, 18]);
      seg(p, A, 38, 32, 32, 46, 5, 4.5); p.ell(Ad, 32, 47, 3.2, 3.2);
      p.ell(V, 32, 52, 3.5, 3.5); p.ell(Vh, 32, 52, 1.5, 1.5);
    },
    weaver(p, f) {
      const B = '#2a2418', Bh = '#5a4a2c', Bd = '#14100a', G = '#ffd23a', Gh = '#fff6c0', Gd = '#c08a10', up = f ? -2 : 0;
      curve(p, Bd, bez(46, 66 + up, 38, 82, 30, 96, 8), 3, 1); curve(p, Bd, bez(54, 66 + up, 62, 84, 70, 96, 8), 3, 1); curve(p, Bd, bez(50, 68 + up, 52, 86, 48, 98, 8), 2.6, 0.8);
      curve(p, B, bez(36, 60 + up, 26, 40, 14, 30, 10), 3.6, 1.2); curve(p, B, bez(64, 60 + up, 74, 40, 86, 30, 10), 3.6, 1.2);
      curve(p, B, bez(22, 40 + up, 16, 24, 20, 10, 8), 2, 0.8); curve(p, B, bez(78, 40 + up, 84, 24, 80, 10, 8), 2, 0.8);
      curve(p, B, bez(44, 30 + up, 38, 14, 42, 2, 8), 2.6, 0.8); curve(p, B, bez(56, 30 + up, 62, 14, 58, 2, 8), 2.6, 0.8);
      curve(p, Bh, bez(50, 30 + up, 50, 16, 50, 6, 6), 2, 0.8);
      p.poly(B, [36, 34 + up, 64, 34 + up, 70, 52 + up, 62, 70 + up, 38, 70 + up, 30, 52 + up]);
      p.clipPoly([36, 34 + up, 64, 34 + up, 70, 52 + up, 62, 70 + up, 38, 70 + up, 30, 52 + up], () => {
        for (let i = 0; i < 6; i++) seg(p, Bh, 30 + i * 8, 34 + up, 26 + i * 8 + 12, 72 + up, 1.4);
        for (let i = 0; i < 6; i++) seg(p, Bd, 70 - i * 8, 34 + up, 74 - i * 8 - 12, 72 + up, 1.2);
      });
      p.ell(Gd, 50, 52 + up, 10, 10); p.ell(G, 50, 52 + up, 7.5, 7.5); p.ell(Gh, 48, 50 + up, 3.5, 3.5);
      for (const [x, y] of [[20, 30], [82, 28], [42, 6], [58, 4], [14, 30], [86, 32]]) { p.ell(Gd, x, y + up, 2.4, 2.4); p.ell(G, x, y + up, 1.4, 1.4); }
      star(p, Gh, 50, 52 + up, 13, 1.6);
    },
    guardian(p) {
      const R = '#2a1a4a', Rh = '#4a3080', Rd = '#140a26', L = '#c890ff', Lh = '#f4e4ff', S = '#e8dcff', Sk = '#9a88c8';
      seg(p, L, 30, 6, 22, 20, 1.2); seg(p, L, 22, 20, 28, 30, 1.2); seg(p, L, 72, 4, 80, 18, 1.2); seg(p, L, 80, 18, 74, 30, 1.2);
      ringBand(p, L, 50, 14, 18, 7, 2, Math.PI * 0.9, Math.PI * 2.1);
      p.poly(Rd, [40, 34, 60, 34, 74, 92, 26, 92]);
      p.poly(R, [42, 32, 58, 32, 70, 96, 50, 90, 30, 96]);
      p.poly(Rh, [42, 32, 50, 32, 46, 92, 30, 96]);
      seg(p, L, 50, 36, 50, 88, 1.2); seg(p, L, 30, 96, 50, 90, 1); seg(p, L, 50, 90, 70, 96, 1);
      p.poly(R, [38, 34, 26, 48, 20, 40, 34, 28]); p.poly(R, [62, 34, 74, 48, 80, 40, 66, 28]);
      p.ell(Sk, 20, 38, 3.2, 3.2); p.ell(Sk, 80, 38, 3.2, 3.2);
      p.ell(Lh, 18, 34, 4, 4); p.ell(L, 18, 34, 6, 6); p.ell(Lh, 18, 34, 2.4, 2.4);
      p.ell(L, 82, 34, 6, 6); p.ell(Lh, 82, 34, 2.4, 2.4);
      p.poly(Rd, [42, 14, 58, 14, 62, 34, 38, 34]);
      p.poly(R, [42, 10, 50, 4, 58, 10, 60, 30, 40, 30]); p.poly(Rh, [42, 10, 50, 4, 50, 30, 40, 30]);
      p.ell(Sk, 50, 20, 5.5, 7); p.ell(S, 49, 19, 4, 5.5);
      p.snap(L, 46, 19, 2.2, 1.4); p.snap(L, 51.6, 19, 2.2, 1.4);
      star(p, Lh, 50, 40, 5, 1.2);
    },
    juvsting(p, f) {
      const B = '#1e4a6a', Bh = '#3a8ac0', Bd = '#0c1e30', A = '#ffc830', Ah = '#fff0a0', Wm = '#8ad0f0', Wd = '#3a7aa8', wy = f ? -7 : 0;
      p.poly(Wd, [50, 42, 18, 14 + wy, 4, 26 + wy, 30, 48]); p.poly(Wm, [50, 42, 20, 18 + wy, 9, 27 + wy, 31, 45]);
      p.poly(Wd, [50, 42, 82, 14 + wy, 96, 26 + wy, 70, 48]); p.poly(Wm, [50, 42, 80, 18 + wy, 91, 27 + wy, 69, 45]);
      for (const s of [-1, 1]) { seg(p, Bd, 50 + s * 8, 50, 50 + s * 22, 60, 2.4); seg(p, Bd, 50 + s * 22, 60, 50 + s * 26, 74, 2); seg(p, Bd, 50 + s * 9, 56, 50 + s * 18, 72, 2); }
      p.ell(Bd, 50, 68, 14, 20); p.ell(B, 50, 66, 12, 18); p.ell(Bh, 46, 60, 5, 9);
      for (const y of [58, 66, 74]) seg(p, A, 39, y, 61, y, 1.6);
      p.poly(Bd, [44, 82, 56, 82, 50, 98]); p.poly(A, [46, 82, 54, 82, 50, 96]); p.poly(Ah, [48, 82, 50, 82, 50, 94]);
      p.ell(Bd, 50, 44, 12, 10); p.ell(B, 50, 43, 10, 8); p.ell(Bh, 47, 40, 4, 3);
      p.ell(Bd, 50, 29, 9, 8); p.ell(B, 50, 28, 8, 7);
      gem(p, Ah, A, 45, 27, 2.2); gem(p, Ah, A, 55, 27, 2.2);
      seg(p, Bd, 46, 34, 42, 40, 1.6); seg(p, Bd, 54, 34, 58, 40, 1.6);
      curve(p, Bd, bez(46, 22, 40, 12, 34, 10, 6), 1.4, 0.8); curve(p, Bd, bez(54, 22, 60, 12, 66, 10, 6), 1.4, 0.8);
    },
    gnawsting(p, f) {
      const B = '#2a4a24', Bh = '#5a8a3a', Bd = '#122010', C = '#a8ff50', Ch = '#eaffc0', K = '#3a2a10', wy = f ? -5 : 0;
      p.poly(Bd, [50, 40, 14, 22 + wy, 6, 40 + wy, 30, 50]); p.poly('#6aa060', [50, 40, 16, 26 + wy, 11, 39 + wy, 31, 47]);
      p.poly(Bd, [50, 40, 86, 22 + wy, 94, 40 + wy, 70, 50]); p.poly('#6aa060', [50, 40, 84, 26 + wy, 89, 39 + wy, 69, 47]);
      for (const s of [-1, 1]) for (const k of [0, 1, 2]) { seg(p, Bd, 50 + s * 12, 52 + k * 7, 50 + s * (26 + k * 2), 58 + k * 9, 2.6); seg(p, Bd, 50 + s * (26 + k * 2), 58 + k * 9, 50 + s * (24 + k * 3), 72 + k * 8, 2); }
      p.ell(Bd, 50, 66, 19, 22); p.ell(B, 50, 64, 17, 20); p.ell(Bh, 44, 56, 6, 10);
      for (const [x, y] of [[40, 60], [58, 66], [46, 74], [56, 54]]) { p.ell(C, x, y, 2.6, 2.6); p.ell(Ch, x - 0.6, y - 0.6, 1, 1); }
      for (const y of [62, 72]) seg(p, K, 34, y, 66, y, 1.4);
      p.poly(Bd, [42, 82, 58, 82, 50, 98]); p.poly(C, [45, 84, 55, 84, 50, 96]);
      p.ell(Bd, 50, 40, 15, 12); p.ell(B, 50, 39, 13, 10);
      for (const s of [-1, 1]) p.poly(K, [50 + s * 8, 30, 50 + s * 16, 20, 50 + s * 12, 32]);
      p.ell(Bd, 50, 28, 10, 8); p.ell(B, 50, 27, 9, 7);
      gem(p, Ch, C, 45, 26, 2.2); gem(p, Ch, C, 55, 26, 2.2);
      p.poly(K, [44, 32, 50, 38, 56, 32, 54, 36, 50, 40, 46, 36]);
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
    trotter(p, f) {
      const Bk = '#16161c', W = '#f2f2f4', Ws = '#c4c4d2', Au = '#e8b840', Auh = '#fff0b0', b = f ? -2 : 0;
      p.poly(Au, [58, 34 + b, 88, 16 + b, 97, 20 + b, 82, 32 + b, 66, 44 + b]); p.poly(Auh, [60, 34 + b, 88, 17 + b, 91, 19 + b, 66, 37 + b]);
      p.ell(Bk, 38, 88, 7, 3); p.ell(Bk, 60, 88, 7, 3);
      const egg = circle(48, 62 + b, 28, 25, 24);
      p.poly(Bk, egg);
      p.clipPoly(egg, () => {
        p.ell(Au, 48, 47 + b, 32, 22); p.ell(W, 48, 44 + b, 32, 20); p.ell(Ws, 64, 48 + b, 14, 12);
        p.poly(Au, [46, 30 + b, 50, 30 + b, 51, 64 + b, 45, 64 + b]);
      });
      p.ell('#4a4a5a', 34, 70 + b, 6, 3); p.ell('#7a7a8a', 32, 69 + b, 2.5, 1.4);
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

  function baryonArt(p, f, c) {
    const { S, Ss, C, Cg, Ch, Sp } = c, cx = 50, cy = 52, r = 22, band = f ? 3 : 0;
    p.ell(Ss, cx, cy, r, r);
    p.ell(S, cx - 2, cy - 2, r - 2.5, r - 2.5);
    p.clipPoly(circle(cx, cy, r - 1.5), () => {
      p.poly(C, [cx - 30, cy - 12 + band, cx + 30, cy + 2 + band, cx + 30, cy + 14 + band, cx - 30, cy + 1 + band]);
      p.poly(Ss, [cx + 4, cy - 30, cx + 8, cy - 30, cx + 2, cy - 6 + band, cx - 2, cy - 7 + band]);
    });
    p.snap('#ffffff', 40, 47 + band, 1.6, 1.6); p.snap(Sp, 56, 53 + band, 1.6, 1.6); p.snap('#ffffff', 64, 57 + band, 1.2, 1.2);
    p.ell(Cg, cx + 2, cy + 3 + band, 4, 3); p.ell(Ch, cx + 2, cy + 3 + band, 1.6, 1.2);
    p.ell('#ffffff', cx - 9, cy - 11, 4, 2.5);
  }

  function prowlerArt(p, c) {
    const { O, Oh, Cr, Crh, Crd, M, Md, E, St } = c;
    shard(p, Crd, null, 34, 44, 22, -2.4, 5); shard(p, Crd, null, 44, 40, 30, -1.95, 6);
    shard(p, Cr, Crh, 52, 38, 34, -1.5, 7); shard(p, Cr, Crh, 62, 40, 28, -1.05, 6); shard(p, Crd, null, 70, 44, 22, -0.6, 5);
    seg(p, M, 64, 72, 74, 84, 6, 5); seg(p, Md, 74, 84, 70, 94, 5, 4); foot(p, Md, 70, 96, 9, 1);
    seg(p, M, 40, 72, 32, 84, 6, 5); seg(p, Md, 32, 84, 34, 94, 5, 4); foot(p, Md, 34, 96, 9, -1);
    p.ell(Crd, 52, 60, 26, 22); p.ell(O, 52, 60, 23, 19);
    for (const [x, y] of [[44, 58], [58, 66], [52, 52], [62, 56], [46, 68]]) p.snap(St, x, y, 1.4, 1.4);
    p.ell(Oh, 44, 51, 8, 4.5);
    seg(p, M, 32, 58, 22, 74, 7, 6); p.poly(Cr, [6, 62, 26, 56, 30, 80, 16, 92, 5, 84]); p.poly(Crh, [6, 62, 26, 56, 22, 62, 9, 68]); p.poly(Crd, [16, 92, 30, 80, 28, 86, 18, 95]);
    seg(p, M, 72, 58, 82, 74, 7, 6); p.poly(Cr, [98, 62, 78, 56, 74, 80, 88, 92, 99, 84]); p.poly(Crh, [98, 62, 78, 56, 82, 62, 95, 68]); p.poly(Crd, [88, 92, 74, 80, 76, 86, 86, 95]);
    gem(p, '#fff0c0', E, 44, 46, 2.4); gem(p, '#fff0c0', E, 58, 46, 2.4);
  }

  function knight(p, c) {
    const { A, Ah, Ad, Gl, St } = c;
    seg(p, Ad, 20, 96, 72, 4, 2.8); seg(p, Gl, 22, 93, 70, 7, 1.1);
    p.poly(St, [63, 6, 80, 0, 86, 15, 77, 22, 68, 16]); p.poly(Gl, [80, 0, 86, 15, 83, 16, 78, 3]); p.poly(Ad, [63, 6, 68, 16, 66, 17, 61, 9]);
    seg(p, A, 44, 58, 36, 76, 8, 7); seg(p, Ad, 36, 76, 34, 92, 7, 5); foot(p, Ad, 33, 95, 10, -1);
    seg(p, A, 56, 58, 64, 74, 8, 7); seg(p, Ad, 64, 74, 66, 92, 7, 5); foot(p, Ad, 67, 95, 10, 1);
    shard(p, Ah, Gl, 36, 74, 8, -2.3, 3.5); shard(p, Ah, Gl, 64, 72, 8, -0.8, 3.5);
    p.poly(Ad, [40, 50, 60, 50, 58, 58, 42, 58]);
    p.poly(A, [36, 26, 64, 26, 62, 48, 50, 56, 38, 48]);
    p.poly(Ah, [38, 27, 50, 27, 50, 52, 40, 46]);
    seg(p, Gl, 50, 28, 50, 52, 1.4); seg(p, Gl, 38, 30, 44, 46, 1.2);
    shard(p, Ah, Gl, 36, 28, 13, -2.45, 4.5); shard(p, Ah, Gl, 64, 28, 13, -0.7, 4.5);
    seg(p, A, 38, 32, 44, 48, 5.5, 4.5); p.ell(Ad, 45, 50, 3.2, 3.2);
    seg(p, A, 62, 32, 57, 40, 5.5, 4.5); p.ell(Ad, 56, 41, 3.2, 3.2);
    p.rect(Ad, 46, 22, 8, 5);
    p.poly(A, [42, 6, 58, 6, 59, 24, 41, 24]); p.poly(Ah, [42, 6, 49, 6, 49, 24, 42, 24]);
    p.snap(Gl, 43, 13, 14, 2.2);
    shard(p, Ah, Gl, 50, 6, 9, -1.57, 3);
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
    reaver: { icon: [50, 20, 17] }, eliminator: { icon: [52, 15, 15] }, trampler: { icon: [38, 16, 18] },
    flamespawn: { icon: [50, 44, 28], anim: true, float: true, aura: '255,120,60' }, frostspawn: { icon: [50, 44, 28], anim: true, float: true, aura: '120,190,255' },
    thunderspawn: { icon: [50, 44, 28], anim: true, float: true, aura: '190,120,255' }, windspawn: { icon: [50, 44, 30], anim: true, float: true, aura: '100,240,170' },
    baryon: { icon: [50, 52, 25], anim: true, float: true }, antibaryon: { icon: [50, 52, 25], anim: true, float: true, aura: '255,180,80' },
    distorter: { icon: [50, 16, 16], aura: '255,80,210' }, weaver: { icon: [50, 48, 26], anim: true, float: true, aura: '255,210,60' }, guardian: { icon: [50, 22, 18], aura: '200,140,255' },
    beetle: { icon: [50, 46, 24] }, hound: { icon: [30, 52, 24] }, spider: { icon: [50, 54, 26] }, direwolf: { icon: [50, 17, 16] },
    soldier: { icon: [50, 15, 13] }, gunner: { icon: [50, 15, 13] }, cannoneer: { icon: [50, 12, 14] }, lieutenant: { icon: [50, 12, 14] },
    vagrant: { icon: [50, 18, 13] }, shadewalker: { icon: [50, 15, 15], aura: '110,230,255' }, incinerator: { icon: [50, 15, 15], aura: '255,150,60' },
    prowler: { icon: [52, 50, 28], aura: '90,160,255' }, searing: { icon: [52, 50, 28], aura: '255,120,50' }, iceout: { icon: [50, 32, 24], aura: '140,210,255' }, blazeout: { icon: [50, 30, 24], aura: '255,140,60' }, iceedge: { icon: [50, 52, 30] },
    ethereal: { icon: [50, 34, 18], aura: '255,110,60' }, etherhound: { icon: [22, 50, 20], aura: '255,130,70' }, mimic: { icon: [50, 22, 16], anim: true, aura: '255,110,60' },
    trotter: { icon: [48, 56, 30], anim: true }, juvsting: { icon: [50, 34, 20], anim: true, float: true, aura: '120,210,255' }, gnawsting: { icon: [50, 34, 22], anim: true, aura: '170,255,90' }, skaracabaz: { icon: [50, 28, 20], anim: true, aura: '80,230,210' }, doomsday: { icon: [50, 24, 20], anim: true, aura: '170,110,255' },
    gepard_b: { figure: 'gepard', front: 'gepardShield' }, bronya_b: { figure: 'bronya', front: 'bronyaRifle', aura: '120,200,255' }, grizzly: { icon: [48, 46, 26], anim: true }, svarog_b: { icon: [50, 18, 15], anim: true, aura: '255,60,160' },
    cocolia1: { figure: 'cocolia', front: 'cocoliaSpear', aura: '150,220,255' }, cocolia2: { icon: [50, 17, 13], anim: true, aura: '150,200,255' },
    hecate: { icon: [50, 20, 17], anim: true, aura: '255,70,130' }, scar_nightmare: { icon: [50, 24, 20], anim: true, aura: '170,110,255' }
  };

  function lookFor(name) { return G.lookOf(name, null); }

  function idOf(data) {
    if (data && data.id && META[data.id]) return data.id;
    const byShape = { bronya: 'bronya_b', cocolia: 'cocolia1', cocolia2: 'cocolia2', gepard: 'gepard_b', doomsday: 'doomsday', grizzly: 'grizzly', svarog: 'svarog_b' };
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

  Object.assign(G, { drawEnemy, fieldEnemy, foeIcon, foeCanvas, FOE_META: META, FOE_ART: ART, FOE_FAMILY: FAMILY, foeId: idOf, svarogArt, SVAROG });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
