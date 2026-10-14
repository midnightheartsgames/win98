(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade } = S;
  const BG = S.BG;
  const E = S.EP104;
  const L = E.LAYERS;
  const A = S.art104;
  const B = S.art104bg;
  const { vgrad, pool, textOn, sprite, vignette } = BG;
  const LAMP = A.LAMP;
  const TVS = [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA];

  BG.warroom = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 128);
    vgrad(buf, wall, C.navy, 0, 128, 0.15, 0.62);
    wall.each((x, y) => { if (x % 40 === 0 || y % 32 === 0) buf.set(x, y, C.navy[0]); });
    part(buf, P.rect(0, 0, 320, 8), C.night, { b: 1, sh: 0, hi: 0 });
    for (const x of [60, 160, 260]) { part(buf, P.rect(x - 22, 6, 44, 4), C.grey, { b: 3, sh: 0 }); part(buf, P.rect(x - 20, 8, 40, 2), LAMP, { sh: 0, hi: 0, ol: 0 }); }
    for (const x of [42, 124, 206]) {
      part(buf, P.rect(x, 16, 72, 50), C.grey, { b: 1 });
      part(buf, P.rect(x + 3, 19, 66, 44), C.teal, { b: 0, sh: 0, hi: 0 });
    }
    part(buf, P.rect(124, 70, 72, 13), C.night, { b: 0 });
    textOn(buf, 'ДЕФКОН 1', 137, 72, C.neonA, 0);
    part(buf, P.rect(2, 28, 38, 102), C.stone, { b: 1 });
    const steel = P.rect(6, 32, 30, 98);
    part(buf, steel, C.stone, { b: 2 });
    for (let y = 38; y < 128; y += 12) for (let x = 10; x < 36; x += 10) buf.set(x, y, C.stone[4]);
    part(buf, P.rect(7, 37, 28, 11), C.gold, { b: 4 });
    textOn(buf, 'ОВАЛ', 10, 39, C.red[1], 0);
    part(buf, P.rect(30, 84, 4, 10), C.grey, { b: 4, sh: 0 });
    part(buf, P.rect(62, 8, 12, 12), C.grey, { b: 1 });
    part(buf, P.rect(65, 18, 6, 60), C.grey, { b: 2 });
    part(buf, P.rect(58, 76, 20, 12), C.grey, { b: 2 });
    part(buf, P.rect(52, 80, 8, 4), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(76, 80, 8, 4), C.grey, { b: 1, sh: 0 });
    part(buf, P.ell(68, 90, 5, 3), C.night, { b: 0, sh: 0 });
    part(buf, P.rect(258, 74, 52, 40), C.grey, { b: 1 });
    const cam = P.rect(262, 78, 44, 32);
    vgrad(buf, cam, C.sky, 78, 110, 0.4, 0.95);
    part(buf, P.rect(262, 102, 44, 8), C.green, { b: 2, sh: 0, hi: 0, ol: 0 });
    B.obelisk(new Pen(buf), 284, 80, 106, 3.4, B.WHITE);
    S.outerLine(buf, cam, C.black);
    part(buf, P.rect(260, 115, 48, 11), C.gold, { b: 4 });
    textOn(buf, 'ШАХТА 1', 264, 117, C.night[0], 0);
    part(buf, P.rect(0, 122, 320, 8), C.night, { b: 2, sh: 0, hi: 1 });
    const floor = P.rect(0, 128, 320, 72);
    floor.each((x, y) => {
      const k = (y - 100) / 100;
      const u = (x - 160) / Math.max(0.3, k), v = Math.log(Math.max(1, y - 112)) * 7;
      buf.set(x, y, (Math.floor((u + 4000) / 26) + Math.floor(v)) % 2 ? C.asphalt[1] : C.asphalt[2]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (142 - y) / 18));
    for (let x = 0; x < 320; x++) if (Math.floor(x / 8) % 2 === 0) { buf.set(x, 196, C.yellow[3]); buf.set(x, 197, C.yellow[3]); }
    pool(buf, 160, 60, 150, 30, 0.7);
    pool(buf, 160, 160, 110, 30, 0.5);
    vignette(buf, 0.9, 160, 110);
  };

  Object.assign(L, {
    warroom: {
      table: () => sprite(170, 50, (P, b) => {
        P.part(P.ell(85, 40, 46, 5), C.night, { b: 0, sh: 0, hi: 0 });
        P.part(P.rect(74, 22, 22, 22), C.wood, { b: 1 });
        P.part(P.ell(85, 20, 84, 17), C.wood, { b: 2 });
        const felt = P.ell(85, 18, 78, 13.5);
        P.part(felt, C.green, { b: 2, sh: 0, hi: 0 });
        felt.each((x, y) => { if ((x + y * 2) % 23 === 0) b.set(x, y, C.green[1]); });
        P.part(P.path('M 40 14 Q 60 8 84 12 Q 110 8 128 16 Q 112 24 86 22 Q 60 26 40 14 Z'), C.olive, { b: 3, sh: 0, hi: 0 });
        for (const [x, y, c] of [[52, 15, C.red], [70, 12, C.red], [100, 19, C.blue], [118, 15, C.blue], [86, 16, C.gold]]) { P.line(x, y, x, y - 7, C.grey[5]); P.part(P.poly([x, y - 7, x + 5, y - 5.4, x, y - 4]), c, { b: 3, sh: 0, hi: 0 }); }
        P.part(P.poly([18, 17, 34, 15, 36, 22, 20, 24]), C.red, { b: 2 });
        P.part(P.poly([20, 18, 33, 16.6, 34, 20.6, 21, 22]), C.cream, { b: 4, sh: 0, hi: 0, ol: 0 });
        P.part(P.rect(140, 12, 12, 7), C.red, { b: 3 });
        P.part(P.cap(141, 10, 151, 10, 1.8), C.red, { b: 3 });
      }),
      console: g => sprite(62, 66, (P, b) => {
        P.part(P.poly([2, 66, 4, 26, 58, 26, 60, 66]), C.grey, { b: 2 });
        P.part(P.poly([4, 26, 10, 4, 52, 4, 58, 26]), C.grey, { b: 3 });
        P.part(P.rect(14, 7, 34, 17), C.night, { b: 0 });
        P.part(P.rect(16, 9, 30, 13), TVS, { sh: 0, hi: 0, ol: 0 });
        const k = g ? Math.floor(g.time * 3) % 2 : 0;
        P.line(31, 9, 31, 21, C.night[2]); P.line(16, 15, 45, 15, C.night[2]);
        P.part(P.ell(31, 15, 3, 3), C.red, { b: k ? 4 : 2, sh: 0, hi: 0 });
        P.part(P.rect(8, 32, 18, 8), C.grey, { b: 4 });
        P.part(P.ell(44, 38, 9, 7), C.grey, { b: 1 });
        P.part(P.ell(44, 36, 6.4, 5), C.red, { b: 3 });
        P.px(42, 34, C.red[4]);
        for (let i = 0; i < 4; i++) P.px(10 + i * 4, 46, [C.neonB, C.red[4], C.gold[4], C.neonB][(i + k) % 4]);
        P.part(P.rect(8, 50, 46, 3), C.grey, { b: 1, sh: 0 });
      })
    }
  });

  function heart(P, x, y, s, ramp) {
    return P.part(P.path(`M ${x} ${y + 3.4 * s} L ${x - 3.6 * s} ${y - 0.4 * s} Q ${x - 3.8 * s} ${y - 3.4 * s} ${x - 1.6 * s} ${y - 3.2 * s} Q ${x - 0.4 * s} ${y - 3.2 * s} ${x} ${y - 1.8 * s} Q ${x + 0.4 * s} ${y - 3.2 * s} ${x + 1.6 * s} ${y - 3.2 * s} Q ${x + 3.8 * s} ${y - 3.4 * s} ${x + 3.6 * s} ${y - 0.4 * s} Z`), ramp || C.red, { b: 3, sh: 0, hi: 0 });
  }

  function poster(P, b, x, y, w, h, ramp, top, bottom, ink) {
    P.part(P.rect(x, y, w, h), ramp, { b: 3 });
    if (top) textOn(b, top, x + Math.max(1, Math.floor((w - S.font.measure(top)) / 2)), y + 1, ink, 0);
    if (bottom) textOn(b, bottom, x + Math.max(1, Math.floor((w - S.font.measure(bottom)) / 2)), y + h - 9, ink, 0);
  }

  function sergeant(P, x, y) {
    P.part(P.ell(x, y, 3.4, 3.8), C.skin, { b: 3, sh: 0 });
    P.part(P.poly([x - 4.6, y - 2.6, x + 4.6, y - 2.6, x + 3, y - 5.6, x - 3, y - 5.6]), C.olive, { b: 1, sh: 0 });
    P.part(P.rect(x - 4, y + 3.6, 8, 5), C.olive, { b: 2, sh: 0 });
    P.part(P.cap(x + 2, y + 5, x + 7, y + 2, 1.2), C.skin, { b: 3, sh: 0 });
  }

  L.street = {
    lamp: () => S.LAYERS.street.lamp(),
    hydrant: () => S.LAYERS.street.hydrant(),
    mailbox: () => S.LAYERS.street.mailbox(),
    desoto: () => S.LAYERS.street.desoto(),
    redcar: () => S.LAYERS.street.redcar(),
    posters: g => sprite(66, 58, (P, b) => {
      const f = g ? g.f : {};
      P.part(P.rect(0, 0, 66, 58), C.stone, { b: 2, sh: 0, hi: 0, ol: 0 });
      BG.bricks(b, P.rect(0, 0, 66, 58), 10, 5, C.stone, C.stone[0], 7);
      for (const [x, y] of [[2, 3], [23, 1]]) { poster(P, b, x, y, 19, 25, C.olive, '', '', 0); sergeant(P, x + 9, y + 9); textOn(b, 'ДАЙ', x + 2, y + 17, C.grey[5], 0); }
      if (!f.posterTaken) {
        const Q = new Pen(b).at(54, 16, 1);
        const c = Math.cos(0.22), s = Math.sin(0.22);
        const rot = pts => pts.flatMap((v, i) => i % 2 ? [] : [pts[i] * c - pts[i + 1] * s, pts[i] * s + pts[i + 1] * c]);
        Q.part(Q.poly(rot([-9.5, -13, 9.5, -13, 9.5, 13, -9.5, 13])), C.olive, { b: 3 });
        sergeant(Q, 1, -4);
        textOn(b, 'ДАЙ', 46, 20, C.grey[5], 0);
        b.set(47, 4, C.grey[4]);
      } else { b.set(47, 4, C.grey[4]); b.set(61, 5, C.grey[4]); }
      if (f.election) {
        poster(P, b, 2, 31, 28, 25, C.cream, 'ЭЙБ', '1861', C.night[1]);
        A.lincolnHead(new Pen(b).at(16, 47, 0.26), 0, 0, {});
      }
      if (f.maxRuns) {
        poster(P, b, 33, 31, 30, 25, C.sky, 'МАКС', '', C.red[2]);
        const m = S.sprite('max', { act: 'head' }, 0.42);
        S.blit(b, m.buf, 48 - m.ox, 54 - m.oy);
      }
    }),
    sybilSign: g => sprite(144, 11, (P, b) => {
      const carbon = g && g.f.scandal;
      P.part(P.rect(0, 0, 144, 11), C.plum, { b: 1 });
      textOn(b, 'ДАТЫ НА ЗАКАЗ', 36, 2, C.yellow[4], C.black);
      if (carbon) {
        P.part(P.poly([6, 1, 28, 0, 29, 10, 7, 11]), C.grey, { b: 5, sh: 0 });
        textOn(b, 'С-14', 8, 2, C.night[1], 0);
        P.part(P.poly([118, 0, 138, 1, 137, 11, 117, 10]), C.grey, { b: 5, sh: 0 });
        P.part(P.ell(127, 5.5, 5, 2), C.grey, { b: 5, sh: 0, hi: 0, ol: C.blue[2] });
        P.px(127, 5, C.red[3]);
      } else { heart(P, 18, 5.4, 1.2, C.pink); heart(P, 128, 5.4, 1.2, C.pink); }
    }),
    sybilPlate: g => sprite(36, 20, (P, b) => {
      P.part(P.rect(0, 0, 36, 20), C.gold, { b: 3 });
      textOn(b, g && g.f.scandal ? 'ВЕЩИ' : 'ПАРЫ', 6, 1, C.gold[0], 0);
      textOn(b, 'ЗА ЧАС', 1, 10, C.gold[0], 0);
    }),
    boscoFlag: () => sprite(24, 34, P => {
      P.part(P.rect(1, 0, 2, 34), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(3, 2, 20, 14), C.red, { b: 3 });
      A.starShape(P, 9, 8, 3.4, 1.4, C.gold, 4);
    }),
    boscoBanner: () => sprite(148, 11, (P, b) => {
      P.part(P.rect(0, 0, 148, 11), C.red, { b: 2 });
      const t = 'НАРОДНЫЙ СКЛАД НЕУДОБСТВ';
      textOn(b, t, Math.floor((148 - S.font.measure(t)) / 2), 2, C.gold[4], 0);
    }),
    hughstand: () => sprite(48, 34, (P, b) => {
      const cloth = P.part(P.rect(1, 12, 46, 22), C.grey, { b: 5 });
      cloth.each((x, y) => { if (b.px[y * b.w + x] !== C.black && y > 13) b.set(x, y, C.cycle[Math.floor((x + y) / 6) % 8]); });
      for (let i = 0; i < 4; i++) { P.part(P.rect(4 + i * 10, 3 + (i % 2) * 2, 8, 10 - (i % 2) * 2), [C.pink, C.sky, C.gold, C.mint][i], { b: 3 }); P.px(8 + i * 10, 7 + (i % 2), C.grey[5]); }
    }),
    delivery: () => sprite(50, 20, (P, b) => {
      P.part(P.rect(0, 0, 50, 20), C.cream, { b: 4 });
      for (let i = 0; i < 12; i++) { b.set(2 + i * 4, 1, C.cycle[i % 8]); b.set(2 + i * 4, 18, C.cycle[(i + 3) % 8]); }
      textOn(b, 'ДОСТАВКА', 2, 2, C.purple[2], 0);
      textOn(b, 'НА ДОМ!', 6, 10, C.purple[2], 0);
      b.set(25, 0, C.grey[1]);
    }),
    paperY: () => sprite(20, 34, (P, b) => {
      P.part(P.rect(1, 4, 18, 22), C.yellow, { b: 3 });
      P.part(P.rect(3, 7, 14, 11), C.sky, { b: 3, sh: 0 });
      P.part(P.rect(5, 9, 10, 7), C.cream, { b: 4, sh: 0, hi: 0 });
      P.part(P.rect(5, 9, 10, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(7, 20, 6, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(3, 26, 3, 8), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(14, 26, 3, 8), C.grey, { b: 1, sh: 0 });
    }),
    paperG: () => sprite(20, 34, (P, b) => {
      P.part(P.rect(1, 4, 18, 22), C.green, { b: 3 });
      P.part(P.rect(3, 7, 14, 11), C.sky, { b: 3, sh: 0 });
      P.part(P.rect(5, 9, 10, 7), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.line(6, 11 + i * 2, 13, 11 + i * 2, C.cream[1]);
      P.part(P.rect(7, 20, 6, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(3, 26, 3, 8), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(14, 26, 3, 8), C.grey, { b: 1, sh: 0 });
    })
  };

  L.bosco = {
    counter: () => S.LAYERS.bosco.counter(),
    glovearm: g => S.LAYERS.bosco.glovearm(g),
    weenies: g => sprite(30, 26, (P, b) => {
      const k = g ? Math.floor(g.time * 2) % 2 : 0;
      P.part(P.rect(0, 8, 30, 18), C.grey, { b: 2 });
      const glass = P.rect(2, 10, 26, 12);
      grad(b, glass, C.orange, (x, y) => 0.75 - (y - 10) / 30);
      for (let i = 0; i < 3; i++) {
        P.part(P.cap(5, 13 + i * 3.4, 25, 13 + i * 3.4, 1.4), C.stone, { b: 2 + ((i + k) % 2), sh: 0 });
        P.px(8 + ((i * 5 + k * 3) % 14), 13 + i * 3.4, C.olive[3]);
      }
      S.outerLine(b, glass, C.black);
      P.part(P.rect(3, 0, 24, 9), C.red, { b: 3 });
      S.font.draw(b, 'HOT', 7, 1, C.yellow[4], 0);
    }),
    dish: g => sprite(38, 48, (Q, b) => {
      const P = new Pen(b).at(0, 8, 1);
      const on = g && g.f.boscoFunded;
      P.part(P.rect(15, 24, 4, 14), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(17, 38, 9, 2.4), C.grey, { b: 1 });
      P.part(P.ell(17, 16, 15, 11, -0.5), C.grey, { b: 4 });
      P.part(P.ell(19, 15, 11, 7.6, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
      P.line(19, 15, 30, 4, C.grey[1]);
      P.part(P.ell(30, 4, 2, 2), on ? [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB] : C.red, { b: 3, sh: 0, hi: 0 });
      if (on) { P.curve('M 28 0 Q 34 2 33 8', C.neonB); P.curve('M 25 -2 Q 36 0 36 10', C.neonB); }
    }),
    cans: g => sprite(44, 48, (P, b) => {
      const gone = g && g.f.beaconTaken;
      const cols = [C.red, C.green, C.gold, C.blue];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
        const x = 4 + i * 12 + r * 6, y = 36 - r * 11;
        P.part(P.rect(x, y, 11, 11), cols[(i + r) % 4], { b: 3 });
        P.part(P.rect(x + 1, y + 3, 9, 4), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
      }
      P.part(P.rect(12, 2, 18, 9), C.grey, { b: 5 });
      P.part(P.ell(14, 6.5, 3.4, 3.2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(14, 6.5, 1.5, 1.5), C.sky, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.px(27, 4, C.red[4]);
      P.part(P.rect(19, 11, 4, 3), C.grey, { b: 3, sh: 0 });
      const sign = gone ? [4, 22, 30, 17, 32, 27, 6, 32] : [5, 20, 33, 20, 33, 31, 5, 31];
      P.part(P.poly(sign), C.yellow, { b: 4 });
      if (!gone) { textOn(b, 'СКИДКА', 6, 22, C.red[2], 0); if (g && Math.floor(g.time * 2) % 2) b.set(34, 24, C.neonA); }
      else P.line(8, 25, 28, 21, C.red[2]);
    }),
    serum: () => sprite(34, 26, (P, b) => {
      P.part(P.poly([4, 25, 4, 11, 6.4, 7, 6.4, 2, 10.6, 2, 10.6, 7, 13, 11, 13, 25]), C.sky, { b: 4 });
      P.part(P.rect(5, 14, 7, 6), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.rect(6.4, 0, 4.2, 2.6), C.red, { b: 3, sh: 0 });
      P.part(P.rect(16, 12, 17, 11), C.grey, { b: 5 });
      textOn(b, '100', 17, 13, C.red[2], 0);
      P.line(14, 16, 16, 16, C.grey[2]);
    }),
    portrait: () => sprite(40, 34, (P, b) => {
      P.part(P.rect(0, 0, 40, 34), C.red, { b: 2 });
      P.part(P.rect(2, 2, 36, 22), C.red, { b: 3, sh: 0, hi: 0 });
      A.boscovHead(new Pen(b).at(20, 16, 0.5), 0, 0, {});
      textOn(b, 'ЛУЧШИЙ', 3, 25, C.gold[4], 0);
    })
  };

  L.sybil = {
    lamp: () => S.LAYERS.sybil.lamp(),
    couch: g => S.LAYERS.sybil.couch(g),
    board: g => sprite(100, 38, (P, b) => {
      const carbon = g && g.f.scandal;
      P.part(P.rect(0, 0, 100, 38), C.oak, { b: 3 });
      P.part(P.rect(3, 3, 94, 32), C.sand, { b: 3, sh: 0, hi: 0 });
      if (carbon) {
        for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) if (r > 0 || c === 0 || c === 8) P.part(P.rect(6 + c * 7, 6 + r * 7, 6, 6), [C.sky, C.mint, C.gold, C.pink][(r + c) % 4], { b: 3, sh: 0, hi: 0 });
        P.part(P.rect(72, 6, 22, 12), C.grey, { b: 5, sh: 0 });
        textOn(b, 'С-14', 74, 7, C.red[2], 0);
        textOn(b, 'ВЕЩИ НЕ ВРУТ', 8, 27, C.night[1], 0);
        return;
      }
      for (let i = 0; i < 3; i++) {
        const x = 8 + i * 22;
        P.part(P.rect(x, 6, 18, 14), C.grey, { b: 5, sh: 0 });
        heart(P, x + 9, 13, 1.5, [C.red, C.pink, C.rose][i]);
        P.px(x + 9, 7, C.red[3]);
      }
      P.part(P.rect(74, 6, 20, 14), C.grey, { b: 5, sh: 0 });
      textOn(b, '?', 82, 8, C.grey[2], 0);
      textOn(b, 'ПАР СОЗДАНО: 0', 10, 25, C.red[2], 0);
    }),
    fox: () => sprite(34, 24, P => {
      P.part(P.rect(0, 20, 34, 4), C.wood, { b: 3 });
      P.part(P.path('M 4 20 Q 0 12 8 8 Q 10 14 12 20 Z'), C.orange, { b: 3 });
      P.part(P.ell(16, 15, 8, 5), C.orange, { b: 3 });
      P.part(P.rect(11, 16, 2.4, 5), C.night, { b: 1, sh: 0 });
      P.part(P.rect(19, 16, 2.4, 5), C.night, { b: 1, sh: 0 });
      P.part(P.poly([21, 6, 24, 1, 26, 7]), C.orange, { b: 2, sh: 0 });
      P.part(P.ell(25, 10, 5, 4.4), C.orange, { b: 3 });
      P.part(P.poly([28, 9, 34, 11.6, 28, 13]), C.cream, { b: 4, sh: 0 });
      P.px(33, 11.6, C.black); P.px(26, 9, C.pupil);
      P.part(P.ell(3, 10, 2.2, 2.6), C.cream, { b: 4, sh: 0 });
    }),
    desk: g => sprite(64, 52, (P, b) => {
      const f = g ? g.f : {};
      const Q = new Pen(b).at(0, 4, 1);
      Q.part(Q.poly([2, 12, 62, 10, 64, 18, 0, 20]), C.wood, { b: 3 });
      Q.part(Q.poly([0, 20, 64, 18, 64, 48, 0, 48]), C.wood, { b: 2 });
      Q.part(Q.rect(6, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      Q.part(Q.rect(36, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      Q.part(Q.rect(4, 3, 16, 9), C.pink, { b: 3 });
      textOn(b, 'АНК', 5, 7, C.grey[5], 0);
      Q.part(Q.rect(6, 1, 12, 2.4), C.grey, { b: 5, sh: 0 });
      Q.part(Q.rect(24, 6, 12, 5), C.pink, { b: 3 });
      Q.part(Q.cap(25, 5, 35, 5, 1.6), C.pink, { b: 2 });
      Q.part(Q.path('M 47 12 L 46 -2 Q 52 -5 58 -2 L 57 12 Z'), C.wood, { b: 1 });
      Q.part(Q.ell(49.6, 2, 1.6, 1.8), C.eye, { sh: 0, hi: 0 }); Q.part(Q.ell(54.4, 2, 1.6, 1.8), C.eye, { sh: 0, hi: 0 });
      Q.px(49.6, 2, C.pupil); Q.px(54.4, 2, C.pupil);
      Q.part(Q.rect(48.6, 6.6, 6.8, 2.6), C.eye, { sh: 0, hi: 0 });
      Q.line(50.6, 6.6, 50.6, 9, C.black); Q.line(53.2, 6.6, 53.2, 9, C.black);
      if (f.sybilGone) {
        Q.part(Q.poly([24, 12, 38, 11.4, 39, 16.4, 25, 17]), C.cream, { b: 4, sh: 0 });
        Q.line(27, 13.6, 36, 13.2, C.cream[1]);
      }
    }),
    dater: () => sprite(18, 12, P => {
      P.part(P.poly([1, 3, 12, 2, 12, 6, 6, 6.6, 5.4, 11, 2, 11]), C.teal, { b: 3 });
      P.part(P.rect(12, 2.6, 4, 3), C.grey, { b: 1, sh: 0 });
      P.px(16, 4, C.neonB);
    })
  };

  L.office = {
    closetOpen: g => S.LAYERS.office.closetOpen(g),
    desk: () => S.LAYERS.office.desk(),
    phone: () => S.LAYERS.office.phone(),
    mrbear: g => sprite(24, 26, P => S.art103.mrBear(P, 12, 24, g ? g.time : 0)),
    leoCloset: () => sprite(36, 92, (P, b) => {
      const sp = S.sprite('leonard', { act: 'tied', v: 'tape', dir: 's' }, 0.8);
      S.blit(b, sp.buf, 13 - sp.ox, 88 - sp.oy);
      S.art.bradyHair(new Pen(b).at(13, 42, 0.8), 0, 0);
    }),
    glove: () => sprite(14, 14, P => {
      P.line(7, 0, 7, 3, C.grey[3]);
      P.part(P.ell(7, 8, 5.4, 5), C.red, { b: 3 });
      P.part(P.ell(3, 7, 2.4, 2.8), C.red, { b: 3 });
      P.part(P.rect(4, 11.6, 6, 2.4), C.grey, { b: 5, sh: 0 });
    }),
    capgun: () => sprite(10, 10, P => {
      P.px(5, 0, C.grey[3]);
      P.part(P.poly([1, 2, 9, 2, 9, 4.4, 4.4, 5, 4, 9, 1, 9]), C.grey, { b: 4 });
      P.part(P.rect(8, 2, 2, 2.4), C.orange, { b: 3, sh: 0, hi: 0 });
    }),
    head: () => sprite(16, 20, (P, b) => {
      A.presHead(new Pen(b).at(8, 11, 0.5), 0, 0, { v: 'dead' });
    }),
    sign: () => sprite(32, 20, (P, b) => {
      P.part(P.rect(15, 9, 2, 11), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(0, 0, 32, 10), C.cream, { b: 4 });
      textOn(b, 'УЕХАЛ', 2, 1, C.red[2], 0);
    }),
    machine: g => sprite(16, 10, P => {
      P.part(P.rect(0, 2, 16, 8), C.grey, { b: 1 });
      P.part(P.rect(2, 4, 7, 4), C.grey, { b: 0, sh: 0, hi: 0 });
      P.px(12, 5, g && !g.f.machineHeard && Math.floor(g.time * 2) % 2 ? C.neonA : C.red[1]);
    })
  };

  S.art104bg.heart = heart;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
