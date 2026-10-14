(function (S) {
  'use strict';
  const { C, Buf, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const E = S.EP105;
  const L = E.LAYERS;
  const A = S.art105;
  const { vgrad, pool, textOn, sprite, vignette, lineIn } = BG;
  const LAMP = A.LAMP;
  const OX = 120;
  E.OX = OX;

  function boards(buf, P, x, y, w, h) {
    part(buf, P.rect(x, y, w, h), C.night, { b: 1 });
    for (let i = 0; i < 4; i++) part(buf, P.poly([x - 2, y + 4 + i * (h / 4), x + w + 2, y + i * (h / 4), x + w + 2, y + 8 + i * (h / 4), x - 2, y + 12 + i * (h / 4)]), C.oak, { b: 3, sh: 1 });
  }

  BG.street5 = function (buf) {
    const base = new Buf(640, 200, 1);
    BG.street(base);
    for (let y = 0; y < 200; y++) {
      const row = y * 640;
      buf.px.set(base.px.subarray(row, row + 640), y * buf.w + OX);
      for (let x = 0; x < OX; x++) buf.px[y * buf.w + x] = base.px[row + 170 + x];
    }
    const P = new Pen(buf);
    const sky = P.rect(0, 0, OX, 60);
    vgrad(buf, sky, C.sky, 0, 80, 0.7, 0.3);
    part(buf, P.rect(18, 8, 3, 24), C.grey, { b: 1, sh: 0 });
    part(buf, P.ell(19.5, 8, 9, 5), C.grey, { b: 4 });
    line(buf, 19, 8, 27, 2, C.grey[1]);
    part(buf, P.rect(52, 4, 2, 28), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 3; i++) line(buf, 46, 8 + i * 5, 60, 8 + i * 5, C.grey[1]);
    for (const [x0, y0] of [[22, 12], [54, 10]]) for (let k = 0; k < 2; k++) {
      for (let x = x0; x < OX + 8; x++) { const t = (x - x0) / (OX + 8 - x0); buf.set(x, Math.round(y0 + k * 2 + Math.sin(t * Math.PI) * 9 + t * (4 - y0)), C.black); }
    }
    const wall = P.rect(0, 32, 116, 106);
    vgrad(buf, wall, C.olive, 32, 138, 0.62, 0.3);
    wall.each((x, y) => { if (x % 9 === 0) buf.set(x, y, C.olive[0]); else if (hash(x >> 1, y >> 2, 4) < 0.06) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    part(buf, P.rect(0, 28, 118, 6), C.olive, { b: 1 });
    part(buf, P.rect(116, 28, 4, 110), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(6, 38, 104, 28), C.sand, { b: 3 });
    S.bigText(buf, 'ЛЕФТИ', 50, 41, 2, C.red[2], C.red[3], 1);
    textOn(buf, 'ПРОКАТ ИНСТРУМЕНТА', 9, 57, C.wood[1], 0);
    part(buf, P.cap(92, 58, 102, 46, 1.6), C.grey, { b: 3, sh: 0 });
    part(buf, P.cap(102, 46, 102.4, 42, 1.4), C.grey, { b: 3, sh: 0 });
    part(buf, P.cap(102, 46, 106, 46.6, 1.4), C.grey, { b: 3, sh: 0 });
    boards(buf, P, 8, 78, 46, 48);
    part(buf, P.rect(66, 68, 42, 72), C.olive, { b: 1 });
    const door = P.rect(70, 72, 34, 68);
    part(buf, door, C.wood, { b: 1 });
    part(buf, P.rect(74, 76, 26, 20), LAMP, { sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) line(buf, 76 + i * 7, 76, 76 + i * 7, 95, C.wood[0]);
    part(buf, P.rect(74, 102, 26, 34), C.wood, { b: 1, sh: 1, hi: 1 });
    part(buf, P.ell(100, 106, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.poly([72, 99, 102, 98, 102.4, 111, 72.4, 112]), C.cream, { b: 4 });
    textOn(buf, 'КОПС', 76, 101, C.blue[1], 0);
    part(buf, P.rect(62, 136, 50, 3), C.stone, { b: 3, sh: 0 });
    pool(buf, 87, 86, 22, 16, 1.2);
    pool(buf, 87, 150, 34, 12, 0.6);
    shade(buf, P.rect(0, 0, 8, 200), 0, x => (8 - x) / 8);
  };

  function toolShape(P, x, y, kind, c) {
    if (kind === 'wrench') { P.curve(`M ${x} ${y + 30} L ${x} ${y + 8} L ${x - 4} ${y + 2} L ${x - 2} ${y} L ${x} ${y + 4} L ${x + 2} ${y} L ${x + 4} ${y + 2} L ${x} ${y + 8}`, c); P.curve(`M ${x + 2} ${y + 8} L ${x + 2} ${y + 30} L ${x} ${y + 30}`, c); }
    else if (kind === 'hammer') { P.curve(`M ${x - 7} ${y} L ${x + 7} ${y} L ${x + 7} ${y + 6} L ${x + 1} ${y + 6} L ${x + 1} ${y + 30} L ${x - 2} ${y + 30} L ${x - 2} ${y + 6} L ${x - 7} ${y + 6} Z`, c); }
    else if (kind === 'saw') { P.curve(`M ${x} ${y + 4} L ${x + 34} ${y} L ${x + 36} ${y + 12} L ${x} ${y + 12} Z`, c); for (let i = 0; i < 8; i++) P.curve(`M ${x + 2 + i * 4} ${y + 12} L ${x + 4 + i * 4} ${y + 15} L ${x + 6 + i * 4} ${y + 12}`, c); P.curve(`M ${x + 36} ${y + 2} Q ${x + 48} ${y + 2} ${x + 46} ${y + 12} Q ${x + 40} ${y + 16} ${x + 36} ${y + 10}`, c); }
    else if (kind === 'pliers') { P.curve(`M ${x - 3} ${y} L ${x} ${y + 9} L ${x + 3} ${y}`, c); P.curve(`M ${x} ${y + 9} L ${x - 5} ${y + 30}`, c); P.curve(`M ${x} ${y + 9} L ${x + 5} ${y + 30}`, c); }
    else { P.curve(`M ${x} ${y} L ${x + 40} ${y} L ${x + 40} ${y + 6} L ${x} ${y + 6} Z`, c); P.curve(`M ${x + 16} ${y + 1} L ${x + 24} ${y + 1} L ${x + 24} ${y + 5} L ${x + 16} ${y + 5} Z`, c); }
  }

  BG.leftys = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 128);
    vgrad(buf, wall, C.sand, 0, 128, 0.22, 0.5);
    wall.each((x, y) => { if (x % 6 === 3 && y % 6 === 3 && y > 12 && y < 100 && x > 50 && x < 236) buf.set(x, y, C.sand[0]); else if (hash(x >> 1, y >> 1, 12) < 0.04) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    part(buf, P.rect(0, 0, 320, 8), C.wood, { b: 1, sh: 0, hi: 0 });
    for (const lx of [90, 210]) { part(buf, P.rect(lx, 6, 40, 4), C.grey, { b: 3, sh: 0 }); part(buf, P.rect(lx + 2, 8, 36, 2), LAMP, { sh: 0, hi: 0, ol: 0 }); }
    const ink = C.cream[4];
    toolShape(P, 66, 40, 'wrench', ink);
    toolShape(P, 88, 40, 'hammer', ink);
    toolShape(P, 106, 44, 'saw', ink);
    toolShape(P, 172, 40, 'pliers', ink);
    toolShape(P, 186, 46, 'level', ink);
    toolShape(P, 186, 60, 'level', ink);
    part(buf, P.rect(104, 78, 50, 12), C.cream, { b: 4 });
    textOn(buf, 'ВЕРНИ!', 112, 80, C.red[2], 0);
    part(buf, P.rect(4, 36, 38, 112), C.wood, { b: 1 });
    part(buf, P.rect(8, 40, 30, 50), LAMP, { sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) line(buf, 10 + i * 8, 40, 10 + i * 8, 89, C.wood[0]);
    part(buf, P.rect(8, 94, 30, 50), C.wood, { b: 1, sh: 1, hi: 1 });
    part(buf, P.ell(35, 96, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    const shut = P.rect(244, 30, 72, 96);
    part(buf, shut, C.grey, { b: 2 });
    shut.each((x, y) => { if ((y - 30) % 6 === 5) buf.set(x, y, C.grey[0]); else if ((y - 30) % 6 === 0) buf.set(x, y, C.grey[4]); });
    part(buf, P.rect(240, 24, 80, 8), C.grey, { b: 1 });
    part(buf, P.rect(252, 54, 56, 22), C.yellow, { b: 3 });
    textOn(buf, 'ВЫДАЧА', 262, 56, C.black, 0);
    textOn(buf, 'ЗАКРЫТА', 259, 65, C.red[2], 0);
    part(buf, P.ell(280, 120, 4, 4.4), C.gold, { b: 3 });
    part(buf, P.rect(46, 20, 12, 108), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(48, 96, 8, 10), C.grey, { b: 4 });
    buf.set(50, 99, C.black); buf.set(53, 99, C.black); buf.set(50, 102, C.black); buf.set(53, 102, C.black);
    for (const [sx, sy] of [[44, 92], [58, 94], [45, 108], [59, 106]]) line(buf, 52, 100, sx, sy, C.night[0]);
    part(buf, P.rect(0, 122, 320, 7), C.wood, { b: 1, sh: 0, hi: 1 });
    const floor = P.rect(0, 128, 320, 72);
    grad(buf, floor, C.stone, (x, y) => 0.3 + (y - 128) / 170 + (hash(x >> 1, y >> 1, 6) - 0.5) * 0.09);
    for (let x = -60; x < 380; x += 44) lineIn(buf, floor, 160 + (x - 160) * 0.55, 128, x, 200, C.stone[1]);
    lineIn(buf, floor, 0, 160, 320, 160, C.stone[1]);
    for (const [cx, cy, rx] of [[70, 176, 16], [236, 186, 22], [150, 190, 12]]) part(buf, P.ell(cx, cy, rx, rx * 0.26), C.stone, { b: 0, sh: 0, hi: 0, ol: 0 });
    const cable = (pts, c) => { for (let i = 2; i < pts.length; i += 2) line(buf, pts[i - 2], pts[i - 1], pts[i], pts[i + 1], c); };
    cable([52, 106, 52, 130, 80, 140, 96, 144], C.night[0]);
    cable([52, 106, 54, 132, 120, 136, 150, 140], C.red[1]);
    cable([52, 106, 56, 134, 170, 134, 208, 140], C.night[0]);
    cable([52, 106, 58, 131, 220, 132, 262, 144], C.blue[1]);
    part(buf, P.rect(60, 129, 22, 5), C.cream, { b: 3 });
    for (let i = 0; i < 4; i++) buf.set(63 + i * 5, 131, i % 2 ? C.neonA : C.black);
    pool(buf, 110, 12, 50, 26, 0.8);
    pool(buf, 230, 12, 50, 26, 0.8);
    pool(buf, 160, 168, 130, 30, 0.5);
    vignette(buf, 0.9, 160, 110);
  };

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };

  lay('office', {
    closetOpen: g => S.LAYERS.office.closetOpen(g),
    desk: () => S.LAYERS.office.desk(),
    phone: () => S.LAYERS.office.phone(),
    mrbear: g => sprite(24, 26, P => S.art103.mrBear(P, 12, 24, g ? g.time : 0)),
    leoCloset: () => sprite(36, 92, (P, b) => {
      const sp = S.sprite('leonard', { act: 'tied', v: 'tape', dir: 's' }, 0.8);
      S.blit(b, sp.buf, 13 - sp.ox, 88 - sp.oy);
      S.art.bradyHair(new Pen(b).at(13, 42, 0.8), 0, 0);
    }),
    head5: () => sprite(16, 20, (P, b) => {
      S.art104.presHead(new Pen(b).at(8, 11, 0.5), 0, 0, { v: 'dead' });
    }),
    capgun: () => sprite(10, 10, P => {
      P.px(5, 0, C.grey[3]);
      P.part(P.poly([1, 2, 9, 2, 9, 4.4, 4.4, 5, 4, 9, 1, 9]), C.grey, { b: 4 });
      P.part(P.rect(8, 2, 2, 2.4), C.orange, { b: 3, sh: 0, hi: 0 });
    }),
    glove: () => sprite(14, 14, P => {
      P.line(7, 0, 7, 3, C.grey[3]);
      P.part(P.ell(7, 8, 5.4, 5), C.red, { b: 3 });
      P.part(P.ell(3, 7, 2.4, 2.8), C.red, { b: 3 });
      P.part(P.rect(4, 11.6, 6, 2.4), C.grey, { b: 5, sh: 0 });
    }),
    exhibit: () => sprite(16, 12, P => {
      P.px(8, 0, C.grey[3]);
      A.gogglesArt(P, 8, 6, 0.62);
    }),
    sign: () => sprite(44, 20, (P, b) => {
      P.part(P.rect(21, 9, 2, 11), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(0, 0, 44, 10), C.cream, { b: 4 });
      textOn(b, 'У БОСКО', 2, 1, C.red[2], 0);
    }),
    machine: g => sprite(16, 10, P => {
      P.part(P.rect(0, 2, 16, 8), C.grey, { b: 1 });
      P.part(P.rect(2, 4, 7, 4), C.grey, { b: 0, sh: 0, hi: 0 });
      P.px(12, 5, g && !g.f.machineDone && Math.floor(g.time * 2) % 2 ? C.neonA : C.red[1]);
    }),
    decrees: () => sprite(30, 14, P => {
      for (let i = 0; i < 3; i++) P.part(P.poly([1 + i, 6 - i * 1.6, 17 + i, 4.6 - i * 1.6, 19 + i, 10 - i * 1.6, 3 + i, 11.4 - i * 1.6]), C.cream, { b: 4, sh: 0 });
      P.line(6, 6, 16, 5, C.cream[1]); P.line(7, 8, 17, 7, C.cream[1]);
      P.part(P.ell(15, 8.4, 2.2, 1.6), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(22, 6, 6, 5), C.wood, { b: 2 });
      P.part(P.rect(24, 1, 2, 5), C.wood, { b: 3, sh: 0 });
      P.part(P.ell(25, 1.4, 2, 1.4), C.wood, { b: 3, sh: 0 });
    })
  });

  lay('street', {
    lamp: () => S.LAYERS.street.lamp(),
    hydrant: () => S.LAYERS.street.hydrant(),
    mailbox: () => sprite(24, 32, (P, b) => {
      S.blit(b, S.LAYERS.street.mailbox(), 0, 2);
      for (const [x, y, r] of [[8, 12, 0.3], [13, 9, -0.2], [11, 15, 0.1]]) P.part(P.poly([x, y, x + 9, y - 2 + r * 6, x + 10, y + 3 + r * 6, x + 1, y + 5]), C.cream, { b: 4, sh: 0 });
      P.part(P.poly([2, 28, 12, 27, 13, 31, 3, 32]), C.cream, { b: 4, sh: 0 });
    }),
    desoto: () => S.LAYERS.street.desoto(),
    redcar: () => S.LAYERS.street.redcar(),
    posters: () => sprite(66, 58, (P, b) => {
      P.part(P.rect(0, 0, 66, 58), C.stone, { b: 2, sh: 0, hi: 0, ol: 0 });
      BG.bricks(b, P.rect(0, 0, 66, 58), 10, 5, C.stone, C.stone[0], 7);
      for (const [x, y, ramp] of [[2, 3, C.purple], [34, 5, C.teal]]) {
        P.part(P.rect(x, y, 30, 40), ramp, { b: 2 });
        A.gogglesArt(P, x + 15, y + 12, 0.9);
        textOn(b, '2.0', x + 6, y + 21, C.lamp, 0);
        textOn(b, 'ЛУЧШЕ', x + 1, y + 30, C.grey[5], 0);
      }
      P.part(P.poly([8, 46, 58, 45, 58, 56, 8, 57]), C.olive, { b: 2 });
      textOn(b, 'ДАЙ ВСЁ', 12, 47, C.grey[5], 0);
    }),
    sybilSign: () => sprite(144, 11, (P, b) => {
      P.part(P.rect(0, 0, 144, 11), C.plum, { b: 1 });
      textOn(b, 'БЕТА-ТЕСТЫ НА ЗАКАЗ', 12, 2, C.yellow[4], C.black);
    }),
    sybilPlate: () => sprite(36, 20, (P, b) => {
      P.part(P.rect(0, 0, 36, 20), C.gold, { b: 3 });
      textOn(b, 'ИГРАЮ', 2, 1, C.gold[0], 0);
      textOn(b, 'ЗА ВАС', 1, 10, C.gold[0], 0);
    }),
    boscoFlag: () => sprite(24, 34, P => {
      P.part(P.rect(1, 0, 2, 34), C.grey, { b: 2, sh: 0 });
      P.part(P.poly([3, 2, 23, 2, 19, 9, 23, 16, 3, 16]), C.green, { b: 3 });
      P.part(P.path('M 8 12 Q 7 6 13 5 Q 15 9 12 12 Q 10 13 8 12 Z'), C.slime, { b: 3, sh: 0 });
    }),
    boscoBanner: () => sprite(148, 11, (P, b) => {
      P.part(P.rect(0, 0, 148, 11), C.green, { b: 1 });
      const t = 'ТАВЕРНА ЭЛЬБОСКОДРИЛА';
      textOn(b, t, Math.floor((148 - S.font.measure(t)) / 2), 2, C.gold[4], 0);
    }),
    hughstand: () => sprite(48, 34, (P, b) => {
      const cloth = P.part(P.rect(1, 12, 46, 22), C.grey, { b: 5 });
      cloth.each((x, y) => { if (b.px[y * b.w + x] !== C.black && y > 13) b.set(x, y, C.cycle[Math.floor((x + y) / 6) % 8]); });
      P.part(P.rect(6, 4, 8, 8), C.pink, { b: 3 });
      P.part(P.poly([16, 0, 46, 1, 46, 11, 16, 10]), C.cream, { b: 4 });
      textOn(b, 'УШЁЛ', 19, 2, C.purple[2], 0);
    }),
    paperY: () => sprite(20, 34, P => {
      P.part(P.rect(1, 4, 18, 22), C.yellow, { b: 3 });
      P.part(P.rect(3, 7, 14, 11), C.sky, { b: 3, sh: 0 });
      P.part(P.rect(5, 9, 10, 7), C.cream, { b: 4, sh: 0, hi: 0 });
      P.part(P.rect(5, 9, 10, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(7, 20, 6, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(3, 26, 3, 8), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(14, 26, 3, 8), C.grey, { b: 1, sh: 0 });
    }),
    paperG: () => sprite(20, 34, P => {
      P.part(P.rect(1, 4, 18, 22), C.green, { b: 3 });
      P.part(P.rect(3, 7, 14, 11), C.sky, { b: 3, sh: 0 });
      P.part(P.rect(5, 9, 10, 7), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.line(6, 11 + i * 2, 13, 11 + i * 2, C.cream[1]);
      P.part(P.rect(7, 20, 6, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(3, 26, 3, 8), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(14, 26, 3, 8), C.grey, { b: 1, sh: 0 });
    }),
    deadend: () => sprite(38, 46, (P, b) => {
      P.part(P.rect(17, 12, 3, 34), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(1, 1, 36, 12), C.yellow, { b: 3 });
      textOn(b, 'ТУПИК', 4, 3, C.black, 0);
    })
  });

  function weeniesArt(g) {
    return sprite(30, 26, (P, b) => {
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
    });
  }

  function dishArt() {
    return sprite(38, 48, (Q, b) => {
      const P = new Pen(b).at(0, 8, 1);
      P.part(P.rect(15, 24, 4, 14), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(17, 38, 9, 2.4), C.grey, { b: 1 });
      P.part(P.ell(17, 16, 15, 11, -0.5), C.grey, { b: 4 });
      P.part(P.ell(19, 15, 11, 7.6, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
      P.line(19, 15, 30, 4, C.grey[1]);
      P.part(P.ell(30, 4, 2, 2), A.NEON_G, { b: 3, sh: 0, hi: 0 });
      P.curve('M 28 0 Q 34 2 33 8', C.neonB); P.curve('M 25 -2 Q 36 0 36 10', C.neonB);
    });
  }

  function sludgieArt(P, b, vr, t) {
    P.part(P.rect(2, 22, 24, 36), vr ? C.purple : C.grey, { b: vr ? 2 : 3 });
    P.part(P.rect(0, 18, 28, 6), vr ? C.purple : C.grey, { b: 4 });
    for (const [x, ramp] of [[3, vr ? C.sky : C.slime], [15, vr ? C.pink : C.orange]]) {
      const tank = P.rect(x, 2, 10, 16);
      P.part(tank, C.grey, { b: 5, sh: 0, hi: 0 });
      const lvl = 5 + (Math.floor((t || 0) * 2 + x) % 2);
      P.part(P.rect(x + 1, 2 + lvl, 8, 15 - lvl), ramp, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.px(x + 3, 4 + lvl + 3, ramp[4]); P.px(x + 6, 4 + lvl + 6, ramp[4]);
      S.outerLine(b, tank, C.black);
      P.part(P.rect(x + 3, 24, 4, 5), C.grey, { b: 1, sh: 0 });
    }
    P.part(P.rect(4, 32, 20, 10), vr ? A.GLOW : C.cream, { b: 3, sh: 0 });
    textOn(b, vr ? 'СЛИЗЬ' : 'ЛЁД', vr ? 4 : 7, 33, vr ? C.night[0] : C.red[2], 0);
    P.part(P.rect(4, 46, 20, 8), C.night, { b: 0, sh: 0, hi: 0 });
    P.part(P.rect(2, 56, 24, 2), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 });
  }
  A.sludgieArt = sludgieArt;

  lay('bosco', {
    counter: () => S.LAYERS.bosco.counter(),
    glovearm: g => S.LAYERS.bosco.glovearm(g),
    table: () => S.LAYERS.bosco.table(),
    weenies: g => weeniesArt(g),
    dish: () => dishArt(),
    sludgie: g => sprite(28, 58, (P, b) => sludgieArt(P, b, false, g ? g.time : 0)),
    cannon: g => sprite(40, 22, P => {
      A.cannon(P, 17, 11, 1.25, false);
      if (g && g.vt.smoke && g.time - g.vt.smoke < 0.6) for (let i = 0; i < 4; i++) P.part(P.ell(32 + i * 2, 5 - i, 3 - i * 0.4, 2.4), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    }),
    balls: () => sprite(14, 8, P => { for (const [x, y] of [[3, 5], [8, 5], [5.5, 2.4]]) P.part(P.ell(x, y, 2.6, 2.4), C.grey, { b: 1 }); }),
    binoc: () => sprite(14, 10, P => {
      for (const x of [4, 10]) { P.part(P.poly([x - 2, 1, x + 2, 1, x + 3, 8, x - 3, 8]), C.grey, { b: 1 }); P.part(P.ell(x, 8, 3, 1.4), C.sky, { b: 3, sh: 0 }); }
      P.part(P.rect(5, 3, 4, 2), C.grey, { b: 2, sh: 0 });
    }),
    codes: () => sprite(34, 16, (P, b) => {
      P.part(P.rect(0, 0, 34, 16), C.night, { b: 1 });
      textOn(b, 'ЧИТЫ', 5, 1, C.neonB, 0);
      textOn(b, '2.0', 9, 8, C.lamp, 0);
    })
  });

  function pcArt(P, b, on) {
    P.part(P.rect(0, 14, 22, 6), C.cream, { b: 3 });
    P.part(P.rect(2, 0, 18, 15), C.cream, { b: 3 });
    const scr = P.rect(4, 2, 14, 10);
    P.part(scr, on ? C.purple : C.night, { b: on ? 2 : 0, sh: 0, hi: 0 });
    if (on) for (let i = 0; i < 6; i++) b.set(Math.round(P.X(11 + Math.cos(i * 1.05) * (1 + i * 0.6))), Math.round(P.Y(7 + Math.sin(i * 1.05) * (1 + i * 0.5))), C.cycle[i]);
    P.px(18, 17, on ? C.neonB : C.green[1]);
    P.part(P.rect(3, 16, 8, 1.6), C.grey, { b: 1, sh: 0, hi: 0, ol: 0 });
  }

  lay('sybil', {
    lamp: () => S.LAYERS.sybil.lamp(),
    couch: g => S.LAYERS.sybil.couch(g),
    board: () => sprite(100, 38, (P, b) => {
      P.part(P.rect(0, 0, 100, 38), C.oak, { b: 3 });
      P.part(P.rect(3, 3, 94, 32), C.sand, { b: 3, sh: 0, hi: 0 });
      textOn(b, 'НАЙДЕНО ОШИБОК', 6, 5, C.red[2], 0);
      for (let i = 0; i < 9; i++) { const h = [3, 5, 4, 8, 7, 11, 10, 14, 16][i]; P.part(P.rect(8 + i * 9, 32 - h, 6, h), [C.sky, C.mint, C.gold][i % 3], { b: 3, sh: 0, hi: 0 }); }
      P.part(P.poly([8, 14, 32, 13, 33, 22, 9, 23]), C.cream, { b: 4, sh: 0 });
      textOn(b, 'НОЛЬ', 10, 14, C.night[1], 0);
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
      P.px(33, 11.6, C.black);
      P.part(P.rect(22, 7.6, 7, 3), C.grey, { b: 1, sh: 0 });
      P.px(24, 8.6, C.tvA); P.px(27, 8.6, C.tvA);
      P.part(P.ell(3, 10, 2.2, 2.6), C.cream, { b: 4, sh: 0 });
    }),
    desk: g => sprite(64, 56, (P, b) => {
      const Q = new Pen(b).at(0, 8, 1);
      Q.part(Q.poly([2, 12, 62, 10, 64, 18, 0, 20]), C.wood, { b: 3 });
      Q.part(Q.poly([0, 20, 64, 18, 64, 48, 0, 48]), C.wood, { b: 2 });
      Q.part(Q.rect(6, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      Q.part(Q.rect(36, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      pcArt(new Pen(b).at(4, 0, 1), b, true);
      Q.part(Q.rect(29, 7, 13, 5), C.grey, { b: 1 });
      for (let i = 0; i < 4; i++) Q.px(31 + i * 2.6, 9, g && Math.floor(g.time * 5 + i) % 3 === 0 ? C.neonA : C.red[1]);
      Q.part(Q.path('M 47 12 L 46 -2 Q 52 -5 58 -2 L 57 12 Z'), C.wood, { b: 1 });
      Q.part(Q.ell(49.6, 2, 1.6, 1.8), C.eye, { sh: 0, hi: 0 }); Q.part(Q.ell(54.4, 2, 1.6, 1.8), C.eye, { sh: 0, hi: 0 });
      Q.px(49.6, 2, C.pupil); Q.px(54.4, 2, C.pupil);
      Q.part(Q.rect(48.6, 6.6, 6.8, 2.6), C.eye, { sh: 0, hi: 0 });
      Q.line(50.6, 6.6, 50.6, 9, C.black); Q.line(53.2, 6.6, 53.2, 9, C.black);
    }),
    goggles: () => sprite(22, 12, P => A.gogglesArt(P, 11, 6, 0.9)),
    sparks: g => sprite(22, 14, P => { const k = g ? Math.floor(g.time * 8) % 4 : 0; for (let i = 0; i < 3; i++) P.px(4 + ((i * 7 + k * 5) % 16), 2 + ((i * 5 + k * 3) % 9), C.lamp); })
  });

  lay('leftys', {
    banner: () => sprite(204, 28, (P, b) => {
      P.line(2, 0, 10, 6, C.grey[2]); P.line(202, 0, 194, 6, C.grey[2]);
      P.part(P.poly([4, 5, 200, 3, 201, 25, 5, 27]), C.grey, { b: 5, sh: 1 });
      S.bigText(b, 'К.О.П.С.', 46, 8, 2, C.blue[2], C.blue[3], 0);
      textOn(b, 'КЛУБ ОХРАНЫ', 96, 6, C.red[2], 0);
      textOn(b, 'ПОЖИЛЫХ СИСТЕМ', 96, 16, C.red[2], 0);
    }),
    snacks: () => sprite(64, 40, (P, b) => {
      P.part(P.poly([2, 12, 62, 10, 64, 16, 0, 18]), C.grey, { b: 5 });
      P.line(8, 17, 4, 39, C.grey[2]); P.line(56, 16, 60, 39, C.grey[2]); P.line(10, 28, 56, 27, C.grey[1]);
      P.part(P.rect(6, 2, 10, 10), C.grey, { b: 1 });
      P.part(P.rect(8, 4, 6, 5), C.oak, { b: 1, sh: 0, hi: 0 });
      P.px(15, 3, C.neonA);
      P.part(P.ell(30, 11, 9, 2.6), C.cream, { b: 4 });
      for (const [x, c] of [[25, C.pink], [30, C.oak], [35, C.pink]]) { P.part(P.ell(x, 9, 2.8, 1.8), c, { b: 3, sh: 0 }); P.px(x, 9, C.cream[1]); }
      P.part(P.rect(44, 3, 16, 9), C.oak, { b: 3 });
      A.gogglesArt(P, 52, 3, 0.55);
      textOn(b, 'ДАРОМ', 22, 18, C.red[2], 0);
    }),
    chair: () => sprite(24, 40, (P, b) => {
      P.part(P.rect(3, 2, 18, 3), C.grey, { b: 3 });
      P.part(P.rect(3, 9, 18, 3), C.grey, { b: 3 });
      P.part(P.poly([2, 22, 22, 22, 23, 26, 1, 26]), C.grey, { b: 2 });
      P.line(4, 14, 4, 22, C.grey[2]); P.line(19, 14, 19, 22, C.grey[2]);
      P.line(4, 26, 21, 39, C.grey[2]); P.line(20, 26, 3, 39, C.grey[2]);
    }),
    modem: g => sprite(14, 12, P => { const k = g ? Math.floor(g.time * 6) : 0; for (let i = 0; i < 4; i++) P.px(2 + i * 3, 2 + ((i + k) % 2) * 5, (i + k) % 3 ? C.neonB : C.neonA); })
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
