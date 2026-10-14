(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const A = S.art106;
  const TAU = Math.PI * 2;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];
  const GLOW = [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA];
  const NEON_R = [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA];
  const NEON_G = [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB];
  const BOW = [C.red, C.orange, C.yellow, C.green, C.sky, C.blue, C.purple];

  function rot90(src) {
    const out = new Buf(src.h, src.w);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.px[x * out.w + (src.h - 1 - y)] = src.px[y * src.w + x];
    return out;
  }

  function uni(P, x, y, horn) {
    const Wt = C.grey;
    P.part(P.cap(x - 5, y - 4, x - 5, y - 0.6, 1.4), Wt, { b: 4, sh: 0 });
    P.part(P.cap(x + 3, y - 4, x + 3, y - 0.6, 1.4), Wt, { b: 5, sh: 0 });
    P.part(P.path(`M ${x - 7} ${y - 8} Q ${x - 12.4} ${y - 7} ${x - 11} ${y - 1} Q ${x - 8.6} ${y - 4} ${x - 6.4} ${y - 6} Z`), C.pink, { b: 3, sh: 0 });
    P.part(P.ell(x - 1, y - 6.6, 7, 4), Wt, { b: 5 });
    P.part(P.cap(x + 4, y - 8, x + 7, y - 13, 2.4, 2.2), Wt, { b: 5, sh: 0 });
    P.part(P.path(`M ${x + 3} ${y - 9} Q ${x + 2} ${y - 14} ${x + 6} ${y - 17} Q ${x + 5.6} ${y - 12.6} ${x + 5.4} ${y - 9.4} Z`), C.pink, { b: 3, sh: 0 });
    P.part(P.ell(x + 9, y - 14, 4, 3), Wt, { b: 5 });
    P.px(x + 10.4, y - 14.6, C.pupil);
    P.px(x + 12, y - 13, C.pink[3]);
    P.part(P.poly([x + 7.6, y - 16.4, x + 10.4, y - 16.4, x + 12.6, y - 23.4]), horn, { b: 3, sh: 0 });
    P.px(x + 10.6, y - 19.6, horn[4]);
  }

  function lander(P, x, y, o) {
    o = o || {};
    const G = C.gold, M = C.grey;
    for (const s of [-1, 1]) {
      P.line(x + s * 18, y - 22, x + s * 31, y - 3, M[2]);
      P.line(x + s * 19, y - 22, x + s * 32, y - 3, M[4]);
      P.line(x + s * 22, y - 36, x + s * 31, y - 3, M[3]);
      P.part(P.ell(x + s * 31, y - 2, 5, 1.8), M, { b: 3, sh: 0 });
    }
    if (o.fire) {
      for (let i = 0; i < 5; i++) {
        const fx = x - 8 + i * 4, h = 8 + ((i * 7 + (o.k || 0) * 3) % 7);
        P.part(P.poly([fx - 3, y - 8, fx + 3, y - 8, fx, y - 8 + h]), i % 2 ? C.orange : C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
      }
      P.part(P.ell(x, y - 1, 16, 3), LAMP, { sh: 0, hi: 0, ol: 0 });
    }
    P.part(P.poly([x - 5, y - 18, x + 5, y - 18, x + 8.6, y - 8, x - 8.6, y - 8]), M, { b: 1 });
    P.line(x - 6, y - 12, x + 6, y - 12, M[3]);
    const foil = P.poly([x - 20, y - 40, x + 20, y - 40, x + 24, y - 18, x - 24, y - 18]);
    P.part(foil, G, { b: 3 });
    foil.each((px, py) => { if (P.b.px[py * P.b.w + px] !== C.black && S.hash(px >> 1, py >> 1, 17) < 0.16) P.b.set(px, py, G[2]); });
    P.line(x - 22, y - 29, x + 22, y - 29, G[1]);
    P.part(P.rect(x + 8, y - 27, 9, 6), M, { b: 5, sh: 0, hi: 0 });
    for (let i = 0; i < 3; i++) P.line(x + 8, y - 26 + i * 2, x + 17, y - 26 + i * 2, i % 2 ? M[5] : C.red[3]);
    P.part(P.rect(x + 8, y - 27, 4, 3), C.blue, { b: 2, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([x - 14, y - 40, x + 14, y - 40, x + 18, y - 58, x + 8, y - 68, x - 8, y - 68, x - 18, y - 58]), M, { b: 3 });
    P.part(P.poly([x - 13, y - 58, x - 6, y - 64, x - 6, y - 56]), C.sky, { b: 2, sh: 0 });
    P.part(P.poly([x + 13, y - 58, x + 6, y - 64, x + 6, y - 56]), C.sky, { b: 2, sh: 0 });
    P.part(P.rect(x - 5, y - 55, 10, 14), o.open ? C.night : M, { b: o.open ? 0 : 2, sh: o.open ? 0 : 1 });
    if (!o.open) P.part(P.ell(x + 3, y - 48, 1.2, 1.2), C.gold, { b: 3, sh: 0 });
    else P.part(P.poly([x + 5, y - 55, x + 11, y - 52, x + 11, y - 40, x + 5, y - 41]), M, { b: 4, sh: 0 });
    P.line(x, y - 68, x + 3, y - 78, M[1]);
    P.part(P.ell(x + 4.6, y - 80, 4.4, 2.4, -0.5), M, { b: 4 });
    P.line(x - 12, y - 68, x - 14, y - 76, M[2]);
    P.px(x - 14, y - 77, o.fire ? C.neonA : C.red[2]);
    for (let i = 0; i < 4; i++) P.line(x - 3, y - 38 + i * 5, x + 3, y - 38 + i * 5, M[1]);
  }

  function landerSprite(o) {
    const b = new Buf(80, 96);
    lander(new Pen(b), 40, 92, o);
    return b;
  }

  function satellite(P, x, y, wreck) {
    const M = C.grey;
    if (wreck) {
      P.part(P.ell(x, y, 26, 5), C.stone, { b: 1, sh: 0, hi: 0 });
      P.part(P.ell(x, y - 1, 20, 3.4), C.stone, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.poly([x - 9, y - 1, x - 5, y - 15, x + 9, y - 12, x + 7, y - 1]), M, { b: 3 });
      P.part(P.poly([x - 8, y - 14, x - 24, y - 22, x - 22, y - 12, x - 10, y - 8]), C.blue, { b: 2 });
      P.part(P.poly([x + 8, y - 11, x + 20, y - 4, x + 23, y - 9, x + 10, y - 15]), C.blue, { b: 2 });
      for (let i = 0; i < 3; i++) P.line(x - 20 + i * 4, y - 20 + i * 1.6, x - 18 + i * 4, y - 12 + i * 1.2, C.sky[3]);
      P.part(P.ell(x + 2, y - 17, 5, 2.6, 0.4), M, { b: 5 });
      P.line(x + 2, y - 17, x + 9, y - 24, M[1]);
      for (let i = 0; i < 3; i++) P.part(P.ell(x - 2 + i * 5, y - 22 - i * 4, 2.6 + i, 2 + i * 0.6), M, { b: 4, sh: 0, hi: 0, ol: 0 });
      return;
    }
    P.part(P.rect(x - 6, y - 6, 12, 12), M, { b: 3 });
    P.part(P.rect(x - 24, y - 4, 17, 8), C.blue, { b: 2 });
    P.part(P.rect(x + 7, y - 4, 17, 8), C.blue, { b: 2 });
    for (let i = 0; i < 3; i++) { P.line(x - 20 + i * 5, y - 3, x - 20 + i * 5, y + 3, C.sky[3]); P.line(x + 11 + i * 5, y - 3, x + 11 + i * 5, y + 3, C.sky[3]); }
    P.part(P.ell(x, y + 9, 5, 2.4), M, { b: 5 });
    P.line(x, y - 6, x + 4, y - 13, M[1]);
    P.px(x + 4, y - 14, C.neonA);
  }

  const TAL = { gastro: C.slime, lead: C.stone, spoon: C.sky, mtal: C.cream };

  function talisman(P, x, y, kind, r) {
    r = r || 5;
    P.line(x - r * 0.6, y - r * 1.7, x - r * 0.2, y - r * 0.8, C.gold[2]);
    P.line(x + r * 0.6, y - r * 1.7, x + r * 0.2, y - r * 0.8, C.gold[2]);
    P.part(P.ell(x, y, r, r), C.gold, { b: 3 });
    P.part(P.ell(x, y, r * 0.66, r * 0.66), TAL[kind] || C.sky, { b: 3, sh: 0, hi: 0 });
    const k = r / 5;
    if (kind === 'gastro') P.curve(`M ${x - 1.6 * k} ${y - 2 * k} Q ${x + 2.6 * k} ${y - 2 * k} ${x + 1.4 * k} ${y + 0.6 * k} Q ${x - 1 * k} ${y + 2.6 * k} ${x - 1.6 * k} ${y}`, C.slime[0]);
    else if (kind === 'lead') { P.line(x - 2 * k, y, x + 2 * k, y, C.black); P.px(x, y - k, C.black); P.px(x, y + k, C.black); P.px(x, y, C.eye); }
    else if (kind === 'spoon') { P.part(P.ell(x - 0.8 * k, y - 1.4 * k, 1.4 * k, 1.1 * k), C.grey, { b: 5, sh: 0, hi: 0 }); P.curve(`M ${x - 0.4 * k} ${y - 0.4 * k} Q ${x + 2.2 * k} ${y} ${x + 1 * k} ${y + 2.4 * k}`, C.grey[5]); }
    else { P.px(x - 1 * k, y - 0.6 * k, C.pupil); P.px(x + 1 * k, y - 0.6 * k, C.pupil); P.line(x - 1 * k, y + 1.2 * k, x + 1 * k, y + 1.2 * k, C.hair[2]); P.line(x - 2 * k, y - 2.4 * k, x + 2 * k, y - 2.4 * k, C.hair[3]); }
  }

  function caseArt(P, x, y, broken) {
    P.part(P.rect(x - 8, y - 2, 16, 3), C.grey, { b: 1 });
    if (broken) {
      for (const [dx, dy, s] of [[-7, -5, 3], [-2, -8, 4], [4, -5, 3], [7, -9, 2]]) P.part(P.poly([x + dx, y - 2, x + dx + s, y - 2, x + dx + s * 0.4, y + dy]), GLOW, { b: 3, sh: 0, hi: 0 });
      return;
    }
    const glass = P.rect(x - 7, y - 16, 14, 14);
    P.part(glass, GLOW, { b: 3, sh: 0, hi: 0 });
    glass.each((px, py) => { if ((px + py * 2) % 4 === 0 && P.b.px[py * P.b.w + px] !== C.black) P.b.set(px, py, C.sky[2]); });
    talisman(P, x, y - 7.4, 'spoon', 4);
    P.line(x - 5, y - 14, x - 2, y - 14, C.eye);
    P.line(x - 5, y - 14, x - 5, y - 11, C.eye);
  }

  function spork(P, x0, y0, x1, y1, ramp) {
    const R = ramp || C.grey;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    P.part(P.cap(x0, y0, x1 - ux * 12, y1 - uy * 12, 2, 1.6), R, { b: 4, sh: 1 });
    P.part(P.ell(x1 - ux * 8, y1 - uy * 8, 6.4, 5), R, { b: 4 });
    for (let i = -1; i <= 1; i++) P.part(P.cap(x1 - ux * 4 - uy * i * 3.4, y1 - uy * 4 + ux * i * 3.4, x1 + ux * 2 - uy * i * 3.4, y1 + uy * 2 + ux * i * 3.4, 1.2, 0.6), R, { b: 5, sh: 0 });
  }

  function coasterCar(P, x, y) {
    P.part(P.poly([x - 14, y - 12, x + 14, y - 12, x + 12, y - 3, x - 12, y - 3]), C.purple, { b: 3 });
    for (let i = 0; i < 7; i++) P.part(P.rect(x - 12 + i * 3.4, y - 10, 3, 2.4), BOW[i], { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(x - 15, y - 14, 30, 2.6), C.gold, { b: 3, sh: 0 });
    P.part(P.ell(x - 8, y - 2, 3, 3), C.grey, { b: 1 });
    P.part(P.ell(x + 8, y - 2, 3, 3), C.grey, { b: 1 });
  }

  function wheel(P, x, y, r, t) {
    P.part(P.poly([x - 5, y + r + 14, x + 5, y + r + 14, x + 2, y, x - 2, y]), C.grey, { b: 1 });
    P.part(P.rect(x - 12, y + r + 13, 24, 3), C.grey, { b: 2, sh: 0 });
    P.part(P.ell(x, y, r + 2, r + 2), C.gold, { b: 2 });
    for (let i = 0; i < 7; i++) {
      const a0 = t + i * TAU / 7, a1 = t + (i + 1) * TAU / 7;
      const pts = [x, y];
      for (let k = 0; k <= 4; k++) { const a = a0 + (a1 - a0) * k / 4; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      P.part(P.poly(pts), BOW[i], { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    P.part(P.ell(x, y, 2.4, 2.4), C.gold, { b: 4, sh: 0 });
  }

  function tank(P, x, y, o) {
    o = o || {};
    const k = o.k || 0;
    P.part(P.rect(x - 22, y - 8, 44, 8), C.grey, { b: 1 });
    P.line(x - 20, y - 4, x + 20, y - 4, C.grey[3]);
    const glass = P.rect(x - 20, y - 58, 40, 50);
    P.part(glass, C.sky, { b: o.boil ? 3 : 2, sh: 0, hi: 0 });
    glass.each((px, py) => {
      if (P.b.px[py * P.b.w + px] === C.black) return;
      if (py < P.Y(y - 50)) P.b.set(px, py, C.night[1]);
      else if ((px + py * 2 + k) % 9 === 0) P.b.set(px, py, C.sky[4]);
    });
    P.line(x - 19, y - 50, x + 19, y - 50, C.sky[4]);
    if (o.boil) for (let i = 0; i < 9; i++) P.part(P.ell(x - 16 + ((i * 7 + k * 3) % 32), y - 12 - ((i * 11 + k * 5) % 36), 1.6, 1.6), C.grey, { b: 5, sh: 0, hi: 0, ol: C.sky[4] });
    P.part(P.rect(x - 23, y - 62, 46, 4.4), C.grey, { b: o.pinned ? 1 : 3 });
    P.part(P.rect(x - 4, y - 65, 8, 3), C.grey, { b: 2, sh: 0 });
    P.line(x + 22, y - 40, x + 30, y - 46, C.grey[2]);
    P.part(P.ell(x + 32, y - 47, 4, 4), C.red, { b: 3 });
    P.part(P.ell(x + 32, y - 47, 1.8, 1.8), C.eye, { sh: 0, hi: 0, ol: 0 });
  }

  function crystal(P, x, y, s, lit) {
    const Q = P.scaled(x, y, s || 1);
    const R = lit ? [C.tvB, C.tvB, C.tvA, C.tvA, C.glow] : C.sky;
    Q.part(Q.poly([x - 16, y - 12, x - 20, y - 50, x - 8, y - 76, x + 6, y - 80, x + 19, y - 54, x + 17, y - 12, x, y - 2]), R, { b: 2 });
    Q.part(Q.poly([x - 8, y - 76, x + 6, y - 80, x + 2, y - 44, x - 10, y - 46]), R, { b: 4, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.poly([x + 6, y - 80, x + 19, y - 54, x + 2, y - 44]), R, { b: 3, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.poly([x - 20, y - 50, x - 10, y - 46, x - 2, y - 8, x - 16, y - 12]), R, { b: 1, sh: 0, hi: 0, ol: 0 });
    Q.line(x - 10, y - 46, x + 2, y - 44, C.eye);
    Q.line(x + 2, y - 44, x, y - 2, C.sky[4]);
    Q.line(x - 8, y - 76, x - 10, y - 46, C.eye);
  }

  function crystalShard(P, x, y, h, ramp, tilt) {
    const R = ramp || C.lilac;
    const t = tilt || 0;
    P.part(P.poly([x - h * 0.22, y, x - h * 0.18 + t, y - h * 0.7, x + t * 1.6, y - h, x + h * 0.2 + t, y - h * 0.66, x + h * 0.22, y]), R, { b: 3 });
    P.line(x + t * 1.6, y - h, x + t * 0.4, y - 1, R[4]);
  }

  function earth(P, x, y, r, o) {
    o = o || {};
    const disc = P.ell(x, y, r, r);
    P.part(disc, C.blue, { b: 2 });
    disc.each((px, py) => {
      if (P.b.px[py * P.b.w + px] === C.black) return;
      const u = (px - P.X(x)) / (r * Math.abs(P.sx)), v = (py - P.Y(y)) / (r * Math.abs(P.sx));
      const n = Math.sin(u * 5 + 1.4) * Math.cos(v * 4 - 0.6) + Math.sin((u + v) * 7) * 0.4;
      if (n > 0.55) P.b.set(px, py, u + v > 0.5 ? C.green[2] : C.green[3]);
      else if (S.hash(px >> 1, py >> 1, 21) < 0.08) P.b.set(px, py, C.grey[5]);
      else if (u + v > 0.7) P.b.set(px, py, C.blue[1]);
      if (o.bliss && (px + py + (o.k || 0)) % 5 === 0) P.b.set(px, py, C.cycle[(px >> 2) & 7]);
      if (o.max && (px + py) % 4 === 0) P.b.set(px, py, C.grey[5]);
    });
    if (o.ring) for (let i = 0; i < 3; i++) P.curve(`M ${x - r - 3 - i * 3} ${y} Q ${x} ${y - r - 8 - i * 4} ${x + r + 3 + i * 3} ${y}`, C.cycle[(i * 2 + (o.k || 0)) % 8]);
  }

  function micro(P, x, y, on) {
    P.part(P.rect(x - 14, y - 16, 28, 16), C.grey, { b: 4 });
    P.part(P.rect(x - 12, y - 14, 17, 12), on ? LAMP : C.night, { b: on ? 3 : 1, sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) P.line(x - 11 + i * 4, y - 13, x - 11 + i * 4, y - 3, on ? C.yellow[3] : C.night[2]);
    P.part(P.rect(x + 7, y - 14, 5, 3), on ? NEON_G : C.green, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 3; i++) { P.px(x + 8, y - 9 + i * 2.4, C.grey[1]); P.px(x + 10.4, y - 9 + i * 2.4, C.grey[1]); }
  }

  function remote(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.line(x + 2, y - 12, x + 5, y - 19, C.grey[4]);
    Q.px(x + 5, y - 20, C.neonA);
    Q.part(Q.rect(x - 4, y - 12, 8, 14), C.grey, { b: 1 });
    Q.part(Q.ell(x, y - 6, 2.6, 2.6), C.red, { b: 3 });
    Q.part(Q.rect(x - 2.4, y - 1.6, 4.8, 1.6), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
  }

  function meter(P, x, y, bent) {
    const M = C.grey;
    if (bent) {
      P.curve(`M ${x} ${y} L ${x} ${y - 16} Q ${x + 1} ${y - 28} ${x + 12} ${y - 30} Q ${x + 24} ${y - 31} ${x + 27} ${y - 38}`, M[1]);
      P.curve(`M ${x + 1} ${y} L ${x + 1} ${y - 16} Q ${x + 2} ${y - 27} ${x + 12} ${y - 29} Q ${x + 23} ${y - 30} ${x + 26} ${y - 37}`, M[4]);
      P.part(P.ell(x + 28, y - 41, 5, 4.4, 0.5), M, { b: 3 });
      P.part(P.ell(x + 28.6, y - 41.6, 2.6, 2.2), C.eye, { sh: 0, hi: 0 });
      P.px(x + 29, y - 41.6, C.red[3]);
    } else {
      P.part(P.rect(x - 1, y - 40, 2.6, 40), M, { b: 2, sh: 0 });
      P.part(P.ell(x + 0.4, y - 44, 5, 5.4), M, { b: 3 });
      P.part(P.ell(x + 0.4, y - 45, 3, 2.6), C.eye, { sh: 0, hi: 0 });
      P.line(x + 0.4, y - 45, x + 2, y - 46.6, C.red[3]);
    }
    P.part(P.rect(x - 2.4, y - 2, 6, 2), M, { b: 1, sh: 0 });
  }

  function hat(P, x, y, rat, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.ell(x, y - 1.4, 9.4, 2.6), C.night, { b: 1 });
    Q.part(Q.path(`M ${x - 6} ${y - 2} L ${x - 5.4} ${y - 14} Q ${x} ${y - 16} ${x + 5.4} ${y - 14} L ${x + 6} ${y - 2} Z`), C.night, { b: 1 });
    Q.part(Q.rect(x - 5.8, y - 5.4, 11.6, 2.4), C.red, { b: 3, sh: 0, hi: 0 });
    if (rat) {
      Q.part(Q.ell(x - 1.6, y - 17.4, 1.8, 2.2), C.rat, { b: 3, sh: 0 });
      Q.part(Q.ell(x + 2.4, y - 17.4, 1.8, 2.2), C.rat, { b: 3, sh: 0 });
      Q.part(Q.ell(x + 0.4, y - 15, 3.2, 2.2), C.rat, { b: 3 });
      Q.px(x - 0.6, y - 15.4, C.pupil); Q.px(x + 1.6, y - 15.4, C.pupil);
    }
  }

  function goggles(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.rect(x - 8, y - 1, 16, 2), C.grey, { b: 0, sh: 0, hi: 0 });
    Q.part(Q.path(`M ${x - 7} ${y - 3} L ${x + 7} ${y - 3} L ${x + 8} ${y + 4} L ${x + 1.6} ${y + 4} L ${x} ${y + 2.4} L ${x - 1.6} ${y + 4} L ${x - 8} ${y + 4} Z`), C.grey, { b: 1 });
    Q.part(Q.rect(x - 5.6, y - 1.4, 11.2, 3), GLOW, { b: 3, sh: 0, hi: 0, ol: 0 });
  }

  function leaf(P, x, y, s, ramp) {
    const k = s || 1;
    const pts = [0, -6, 1.4, -3.4, 3.6, -4.4, 3, -1.6, 6, -1, 3.4, 1.4, 4, 3.6, 1, 2.8, 0.6, 6, -0.6, 6, -1, 2.8, -4, 3.6, -3.4, 1.4, -6, -1, -3, -1.6, -3.6, -4.4, -1.4, -3.4];
    P.part(P.poly(pts.map((v, i) => (i % 2 ? y + v * k : x + v * k))), ramp || C.red, { b: 3, sh: 0 });
  }

  function rainbow(P, x, y, r, w) {
    for (let i = 0; i < 7; i++) {
      const rr = r - i * (w || 1.6);
      if (rr < 1) break;
      P.curve(`M ${x - rr} ${y} Q ${x - rr} ${y - rr * 1.34} ${x} ${y - rr * 1.34} Q ${x + rr} ${y - rr * 1.34} ${x + rr} ${y}`, BOW[i][3]);
    }
  }

  function beam(f, x0, y0, x1, y1, t, wd) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    const nx = -(y1 - y0) / n, ny = (x1 - x0) / n;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const w = (wd || 3) * (0.4 + k);
      for (let j = -w; j <= w; j++) f.set(Math.round(x0 + (x1 - x0) * k + nx * j), Math.round(y0 + (y1 - y0) * k + ny * j), C.cycle[(Math.floor(j + w + i * 0.3 + t * 9) % 8 + 8) % 8]);
    }
  }

  function stars(buf, m, seed, n) {
    for (let i = 0; i < n; i++) {
      const x = m.x0 + Math.floor(S.hash(i, seed, 1) * m.w), y = m.y0 + Math.floor(S.hash(i, seed, 2) * m.h);
      if (!m.has(x, y)) continue;
      const v = S.hash(i, seed, 3);
      buf.set(x, y, v > 0.8 ? C.lamp : v > 0.4 ? C.grey[5] : C.grey[3]);
      if (v > 0.93) { buf.set(x + 1, y, C.grey[4]); buf.set(x, y + 1, C.grey[4]); }
    }
  }

  Object.assign(A, { rot90, uni, lander, landerSprite, satellite, talisman, caseArt, spork, coasterCar, wheel, tank, crystal, crystalShard, earth, micro, remote, meter, hat, goggles, leaf, rainbow, beam, stars, LAMP, GLOW, NEON_R, BOW });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
