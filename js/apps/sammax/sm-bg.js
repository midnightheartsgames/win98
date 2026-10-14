(function (S) {
  'use strict';
  const { C, Buf, Pen, part, grad, shade, light, fill, line, hash, font } = S;
  const BG = S.BG = S.BG || {};
  const LAYERS = S.LAYERS = S.LAYERS || {};

  function lineIn(buf, m, x0, y0, x1, y1, c) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      if (m.has(x, y)) buf.set(x, y, c);
    }
  }

  function vgrad(buf, m, ramp, y0, y1, t0, t1) {
    grad(buf, m, ramp, (x, y) => t0 + (t1 - t0) * Math.max(0, Math.min(1, (y - y0) / Math.max(1, y1 - y0))));
  }

  function planks(buf, m, vx, vy, ramp, o) {
    o = o || {};
    const x0 = m.x0, x1 = m.x0 + m.w, y0 = m.y0, y1 = m.y0 + m.h;
    grad(buf, m, ramp, (x, y) => {
      const t = (y - y0) / (y1 - y0);
      return 0.25 + t * 0.5 + (hash(Math.floor((x - vx) / Math.max(4, (y - vy) * 0.35)), 3, 7) - 0.5) * 0.12;
    });
    const step = o.step || 22;
    for (let bx = x0 - 400; bx <= x1 + 400; bx += step) lineIn(buf, m, vx + (bx - vx) * 0.02, vy, bx, y1 + 10, ramp[0]);
    for (let r = 0; r < 14; r++) {
      const yy = Math.round(y0 + (y1 - y0) * Math.pow(r / 14, 1.35));
      for (let bx = x0 - 400; bx <= x1 + 400; bx += step) {
        if (hash(bx, r, 11) < 0.55) continue;
        const k = (yy - vy) / (y1 + 10 - vy);
        const xa = vx + (bx - vx) * k, xb = vx + (bx + step - vx) * k;
        lineIn(buf, m, xa, yy, xb, yy, ramp[1]);
      }
    }
    if (o.shine) shade(buf, m, 0, (x, y) => (y - y0) / (y1 - y0) < 0.12 ? 0.8 : 0);
  }

  function bricks(buf, m, bw, bh, ramp, mortar, seed) {
    m.each((x, y) => {
      const row = Math.floor(y / bh);
      const off = row % 2 ? bw / 2 : 0;
      const col = Math.floor((x + off) / bw);
      const lx = (x + off) - col * bw, ly = y - row * bh;
      let c;
      if (ly === 0 || lx === 0) c = mortar;
      else {
        const v = hash(col, row, seed || 1);
        c = v < 0.2 ? ramp[1] : v > 0.85 ? ramp[3] : ramp[2];
        if (ly === 1 && hash(col, row, 5) > 0.5) c = ramp[3];
        if (ly === bh - 1) c = ramp[1];
      }
      buf.set(x, y, c);
    });
  }

  function noise(buf, m, amount, seed) {
    m.each((x, y) => {
      const v = hash(x, y, seed || 9);
      if (v < amount) { const i = y * buf.w + x; buf.px[i] = S.DARKER[buf.px[i]]; }
      else if (v > 1 - amount * 0.5) { const i = y * buf.w + x; buf.px[i] = S.LIGHTER[buf.px[i]]; }
    });
  }

  function vignette(buf, k, cx, cy) {
    const w = buf.w, h = buf.h;
    cx = cx === undefined ? w / 2 : cx; cy = cy === undefined ? h * 0.55 : cy;
    const m = new S.Mask(0, 0, w, h); m.m.fill(1);
    shade(buf, m, 0, (x, y) => {
      const dx = (x - cx) / (w * 0.62), dy = (y - cy) / (h * 0.75);
      return Math.max(0, (dx * dx + dy * dy - 0.45) * k);
    });
  }

  function pool(buf, cx, cy, rx, ry, k, dark) {
    const m = S.ellipseMask(cx, cy, rx, ry, 0);
    const fn = (x, y) => {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      return Math.max(0, (1 - Math.sqrt(dx * dx + dy * dy)) * k);
    };
    if (dark) shade(buf, m, 0, fn); else light(buf, m, 0, fn);
  }

  function dropShadow(buf, cx, cy, rx, ry, k) { pool(buf, cx, cy, rx, ry, k || 1.6, true); }

  function box(P, x, y, w, h, dx, dy, ramp, o) {
    o = o || {};
    const front = P.poly([x, y, x + w, y, x + w, y + h, x, y + h]);
    const top = P.poly([x, y, x + dx, y - dy, x + w + dx, y - dy, x + w, y]);
    const side = dx >= 0 ? P.poly([x + w, y, x + w + dx, y - dy, x + w + dx, y + h - dy, x + w, y + h]) : P.poly([x, y, x + dx, y - dy, x + dx, y + h - dy, x, y + h]);
    P.part(side, ramp, { b: (o.b || 3) - 1, sh: 0, hi: 0 });
    P.part(top, ramp, { b: Math.min(ramp.length - 1, (o.b || 3) + 1), sh: 0, hi: 0 });
    P.part(front, ramp, { b: o.b || 3, sh: o.sh === undefined ? 2 : o.sh, hi: o.hi === undefined ? 1 : o.hi });
    return front;
  }

  function textOn(buf, text, x, y, c, ol, mirror) {
    const w = font.measure(text) + 4;
    const t = new Buf(w, 14);
    font.draw(t, text, 2, 2, c, ol === undefined ? 0 : ol);
    for (let yy = 0; yy < t.h; yy++) for (let xx = 0; xx < t.w; xx++) {
      const v = t.px[yy * t.w + (mirror ? t.w - 1 - xx : xx)];
      if (v) buf.set(Math.round(x) + xx - 2, Math.round(y) + yy - 2, v);
    }
  }

  function sprite(w, h, fn) {
    const b = new Buf(w, h);
    fn(new Pen(b), b);
    return b;
  }

  function cityView(buf, m, x0, y0, x1, y1, seed, night) {
    vgrad(buf, m, night ? C.night : [C.purple[1], C.purple[2], C.plum[3], C.rose[3], C.orange[3], C.orange[4]], y0, y1, 0.05, 0.95);
    let x = x0 - 4;
    let k = 0;
    while (x < x1) {
      const bw = 10 + Math.floor(hash(k, seed, 1) * 16);
      const bh = 18 + Math.floor(hash(k, seed, 2) * (y1 - y0) * 0.7);
      const top = y1 - bh;
      const bm = S.ringsMask([[x, top, x + bw, top, x + bw, y1 + 2, x, y1 + 2]]).and(m);
      fill(buf, bm, night ? C.night[1] : C.plum[1]);
      bm.each((px, py) => {
        const lx = px - x, ly = py - top;
        if (lx % 4 === 2 && ly % 5 === 2 && hash(px, py, seed) > 0.45) buf.set(px, py, hash(px, py, 3) > 0.3 ? C.lamp : C.orange[3]);
      });
      if (hash(k, seed, 4) > 0.6) {
        const am = S.ringsMask([[x + bw / 2 - 1, top - 6, x + bw / 2, top - 6, x + bw / 2, top, x + bw / 2 - 1, top]]).and(m);
        fill(buf, am, night ? C.night[1] : C.plum[1]);
      }
      x += bw + Math.floor(hash(k, seed, 5) * 3);
      k++;
    }
  }

  BG.office = function (buf, o) {
    o = o || {};
    const P = new Pen(buf);
    const wallR = o.dream ? C.lilac : C.teal;
    const floorR = o.dream ? C.plum : C.wood;
    const wall = P.poly([0, 0, 320, 0, 320, 126, 0, 126]);
    vgrad(buf, wall, wallR, 0, 126, 0.15, 0.62);
    shade(buf, wall, 0, (x, y) => (x % 14 < 5 ? 0.35 : 0) + (x % 14 === 5 ? 0.5 : 0));
    const ceil = P.poly([0, 0, 320, 0, 320, 8, 0, 12]);
    part(buf, ceil, wallR, { b: 1, sh: 0, hi: 0, ol: 0 });
    line(buf, 0, 12, 320, 8, C.black);
    const lw = P.poly([0, 12, 34, 16, 34, 128, 0, 150]);
    vgrad(buf, lw, wallR, 12, 150, 0.05, 0.4);
    line(buf, 34, 16, 34, 128, C.black);
    const rw = P.poly([262, 9, 320, 4, 320, 160, 262, 128]);
    vgrad(buf, rw, wallR, 4, 160, 0.1, 0.5);
    line(buf, 262, 9, 262, 128, C.black);
    const floor = P.poly([0, 150, 34, 128, 262, 128, 320, 160, 320, 200, 0, 200]);
    planks(buf, floor, 150, 40, floorR, { step: 20 });
    const base = P.poly([34, 122, 262, 122, 262, 129, 34, 129]);
    part(buf, base, floorR, { b: 1, sh: 0, hi: 1 });
    part(buf, P.poly([0, 145, 34, 124, 34, 130, 0, 152]), floorR, { b: 1, sh: 0, hi: 0 });
    part(buf, P.poly([262, 124, 320, 154, 320, 161, 262, 130]), floorR, { b: 1, sh: 0, hi: 0 });
    const win = P.poly([102, 30, 162, 28, 164, 96, 100, 98]);
    cityView(buf, win, 100, 28, 164, 98, 3, o.dream);
    for (let i = 0; i < 6; i++) {
      const y = 31 + i * 3.2;
      part(buf, P.poly([102, y, 162, y - 1, 162, y + 2, 102, y + 3]), o.dream ? C.pink : C.sand, { b: 3, sh: 0, hi: 0, ol: C.sand[0] });
    }
    part(buf, P.poly([101, 49, 163, 48, 163, 51, 101, 52]), o.dream ? C.pink : C.sand, { b: 2, sh: 0, hi: 1 });
    line(buf, 132, 52, 132, 96, C.oak[1]);
    line(buf, 101, 73, 163, 72, C.oak[1]);
    S.outerLine(buf, win, C.black);
    part(buf, P.poly([96, 27, 167, 25, 167, 29, 96, 31]), C.oak, { b: 3, sh: 0 });
    part(buf, P.poly([96, 30, 101, 30, 99, 99, 95, 99]), C.oak, { b: 2, sh: 0 });
    part(buf, P.poly([162, 29, 167, 28, 168, 97, 164, 97]), C.oak, { b: 2, sh: 0 });
    part(buf, P.poly([92, 97, 171, 95, 173, 101, 90, 103]), C.oak, { b: 3 });
    part(buf, P.poly([40, 64, 80, 62, 81, 128, 41, 129]), C.olive, { b: 2 });
    part(buf, P.poly([80, 62, 90, 67, 90, 124, 81, 128]), C.olive, { b: 1, sh: 0 });
    part(buf, P.poly([40, 64, 50, 60, 90, 58, 80, 62]), C.olive, { b: 3, sh: 0 });
    for (let i = 0; i < 3; i++) {
      const y = 69 + i * 19;
      part(buf, P.poly([44, y, 77, y - 1, 77, y + 15, 44, y + 16]), C.olive, { b: 3, sh: 1 });
      part(buf, P.rect(55, y + 6, 11, 3), C.grey, { b: 4, sh: 0, hi: 0 });
      part(buf, P.rect(57, y + 1, 7, 3), C.sand, { b: 4, sh: 0, hi: 0 });
    }
    part(buf, P.poly([43, 18, 81, 17, 82, 48, 44, 50]), C.gold, { b: 2 });
    const pic = P.poly([46, 21, 79, 20, 79, 45, 47, 47]);
    vgrad(buf, pic, C.green, 20, 47, 0.2, 0.55);
    part(buf, P.ell(62, 39, 13, 4), C.green, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 3; i++) {
      const dx = 51 + i * 10;
      part(buf, P.ell(dx, 32, 3, 3.5), C.fur, { b: 3, sh: 1 });
      part(buf, P.ell(dx + 2, 31, 2, 1.2), C.fur, { b: 4, sh: 0, hi: 0 });
      part(buf, P.rect(dx - 2, 35, 5, 4), [C.red, C.blue, C.gold][i], { b: 3, sh: 0, hi: 0 });
    }
    for (let i = 0; i < 4; i++) buf.set(56 + i * 4, 40, C.grey[5]);
    part(buf, P.poly([176, 88, 208, 86, 209, 128, 176, 129]), C.oak, { b: 2 });
    line(buf, 177, 107, 208, 106, C.oak[0]);
    part(buf, P.poly([186, 112, 198, 111, 198, 121, 186, 122]), C.oak, { b: 1, sh: 0, hi: 0, ol: 0 });
    part(buf, P.poly([189, 118, 192, 113, 195, 118, 193, 118, 193, 121, 191, 121, 191, 118]), C.red, { b: 1, sh: 0, hi: 0, ol: 0 });
    part(buf, P.poly([172, 60, 212, 58, 213, 87, 172, 88]), C.grey, { b: 2 });
    part(buf, P.poly([175, 63, 205, 61, 205, 84, 175, 85]), C.grey, { b: 0, sh: 0, hi: 0 });
    part(buf, P.rect(207, 64, 4, 3), C.grey, { b: 4, sh: 0, hi: 0 });
    part(buf, P.rect(207, 70, 4, 3), C.grey, { b: 4, sh: 0, hi: 0 });
    line(buf, 185, 58, 178, 46, C.grey[1]);
    line(buf, 195, 58, 204, 47, C.grey[1]);
    part(buf, P.poly([178, 89, 206, 88, 206, 96, 178, 97]), C.grey, { b: 1 });
    part(buf, P.rect(182, 91, 12, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
    buf.set(200, 92, C.red[4]);
    const door = P.poly([224, 42, 260, 40, 260, 128, 224, 128]);
    part(buf, door, C.oak, { b: 2 });
    part(buf, P.poly([228, 47, 256, 46, 256, 82, 228, 83]), C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.poly([228, 88, 256, 87, 256, 122, 228, 123]), C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(253, 86, 2, 2), C.gold, { b: 3, sh: 0 });
    part(buf, P.poly([205, 127, 205, 120, 208, 116, 213, 116, 216, 120, 216, 127]), C.black, { b: 0, sh: 0, hi: 0, ol: C.black });
    part(buf, P.poly([206, 127, 206, 121, 209, 118, 212, 118, 215, 121, 215, 127]), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 });
    const edoor = P.poly([276, 32, 306, 23, 306, 170, 276, 142]);
    part(buf, edoor, C.oak, { b: 2 });
    const glass = P.poly([280, 38, 302, 31, 302, 86, 280, 88]);
    grad(buf, glass, C.sky, (x, y) => 0.55 + (y - 31) / 120 + (hash(x, y, 2) - 0.5) * 0.2);
    S.outerLine(buf, glass, C.black);
    textOn(buf, 'SAM', 283, 45, C.navy[1], 0, true);
    textOn(buf, '& MAX', 281, 55, C.navy[1], 0, true);
    part(buf, P.poly([280, 95, 302, 91, 302, 133, 280, 128]), C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(281, 102, 2, 2.2), C.gold, { b: 3, sh: 0 });
    part(buf, P.poly([268, 76, 273, 75, 273, 84, 268, 85]), C.sand, { b: 4, sh: 0 });
    part(buf, P.rect(269.5, 78, 2, 3), C.grey, { b: 2, sh: 0, hi: 0, ol: 0 });
    part(buf, P.poly([16, 124, 24, 124, 22, 128, 18, 128]), C.oak, { b: 1 });
    part(buf, P.cap(20, 126, 20, 60, 1.6), C.oak, { b: 2, sh: 0 });
    part(buf, P.cap(20, 62, 12, 56, 1.2), C.oak, { b: 2, sh: 0 });
    part(buf, P.cap(20, 62, 28, 56, 1.2), C.oak, { b: 2, sh: 0 });
    line(buf, 150, 0, 150, 14, C.black);
    part(buf, P.rect(147, 13, 6, 4), C.grey, { b: 2, sh: 0 });
    if (!o.dream) {
      pool(buf, 150, 50, 90, 60, 0.6);
      pool(buf, 132, 150, 90, 28, 0.8);
      dropShadow(buf, 192, 130, 22, 4);
      dropShadow(buf, 62, 130, 26, 4);
      dropShadow(buf, 242, 129, 20, 3);
      vignette(buf, 1.1);
    }
  };

  LAYERS.office = {
    glove: () => sprite(24, 14, P => {
      P.part(P.ell(9, 7, 7, 5.5), C.red, { b: 3 });
      P.part(P.ell(4.5, 6, 3, 3.2), C.red, { b: 3 });
      P.part(P.rect(14, 4, 7, 7), C.grey, { b: 5, sh: 1 });
      P.line(15, 7, 20, 7, C.grey[2]);
    }),
    ball: () => sprite(18, 18, P => {
      P.part(P.ell(9, 9, 7.5, 7.5), C.purple, { b: 2 });
      P.px(7, 5, C.black); P.px(10, 5, C.black); P.px(8.5, 8, C.black);
      P.px(5, 7, C.purple[4]);
    }),
    hanger: () => sprite(16, 12, P => {
      P.curve('M 8 1 Q 11 1 10 4 L 8 5 L 1 10 L 15 10 L 8 5', C.grey[4]);
      P.curve('M 2 11 L 14 11', C.grey[1]);
    }),
    closetOpen: g => sprite(46, 92, P => {
      const dream = g && g.fx.dream;
      part(P.b, P.poly([2, 2, 38, 1, 38, 88, 2, 88]), C.black, { b: 0, sh: 0, hi: 0 });
      const inner = P.poly([4, 4, 36, 3, 36, 86, 4, 86]);
      vgrad(P.b, inner, dream ? C.plum : C.wood, 3, 86, 0.05, 0.35);
      part(P.b, P.rect(4, 28, 32, 3), C.wood, { b: 2, sh: 0 });
      P.part(P.poly([36, 2, 45, 7, 45, 92, 36, 88]), C.oak, { b: 3 });
      P.part(P.ell(43, 50, 1.5, 2), C.gold, { b: 3, sh: 0 });
      P.part(P.rect(8, 14, 9, 12), C.sand, { b: 2 });
      P.part(P.rect(20, 18, 12, 8), C.red, { b: 2 });
    }),
    cheese: g => sprite(34, 30, P => {
      const holes = g && g.f.cheeseShot;
      const tone = g && g.fx.dream ? C.yellow : C.cheese;
      P.part(P.path('M 2 28 L 5 16 L 11 9 L 19 4 L 26 9 L 31 18 L 33 28 Z'), tone, { b: 3 });
      P.part(P.poly([6, 28, 9, 19, 17, 17, 16, 28]), C.orange, { b: 3, sh: 1 });
      P.part(P.poly([18, 28, 22, 16, 30, 22, 31, 28]), tone, { b: 2, sh: 1 });
      if (holes) {
        const hs = [[12, 12], [20, 9], [25, 14], [9, 22], [21, 22], [15, 18], [27, 24], [6, 25], [18, 13]];
        for (const [x, y] of hs) { P.part(P.ell(x, y, 1.6, 1.4), tone, { b: 0, sh: 0, hi: 0, ol: tone[1] }); }
      }
    }),
    phone: () => sprite(24, 14, P => {
      P.part(P.poly([3, 13, 5, 6, 19, 6, 21, 13]), C.grey, { b: 1 });
      P.part(P.cap(3, 5, 21, 5, 2.5), C.grey, { b: 1 });
      P.part(P.ell(12, 10, 3, 2), C.grey, { b: 3, sh: 0, hi: 0 });
    }),
    desk: () => sprite(112, 64, P => {
      const b = P.b;
      part(b, P.poly([0, 18, 92, 12, 108, 20, 18, 28]), C.oak, { b: 3 });
      part(b, P.poly([0, 18, 18, 28, 18, 64, 0, 64]), C.oak, { b: 1 });
      part(b, P.poly([18, 28, 108, 20, 108, 64, 18, 64]), C.oak, { b: 2 });
      for (let i = 0; i < 2; i++) part(b, P.poly([26, 34 + i * 14, 58, 32 + i * 14, 58, 43 + i * 14, 26, 45 + i * 14]), C.oak, { b: 2, sh: 1, hi: 1 });
      part(b, P.poly([66, 29, 100, 26, 100, 64, 66, 64]), C.oak, { b: 2, sh: 1, hi: 1 });
      part(b, P.ell(42, 39, 3, 1.3), C.gold, { b: 3, sh: 0, hi: 0 });
      part(b, P.ell(42, 53, 3, 1.3), C.gold, { b: 3, sh: 0, hi: 0 });
      part(b, P.poly([10, 16, 38, 13, 44, 17, 16, 20]), C.grey, { b: 5, sh: 0, hi: 0 });
      part(b, P.poly([14, 14, 36, 12, 40, 15, 18, 17]), C.sand, { b: 4, sh: 0, hi: 0 });
      part(b, P.ell(84, 12, 4, 1.8), C.green, { b: 2 });
      part(b, P.cap(84, 12, 88, 2, 1.2), C.grey, { b: 1, sh: 0 });
      part(b, P.poly([82, 0, 97, 0, 99, 5, 80, 5]), C.green, { b: 3 });
      part(b, P.rect(62, 9, 5, 6), C.grey, { b: 5, sh: 1 });
      P.px(66, 11, C.grey[3]);
    })
  };

  Object.assign(BG, { lineIn, vgrad, planks, bricks, noise, vignette, pool, dropShadow, box, textOn, sprite, cityView });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
