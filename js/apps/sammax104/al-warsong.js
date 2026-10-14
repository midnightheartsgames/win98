(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP104;
  const CLOSEUPS = S.CLOSEUPS;
  const COLORS = S.COLORS;
  const BG = S.BG;
  const A = S.art104;
  const B = S.art104bg;
  const { cached } = S.tvArt;
  const TAU = Math.PI * 2;
  const END = 162.4;
  const STEP = 0.125;
  const WHITE = B.WHITE;
  const FULL = new S.Mask(0, 0, W, H);
  FULL.m.fill(1);

  const LYRICS = [
    [5.4, 8.8, 'superball', 'Что там гудит?'],
    [8.9, 12.6, 'superball', 'Что там горит?'],
    [12.7, 20.2, 'superball', 'Ужели ДЕФКОН так звенит?'],
    [20.9, 25.1, 'superball', 'И лампа красная над дверью?'],
    [25.2, 29.3, 'superball', 'Такое значит лишь одно...'],
    [29.4, 37.6, 'superball', 'Война!'],
    [39.9, 41.9, 'agents', 'Война! А что с неё возьмёшь?'],
    [41.9, 43.9, 'agents', 'Возьмёшь медаль! Возьмёшь и грош!'],
    [43.9, 45.4, 'superball', 'Медаль и грош! Медаль и грош!'],
    [47.9, 49.9, 'agents', 'Война! А что с неё возьмёшь?'],
    [49.9, 52.3, 'agents', 'Казне доход, заводам план!'],
    [52.3, 56.0, 'superball', 'Гора поделится на три,'],
    [56.0, 60.6, 'superball', 'И каждому по голове!'],
    [63.9, 65.9, 'agents', 'Война! А что с неё возьмёшь?'],
    [65.9, 68.8, 'agents', 'Возьмёшь медаль! Возьмёшь и грош!'],
    [116.5, 119.6, 'superball', 'Война-а-а!'],
    [120.3, 122.0, 'agents', 'Война! А что с неё возьмёшь?'],
    [122.0, 126.4, 'agents', 'Возьмёшь медаль! Возьмёшь и грош!'],
    [126.5, 129.9, 'agents', 'Война! А что с неё возьмёшь?'],
    [129.9, 134.0, 'agents', 'Казне доход, заводам план!'],
    [134.0, 138.0, 'superball', 'Чем дольше бой, тем выше рейтинг, господа,'],
    [138.0, 143.0, 'superball', 'Коней на переправе не меняют никогда!'],
    [143.0, 147.0, 'agents', 'За танки, бомбы и мундир!'],
    [147.0, 151.0, 'agents', 'Мы славим всё, что портит мир!'],
    [151.0, 155.0, 'agents', 'За танки, бомбы и мундир!'],
    [155.0, 160.3, 'agents', 'Ответ положительный! Война!']
  ];

  const lum = S.PALETTE.map(([r, g, b]) => (r * 0.3 + g * 0.59 + b * 0.11) / 255);
  function lutFor(ramp, gain) {
    const out = new Uint8Array(256);
    for (let i = 0; i < 256; i++) out[i] = i < 2 || S.EMISSIVE[i] ? i : ramp[Math.min(ramp.length - 1, Math.floor(lum[i] * ramp.length * (gain || 1.2)))];
    return out;
  }
  const LUT = { red: lutFor(C.red.slice(0, 4), 1.05), blue: lutFor(C.blue, 1.35), pink: lutFor(C.pink), gold: lutFor(C.gold) };

  function wash(f, lut, m) {
    const px = f.px;
    if (!m) { for (let i = 0; i < px.length; i++) px[i] = lut[px[i]]; return; }
    m.each((x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) { const i = y * W + x; px[i] = lut[px[i]]; } });
  }

  function flash(f, lut) {
    const px = f.px;
    for (let y = 0; y < H; y++) for (let x = (y & 1); x < W; x += 2) { const i = y * W + x; px[i] = lut[px[i]]; }
  }

  function spots(f, masks, k) {
    const copy = f.px.slice();
    S.shade(f, FULL, k);
    for (const m of masks) m.each((x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) f.px[y * W + x] = copy[y * W + x]; });
  }

  function rotBuf(src) {
    const out = new S.Buf(src.h, src.w);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.px[(src.w - 1 - x) * out.w + y] = src.px[y * src.w + x];
    return out;
  }

  let sing = null;
  function singing(T) {
    if (!sing) {
      const fl = S.songOf(S.THEMES.warsong);
      sing = new Uint8Array(fl.total);
      fl.lead.forEach((n, at) => { if (n) for (let k = 0; k < n.len - (n.len > 1 ? 1 : 0); k++) sing[at + k] = 1; });
    }
    const s = Math.floor(T / STEP);
    return s >= 0 && s < sing.length && sing[s] === 1;
  }

  function put(f, id, x, y, s, o) {
    const sp = S.sprite(id, o, s);
    if (sp) blit(f, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
    return sp;
  }

  function agent(f, x, y, s, act, T, o) {
    return put(f, 'superball', x, y, s, Object.assign({ dir: 's', act, t: T, talk: singing(T) ? 1 : 0 }, o || {}));
  }

  function bust(f, x, y, s, T, o) {
    o = o || {};
    const P = new Pen(f).at(x, y, s, o.flip);
    const G = C.grey, K = C.pale;
    A.suit(P, G, 1, 4, 60, 15);
    if (o.chest) A.sleeve(P, G, 1, 13, 10, -2, 22, K);
    if (o.cup) { A.sleeve(P, G, 1, -13, 10, -5, -4, K); A.sleeve(P, G, 1, 13, 10, 5, -4, K); }
    A.superballHead(P, 0, -12, { talk: o.talk === undefined ? singing(T) : o.talk, wide: o.wide });
    if (o.cup) { P.part(P.ell(-4, -3.5, 2.8, 2.6), K, { b: 3, sh: 0 }); P.part(P.ell(4, -3.5, 2.8, 2.6), K, { b: 3, sh: 0 }); }
  }

  function wallPaint(b, P, x0, x1, top, floorY) {
    const w = P.rect(x0, top, x1 - x0, floorY - top);
    BG.vgrad(b, w, C.cream, top, floorY, 0.6, 0.85);
    w.each((x, y) => { if ((x + 600) % 24 === 0 && y > top + 12 && y < floorY - 26) b.set(x, y, C.cream[2]); });
    S.part(b, P.rect(x0, top, x1 - x0, 9), C.cream, { b: 4, sh: 0, hi: 0 });
    S.line(b, x0, top + 9, x1, top + 9, C.cream[1]);
    S.part(b, P.rect(x0, floorY - 24, x1 - x0, 22), C.cream, { b: 3, sh: 0, hi: 1 });
    for (let x = x0 + 6; x < x1; x += 30) S.part(b, P.rect(x, floorY - 20, 22, 14), C.cream, { b: 3, sh: 1, hi: 1 });
    S.part(b, P.rect(x0, floorY - 3, x1 - x0, 4), C.oak, { b: 2, sh: 0, hi: 1 });
  }

  function rug(b, P, y0, y1) {
    const r = P.rect(0, y0, b.w, y1 - y0);
    S.grad(b, r, C.blue, (x, y) => 0.3 + (y - y0) / 260 + (S.hash(x >> 1, y >> 1, 8) - 0.5) * 0.05);
  }

  function windowPaint(b, P, x, y, w, h) {
    S.part(b, P.rect(x - 3, y - 3, w + 6, h + 6), WHITE, { b: 2 });
    const glass = P.rect(x, y, w, h);
    S.grad(b, glass, C.sky, (px, py) => 0.35 + (py - y) / (h * 1.4));
    const green = P.rect(x, y + h * 0.7, w, h * 0.3);
    S.grad(b, green, C.green, (px, py) => 0.35 + (S.hash(px >> 1, py >> 1, 3) - 0.5) * 0.3);
    S.line(b, x + w / 2, y, x + w / 2, y + h, C.grey[4]);
    S.line(b, x, y + h / 3, x + w, y + h / 3, C.grey[4]);
    S.line(b, x, y + h * 2 / 3, x + w, y + h * 2 / 3, C.grey[4]);
    S.outerLine(b, glass, C.black);
  }

  function drape(b, P, x, d, top, bot) {
    S.part(b, P.path(`M ${x} ${top} L ${x + d * 16} ${top} Q ${x + d * 9} ${(top + bot) / 2} ${x + d * 7} ${bot} L ${x} ${bot} Z`), C.gold, { b: 2 });
    for (let i = 1; i < 3; i++) S.line(b, x + d * i * 5, top + 2, x + d * i * 3, bot - 2, C.gold[1]);
  }

  function flagPole(b, P, x, top, bot, us) {
    S.line(b, x, top, x, bot, C.gold[2]);
    S.part(b, P.ell(x, top - 1, 2, 2), C.gold, { b: 4, sh: 0 });
    const cloth = P.path(`M ${x + 1} ${top + 3} L ${x + 9} ${top + 5} Q ${x + 8} ${(top + bot) / 2} ${x + 5} ${bot - 22} L ${x - 2} ${bot - 24} Q ${x - 3} ${(top + bot) / 2 - 6} ${x + 1} ${top + 3} Z`);
    if (us) { S.part(b, cloth, C.red, { b: 3 }); B.usFlag(b, cloth, x - 3, top + 3); }
    else { S.part(b, cloth, C.blue, { b: 2 }); for (let i = 0; i < 4; i++) b.set(x + 2, top + 12 + i * 12, C.gold[4]); }
  }

  function bookcase(b, P, x, y, w, h) {
    S.part(b, P.rect(x, y, w, h), C.wood, { b: 1 });
    const rows = 4, rh = (h - 8) / rows;
    for (let r = 0; r < rows; r++) {
      const sy = y + 4 + r * rh;
      S.part(b, P.rect(x + 3, sy, w - 6, rh - 3), C.wood, { b: 0, sh: 0, hi: 0, ol: 0 });
      let bx = x + 4;
      let k = 0;
      while (bx < x + w - 6) {
        const bw = 3 + Math.floor(S.hash(k, r, 7) * 3), bh = rh - 5 - Math.floor(S.hash(k, r, 8) * 5);
        const ramp = [C.red, C.navy, C.green, C.oak, C.plum][Math.floor(S.hash(k, r, 9) * 5)];
        S.part(b, P.rect(bx, sy + rh - 3 - bh, bw, bh), ramp, { b: 2, sh: 0, hi: 1 });
        bx += bw + 1; k++;
      }
      S.part(b, P.rect(x + 2, sy + rh - 3, w - 4, 3), C.wood, { b: 3, sh: 0 });
    }
  }

  function tankPainting(b, P, x, y, w, h) {
    S.part(b, P.rect(x, y, w, h), C.gold, { b: 3 });
    const pic = P.rect(x + 4, y + 4, w - 8, h - 8);
    BG.vgrad(b, pic, [C.sky[2], C.sky[3], C.sand[3], C.sand[2]], y + 4, y + h - 4, 0, 1);
    const cx = x + w / 2, gy = y + h - 12;
    S.part(b, P.poly([cx - 16, gy, cx + 16, gy, cx + 12, gy + 5, cx - 12, gy + 5]), C.olive, { b: 1 });
    S.part(b, P.poly([cx - 13, gy - 6, cx + 13, gy - 6, cx + 16, gy, cx - 16, gy]), C.olive, { b: 2 });
    S.part(b, P.ell(cx - 1, gy - 8, 7, 3.4), C.olive, { b: 3 });
    S.line(b, cx + 5, gy - 9, cx + 17, gy - 12, C.olive[0]);
    for (let i = -10; i <= 10; i += 5) b.set(Math.round(cx + i), gy + 2, C.olive[3]);
  }

  function signBoard(f, P, x, y, w, lit, big) {
    const h = big ? 70 : 34;
    P.part(P.rect(x, y, w, h), C.gold, { b: 2 });
    P.part(P.rect(x + 4, y + 4, w - 8, h - 8), C.red, { b: lit ? 3 : 2, sh: 1, hi: 1 });
    const cx = x + w / 2;
    if (big) {
      S.bigText(f, 'ВОЕННАЯ', cx, y + 10, 4, lit ? C.neonA : C.gold[3], lit ? C.pink[4] : C.gold[4], 1);
      S.bigText(f, 'КОМНАТА', cx, y + 44, 2, C.gold[3], C.gold[4], 1);
    } else {
      S.bigText(f, 'ВОЕННАЯ', cx, y + 6, 2, lit ? C.neonA : C.gold[3], lit ? C.pink[4] : C.gold[4], 1);
      font.drawCentered(f, 'КОМНАТА', cx, y + 22, C.gold[4], C.black);
    }
  }

  function beacon(f, P, x, y, s, T) {
    const on = Math.floor(T * 2) % 2 === 0;
    P.part(P.rect(x - 6 * s, y, 12 * s, 3 * s), C.grey, { b: 2 });
    P.part(P.path(`M ${x - 5 * s} ${y} Q ${x - 5 * s} ${y - 9 * s} ${x} ${y - 9 * s} Q ${x + 5 * s} ${y - 9 * s} ${x + 5 * s} ${y} Z`), on ? [C.neonA, C.neonA, C.neonA, C.pink[4], C.pink[4]] : C.red, { b: 2, sh: on ? 0 : 1 });
    if (on) for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.15 + i * 0.14); S.line(f, x + Math.cos(a) * 8 * s, y - 5 * s + Math.sin(a) * 8 * s, x + Math.cos(a) * 15 * s, y - 5 * s + Math.sin(a) * 15 * s, C.neonA); }
  }

  function redPulse(f, T, k) {
    const v = (Math.sin(T * Math.PI * 2) * 0.5 + 0.5) * k;
    if (v > 0.55) flash(f, LUT.red);
  }

  function steelDoor(b, P, x, y, w, h) {
    S.part(b, P.rect(x - 4, y - 4, w + 8, h + 4), C.stone, { b: 1 });
    S.part(b, P.rect(x, y, w, h), C.stone, { b: 2 });
    for (let yy = y + 4; yy < y + h; yy += 10) for (let xx = x + 3; xx < x + w; xx += 10) b.set(xx, yy, C.stone[4]);
    P.rect(x, y + h * 0.45, w, 8).each((px, py) => b.set(px, py, Math.floor((px + py) / 5) % 2 ? C.yellow[3] : C.night[1]));
    S.part(b, P.rect(x + 3, y + h * 0.62, 6, 12), C.grey, { b: 4 });
  }

  function couchArt(P, x, y, w) {
    const back = P.path(`M ${x + 6} ${y + 40} L ${x + 6} ${y + 6} Q ${x + w / 2} ${y - 6} ${x + w - 6} ${y + 6} L ${x + w - 6} ${y + 40} Z`);
    stripesIn(P, back, x);
    P.part(P.rect(x + 8, y + 38, w - 16, 12), C.red, { b: 3, sh: 0, hi: 1 });
    stripesIn(P, P.rect(x + 6, y + 48, w - 12, 22), x);
    for (const [ax, d] of [[x, 1], [x + w, -1]]) {
      const arm = P.path(`M ${ax} ${y + 70} L ${ax} ${y + 30} Q ${ax + d * 2} ${y + 20} ${ax + d * 12} ${y + 22} Q ${ax + d * 18} ${y + 26} ${ax + d * 16} ${y + 36} L ${ax + d * 16} ${y + 70} Z`);
      stripesIn(P, arm, ax);
    }
    for (const sx of [x + 30, x + w - 30]) A.starShape(P, sx, y + 30, 9, 4, C.gold, 3);
    P.part(P.rect(x + 8, y + 70, 4, 6), C.wood, { b: 1 });
    P.part(P.rect(x + w - 12, y + 70, 4, 6), C.wood, { b: 1 });
  }

  function stripesIn(P, m, x0) {
    const b = P.b;
    m.each((x, y) => {
      const edge = !m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y - 1) || !m.has(x, y + 1);
      b.set(x, y, edge ? C.black : (Math.floor((x - x0 + 400) / 4) % 2 ? C.red[3] : C.grey[5]));
    });
  }

  function globeArt(f, P, cx, cy, r, T) {
    P.part(P.ell(cx, cy, r, r), C.sky, { b: 2 });
    P.part(P.path(`M ${cx - r * 0.7} ${cy - r * 0.4} Q ${cx - r * 0.2} ${cy - r * 0.75} ${cx + r * 0.5} ${cy - r * 0.45} Q ${cx + r * 0.75} ${cy} ${cx + r * 0.35} ${cy + r * 0.25} Q ${cx - r * 0.1} ${cy + r * 0.05} ${cx - r * 0.35} ${cy + r * 0.2} Q ${cx - r * 0.8} ${cy} ${cx - r * 0.7} ${cy - r * 0.4} Z`), C.red, { b: 3 });
    P.part(P.path(`M ${cx - r * 0.2} ${cy + r * 0.45} Q ${cx + r * 0.2} ${cy + r * 0.35} ${cx + r * 0.3} ${cy + r * 0.7} Q ${cx} ${cy + r * 0.85} ${cx - r * 0.25} ${cy + r * 0.7} Z`), C.green, { b: 3, sh: 0 });
    S.bigText(f, 'США', P.X(cx + r * 0.05), Math.round(P.Y(cy - r * 0.2)), Math.max(1, Math.round(r / 22)), C.grey[5], C.eye, 1);
    for (const [dx, dy, k] of [[-0.5, -0.25, 0.14], [0.55, -0.1, 0.12]]) A.starShape(P, cx + r * dx, cy + r * dy, r * k, r * k * 0.45, C.grey, 5);
    P.curve(`M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.3} ${cx + r} ${cy}`, C.sky[0]);
  }

  function monkey(P, x, y, T) {
    const clap = Math.floor(T * 4) % 2 === 0;
    P.part(P.ell(x, y - 8, 6, 7), C.fur, { b: 2 });
    P.part(P.ell(x, y - 7, 3.5, 4.5), C.sand, { b: 3, sh: 0 });
    P.part(P.ell(x, y - 19, 5.5, 5), C.fur, { b: 3 });
    P.part(P.ell(x, y - 18, 3.6, 3), C.sand, { b: 3, sh: 0 });
    P.px(x - 1.5, y - 20, C.pupil); P.px(x + 1.5, y - 20, C.pupil);
    P.line(x - 2, y - 16.5, x + 2, y - 16.5, C.black);
    P.part(P.rect(x - 3, y - 27, 6, 4), C.red, { b: 3, sh: 0 });
    P.line(x, y - 27, x + 3, y - 29, C.black);
    const d = clap ? 3 : 9;
    P.part(P.ell(x - d, y - 11, 1.4, 4.4), C.gold, { b: 4, sh: 0 });
    P.part(P.ell(x + d, y - 11, 1.4, 4.4), C.gold, { b: 4, sh: 0 });
    P.part(P.cap(x - 5, y - 10, x - d + 1, y - 11, 1.6), C.fur, { b: 2, sh: 0 });
    P.part(P.cap(x + 5, y - 10, x + d - 1, y - 11, 1.6), C.fur, { b: 2, sh: 0 });
  }

  function topAgent(f, x, y, ang, s, T, o) {
    o = o || {};
    const c = Math.cos(ang), sn = Math.sin(ang);
    const R = (u, v) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s];
    const P = new Pen(f);
    const flap = Math.sin(T * Math.PI * 4 + (o.ph || 0)) * 0.5 + 0.5;
    const G = C.grey, K = C.pale;
    for (const side of [-1, 1]) {
      const hip = R(side * 4, 10), foot = R(side * (8 + flap * 6), 28);
      P.part(P.cap(hip[0], hip[1], foot[0], foot[1], 3 * s, 2.6 * s), G, { b: 1, sh: 1 });
      const sh = R(side * 8, -6), hand = R(side * (24 - flap * 4), -6 - flap * 12);
      P.part(P.cap(sh[0], sh[1], hand[0], hand[1], 2.6 * s, 2.2 * s), G, { b: 1, sh: 1 });
      P.part(P.ell(hand[0], hand[1], 2.4 * s, 2.4 * s), K, { b: 3, sh: 0 });
    }
    const t = [R(-9, -10), R(9, -10), R(7, 12), R(-7, 12)];
    P.part(P.poly([t[0][0], t[0][1], t[1][0], t[1][1], t[2][0], t[2][1], t[3][0], t[3][1]]), G, { b: 1 });
    const v1 = R(-3, -10), v2 = R(3, -10), v3 = R(0, 0);
    P.part(P.poly([v1[0], v1[1], v2[0], v2[1], v3[0], v3[1]]), G, { b: 5, sh: 0, hi: 0 });
    const t1 = R(0, -9), t2 = R(0, -1);
    P.line(t1[0], t1[1], t2[0], t2[1], C.red[3]);
    const hd = R(0, -17), hair = R(0, -21);
    P.part(P.ell(hd[0], hd[1], 6 * s, 6 * s), K, { b: 3 });
    P.part(P.ell(hair[0], hair[1], 5 * s, 3.2 * s, ang), C.wood, { b: 1, sh: 0 });
    const g1 = R(-3, -17), g2 = R(3, -17);
    P.line(g1[0], g1[1], g2[0], g2[1], C.black);
    if (o.prop === 'gas') { const pp = R(28, -16); P.part(P.rect(pp[0] - 4 * s, pp[1] - 5 * s, 8 * s, 10 * s), C.red, { b: 3 }); font.drawCentered(f, 'ГАЗ', pp[0], pp[1] - 3, C.yellow[4], C.black); }
    if (o.prop === 'cash') { const pp = R(-28, -16); P.part(P.ell(pp[0], pp[1], 6 * s, 6 * s), C.sand, { b: 3 }); font.drawCentered(f, '$', pp[0], pp[1] - 3, C.green[2], 0); }
  }

  function blockText(f, text, cx, y, s, depth, lit) {
    const w = font.measure(text) * s;
    const m = new S.Mask(0, 0, W, H);
    let x = Math.round(cx - w / 2);
    for (const ch of text) {
      const g = font.glyph(ch);
      for (let i = 0; i < g.bits.length; i += 2) for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) m.put(x + g.bits[i] * s + dx, y + g.bits[i + 1] * s + dy, 1);
      x += (g.w + 1) * s;
    }
    for (let k = depth; k > 0; k--) m.each((px, py) => f.set(px + k, py + k, k === depth ? C.black : C.red[1]));
    const face = lit ? [C.red[2], C.red[3], C.neonA, C.neonA, C.pink[4]] : C.red;
    S.part(f, m, face, { b: 3, sh: 1, hi: 1, lx: -1, ly: -1 });
  }

  function spotMask(cx, cy, rx, ry) { return S.ellipseMask(cx, cy, rx, ry, 0); }

  function starMask(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr); }
    return S.ringsMask([pts]);
  }

  const SET = {
    sign: () => cached('ws_sign', W, H, (P, b) => {
      wallPaint(b, P, 0, W, 0, 210);
      S.part(b, P.rect(0, 0, W, 16), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let x = 0; x < W; x += 12) S.part(b, P.rect(x, 16, 8, 5), C.cream, { b: 3, sh: 0 });
      steelDoor(b, P, 70, 138, 180, 80);
    }),
    desk: () => cached('ws_desk', 400, H, (P, b) => {
      wallPaint(b, P, 0, 400, 0, 130);
      bookcase(b, P, 316, 30, 74, 98);
      windowPaint(b, P, 112, 22, 96, 92);
      drape(b, P, 92, 1, 12, 130);
      drape(b, P, 228, -1, 12, 130);
      S.part(b, P.rect(84, 8, 152, 8), C.gold, { b: 2 });
      flagPole(b, P, 56, 26, 130, false);
      flagPole(b, P, 262, 26, 130, true);
      rug(b, P, 128, H);
      BG.pool(b, 160, 70, 60, 50, 0.6);
    }),
    deskFront: () => cached('ws_deskfront', W, H, (P, b) => {
      P.part(P.poly([66, 124, 254, 124, 262, 136, 58, 136]), C.wood, { b: 3 });
      P.part(P.rect(58, 136, 204, 70), C.wood, { b: 2 });
      for (const x of [64, 128, 196]) P.part(P.rect(x, 144, 56, 52), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.ell(160, 166, 15, 14), C.wood, { b: 3, sh: 1, hi: 1 });
      P.part(P.path('M 160 158 Q 148 155 143 162 Q 152 162 156 167 L 164 167 Q 168 162 177 162 Q 172 155 160 158 Z'), C.gold, { b: 3, sh: 0 });
      P.part(P.rect(214, 114, 22, 10), C.night, { b: 2 });
      P.part(P.cap(215, 113, 235, 113, 2.4), C.night, { b: 2 });
      P.px(225, 118, C.neonA);
      P.part(P.poly([132, 116, 168, 115, 170, 124, 134, 125]), C.green, { b: 1 });
      P.part(P.poly([135, 117, 166, 116, 167, 122, 136, 123]), C.green, { b: 2, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(92, 118, 18, 6), C.grey, { b: 5, sh: 0 });
    }),
    chair: () => cached('ws_chair', W, H, (P, b) => {
      P.part(P.path('M 126 128 L 122 46 Q 122 20 160 20 Q 198 20 198 46 L 194 128 Z'), C.red, { b: 2 });
      P.part(P.path('M 132 124 L 129 50 Q 129 28 160 28 Q 191 28 191 50 L 188 124 Z'), C.red, { b: 3, sh: 1, hi: 1 });
      for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) P.px(140 + k * 13, 40 + i * 16, C.red[1]);
    }),
    easel: () => cached('ws_easel', 60, 120, (P, b) => {
      P.line(12, 118, 26, 12, C.wood[1]);
      P.line(48, 118, 34, 12, C.wood[1]);
      B.calendarArt(new Pen(b).at(2, 14, 1), b, 26, 56, 60);
      P.part(P.rect(2, 74, 56, 4), C.wood, { b: 2, sh: 0 });
    }),
    shelf: () => cached('ws_shelf', 480, H, (P, b) => {
      wallPaint(b, P, 0, 480, 0, 196);
      rug(b, P, 196, H);
      S.part(b, P.rect(0, 0, 480, 16), C.cream, { b: 4, sh: 0, hi: 0 });
      signBoard(b, new Pen(b), 20, 26, 120, false, false);
      steelDoor(b, P, 30, 70, 100, 130);
      bookcase(b, P, 190, 30, 120, 150);
      tankPainting(b, P, 330, 40, 74, 54);
      S.part(b, P.rect(420, 120, 30, 6), C.wood, { b: 3 });
      B.tree(b, P, 435, 96, 18, 4);
      S.part(b, P.poly([424, 126, 446, 126, 442, 150, 428, 150]), C.brick, { b: 3 });
    }),
    shelfClose: () => cached('ws_shelfclose', W, H, (P, b) => {
      wallPaint(b, P, 0, W, 0, 230);
      bookcase(b, P, 10, 20, 190, 220);
      tankPainting(b, P, 224, 30, 90, 66);
    }),
    portrait: () => cached('ws_portrait', 380, H, (P, b) => {
      wallPaint(b, P, 0, 380, 0, 230);
      P.part(P.rect(84, 6, 152, 190), C.gold, { b: 3 });
      P.part(P.rect(92, 14, 136, 174), C.gold, { b: 1, sh: 0 });
      const pic = P.rect(96, 18, 128, 166);
      BG.vgrad(b, pic, [C.wood[0], C.wood[1], C.olive[1], C.wood[1]], 18, 184, 0.05, 0.9);
      BG.pool(b, 168, 80, 60, 70, 0.8);
      P.part(P.path('M 100 186 Q 104 140 160 134 Q 216 140 220 186 Z'), C.night, { b: 2 });
      P.part(P.path('M 132 140 Q 160 128 188 140 L 176 186 L 144 186 Z'), C.night, { b: 1, sh: 0 });
      for (let i = 0; i < 4; i++) P.part(P.ell(160, 140 + i * 9, 13 - i * 1.5, 6), WHITE, { b: 2, sh: 1 });
      P.part(P.ell(160, 98, 24, 31), C.skin, { b: 3 });
      P.part(P.path('M 136 84 Q 134 60 160 56 Q 186 60 184 84 Q 178 70 160 70 Q 142 70 136 84 Z'), C.grey, { b: 5 });
      for (const s of [-1, 1]) {
        P.part(P.ell(160 + s * 26, 92, 10, 7), C.grey, { b: 4 });
        P.part(P.ell(160 + s * 27, 105, 9, 6), C.grey, { b: 4 });
        P.part(P.ell(160 + s * 24, 78, 8, 6), C.grey, { b: 5 });
      }
      P.line(146, 85, 155, 84, C.grey[2]);
      P.line(165, 84, 174, 85, C.grey[2]);
      for (const ex of [151, 169]) { P.part(P.ell(ex, 92, 4.6, 3.2), C.eye, { sh: 0, hi: 0 }); P.px(ex, 92, C.pupil); P.px(ex, 93, C.pupil); }
      P.part(P.path('M 158 88 Q 156 100 154 106 Q 160 110 166 106 Q 163 100 162 88 Z'), C.skin, { b: 2, sh: 0, hi: 1 });
      P.part(P.ell(146, 104, 4, 3), C.rose, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(174, 104, 4, 3), C.rose, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.curve('M 150 116 Q 160 113 170 116', C.skin[0]);
      P.line(152, 118, 168, 118, C.skin[1]);
      P.px(160, 124, C.skin[1]);
    }),
    couch: () => cached('ws_couch', W, H, (P, b) => {
      wallPaint(b, P, 0, W, 0, 130);
      windowPaint(b, P, 236, 26, 60, 80);
      P.part(P.rect(30, 30, 46, 58), C.gold, { b: 3 });
      BG.vgrad(b, P.rect(34, 34, 38, 50), C.sky, 34, 84, 0.2, 0.7);
      rug(b, P, 128, H);
    }),
    couchFront: () => cached('ws_couchfront', W, H, P => couchArt(P, 58, 104, 204)),
    fire: () => cached('ws_fire', 440, H, (P, b) => {
      wallPaint(b, P, 0, 440, 0, 186);
      windowPaint(b, P, 330, 30, 64, 96);
      P.part(P.rect(184, 18, 78, 44), C.gold, { b: 3 });
      BG.vgrad(b, P.rect(188, 22, 70, 36), C.teal, 22, 58, 0.1, 0.6);
      P.part(P.rect(150, 70, 146, 10), C.cream, { b: 4 });
      P.part(P.rect(158, 80, 130, 106), C.cream, { b: 3 });
      P.part(P.rect(160, 76, 126, 4), C.cream, { b: 4, sh: 0 });
      P.part(P.path('M 186 186 L 186 122 Q 186 100 223 100 Q 260 100 260 122 L 260 186 Z'), C.night, { b: 0, sh: 0 });
      P.part(P.rect(180, 178, 86, 8), C.stone, { b: 2 });
      P.part(P.rect(268, 60, 10, 10), C.sky, { b: 2 });
      rug(b, P, 186, H);
    }),
    seal: () => cached('ws_seal', W, H, (P, b) => {
      S.grad(b, FULL, C.blue, (x, y) => 0.32 + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.06);
      P.part(P.ell(160, 100, 96, 96), C.gold, { b: 2 });
      P.part(P.ell(160, 100, 84, 84), C.blue, { b: 2, sh: 0, hi: 0, ol: C.gold[1] });
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; A.starShape(P, 160 + Math.cos(a) * 90, 100 + Math.sin(a) * 90, 3, 1.3, C.grey, 5); }
      P.part(P.path('M 160 78 Q 120 64 96 84 Q 124 86 140 100 L 146 122 L 174 122 L 180 100 Q 196 86 224 84 Q 200 64 160 78 Z'), C.gold, { b: 3, sh: 0 });
      P.part(P.ell(160, 74, 7, 7), C.grey, { b: 5, sh: 0 });
      P.part(P.poly([150, 100, 170, 100, 168, 118, 160, 124, 152, 118]), C.red, { b: 3, sh: 0 });
      for (let i = 0; i < 4; i++) P.line(153 + i * 4, 101, 153 + i * 4, 117, C.grey[5]);
    }),
    eagle: () => cached('ws_eagle', W, H, (P, b) => {
      wallPaint(b, P, 0, W, 0, 230);
      drape(b, P, 0, 1, 0, 200);
      P.part(P.rect(96, 150, 96, 60), C.stone, { b: 3 });
      P.part(P.rect(86, 142, 116, 12), C.stone, { b: 4, sh: 0 });
      P.part(P.ell(144, 112, 18, 28), C.gold, { b: 2 });
      P.part(P.path('M 130 106 Q 96 92 82 46 Q 104 66 128 80 Z'), C.gold, { b: 3 });
      P.part(P.path('M 158 106 Q 192 92 206 46 Q 184 66 160 80 Z'), C.gold, { b: 3 });
      P.part(P.ell(144, 74, 10, 10), C.grey, { b: 5 });
      P.part(P.poly([150, 74, 160, 77, 150, 80]), C.gold, { b: 4, sh: 0, hi: 0 });
      P.px(146, 72, C.pupil);
      P.part(P.poly([120, 132, 138, 130, 138, 136, 130, 139, 130, 144, 120, 144]), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(150, 130, 20, 12), C.green, { b: 3, sh: 0 });
      for (let i = 0; i < 6; i++) P.px(153 + i * 3, 134 + (i % 2) * 3, C.green[1]);
    }),
    stage: () => cached('ws_stage', W, H, (P, b) => {
      S.grad(b, FULL, [C.black, C.night[0], C.night[1]], (x, y) => y / H);
      P.part(P.poly([0, 170, W, 170, W, H, 0, H]), C.asphalt, { b: 1, sh: 0, hi: 0, ol: 0 });
      for (let x = -200; x < 520; x += 40) S.line(b, 160 + (x - 160) * 0.4, 170, x, H, C.asphalt[0]);
    }),
    poster: () => cached('ws_poster', W, H, (P, b) => {
      S.grad(b, FULL, [C.black, C.night[0], C.night[1]], (x, y) => y / H);
      P.part(P.rect(84, 6, 152, 176), C.cream, { b: 4 });
      P.part(P.rect(90, 12, 140, 164), C.cream, { b: 3, sh: 0, hi: 0, ol: C.red[2] });
    }),
    army: () => cached('ws_army', W, H, (P, b) => {
      S.grad(b, FULL, [C.black, C.night[0], C.night[1]], (x, y) => y / H);
      const card = P.rect(30, 6, 260, 146);
      P.part(card, C.olive, { b: 2 });
      card.each((x, y) => { const v = S.hash(x >> 3, y >> 3, 11); if (v < 0.3) b.set(x, y, C.olive[1]); else if (v > 0.75) b.set(x, y, C.green[2]); });
      S.outline(b, card, C.black);
      const tank = (cx, gy) => {
        P.part(P.poly([cx - 44, gy, cx + 44, gy, cx + 34, gy + 14, cx - 34, gy + 14]), C.night, { b: 1, sh: 0 });
        P.part(P.poly([cx - 36, gy - 14, cx + 36, gy - 14, cx + 44, gy, cx - 44, gy]), C.night, { b: 2, sh: 0 });
        P.part(P.ell(cx - 4, gy - 20, 18, 8), C.night, { b: 2, sh: 0 });
        P.part(P.cap(cx + 10, gy - 22, cx + 52, gy - 30, 3), C.night, { b: 2, sh: 0 });
      };
      tank(160, 62);
      S.bigText(b, 'ОТДАЙ ВСЁ,', 160, 12, 2, C.grey[5], C.eye, 1);
      S.bigText(b, 'ЧТО ЕСТЬ!', 160, 82, 4, C.yellow[3], C.yellow[4], 1);
      P.part(P.poly([0, 170, W, 170, W, H, 0, H]), C.asphalt, { b: 1, sh: 0, hi: 0, ol: 0 });
    }),
    flag: () => cached('ws_flag', W, H, (P, b) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const wave = Math.sin(x / 34 + y / 60) * 6;
        const yy = y + wave;
        const canton = x < 130 && yy < 92;
        let c;
        if (canton) {
          c = C.blue[2];
          const gx = (x + 1000) % 26, gy = Math.floor(yy + 1000) % 22;
          if (gx > 9 && gx < 15 && gy > 6 && gy < 12 && Math.abs(gx - 12) + Math.abs(gy - 9) < 4) c = C.grey[5];
        } else c = Math.floor((yy + 600) / 15.4) % 2 ? C.grey[5] : C.red[3];
        const shadeK = Math.cos(x / 34 + y / 60);
        if (shadeK < -0.5) c = S.DARKER[c];
        b.set(x, y, c);
      }
    }),
    pool: () => cached('ws_pool', W, H, (P, b) => {
      S.grad(b, FULL, [C.night[0], C.night[1], C.navy[1]], (x, y) => y / H);
      for (let i = 0; i < 40; i++) b.set(Math.floor(S.hash(i, 7, 1) * W), Math.floor(S.hash(i, 7, 2) * 100), C.grey[4]);
      P.rect(0, 128, W, 12).each((x, y) => b.set(x, y, (Math.floor(x / 8) + Math.floor(y / 6)) % 2 ? C.grey[5] : C.sky[3]));
      S.line(b, 0, 127, W, 127, C.black);
      BG.vgrad(b, P.rect(0, 140, W, 60), C.teal, 140, H, 0.4, 0.95);
    }),
    poolTop: () => cached('ws_pooltop', W, H, (P, b) => {
      S.fill(b, FULL, C.grey[3]);
      FULL.each((x, y) => { if ((x % 12 === 0) || (y % 12 === 0)) b.set(x, y, C.grey[2]); });
      const oct = [];
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * TAU / 8; oct.push(160 + Math.cos(a) * 150, 100 + Math.sin(a) * 104); }
      P.part(P.poly(oct), C.sky, { b: 4, sh: 0, hi: 0 });
      const inner = [];
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * TAU / 8; inner.push(160 + Math.cos(a) * 138, 100 + Math.sin(a) * 94); }
      const water = P.poly(inner);
      S.grad(b, water, C.teal, (x, y) => 0.55 + Math.sin(x / 9 + y / 13) * 0.08 + (y - 100) / 500);
      S.outline(b, water, C.navy[1]);
    }),
    star: () => cached('ws_star', W, H, (P, b) => {
      S.grad(b, FULL, C.navy, (x, y) => 0.3 + y / H * 0.4);
      BG.pool(b, 160, 100, 120, 96, 1.6);
      A.starShape(P, 160, 104, 78, 32, WHITE, 3);
    }),
    exit: () => cached('ws_exit', W, H, (P, b) => {
      wallPaint(b, P, 0, W, 0, 186);
      P.part(P.rect(96, 26, 128, 164), WHITE, { b: 1 });
      P.part(P.rect(102, 32, 116, 158), C.night, { b: 0, sh: 0 });
      rug(b, P, 186, H);
      flagPole(b, P, 40, 30, 186, true);
    })
  };

  function exitDoor(f, P, open) {
    const x0 = 102, w = 116 * Math.cos(open * Math.PI * 0.45);
    const panel = P.poly([x0, 32, x0 + w, 32 - open * 10, x0 + w, 190 + open * 6, x0, 190]);
    P.part(panel, WHITE, { b: 2 });
    if (w > 30) {
      P.part(P.rect(x0 + 8, 44, w - 16, 60), WHITE, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(x0 + 8, 116, w - 16, 64), WHITE, { b: 2, sh: 1, hi: 1 });
      P.part(P.ell(x0 + w - 10, 118, 2.6, 2.6), C.gold, { b: 3, sh: 0 });
    }
  }

  function bg(f, buf, x, y) { blit(f, buf, -(x || 0), -(y || 0)); }

  function fire(f, P, T) {
    for (let i = 0; i < 5; i++) {
      const fx = 200 + i * 12, k = 1 + Math.sin(T * 30 + i * 2) * 0.2;
      P.part(P.path(`M ${fx - 7} 178 Q ${fx - 6} ${178 - 22 * k} ${fx} ${178 - 34 * k} Q ${fx + 6} ${178 - 22 * k} ${fx + 7} 178 Z`), C.orange, { b: 3, sh: 0 });
      P.part(P.path(`M ${fx - 3} 178 Q ${fx - 2} ${178 - 12 * k} ${fx} ${178 - 18 * k} Q ${fx + 2} ${178 - 12 * k} ${fx + 3} 178 Z`), A.LAMP, { sh: 0, hi: 0, ol: 0 });
    }
    S.part(f, P.rect(192, 176, 62, 6), C.wood, { b: 1 });
  }

  function deskShot(f, T, o) {
    o = o || {};
    bg(f, SET.desk());
    blit(f, SET.easel(), 266, 70);
    blit(f, SET.chair(), 0, 0);
    if (o.before) o.before(f);
    put(f, 'max', 160, 126, 1.9, { dir: 's', act: o.maxAct || '', talk: o.maxTalk ? 1 : 0, blink: Math.floor(T * 1.7) % 6 === 0 });
    if (o.behind) o.behind(f);
    blit(f, SET.deskFront(), 0, 0);
    if (o.sam) put(f, 'sam', 34, 199, 1.75, { dir: 's', talk: 0, blink: Math.floor(T * 1.3) % 5 === 0 });
    if (o.after) o.after(f);
  }

  function shotSign(f, u, T) {
    bg(f, SET.sign());
    const P = new Pen(f);
    const lit = Math.floor(T * 2) % 2 === 0;
    signBoard(f, P, 50, 40, 220, lit, true);
    beacon(f, P, 160, 38, 1.6, T);
    if (lit) flash(f, LUT.red);
  }

  function shotDeskRise(f, u, T) {
    const rise = S.clamp((u - 0.9) / 0.8, 0, 1);
    deskShot(f, T, { behind: f => agent(f, 236, 214 + (1 - rise) * 92, 1.45, u > 2.2 ? 'sing' : '', T, { talk: u > 2.1 && singing(T) ? 1 : 0 }) });
  }

  function shotSam(f, u, T) {
    bg(f, SET.desk(), 40, 0);
    put(f, 'sam', 140, 238, 3.2, { dir: 'e', blink: Math.floor(T * 1.2) % 5 === 0 });
  }

  function shotMax(f, u, T) {
    bg(f, SET.desk());
    const P = new Pen(f);
    P.part(P.path('M 80 210 L 70 40 Q 70 -10 160 -10 Q 250 -10 250 40 L 240 210 Z'), C.red, { b: 3, sh: 1, hi: 1 });
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) P.px(110 + k * 33, 30 + i * 40, C.red[1]);
    put(f, 'max', 160, 206, 3.4, { dir: 's', act: 'grin', blink: Math.floor(T * 2) % 7 === 0 });
  }

  function doorLow(f, T, cam) {
    const P = new Pen(f);
    S.grad(f, FULL, C.cream, (x, y) => 0.55 + y / 600);
    P.part(P.poly([0, 0, W, 0, W, 22, 0, 30]), C.cream, { b: 4, sh: 0, hi: 0 });
    steelDoor(f, P, 100 - cam, 60, 120, 160);
    signBoard(f, P, 84 - cam, 18, 152, true, false);
    beacon(f, P, 160 - cam, 16, 1.2, T);
    const a = T * 3.1;
    for (const d of [0, Math.PI]) {
      const ex = 160 - cam + Math.cos(a + d) * 260;
      const beam = P.poly([157 - cam, 10, 163 - cam, 10, ex + 46, H, ex - 46, H]);
      S.light(f, beam, 1);
      wash(f, LUT.red, beam);
    }
  }

  function shotDoorSing(f, u, T) {
    const cam = (u - 3.8) * 3;
    doorLow(f, T, cam);
    const act = u > 2.5 && u < 5.5 ? 'point' : 'sing';
    agent(f, 160 - cam * 1.5, 216, 1.6, act, T);
  }

  function shotTwo(f, u, T, grin) {
    deskShot(f, T, { sam: true, maxAct: grin ? 'grin' : '', maxTalk: false });
  }

  function shotShelfPan(f, u, T) {
    const cam = u < 1.6 ? 160 : Math.max(0, 160 - (u - 1.6) * 90);
    bg(f, SET.shelf(), cam);
    agent(f, 330 - cam, 198, 1.3, u > 1.2 ? 'point' : 'sing', T, { dir: u > 1.2 ? 'w' : 's' });
    if (cam < 40 && Math.floor(T * 2) % 2 === 0) wash(f, LUT.red, S.ellipseMask(80 - cam, 50, 110, 60, 0));
  }

  function shotSignLie(f, u, T) {
    const P = new Pen(f);
    S.grad(f, FULL, C.cream, (x, y) => 0.6 + y / 500);
    for (let i = 0; i < 7; i++) S.line(f, i * 60 - 20, 0, 160 + (i * 60 - 180) * 0.4, 60, C.cream[2]);
    P.part(P.poly([0, 150, W, 150, W, H, 0, H]), C.stone, { b: 2, sh: 0, hi: 0 });
    signBoard(f, P, 36, 96, 248, Math.floor(T * 2) % 2 === 0, true);
    put(f, 'superball', 150, 97, 1.5, { act: 'lie', talk: singing(T) ? 1 : 0, t: T });
    if (Math.floor(T * 2) % 2 === 0) wash(f, LUT.red, S.ellipseMask(160, 60, 220, 90, 0));
  }

  function shotClose(f, u, T) {
    bg(f, SET.shelfClose(), 0, 0);
    const war = T > 29.3;
    bust(f, 168, 128, 4.2, T, { wide: war && singing(T), talk: !war && singing(T) });
    if (war) redPulse(f, T * 2, 1);
  }

  function shotPortrait(f, u, T) {
    bg(f, SET.portrait());
    const P = new Pen(f);
    const look = Math.sin(u * 5) > 0 ? -3 : 3;
    for (const ex of [151, 169]) { P.part(P.ell(ex, 92, 4.6, 3.2), C.eye, { sh: 0, hi: 0 }); P.px(ex + look, 92, C.pupil); P.px(ex + look, 93, C.pupil); }
    redPulse(f, T * 2, 1.4);
  }

  function shotCouchStand(f, u, T) {
    bg(f, SET.couch());
    blit(f, SET.couchFront(), 0, 0);
    agent(f, 160, 148, 1.0, 'sing', T);
    const inL = S.clamp((u - 0.9) / 0.4, 0, 1), inR = S.clamp((u - 2.7) / 0.4, 0, 1);
    if (inL > 0) bust(f, -70 + inL * 128, 150, 3.0, T, { talk: singing(T) });
    if (inR > 0) bust(f, 390 - inR * 128, 150, 3.0, T, { talk: singing(T), flip: true });
  }

  function shotChest(f, u, T) {
    bg(f, SET.desk(), 0, 0);
    const P = new Pen(f);
    signBoard(f, P, 12, 6, 110, true, false);
    bust(f, 170, 120, 3.4, T, { chest: true });
  }

  function shotFire(f, u, T) {
    bg(f, SET.fire());
    const P = new Pen(f);
    fire(f, P, T);
    monkey(P, 248, 70, T);
    agent(f, 98, 198, 1.4, Math.floor(T * 2) % 4 === 3 ? 'point' : 'sing', T);
  }

  function shotSeal(f, u, T, solo) {
    bg(f, SET.seal());
    const rot = u * 0.35;
    if (solo) { topAgent(f, 160, 104, rot, 1.6, T, { prop: 'cash' }); return; }
    for (let i = 0; i < 4; i++) {
      const a = rot + i * TAU / 4;
      topAgent(f, 160 + Math.cos(a) * 52, 100 + Math.sin(a) * 52, a - Math.PI / 2, 1.15, T, { ph: i % 2 ? Math.PI : 0, prop: i === 0 ? 'gas' : i === 2 ? 'cash' : '' });
    }
  }

  function shotGlobeSam(f, u, T) {
    bg(f, SET.desk(), 60, 0);
    const P = new Pen(f);
    P.part(P.poly([150, 118, 330, 116, 330, 132, 140, 134]), C.wood, { b: 3 });
    P.part(P.rect(140, 134, 190, 70), C.wood, { b: 2 });
    put(f, 'superball', 196, 118, 0.95, { act: 'lie', t: T, talk: 0 });
    put(f, 'superball', 270, 117, 0.9, { act: 'lie', t: T, talk: 0, dir: 'w' });
    put(f, 'sam', 74, 199, 1.7, { dir: 'e', blink: Math.floor(T * 1.4) % 5 === 0 });
    globeArt(f, P, 252, 150, 62, T);
    if (u > 3.1) bust(f, 330 - S.clamp((u - 3.1) / 0.3, 0, 1) * 70, 150, 3.4, T, { talk: singing(T), flip: true });
  }

  function shotEagle(f, u, T) {
    bg(f, SET.eagle());
    bust(f, 262, 140, 3.0, T, { flip: true });
  }

  function shotWide(f, u, T) {
    const P = new Pen(f);
    S.grad(f, FULL, C.cream, (x, y) => 0.55 + y / 700);
    P.part(P.rect(0, 0, W, 10), C.cream, { b: 4, sh: 0, hi: 0 });
    steelDoor(f, P, 130, 64, 60, 106);
    signBoard(f, P, 106, 26, 108, true, false);
    beacon(f, P, 160, 24, 1, T);
    rug(f, P, 168, H);
    couchArt(new Pen(f).at(232, 120, 0.42), 0, 0, 204);
    agent(f, 160, 186, 1.05, u > 1 ? 'dance' : 'sing', T);
    agent(f, 96, 192, 0.95, 'squat', T);
    agent(f, 224, 192, 0.95, 'squat', T + 0.25);
    if (u > 2.6) spots(f, [starMask(160, 120, 92)], Math.min(3, (u - 2.6) * 2));
    else if (Math.floor(T * 2) % 2 === 0) wash(f, LUT.red, P.poly([0, 0, W, 0, W, 50, 0, 50]));
  }

  function shotDoorOpen(f, u, T) {
    const P = new Pen(f);
    S.grad(f, FULL, C.cream, (x, y) => 0.5 + y / 600);
    P.part(P.rect(70, 20, 180, 190), C.night, { b: 0, sh: 0, hi: 0 });
    const open = S.clamp(u / 1.0, 0, 1);
    const w = 180 * Math.cos(open * Math.PI * 0.48);
    P.part(P.poly([70, 20, 70 + w, 20 - open * 16, 70 + w, 210 + open * 10, 70, 210]), C.stone, { b: 2 });
    if (w > 40) {
      P.rect(70, 100, w, 10).each((x, y) => f.set(x, y, Math.floor((x + y) / 5) % 2 ? C.yellow[3] : C.night[1]));
      P.part(P.ell(70 + w - 16, 140, 4, 6), C.grey, { b: 4 });
    }
    wash(f, LUT.red);
  }

  function shotBlack(f) { f.px.fill(C.black); }

  function shotStage(f, u, T, mode) {
    bg(f, SET.stage());
    const lit = Math.floor(T * 2) % 2 === 0;
    if (mode === 1) blockText(f, 'ВОЙНА', 120, 10, 9, 6, lit);
    else blockText(f, 'ВОЙНА', 160, 24, 7, 5, lit);
    for (let i = 0; i < 3; i++) {
      const sx = 160 + Math.sin(T * 1.3 + i * 2.1) * 120;
      S.light(f, spotMask(sx, 80, 40, 34), 1.2);
    }
    if (mode === 1) { agent(f, 100, 210, 1.5, 'dance', T); agent(f, 250, 214, 1.6, 'dance', T + 0.5); }
    else if (mode === 2) for (let i = 0; i < 5; i++) agent(f, 40 + i * 62, 140 + i * 16, 0.7 + i * 0.13, 'dance', T + i * 0.25);
    else for (let i = 0; i < 4; i++) agent(f, 64 + i * 64, 192, 0.95, 'dance', T + (i % 2) * 0.5);
  }

  function shotPeepers(f, u, T) {
    bg(f, SET.poster());
    const P = new Pen(f);
    const feet = 166, s = 2.2, hy = feet - 38 * s;
    put(f, 'peepers', 160, feet, s, { dir: 's', v: 'gov', blink: false });
    const brim = hy - 17;
    P.part(P.rect(141, brim - 34, 38, 34), WHITE, { b: 2 });
    for (let i = 0; i < 3; i++) P.part(P.rect(141, brim - 30 + i * 9, 38, 4), C.red, { b: 3, sh: 0, hi: 0 });
    P.part(P.rect(141, brim - 8, 38, 7), C.blue, { b: 2, sh: 0 });
    A.starShape(P, 160, brim - 4.5, 3.4, 1.5, C.grey, 5);
    P.part(P.ell(160, brim, 30, 4.4), C.blue, { b: 2 });
    P.part(P.cap(178, 112, 190, 96, 6, 5), C.red, { b: 3 });
    P.part(P.ell(190, 92, 9, 9), C.skin, { b: 3 });
    P.part(P.ell(188, 90, 4, 4), C.skin, { b: 4, sh: 0 });
    P.part(P.rect(90, 128, 140, 48), C.cream, { b: 3, sh: 0, hi: 0, ol: 0 });
    S.bigText(f, 'Я ТЕБЯ ВИЖУ', 160, 134, 2, C.red[3], C.red[4], 1);
    font.drawCentered(f, 'ГОЛОСУЙ ЗА ПИПЕРСА', 160, 160, C.navy[2], 0);
    S.light(f, spotMask(160, 96, 110, 100), 0.6);
    agent(f, 54, 196, 1.15, 'up', T);
    agent(f, 270, 196, 1.15, 'up', T);
  }

  function shotDome(f, u, T) {
    bg(f, SET.stage());
    const P = new Pen(f);
    const dome = P.path('M 30 170 Q 30 40 160 40 Q 290 40 290 170 Z');
    P.part(dome, C.sky, { b: 2 });
    P.part(P.path('M 70 120 Q 80 60 160 54 Q 230 58 250 104 Q 200 124 160 112 Q 110 110 70 120 Z'), C.red, { b: 3 });
    S.bigText(f, 'США', 160, 74, 3, C.grey[5], C.eye, 1);
    A.starShape(P, 96, 92, 8, 3.5, C.grey, 5);
    A.starShape(P, 224, 84, 7, 3, C.grey, 5);
    P.part(P.rect(20, 166, 280, 8), C.red, { b: 2 });
    for (let i = 0; i < 5; i++) agent(f, 50 + i * 55, 198, 0.9, 'kick', T + (i % 2) * 0.25);
  }

  function shotPoolSide(f, u, T) {
    bg(f, SET.pool());
    for (let i = 0; i < 9; i++) { const x = (i * 41 + T * 30) % W; S.line(f, x, 150 + (i % 3) * 14, x + 18, 150 + (i % 3) * 14, C.teal[4]); }
    for (let i = 0; i < 5; i++) {
      const x = ((u * 38 + i * 70) % 380) - 30;
      put(f, 'superball', x, 128, 0.85, { dir: 'e', walk: (u * 1.8 + i * 0.3) % 1, t: T });
    }
    put(f, 'superball', 210 + u * 6, 230, 1.9, { dir: 'e', walk: (u * 1.4) % 1, t: T });
  }

  function shotPoolTop(f, u, T) {
    bg(f, SET.poolTop());
    const P = new Pen(f);
    const rot = u * 0.5;
    P.part(P.ell(160, 100, 13, 10), C.suit, { b: 3 });
    P.part(P.ell(160, 99, 8, 6), C.suit, { b: 2 });
    P.part(P.ell(160, 99, 8.5, 6.5), C.navy, { b: 2, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(160, 99, 6.5, 4.6), C.suit, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 5; i++) {
      const a = rot + i * TAU / 5;
      topAgent(f, 160 + Math.cos(a) * 60, 100 + Math.sin(a) * 44, a - Math.PI / 2, 1.0, T, { ph: i });
    }
    if (u > 2.6) { const k = S.clamp((u - 2.6) / 0.6, 0, 1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.part(P.ell(86 + Math.cos(a) * k * 18, 60 + Math.sin(a) * k * 12, 3, 3), WHITE, { b: 2, sh: 0 }); } }
  }

  function shotPoolRise(f, u, T) {
    const P = new Pen(f);
    S.grad(f, FULL, C.night, (x, y) => y / H);
    BG.vgrad(f, P.rect(0, 120, W, 80), C.teal, 120, H, 0.4, 0.9);
    const k = S.clamp(u / 1.4, 0, 1);
    P.part(P.rect(118, 186 - k * 20, 84, k * 20 + 2), C.sky, { b: 2 });
    P.part(P.ell(160, 186 - k * 20, 42, 8), C.sky, { b: 3 });
    agent(f, 160, 186 - k * 20, 1.15, 'up', T);
    S.light(f, P.poly([150, 0, 170, 0, 220, 200, 100, 200]), 1);
    for (let i = 0; i < 3; i++) { const r = 40 + ((u * 40 + i * 20) % 60); S.line(f, 160 - r, 160 + i * 6, 160 + r, 160 + i * 6, C.teal[4]); }
  }

  function shotArmy(f, u, T) {
    bg(f, SET.army());
    for (let i = 0; i < 4; i++) agent(f, 64 + i * 64, 198, 0.8, 'dance', T + (i % 2) * 0.5);
    S.light(f, spotMask(160 + Math.sin(T * 2) * 80, 120, 70, 60), 0.8);
  }

  function shotStar(f, u, T) {
    bg(f, SET.star());
    if (u > 1.3) {
      const k = S.clamp((u - 1.3) / 0.7, 0, 1);
      agent(f, 160, 230 - k * 60, 0.8 + k * 0.9, 'up', T);
      A.starShape(new Pen(f), 160, 104, 78 * (1 - k * 0.3), 32 * (1 - k * 0.3), WHITE, 3);
      if (k > 0.5) agent(f, 160, 230 - k * 60, 0.8 + k * 0.9, 'up', T);
    }
  }

  function shotStarField(f, u, T) {
    S.grad(f, FULL, C.navy, (x, y) => 0.25 + y / H * 0.3);
    const P = new Pen(f);
    for (let i = 0; i < 24; i++) {
      const a = S.hash(i, 3, 1) * TAU, d = ((S.hash(i, 3, 2) + u * 0.9) % 1);
      const r = d * d * 220;
      A.starShape(P, 160 + Math.cos(a) * r * 1.4, 100 + Math.sin(a) * r, 2 + d * 18, 1 + d * 8, WHITE, 3);
    }
  }

  function shotFlag(f, u, T, mode) {
    bg(f, SET.flag());
    if (mode === 0) for (let i = 0; i < 5; i++) agent(f, 50 + i * 56, 150 + i * 12, 0.8 + i * 0.1, 'dance', T + i * 0.25);
    else if (mode === 1) bust(f, 170, 128, 4.0, T, { cup: true, talk: true });
    else if (mode === 2) for (let i = 0; i < 5; i++) agent(f, 40 + i * 60, 196, 1.0, 'up', T + i * 0.25);
    else for (let i = 0; i < 3; i++) agent(f, 60 + i * 110, 300, 2.0, 'kick', T + (i % 2) * 0.25);
    S.shade(f, FULL, 0, (x, y) => Math.max(0, (Math.abs(x - 160) / 160) * 1.4 - 0.4));
  }

  function shotDoorway(f, u, T) {
    const small = cached('ws_desk_small', W, H, (P, b) => {
      const tmp = new S.Buf(W, H);
      deskShot(tmp, 0, { sam: true, maxAct: 'grin' });
      const sc = S.scaleBuf(tmp, 0.4);
      b.px.fill(C.night[0]);
      blit(b, sc, 160 - sc.w / 2, 64);
      wash(b, LUT.red, P.rect(100, 40, 120, 160));
      S.fill(b, P.rect(0, 0, W, H).minus(P.rect(100, 40, 120, 160)), C.night[0]);
      S.part(b, P.rect(94, 34, 132, 6), C.wood, { b: 1 });
      S.part(b, P.rect(94, 40, 6, 160), C.wood, { b: 1 });
      S.part(b, P.rect(220, 40, 6, 160), C.wood, { b: 1 });
    });
    blit(f, small, 0, 0);
  }

  function shotFaceSide(f, u, T) {
    bg(f, SET.couch());
    blit(f, SET.couchFront(), -20, -40);
    const tmp = new S.Buf(150, 170);
    const P = new Pen(tmp).at(75, 92, 3.4);
    A.suit(P, C.grey, 1, 13, 40, 15);
    A.superballHead(P, 0, 0, { talk: singing(T) });
    blit(f, rotBuf(tmp), 92, 64);
    wash(f, LUT.red);
  }

  function shotCouchLie(f, u, T) {
    bg(f, SET.couch());
    const lights = [LUT.blue, LUT.red, LUT.pink, LUT.gold];
    for (let i = 0; i < 4; i++) agent(f, 90 + i * 46, 160, 1.0, i % 2 ? 'sing' : 'block', T);
    blit(f, SET.couchFront(), 0, 0);
    put(f, 'superball', 140, 156, 1.2, { act: 'lie', talk: singing(T) ? 1 : 0, t: T });
    wash(f, lights[Math.floor(T * 2) % 4]);
  }

  function shotMaxCrowd(f, u, T) {
    deskShot(f, T, {
      maxAct: 'grin',
      before: f => { for (let i = 0; i < 4; i++) agent(f, 76 + i * 56 + (i > 1 ? 56 : 0), 210, 1.25, i % 2 ? 'block' : 'sing', T); }
    });
    if (u > 3.9) {
      const k = S.clamp((u - 3.9) / 0.4, 0, 1);
      bust(f, 160, 260 - k * 90, 3.2, T);
    }
  }

  function shotMarch(f, u, T) {
    const cam = u * 26;
    const back = cached('ws_march', 640, H, (P, b) => {
      wallPaint(b, P, 0, 640, 0, 170);
      for (let x = 20; x < 640; x += 150) { bookcase(b, P, x, 24, 70, 130); tankPainting(b, P, x + 90, 40, 40, 30); }
      S.part(b, P.rect(0, 170, 640, 30), C.blue, { b: 1, sh: 0, hi: 0, ol: 0 });
    });
    blit(f, back, -cam, 0);
    for (let i = 0; i < 6; i++) put(f, 'superball', 360 - i * 52 - u * 34, 192, 1.0, { dir: 'w', walk: (u * 2 + i * 0.25) % 1, t: T, talk: singing(T) ? 1 : 0 });
    const masks = [0, 1, 2].map(i => spotMask(((i * 140 + T * 40) % 420) - 50, 140, 46, 60));
    spots(f, masks, 3);
    wash(f, LUT.pink, masks[0]);
    wash(f, LUT.blue, masks[1]);
  }

  function shotPortraitSpot(f, u, T) {
    bg(f, SET.portrait(), 60, 0);
    const P = new Pen(f);
    P.part(P.rect(236, 120, 20, 70), C.wood, { b: 2 });
    P.part(P.path('M 232 120 Q 232 92 246 92 Q 260 92 260 120 Z'), C.gold, { b: 3 });
    P.part(P.rect(242, 120, 8, 6), C.gold, { b: 2 });
    agent(f, 200, 214, 1.5, 'sing', T);
    spots(f, [spotMask(176, 110, 104, 112)], 2.5);
  }

  function shotMonkey(f, u, T) {
    bg(f, SET.fire(), 120, 0);
    monkey(new Pen(f).at(80, 120, 2.6), 0, 0, T);
    bust(f, 220, 140, 2.8, T, { flip: true });
  }

  function shotRedTrio(f, u, T) {
    const P = new Pen(f);
    S.grad(f, FULL, C.red, (x, y) => 0.9 - y / 300);
    P.part(P.ell(160, -20, 220, 70), C.red, { b: 4, sh: 0, hi: 0, ol: 0 });
    for (let i = 0; i < 3; i++) agent(f, 70 + i * 90, 250, 1.7, 'sing', T + i * 0.1);
  }

  function shotExit(f, u, T) {
    bg(f, SET.exit());
    const P = new Pen(f);
    let open = S.clamp(u / 0.5, 0, 1);
    if (u > 2.9) open = S.clamp(1 - (u - 2.9) / 0.5, 0, 1);
    if (u > 3.7) open = S.clamp((u - 3.7) / 0.3, 0, 0.6);
    if (u > 4.9) open = S.clamp(0.6 - (u - 4.9) / 0.3, 0, 0.6);
    for (let i = 0; i < 4; i++) {
      const x = 300 - u * 70 + i * 46;
      if (x < 90 || x > 340) continue;
      const o = { dir: 'w', act: x < 230 ? 'wave' : '', walk: x < 230 ? -1 : (u * 2 + i * 0.3) % 1, t: T };
      if (x < 226) clipPut(f, 'superball', x, 190, 1.0, o, 102, 218); else put(f, 'superball', x, 190, 1.0, o);
    }
    if (u > 3.8 && u < 5.2) clipPut(f, 'superball', 198, 190, 1.0, { dir: 's', act: 'thumb', t: T }, 177, 218);
    exitDoor(f, P, open);
  }

  function clipPut(f, id, x, y, s, o, x0, x1) {
    const sp = S.sprite(id, o, s);
    if (!sp) return;
    const dx = Math.round(x - sp.ox), dy = Math.round(y - sp.oy), b = sp.buf;
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) {
      const c = b.px[yy * b.w + xx], tx = dx + xx;
      if (c && tx >= x0 && tx < x1) f.set(tx, dy + yy, c);
    }
  }

  const SHOTS = [
    [0, shotSign],
    [2.9, shotDeskRise],
    [7.32, shotSam],
    [8.95, shotMax],
    [10.4, shotDoorSing],
    [17.98, (f, u, T) => shotTwo(f, u, T, true)],
    [20.0, shotShelfPan],
    [24.0, shotSignLie],
    [27.68, shotClose],
    [35.42, shotPortrait],
    [37.62, (f, u, T) => shotTwo(f, u, T, true)],
    [39.25, shotCouchStand],
    [43.9, shotChest],
    [44.9, (f, u, T) => shotTwo(f, u, T, false)],
    [47.27, shotFire],
    [50.87, (f, u, T) => shotSeal(f, u, T, false)],
    [53.87, shotGlobeSam],
    [57.65, shotEagle],
    [61.52, shotWide],
    [68.78, shotDoorOpen],
    [70.0, shotBlack],
    [72.0, (f, u, T) => shotStage(f, u, T, 0)],
    [74.57, (f, u, T) => shotStage(f, u, T, 1)],
    [76.5, (f, u, T) => shotStage(f, u, T, 2)],
    [78.57, shotPeepers],
    [80.87, shotDome],
    [86.08, shotPoolSide],
    [89.38, shotPoolTop],
    [92.7, shotPoolRise],
    [94.73, shotArmy],
    [100.6, shotStar],
    [103.0, shotStarField],
    [104.0, (f, u, T) => shotFlag(f, u, T, 0)],
    [106.72, (f, u, T) => shotFlag(f, u, T, 1)],
    [108.0, (f, u, T) => shotFlag(f, u, T, 2)],
    [111.88, (f, u, T) => shotFlag(f, u, T, 3)],
    [115.97, shotDoorway],
    [119.6, shotFaceSide],
    [121.6, shotCouchLie],
    [126.7, shotMaxCrowd],
    [134.0, shotMarch],
    [143.1, shotPortraitSpot],
    [143.85, shotMonkey],
    [144.45, (f, u, T) => shotSeal(f, u, T, true)],
    [144.93, shotEagle],
    [145.53, shotGlobeSam],
    [146.38, shotFire],
    [147.2, shotPortraitSpot],
    [150.93, shotRedTrio],
    [154.0, shotExit]
  ];

  function shotAt(T) {
    let k = 0;
    for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i][0] <= T) k = i;
    return SHOTS[k];
  }

  function lyricAt(T) {
    for (const l of LYRICS) if (T >= l[0] && T < l[1]) return l;
    return null;
  }

  CLOSEUPS.warsong = function (f, g, cu) {
    const T = Math.max(0, cu.clock === undefined ? g.time - cu.t0 : cu.clock);
    const [t0, draw] = shotAt(T);
    draw(f, T - t0, T);
    const l = lyricAt(T);
    if (l) font.block(f, font.wrap(l[3], 300), W / 2, 197, l[2] === 'superball' ? COLORS.superball : COLORS.agents);
  };

  E.warSong = function* (g) {
    const cu = { kind: 'warsong', t0: g.time, clock: 0, audio: -Infinity };
    g.closeup = cu;
    g.music('warsong');
    let last = g.time;
    const shown = new Set();
    while (!g.skipping && cu.clock < END) {
      cu.clock += g.time - last;
      last = g.time;
      const mp = g.musicPos;
      if (mp && mp.id === 'warsong') {
        if (mp.t > cu.audio + 0.0001 && (mp.t > cu.clock || cu.clock - mp.t < 0.6)) cu.clock = mp.t;
        cu.audio = mp.t;
      }
      const l = lyricAt(cu.clock);
      if (l && !shown.has(l)) { shown.add(l); g.log.push(l[2] + ': ' + l[3]); }
      yield null;
    }
  };

  E.WAR_LYRICS = LYRICS;
  E.WAR_SHOTS = SHOTS;
  E.WAR_END = END;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
