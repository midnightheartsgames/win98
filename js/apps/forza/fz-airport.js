(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const shade = F.Models.shade;
  const Street = F.Street;
  const { uv, vq, hq, oq } = Street;
  const WHITE = C('#ffffff');

  const TYPES = {
    b737: { r: 1.9, lift: 1.05, nose: 4.2, tail: 6, wing: { y: -0.75, z: -1.6, root: 6.2, tip: 1.7, span: 14.4, sweep: 4.8, dih: 0.9, t: 0.35 }, eng: [{ x: 5, y: -1.75, z: -3.9, r: 0.82, l: 3.6, kind: 'jet' }], fin: { h: 6.4, root: 5.6, top: 2.1, sweep: 4.2 }, stab: { span: 6.5, root: 3, tip: 1.1, sweep: 2.4, y: 0.7, t: false }, gear: 1.05 },
    rj70: { r: 1.8, lift: 0.8, nose: 3.8, tail: 5.2, wing: { y: 1.25, z: -1.4, root: 4.6, tip: 1.5, span: 13, sweep: 2.4, dih: -0.35, t: 0.32 }, eng: [{ x: 3.3, y: 0.6, z: -3.2, r: 0.58, l: 2.8, kind: 'jet' }, { x: 6.2, y: 0.5, z: -2.6, r: 0.58, l: 2.8, kind: 'jet' }], fin: { h: 5.6, root: 5, top: 3, sweep: 4.4 }, stab: { span: 5.6, root: 2.4, tip: 1.2, sweep: 1.8, t: true }, gear: 0.8 },
    f50: { r: 1.4, lift: 0.7, nose: 3, tail: 5, wing: { y: 1.05, z: -0.8, root: 3.4, tip: 1.4, span: 14.5, sweep: 0.4, dih: 0.35, t: 0.3 }, eng: [{ x: 3.7, y: 0.55, z: -2.6, r: 0.55, l: 4.2, kind: 'prop' }], fin: { h: 4.8, root: 4.2, top: 2.2, sweep: 2.6 }, stab: { span: 4.8, root: 2.2, tip: 1.1, sweep: 1, y: 0.6, t: false }, gear: 0.7 },
    tu134: { r: 1.5, lift: 1.05, nose: 4.6, tail: 6.5, glass: true, wing: { y: -0.7, z: 1.5, root: 5.4, tip: 1.6, span: 14.5, sweep: 6.2, dih: 0.4, t: 0.32 }, eng: [{ x: 2.35, y: 0.55, z: 11, r: 0.72, l: 5.2, kind: 'rear' }], fin: { h: 6.2, root: 5.2, top: 3, sweep: 5.4 }, stab: { span: 5.8, root: 2.6, tip: 1.2, sweep: 2.6, t: true }, gear: 1 }
  };
  const LIVERY = [
    { body: '#f4f4f0', belly: '#b8bcc0', stripe: '#1a4a9a', stripe2: '#ffc81e', tail: 0 },
    { body: '#eeeee8', belly: '#a8acb0', stripe: '#1e3a8a', stripe2: '#1e3a8a', tail: 1 },
    { body: '#f4f4f0', belly: '#c8202e', stripe: '#c8202e', stripe2: '#f4f4f0', tail: 2 }
  ];
  const OCT = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + k * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; });

  function plane(wb, sb, pl) {
    const T = TYPES[pl.type] || TYPES.b737, L = pl.len, r = T.r, cy = r + T.lift, liv = LIVERY[pl.livery || 0];
    const body = C(liv.body), belly = C(liv.belly), stripe = C(liv.stripe), grey = C('#c8ccd0'), glass = C('#1a2630');
    const z0 = -L / 2, z1 = L / 2;
    const prof = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, e = Math.sin(t * Math.PI / 2); prof.push([z0 + T.nose * t, r * (0.12 + 0.88 * Math.pow(e, 0.8)), cy - r * 0.25 * (1 - e)]); }
    prof.push([z1 - T.tail, r, cy]);
    for (let k = 1; k <= 5; k++) { const t = k / 5; prof.push([z1 - T.tail + T.tail * t, r * (1 - 0.75 * t), cy + r * 0.55 * t * t]); }
    const ringCol = k => { const y = OCT[k][1]; return y < -0.5 ? belly : y > 0.5 ? body : shade(body, 0.94); };
    for (let i = 0; i + 1 < prof.length; i++) {
      const [za, ra, ya] = prof[i], [zb, rb, yb] = prof[i + 1];
      for (let k = 0; k < 8; k++) {
        const a = OCT[k], c = OCT[(k + 1) % 8], n = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, 0];
        const nl = Math.hypot(n[0], n[1]);
        oq(wb, [a[0] * ra, ya + a[1] * ra, za], [c[0] * ra, ya + c[1] * ra, za], [c[0] * rb, yb + c[1] * rb, zb], [a[0] * rb, yb + a[1] * rb, zb], ringCol(k), 0, null, [n[0] / nl, n[1] / nl, 0]);
      }
    }
    const p0 = prof[0];
    for (let k = 0; k < 8; k++) { const a = OCT[k], c = OCT[(k + 1) % 8]; wb.triangle([0, p0[2], p0[0] - 0.12], [c[0] * p0[1], p0[2] + c[1] * p0[1], p0[0]], [a[0] * p0[1], p0[2] + a[1] * p0[1], p0[0]], body); }
    const pe = prof[prof.length - 1];
    for (let k = 0; k < 8; k++) { const a = OCT[k], c = OCT[(k + 1) % 8]; wb.triangle([0, pe[2], pe[0] + 0.1], [a[0] * pe[1], pe[2] + a[1] * pe[1], pe[0]], [c[0] * pe[1], pe[2] + c[1] * pe[1], pe[0]], grey); }
    const fx = r * Math.cos(Math.PI / 8) + 0.012, sideTop = cy + r * Math.sin(Math.PI / 8);
    for (const s of [-1, 1]) {
      const n = [s, 0, 0];
      vq(wb, [s * fx, z0 + T.nose + 0.3], [s * fx, z1 - T.tail - 0.4], cy + r * 0.05, cy + r * 0.34, n, stripe);
      if (liv.stripe2 !== liv.stripe) vq(wb, [s * (fx + 0.002), z0 + T.nose + 0.3], [s * (fx + 0.002), z1 - T.tail - 0.4], cy - r * 0.02, cy + r * 0.05, n, C(liv.stripe2));
      for (let z = z0 + T.nose + 1.6; z < z1 - T.tail - 0.8; z += 0.92) vq(wb, [s * (fx + 0.004), z], [s * (fx + 0.004), z + 0.34], cy + r * 0.12, cy + r * 0.27, n, glass, MAT.WINDOWS);
      for (const dz of [T.nose + 0.9, L - T.tail - 1.4]) vq(wb, [s * (fx + 0.005), z0 + dz], [s * (fx + 0.005), z0 + dz + 0.85], cy - r * 0.3, sideTop - 0.02, n, shade(body, 0.8));
      const tw = Math.min(L * 0.36, 9.5), tz = z0 + T.nose + (L - T.nose - T.tail) * 0.42;
      vq(sb, [s * (fx + 0.006), tz - tw / 2], [s * (fx + 0.006), tz + tw / 2], cy - r * 0.34, cy + r * 0.02, n, WHITE, 0, uv('liv' + (pl.livery || 0)));
    }
    const ck = prof[5], cz = ck[0];
    for (const s of [-1, 1]) oq(wb, [s * 0.1, ck[2] + ck[1] * 0.62, cz - 0.9], [s * ck[1] * 0.8, ck[2] + ck[1] * 0.42, cz - 0.4], [s * ck[1] * 0.86, ck[2] + ck[1] * 0.46, cz + 0.4], [s * 0.1, ck[2] + ck[1] * 0.72, cz - 0.1], glass, MAT.GLASS, null, [s * 0.5, 0.7, -0.5]);
    if (T.glass) for (let k = 4; k < 8; k++) { const a = OCT[k], c = OCT[(k + 1) % 8], p1 = prof[1], p2 = prof[3]; oq(wb, [a[0] * p1[1] * 1.01, p1[2] + a[1] * p1[1] * 1.01, p1[0]], [c[0] * p1[1] * 1.01, p1[2] + c[1] * p1[1] * 1.01, p1[0]], [c[0] * p2[1] * 1.01, p2[2] + c[1] * p2[1] * 1.01, p2[0]], [a[0] * p2[1] * 1.01, p2[2] + a[1] * p2[1] * 1.01, p2[0]], glass, MAT.GLASS, null, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, -0.3]); }
    const W = T.wing, wy = cy + W.y, wz = W.z;
    wing(wb, grey, wy, wz, W, r * 0.9, false);
    const S = T.stab, tailY = cy + r * 0.45;
    const finZ = z1 - T.tail * 0.95, finY = tailY + r * 0.25;
    fin(wb, sb, T.fin, finZ, finY, liv, pl.livery || 0);
    if (S.t) wing(wb, body, finY + T.fin.h, finZ + T.fin.sweep, { root: S.root, tip: S.tip, span: S.span, sweep: S.sweep, dih: 0, t: 0.18 }, 0.15, true);
    else wing(wb, body, tailY + (S.y || 0) * 0.3, z1 - T.tail * 0.7, { root: S.root, tip: S.tip, span: S.span, sweep: S.sweep, dih: 0.2, t: 0.18 }, r * 0.35, true);
    for (const e of T.eng) for (const s of [-1, 1]) engine(wb, s * e.x, cy + e.y, e.z, e, s, cy, W, r);
    const gw = C('#1e1e1e'), strut = C('#9a9ea2');
    const gear = (x, z, twin) => {
      wb.cyl(x, 0.45, z, 0.07, cy - r - 0.3, 5, strut);
      for (const dx of twin ? [-0.28, 0.28] : [0]) { wb.box(x + dx, 0.45, z, 0.12, 0.45, 0.45, gw); }
    };
    gear(0, z0 + T.nose * 0.7, true);
    for (const s of [-1, 1]) gear(s * (r * 0.9 + 1.2), wz + W.root * 0.62, true);
    return cy + r * 0.55 + T.fin.h + r;
  }

  function wing(b, col, y, z, W, x0, flat) {
    for (const s of [-1, 1]) {
      const tipX = s * (x0 + W.span), ty = y + (W.dih || 0);
      const rl = [s * x0, y, z], rt = [s * x0, y, z + W.root], tl = [tipX, ty, z + W.sweep], tt = [tipX, ty, z + W.sweep + W.tip];
      const h = W.t / 2, ht = h * 0.45;
      const up = p => [p[0], p[1] + (p === rl || p === rt ? h : ht), p[2]], dn = p => [p[0], p[1] - (p === rl || p === rt ? h : ht), p[2]];
      oq(b, up(rl), up(tl), up(tt), up(rt), col, 0, null, [0, 1, 0]);
      oq(b, dn(rl), dn(tl), dn(tt), dn(rt), shade(col, 0.72), 0, null, [0, -1, 0]);
      oq(b, up(rl), up(tl), dn(tl), dn(rl), shade(col, 0.9), 0, null, [0, 0, -1]);
      oq(b, up(rt), up(tt), dn(tt), dn(rt), shade(col, 0.85), 0, null, [0, 0, 1]);
      oq(b, up(tl), up(tt), dn(tt), dn(tl), shade(col, 0.95), 0, null, [s, 0, 0]);
      if (!flat) b.box(tipX, ty + ht + 0.05, z + W.sweep + W.tip * 0.3, 0.05, 0.05, 0.05, C(s < 0 ? '#ff2020' : '#20ff40'), MAT.LAMP);
    }
  }

  function fin(b, sb, fn, z, y, liv, li) {
    const col = C(Street.LIV[li].tail), t = 0.12;
    const a = [0, y, z], c = [0, y, z + fn.root], d = [0, y + fn.h, z + fn.sweep + fn.top], e = [0, y + fn.h, z + fn.sweep];
    for (const s of [-1, 1]) oq(b, [s * t, a[1], a[2]], [s * t, c[1], c[2]], [s * t * 0.6, d[1], d[2]], [s * t * 0.6, e[1], e[2]], col, 0, null, [s, 0, 0]);
    oq(b, [-t, a[1], a[2]], [t, a[1], a[2]], [t * 0.6, e[1], e[2]], [-t * 0.6, e[1], e[2]], shade(col, 0.85), 0, null, [0, 0.3, -1]);
    oq(b, [-t * 0.6, e[1], e[2]], [t * 0.6, e[1], e[2]], [t * 0.6, d[1], d[2]], [-t * 0.6, d[1], d[2]], shade(col, 0.9), 0, null, [0, 1, 0]);
    oq(b, [-t, c[1], c[2]], [t, c[1], c[2]], [t * 0.6, d[1], d[2]], [-t * 0.6, d[1], d[2]], shade(col, 0.8), 0, null, [0, 0.2, 1]);
    const lz = z + fn.root * 0.55 + fn.sweep * 0.25, ly = y + fn.h * 0.5, ls = Math.min(fn.h, fn.root) * 0.34;
    for (const s of [-1, 1]) vq(sb, [s * (t + 0.01), lz - ls], [s * (t + 0.01), lz + ls], ly - ls * 0.9, ly + ls * 0.9, [s, 0, 0], WHITE, 0, uv('tail' + li));
  }

  function engine(b, x, y, z, e, s, cy, W, r) {
    const nac = C('#d8dce0'), dark = C('#202428');
    if (e.kind === 'rear') {
      b.cyl(x, y, z, e.r, 0.001, 10, nac);
      cylZ(b, x, y, z - e.l / 2, z + e.l / 2, e.r, nac);
      discZ(b, x, y, z - e.l / 2 - 0.01, e.r * 0.8, dark, -1);
      discZ(b, x, y, z + e.l / 2 + 0.01, e.r * 0.7, dark, 1);
      b.box((x + s * r * 0.8) / 2, y, z, Math.abs(x - s * r * 0.8) / 2, 0.12, e.l * 0.25, nac);
      return;
    }
    cylZ(b, x, y, z - e.l / 2, z + e.l / 2, e.r, nac);
    discZ(b, x, y, z - e.l / 2 - 0.01, e.r * 0.85, dark, -1);
    discZ(b, x, y, z + e.l / 2 + 0.01, e.r * 0.6, dark, 1);
    const wy = cy + W.y;
    b.box(x, (y + wy) / 2, z + e.l * 0.2, 0.12, Math.abs(wy - y) / 2 + 0.1, e.l * 0.3, nac);
    if (e.kind === 'prop') {
      discZ(b, x, y, z - e.l / 2 - 0.3, 0.2, C('#e8e8e8'), -1);
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + 0.3;
        b.beam([x, y, z - e.l / 2 - 0.25], [x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.8, z - e.l / 2 - 0.25], 0.06, dark);
      }
    }
  }

  function cylZ(b, x, y, za, zb, r, col) {
    const n = 10;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
      oq(b, [x + Math.cos(a0) * r, y + Math.sin(a0) * r, za], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, za], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, zb], [x + Math.cos(a0) * r, y + Math.sin(a0) * r, zb], shade(col, 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(am))), 0, null, [Math.cos(am), Math.sin(am), 0]);
    }
  }

  function discZ(b, x, y, z, r, col, dir) {
    const n = 10;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      const p = [x, y, z], q = [x + Math.cos(a0) * r, y + Math.sin(a0) * r, z], w = [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z];
      if (dir < 0) b.triangle(p, w, q, col); else b.triangle(p, q, w, col);
    }
  }

  function hangar(wb, sb, h) {
    const W = h.w / 2, D = h.d / 2, he = h.h * 0.42, top = h.h, N = 14;
    const wall = C('#c8ccc4'), roofC = C('#8a9a90'), door = C('#d8dcd8'), frame = C('#5a6268');
    const arc = k => { const t = -1 + 2 * k / N; return [t * W, he + (top - he) * Math.sqrt(Math.max(0, 1 - t * t))]; };
    for (let k = 0; k < N; k++) {
      const [xa, ya] = arc(k), [xb, yb] = arc(k + 1), nx = -(yb - ya), ny = xb - xa, nl = Math.hypot(nx, ny);
      oq(wb, [xa, ya, -D - 0.8], [xb, yb, -D - 0.8], [xb, yb, D + 0.4], [xa, ya, D + 0.4], k % 2 ? roofC : shade(roofC, 1.08), 0, null, [nx / nl, ny / nl, 0]);
    }
    for (const s of [-1, 1]) vq(wb, [s * W, -D], [s * W, D], 0, he, [s, 0, 0], shade(wall, 0.92));
    for (let k = 0; k < N; k++) {
      const [xa, ya] = arc(k), [xb, yb] = arc(k + 1);
      oq(wb, [xa, 0, D], [xb, 0, D], [xb, yb, D], [xa, ya, D], shade(wall, 0.85), 0, null, [0, 0, 1]);
    }
    const dh = he + (top - he) * 0.52;
    for (let k = 0; k < N; k++) {
      const [xa, ya] = arc(k), [xb, yb] = arc(k + 1);
      if (ya <= dh && yb <= dh) continue;
      oq(wb, [xa, dh, -D], [xb, dh, -D], [xb, Math.max(yb, dh), -D], [xa, Math.max(ya, dh), -D], wall, 0, null, [0, 0, -1]);
    }
    const dw = W - 1.2, panels = 8;
    for (let i = 0; i < panels; i++) {
      const xa = -dw + i * dw * 2 / panels, xb = xa + dw * 2 / panels;
      vq(wb, [xa + 0.05, -D + 0.3], [xb - 0.05, -D + 0.3], 0, dh, [0, 0, -1], i % 2 ? door : shade(door, 0.94));
      vq(wb, [xa + 0.02, -D + 0.29], [xa + 0.14, -D + 0.29], 0, dh, [0, 0, -1], frame);
    }
    for (const s of [-1, 1]) vq(wb, [s * dw, -D], [s * W, -D], 0, dh, [0, 0, -1], shade(wall, 0.9));
    vq(sb, [-W * 0.42, -D - 0.05], [W * 0.42, -D - 0.05], dh + 0.8, dh + 0.8 + W * 0.84 * 48 / 256, [0, 0, -1], WHITE, 0, uv('hangar' + (h.n || 1)));
    return top;
  }

  function tank(b, t) {
    const [x, z, r, h] = t, white = C('#e8e8e2'), band = C('#c8302a');
    b.cyl(x, 0, z, r, h, 16, white);
    b.cyl(x, h * 0.62, z, r + 0.02, 0.7, 16, band);
    b.cone(x, h, z, r + 0.1, r * 0.3, 16, shade(white, 0.92));
    for (let k = 0; k < 9; k++) { const a = k * 0.35; b.box(x + Math.cos(a) * (r + 0.25), k * h / 9 + 0.4, z + Math.sin(a) * (r + 0.25), 0.4, 0.04, 0.3, C('#6a6e72')); }
  }

  function radarTower(b, R) {
    const steel = C('#c8ccd0'), H = 12;
    for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) b.beam([R.x + dx * 1.6, 0, R.z + dz * 1.6], [R.x + dx * 0.6, H, R.z + dz * 0.6], 0.09, steel);
    for (let k = 1; k < 4; k++) {
      const y = k * H / 4, s = 1.6 - (1.0 * y / H);
      const P = [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]].map(([dx, dz]) => [R.x + dx * s, y, R.z + dz * s]);
      for (let i = 0; i < 4; i++) b.beam(P[i], P[(i + 1) % 4], 0.05, steel);
    }
    b.box(R.x, H + 0.15, R.z, 1.2, 0.15, 1.2, C('#8a8e92'));
    b.cyl(R.x, H + 0.3, R.z, 0.35, 0.7, 8, C('#5a5e62'));
  }

  function radarDish() {
    const b = new F.Batch(256), white = C('#f0f0ea'), dark = C('#5a5e62');
    b.box(0, 0.25, 0, 0.3, 0.25, 0.3, dark);
    for (let k = 0; k < 8; k++) {
      const x0 = -3.2 + k * 0.8, x1 = x0 + 0.8, bow = t => 0.5 * (1 - (t / 3.2) ** 2);
      oq(b, [x0, 0.4, -0.4 + bow(x0)], [x1, 0.4, -0.4 + bow(x1)], [x1, 1.7, -0.1 + bow(x1)], [x0, 1.7, -0.1 + bow(x0)], white, 0, null, [0, 0, -1]);
      oq(b, [x0, 0.4, -0.38 + bow(x0)], [x1, 0.4, -0.38 + bow(x1)], [x1, 1.7, -0.08 + bow(x1)], [x0, 1.7, -0.08 + bow(x0)], shade(white, 0.75), 0, null, [0, 0, 1]);
    }
    b.beam([0, 0.5, 0], [0, 1.05, -1.6], 0.05, dark);
    b.box(0, 1.1, -1.65, 0.15, 0.15, 0.15, dark);
    return b;
  }

  function totem(wb, sb, t) {
    const c = Math.cos(t.yaw), s = Math.sin(t.yaw), fx = Math.sin(t.yaw), fz = -Math.cos(t.yaw), y = t.y;
    const P2 = (u, v) => [t.x + c * u + fx * v, t.z + s * u + fz * v];
    const hw = 1.5, d = 0.35, h = 7.6, base = C('#8a9094'), blue = C('#16305e');
    for (const sg of [-1, 1]) {
      vq(wb, P2(-hw, sg * d), P2(hw, sg * d), y, y + 1.2, [fx * sg, 0, fz * sg], base);
      vq(sb, P2(-hw, sg * (d + 0.01)), P2(hw, sg * (d + 0.01)), y + h - 2.1, y + h - 2.1 + hw, [fx * sg, 0, fz * sg], WHITE, 0, uv('totem'));
      vq(wb, P2(-hw, sg * d), P2(hw, sg * d), y + 1.2, y + h, [fx * sg, 0, fz * sg], blue);
      for (let k = 0; k < 3; k++) vq(wb, P2(-hw + 0.3, sg * (d + 0.005)), P2(hw - 0.3, sg * (d + 0.005)), y + 1.6 + k * 0.9, y + 1.66 + k * 0.9, [fx * sg, 0, fz * sg], C('#2a4a8a'));
    }
    for (const sg of [-1, 1]) vq(wb, P2(sg * hw, -d), P2(sg * hw, d), y, y + h, [c * sg, 0, s * sg], shade(blue, 0.8));
    hq(wb, [P2(-hw, -d), P2(hw, -d), P2(hw, d), P2(-hw, d)], y + h, shade(blue, 1.2));
  }

  function mast(b, x, z, y, heads) {
    b.cyl(x, y, z, 0.16, 10.5, 6, C('#8a9094'), 0, { r2: 0.09 });
    b.box(x, y + 10.4, z, 1.1, 0.06, 0.08, C('#6a6e72'));
    for (const k of heads) b.box(x + k, y + 10.2, z, 0.34, 0.12, 0.22, C('#fff4d8'), MAT.LAMP);
  }

  function runwayLight(b, l) {
    const col = l.kind === 'end' ? '#40ff60' : l.kind === 'approach' ? '#ffffff' : '#fff2c0';
    if (l.kind === 'approach') b.cyl(l.x, 0, l.z, 0.06, 1.6, 4, C('#e0501a'));
    b.box(l.x, l.kind === 'approach' ? 1.7 : 0.18, l.z, 0.16, 0.12, 0.16, C(col), MAT.LAMP);
  }

  function decorate(scene) {
    const w = scene.w, air = w.air;
    if (!air) return;
    const put = (x, z, fn) => { const ch = scene.chunkAt(x, z); const h = fn(scene.g(ch, 'white'), scene.g(ch, 'street')); scene.grow(ch, -1, h || 12); };
    for (const pl of air.planes) {
      const ch = scene.chunkAt(pl.x, pl.z), wb = scene.g(ch, 'white'), sb = scene.g(ch, 'street');
      wb.setM(pl.x, 0, pl.z, pl.yaw); sb.setM(pl.x, 0, pl.z, pl.yaw);
      const h = plane(wb, sb, pl);
      wb.clearM(); sb.clearM();
      scene.grow(ch, -1, h + 1);
    }
    for (const h of air.hangars) {
      const ch = scene.chunkAt(h.x, h.z), wb = scene.g(ch, 'white'), sb = scene.g(ch, 'street');
      wb.setM(h.x, 0, h.z, h.yaw); sb.setM(h.x, 0, h.z, h.yaw);
      hangar(wb, sb, h);
      wb.clearM(); sb.clearM();
      scene.grow(ch, -1, h.h + 1);
    }
    for (const t of air.tanks) put(t[0], t[1], b => { tank(b, t); return t[3] + 3; });
    put(air.radar.x, air.radar.z, b => { radarTower(b, air.radar); return 16; });
    if (air.totem) put(air.totem.x, air.totem.z, (b, s) => { totem(b, s, air.totem); return 9; });
    for (const l of air.lights) {
      if (l.kind === 'mast') put(l.x, l.z, b => { mast(b, l.x, l.z, w.terrainH(l.x, l.z), [-0.8, 0.8]); return 12; });
      else put(l.x, l.z, b => { runwayLight(b, l); return 3; });
    }
    scene.airLights = air.lights;
    scene.radar = air.radar;
  }

  const PROPS = F.Models.PROPS;

  PROPS.alamp = b => {
    const steel = C('#9aa0a4');
    b.cyl(0, 0, 0, 0.14, 9, 6, steel, 0, { r2: 0.08 });
    for (const s of [-1, 1]) {
      b.beam([0, 8.8, 0], [s * 1.6, 9.2, 0], 0.05, steel);
      b.box(s * 1.75, 9.1, 0, 0.36, 0.1, 0.22, C('#fff4d8'), MAT.LAMP);
    }
  };

  PROPS.flagpole = (b, p, rng, t) => {
    const id = ['flag_lv', 'flag_air', 'flag_hz', 'flag_air', 'flag_lv'][p.flag % 5];
    b.cyl(0, 0, 0, 0.06, 10, 5, C('#e8e8e8'));
    b.cyl(0, 10, 0, 0.1, 0.12, 6, C('#d8b030'));
    for (const s of [-1, 1]) vq(t, [0.08, s * 0.01], [2.4, s * 0.01], 8.1, 9.3, [0, 0, s], WHITE, 0, uv(id));
  };

  PROPS.trolleys = b => {
    const steel = C('#b8bcc0');
    for (let k = 0; k < 6; k++) {
      const x = -1.5 + k * 0.6;
      b.box(x, 0.55, 0, 0.26, 0.02, 0.45, steel);
      b.box(x, 0.85, 0.42, 0.26, 0.3, 0.015, steel);
      b.box(x, 1.12, 0.45, 0.28, 0.02, 0.02, C('#c8202e'));
      for (const z of [-0.4, 0.4]) b.box(x, 0.12, z, 0.24, 0.1, 0.04, C('#2a2a2a'));
    }
  };

  PROPS.bollard = b => {
    b.cyl(0, 0, 0, 0.1, 0.9, 6, C('#3a3e42'));
    b.cyl(0, 0.62, 0, 0.105, 0.1, 6, C('#f0f0e8'));
  };

  PROPS.afence = (b, p, rng, t) => {
    const l = (p.len || 3) / 2, post = C('#9aa0a4');
    b.cyl(0, 0, -l, 0.05, 2.5, 4, post);
    b.box(0, 2.45, 0, 0.03, 0.03, l, post);
    b.box(0, 0.1, 0, 0.03, 0.03, l, post);
    for (const s of [-1, 1]) vq(t, [s * 0.012, -l], [s * 0.012, l], 0.1, 2.45, [s, 0, 0], C('#ffffff'), 0, uv('chain'));
    for (let k = 0; k < 3; k++) b.beam([0, 2.5 + k * 0.12, -l], [0, 2.5 + k * 0.12, l], 0.01, C('#7a7e82'));
  };

  PROPS.gatepost = b => {
    for (let k = 0; k < 6; k++) b.box(0, 0.2 + k * 0.4, 0, 0.18, 0.2, 0.18, C(k % 2 ? '#1a1a1a' : '#ffc81e'));
    b.box(0, 2.45, 0, 0.26, 0.05, 0.26, C('#3a3a3a'));
  };

  PROPS.windsock = b => {
    b.cyl(0, 0, 0, 0.07, 6, 5, C('#e8e8e8'));
    b.beam([0, 5.9, 0], [0.8, 5.9, 0], 0.03, C('#8a8a8a'));
    for (let k = 0; k < 5; k++) {
      const x0 = 0.8 + k * 0.7, r0 = 0.45 - k * 0.06, r1 = r0 - 0.06, col = C(k % 2 ? '#f4f4f0' : '#ff6a1a');
      for (let i = 0; i < 8; i++) {
        const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2;
        oq(b, [x0, 5.9 - 0.12 * k + Math.cos(a0) * r0, Math.sin(a0) * r0], [x0, 5.9 - 0.12 * k + Math.cos(a1) * r0, Math.sin(a1) * r0], [x0 + 0.7, 5.78 - 0.12 * k + Math.cos(a1) * r1, Math.sin(a1) * r1], [x0 + 0.7, 5.78 - 0.12 * k + Math.cos(a0) * r1, Math.sin(a0) * r1], col, 0, null, [0, Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2)]);
      }
    }
  };

  const VEH = {
    stairs: b => {
      const white = C('#f0f0ea'), grey = C('#6a6e72');
      b.box(0, 0.75, 1.2, 1.1, 0.5, 2.6, white);
      b.box(0, 1.45, 3.2, 1.05, 0.5, 0.7, white, 0, { side: C('#3a4a5a') });
      for (let k = 0; k < 10; k++) b.box(0, 1.3 + k * 0.22, 1.6 - k * 0.3, 0.7, 0.03, 0.15, grey);
      for (const s of [-1, 1]) b.beam([s * 0.75, 1.9, 1.8], [s * 0.75, 4.2, -1.4], 0.04, C('#c8c8c0'));
      b.box(0, 3.3, -1.7, 0.8, 0.04, 0.5, grey);
      for (const [x, z] of [[-1, 3], [1, 3], [-1, -0.6], [1, -0.6]]) b.box(x, 0.35, z, 0.12, 0.35, 0.35, C('#1a1a1a'));
    },
    tug: b => {
      const y = C('#e8b020');
      b.box(0, 0.6, 0, 0.8, 0.35, 1.4, y);
      b.box(0, 1.2, 0.4, 0.7, 0.25, 0.5, shade(y, 0.9));
      b.box(0, 1.55, 0.4, 0.72, 0.03, 0.55, C('#3a3a3a'));
      for (const [x, z] of [[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]]) b.box(x, 0.32, z, 0.12, 0.32, 0.32, C('#1a1a1a'));
    },
    cart: b => {
      const bags = ['#2a62b8', '#c8202e', '#3a3a3a', '#5a8a3a', '#8a5a3a'];
      b.box(0, 0.5, 0, 0.8, 0.06, 1.3, C('#8a8e92'));
      for (let k = 0; k < 6; k++) b.box(-0.4 + (k % 2) * 0.8, 0.8 + (k > 3 ? 0.4 : 0), -0.8 + (k >> 1) * 0.8, 0.35, 0.22, 0.32, C(bags[k % bags.length]));
      b.box(0, 1.45, 0, 0.82, 0.03, 1.32, C('#3a5a8a'));
      for (const [x, z] of [[-0.7, -1.1], [0.7, -1.1], [-0.7, 1.1], [0.7, 1.1]]) b.box(x, 0.22, z, 0.08, 0.22, 0.22, C('#1a1a1a'));
    },
    fuel: b => {
      const red = C('#c8302a'), steel = C('#d8dcd8');
      b.box(0, 1.1, -3.1, 1.2, 0.95, 0.9, red);
      b.box(0, 1.55, -3.6, 1.05, 0.4, 0.02, C('#23303a'), MAT.GLASS);
      cylZ(b, 0, 1.75, -2.1, 3.4, 1.15, steel);
      b.box(0, 1.75, 3.45, 1.1, 1.1, 0.05, steel);
      b.box(0, 0.55, 0.6, 1.1, 0.12, 3.4, C('#3a3a3a'));
      for (const z of [-3, 1.4, 2.6]) for (const s of [-1, 1]) b.box(s * 1.05, 0.45, z, 0.15, 0.45, 0.45, C('#1a1a1a'));
    },
    apronbus: b => {
      const body = C('#e8e8e2'), win = C('#23303a'), blue = C('#1a4a9a');
      b.box(0, 1.55, 0, 1.4, 1.2, 6.2, body);
      b.box(0, 0.45, 0, 1.38, 0.12, 6.1, blue);
      for (const s of [-1, 1]) for (let k = 0; k < 7; k++) b.box(s * 1.41, 1.95, -5.2 + k * 1.7, 0.01, 0.55, 0.7, win, MAT.WINDOWS);
      b.box(0, 1.9, -6.21, 1.2, 0.7, 0.01, win, MAT.GLASS);
      for (const z of [-4.5, 4.5]) for (const s of [-1, 1]) b.box(s * 1.3, 0.35, z, 0.15, 0.35, 0.4, C('#1a1a1a'));
    },
    followme: b => {
      const y = C('#ffc81e');
      b.box(0, 0.8, 0, 0.9, 0.45, 2.1, y);
      b.box(0, 1.45, 0.3, 0.85, 0.3, 1.2, y);
      b.box(0, 1.46, 0.3, 0.86, 0.22, 1.1, C('#23303a'), MAT.GLASS);
      b.box(0, 1.9, 0.3, 0.7, 0.14, 0.18, C('#1a1a1a'));
      for (let k = 0; k < 6; k++) b.box(-0.6 + k * 0.24, 1.9, 0.49, 0.1, 0.1, 0.01, C(k % 2 ? '#1a1a1a' : '#ffffff'));
      for (const [x, z] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.3], [0.85, 1.3]]) b.box(x, 0.35, z, 0.12, 0.35, 0.35, C('#1a1a1a'));
    }
  };
  for (const [k, fn] of Object.entries(VEH)) PROPS[k] = b => fn(b);

  F.Airport = { TYPES, LIVERY, plane, hangar, radarDish, decorate, VEH };
})(globalThis.Forza = globalThis.Forza || {});
