(function (S) {
  'use strict';
  const { C, Buf, Pen, part, shade, hash } = S;
  const BG = S.BG;
  const E = S.EP106;
  const L = E.LAYERS;
  const A = S.art106;
  const { vgrad, pool, textOn, sprite } = BG;
  const OX = 120;

  BG.street6 = function (buf) {
    const base = new Buf(640, 200, 1);
    BG.street(base);
    for (let y = 0; y < 200; y++) {
      const row = y * 640;
      buf.px.set(base.px.subarray(row, row + 640), y * buf.w + OX);
      for (let x = 0; x < OX; x++) buf.px[y * buf.w + x] = base.px[row + 60 + x];
    }
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, OX, 60), C.sky, 0, 80, 0.7, 0.3);
    for (const [x0, y0] of [[30, 14], [70, 9]]) for (let x = x0; x < OX + 8; x++) {
      const t = (x - x0) / (OX + 8 - x0);
      buf.set(x, Math.round(y0 + Math.sin(t * Math.PI) * 8 + t * (5 - y0)), C.black);
    }
    part(buf, P.rect(28, 6, 3, 26), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(68, 2, 3, 30), C.grey, { b: 1, sh: 0 });
    const wall = P.rect(0, 32, 116, 106);
    vgrad(buf, wall, C.olive, 32, 138, 0.62, 0.3);
    wall.each((x, y) => { if (x % 9 === 0) buf.set(x, y, C.olive[0]); else if (hash(x >> 1, y >> 2, 14) < 0.06) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    part(buf, P.rect(0, 28, 118, 6), C.olive, { b: 1 });
    part(buf, P.rect(116, 28, 4, 110), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(6, 38, 104, 28), C.sand, { b: 2 });
    S.bigText(buf, 'ЛЕФТИ', 50, 41, 2, C.red[1], C.red[2], 1);
    textOn(buf, 'ПРОКАТ ИНСТРУМЕНТА', 9, 57, C.wood[1], 0);
    const planks = (x, y, w, h, n) => {
      part(buf, P.rect(x, y, w, h), C.night, { b: 1 });
      for (let i = 0; i < n; i++) part(buf, P.poly([x - 2, y + 3 + i * (h / n), x + w + 2, y + i * (h / n), x + w + 2, y + 7 + i * (h / n), x - 2, y + 10 + i * (h / n)]), C.oak, { b: 3, sh: 1 });
    };
    planks(8, 78, 46, 48, 4);
    part(buf, P.rect(66, 68, 42, 72), C.olive, { b: 1 });
    planks(70, 72, 34, 66, 5);
    part(buf, P.poly([9, 90, 53, 88, 54, 110, 10, 112]), C.cream, { b: 4 });
    textOn(buf, 'КЛУБ', 20, 92, C.blue[1], 0);
    textOn(buf, 'НА ЛУНЕ', 13, 101, C.blue[1], 0);
    part(buf, P.rect(62, 136, 50, 3), C.stone, { b: 3, sh: 0 });
    pool(buf, 87, 150, 34, 12, 0.5);
    shade(buf, P.rect(0, 0, 8, 200), 0, x => (8 - x) / 8);
  };

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };

  function gloveArt() {
    return sprite(14, 14, P => {
      P.line(7, 0, 7, 3, C.grey[3]);
      P.part(P.ell(7, 8, 5.4, 5), C.red, { b: 3 });
      P.part(P.ell(3, 7, 2.4, 2.8), C.red, { b: 3 });
      P.part(P.rect(4, 11.6, 6, 2.4), C.grey, { b: 5, sh: 0 });
    });
  }

  lay('office', {
    closetOpen: g => S.LAYERS.office.closetOpen(g),
    desk: () => S.LAYERS.office.desk(),
    phone: () => S.LAYERS.office.phone(),
    hanger: () => sprite(18, 14, P => {
      P.curve('M 9 1 Q 12 1 11 4 L 9 5 L 1 11 L 17 11 L 9 5', C.grey[5]);
      P.curve('M 2 12 L 16 12', C.grey[2]);
    }),
    mrbear: g => sprite(24, 26, P => {
      S.art103.mrBear(P, 12, 24, g ? g.time : 0);
      A.goggles(P, 12, 8.4, 0.62);
    }),
    head: () => sprite(16, 20, (P, b) => {
      S.art104.presHead(new Pen(b).at(8, 11, 0.5), 0, 0, { v: 'dead' });
    }),
    leoCloset: g => sprite(36, 92, (P, b) => {
      const sp = S.sprite('leonard', { act: 'tied', v: 'tape', dir: 's' }, 0.8);
      S.blit(b, sp.buf, 13 - sp.ox, 88 - sp.oy);
      S.art.bradyHair(new Pen(b).at(13, 42, 0.8), 0, 0);
      if (g && E.blissed(g)) A.halo(new Pen(b), 13, 24, 8, Math.floor(g.time * 2) % 3);
    }),
    capgun: () => sprite(10, 10, P => {
      P.px(5, 0, C.grey[3]);
      P.part(P.poly([1, 2, 9, 2, 9, 4.4, 4.4, 5, 4, 9, 1, 9]), C.grey, { b: 4 });
      P.part(P.rect(8, 2, 2, 2.4), C.orange, { b: 3, sh: 0, hi: 0 });
    }),
    glove: () => gloveArt(),
    jar: g => sprite(12, 16, P => {
      const k = g ? Math.floor(g.time * 3) % 4 : 0;
      P.part(P.rect(2, 3, 8, 12), A.GLOW, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(1.4, 1, 9.2, 2.6), C.grey, { b: 2, sh: 0 });
      for (let i = 0; i < 3; i++) P.px(3 + ((i * 3 + k) % 6), 6 + ((i * 4 + k * 2) % 8), C.cycle[i * 2 + k]);
    }),
    sign: () => sprite(44, 20, (P, b) => {
      P.part(P.rect(21, 9, 2, 11), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(0, 0, 44, 10), C.cream, { b: 4 });
      textOn(b, 'УШЁЛ', 10, 1, C.orange[2], 0);
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
    }),
    lids: () => sprite(40, 10, P => {
      A.BOW.forEach((r, i) => P.part(P.ell(4 + i * 5.2, 4 + (i % 2) * 2, 3, 2), r, { b: 3, sh: 0 }));
    })
  });

  lay('street', {
    lamp: () => S.LAYERS.street.lamp(),
    hydrant: () => S.LAYERS.street.hydrant(),
    desoto: () => S.LAYERS.street.desoto(),
    mailbox: () => sprite(24, 32, (P, b) => {
      S.blit(b, S.LAYERS.street.mailbox(), 0, 2);
      P.part(P.poly([8, 12, 18, 9, 19, 14, 9, 17]), C.cream, { b: 4, sh: 0 });
      P.part(P.ell(14, 12.6, 2, 1.8), C.grey, { b: 4, sh: 0, hi: 0 });
    }),
    posters: () => sprite(66, 58, (P, b) => {
      P.part(P.rect(0, 0, 66, 58), C.stone, { b: 2, sh: 0, hi: 0, ol: 0 });
      BG.bricks(b, P.rect(0, 0, 66, 58), 10, 5, C.stone, C.stone[0], 7);
      P.part(P.rect(3, 4, 28, 38), C.olive, { b: 2 });
      P.part(P.ell(17, 16, 6, 7), C.skin, { b: 3 });
      P.part(P.rect(9, 8, 16, 4), C.olive, { b: 1, sh: 0 });
      P.part(P.cap(17, 24, 27, 30, 2, 1.4), C.skin, { b: 3, sh: 0 });
      textOn(b, 'ДАЙ', 8, 33, C.grey[5], 0);
      P.part(P.rect(32, 8, 32, 36), C.night, { b: 1 });
      A.rainbow(P, 48, 30, 11, 1.4);
      textOn(b, 'СКОРО', 34, 34, C.lamp, 0);
    }),
    sybilSign: () => sprite(144, 11, (P, b) => {
      P.part(P.rect(0, 0, 144, 11), C.red, { b: 1 });
      A.leaf(P, 8, 5.4, 0.7, C.grey.slice(1));
      A.leaf(P, 136, 5.4, 0.7, C.grey.slice(1));
      const t = 'КАНАДА. КАНЦЕЛЯРИЯ';
      textOn(b, t, Math.floor((144 - S.font.measure(t)) / 2), 2, C.grey[5], 0);
    }),
    sybilPlate: () => sprite(36, 20, (P, b) => {
      P.part(P.rect(0, 0, 36, 20), C.gold, { b: 3 });
      textOn(b, 'Е. В.', 9, 1, C.gold[0], 0);
      textOn(b, 'СИБИЛ', 4, 10, C.gold[0], 0);
    }),
    boscoBanner: () => sprite(148, 11, (P, b) => {
      const m = P.rect(0, 0, 148, 11);
      P.part(m, C.rose, { b: 3 });
      m.each((x, y) => { if (b.px[y * b.w + x] !== C.black && (x % 8 === 3) && (y % 5 === 2)) b.set(x, y, C.pink[4]); });
      const t = 'ЛАВКА МАМАШИ БОСКО';
      textOn(b, t, Math.floor((148 - S.font.measure(t)) / 2), 2, C.plum[0], 0);
    }),
    doily: () => sprite(30, 18, P => {
      P.part(P.ell(15, 9, 14, 8), C.grey, { b: 5, sh: 0 });
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; P.px(15 + Math.cos(a) * 10, 9 + Math.sin(a) * 5.4, C.pink[3]); }
      P.part(P.ell(15, 9, 4, 2.6), C.pink, { b: 3, sh: 0, hi: 0 });
    }),
    hughstand: () => sprite(48, 34, (P, b) => {
      const cloth = P.part(P.rect(1, 12, 46, 22), C.grey, { b: 4 });
      cloth.each((x, y) => { if (b.px[y * b.w + x] !== C.black && y > 13 && (x + y) % 3 === 0) b.set(x, y, A.BOW[Math.floor((x + y) / 7) % 7][1]); });
      P.part(P.poly([3, 0, 46, 1, 46, 11, 3, 10]), C.cream, { b: 4 });
      textOn(b, 'НА ЛУНЕ', 6, 2, C.purple[2], 0);
      P.part(P.rect(8, 8, 9, 4.6), C.pink, { b: 3, sh: 0 });
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
    }),
    meter: g => sprite(44, 56, P => A.meter(P, 6, 54, !(g && g.f.jimmyFlown)))
  });

  lay('bosco', {
    counter: () => S.LAYERS.bosco.counter(),
    table: () => S.LAYERS.bosco.table(),
    glovearm: g => sprite(90, 40, (P, b) => {
      S.blit(b, S.LAYERS.bosco.glovearm(g), 0, 0);
      const m = P.ell(18, 10, 8, 7);
      m.each((x, y) => { if (b.px[y * b.w + x] && b.px[y * b.w + x] !== C.black && (x + y) % 2) b.set(x, y, C.pink[3]); });
    }),
    micro: g => sprite(32, 20, P => A.micro(P, 16, 19, !!(g && g.vt.microT && g.time < g.vt.microT))),
    late: () => sprite(40, 18, P => {
      P.part(P.rect(1, 1, 6, 9), C.grey, { b: 5, sh: 1 });
      P.line(2, 4, 5, 4, C.grey[2]); P.part(P.ell(4, 8, 1.4, 1.2), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(9, 2, 7, 5), C.grey, { b: 0 });
      P.px(11, 4, C.eye); P.px(14, 4, C.eye);
      P.part(P.ell(20.5, 5.4, 3.4, 3.4), C.gold, { b: 3 });
      P.line(20.5, 5.4, 22.6, 3.6, C.red[3]);
      P.part(P.rect(26, 2, 5.6, 4), C.cream, { b: 4, sh: 0 });
      P.line(27, 4, 30, 4, C.red[2]);
      const sheet = P.rect(33, 1, 6, 8);
      P.part(sheet, C.cream, { b: 4, sh: 0 });
      sheet.each((x, y) => { if ((x % 2 === 0 || y % 2 === 0) && P.b.px[y * P.b.w + x] !== C.black) P.b.set(x, y, C.sky[3]); });
      for (let i = 0; i < 5; i++) P.line(4 + i * 8.2, 0, 4 + i * 8.2, 1, C.grey[4]);
    }),
    quake: g => sprite(24, 24, P => {
      if (!(g && g.f.remoteGot)) A.remote(P, 11, 20, 0.8);
      const dome = P.path('M 3 22 L 3 10 Q 3 2 12 2 Q 21 2 21 10 L 21 22');
      S.outline(P.b, dome, C.sky[4]);
      P.part(P.rect(1, 21, 22, 3), C.wood, { b: 2 });
      P.px(6, 8, C.eye); P.px(7, 7, C.eye);
    }),
    dish: () => sprite(38, 48, (Q, b) => {
      const P = new Pen(b).at(0, 8, 1);
      P.part(P.rect(15, 24, 4, 14), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(17, 38, 9, 2.4), C.grey, { b: 1 });
      P.part(P.ell(17, 16, 15, 11, -0.5), C.grey, { b: 4 });
      P.part(P.ell(19, 15, 11, 7.6, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
      P.line(19, 15, 30, 4, C.grey[1]);
      P.part(P.ell(30, 4, 2, 2), A.NEON_R, { b: 3, sh: 0, hi: 0 });
    }),
    rack: () => sprite(18, 62, P => {
      P.part(P.rect(8, 4, 2, 56), C.wood, { b: 2, sh: 0 });
      P.part(P.ell(9, 60, 6, 2), C.wood, { b: 1 });
      P.part(P.ell(9, 8, 6.4, 1.6), C.night, { b: 1, sh: 0 });
      P.part(P.path('M 5 8 Q 5 2 9 2 Q 13 2 13 8 Z'), C.night, { b: 1 });
      P.part(P.path('M 3 22 Q 3 16 9 16 Q 15 16 15.6 20 Q 12 22 3 22 Z'), C.night, { b: 1 });
      P.part(P.path('M 3 36 L 4 28 Q 9 26 14 28 L 15 36 Q 9 33 3 36 Z'), C.asphalt, { b: 2 });
      P.part(P.ell(9, 31, 1.6, 1.6), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.poly([3, 46, 9, 41, 8, 48]), C.cream, { b: 4, sh: 1 });
      P.part(P.poly([15, 46, 9, 41, 10, 48]), C.cream, { b: 4, sh: 1 });
      P.px(9, 54, C.grey[3]);
    }),
    weenies: g => sprite(30, 26, (P, b) => {
      const k = g ? Math.floor(g.time * 2) % 2 : 0;
      P.part(P.rect(0, 8, 30, 18), C.grey, { b: 2 });
      const glass = P.rect(2, 10, 26, 12);
      S.grad(b, glass, C.orange, (x, y) => 0.75 - (y - 10) / 30);
      for (let i = 0; i < 3; i++) {
        P.part(P.cap(5, 13 + i * 3.4, 25, 13 + i * 3.4, 1.4), C.stone, { b: 2 + ((i + k) % 2), sh: 0 });
        P.px(8 + ((i * 5 + k * 3) % 14), 13 + i * 3.4, C.olive[3]);
      }
      S.outerLine(b, glass, C.black);
      P.part(P.rect(3, 0, 24, 9), C.red, { b: 3 });
      S.font.draw(b, 'HOT', 7, 1, C.yellow[4], 0);
      P.part(P.poly([11, 8, 15, 5.4, 15, 10.6]), C.pink, { b: 3, sh: 0 });
      P.part(P.poly([19, 8, 15, 5.4, 15, 10.6]), C.pink, { b: 3, sh: 0 });
    })
  });

  lay('sybil', {
    couch: g => S.LAYERS.sybil.couch(g),
    lamp: () => S.LAYERS.sybil.lamp(),
    bags: () => sprite(64, 30, P => {
      for (const [x, s] of [[12, 1], [32, 1.1], [52, 0.9]]) {
        P.part(P.path(`M ${x - 9 * s} 29 Q ${x - 11 * s} ${14} ${x - 4 * s} ${10} L ${x + 4 * s} ${10} Q ${x + 11 * s} ${14} ${x + 9 * s} 29 Z`), C.sand, { b: 3 });
        P.part(P.rect(x - 4 * s, 7, 8 * s, 3.4), C.sand, { b: 2, sh: 0 });
        A.leaf(P, x, 20, 0.7);
      }
    }),
    plaque: () => sprite(70, 18, (P, b) => {
      P.part(P.rect(0, 0, 70, 18), C.oak, { b: 3 });
      P.part(P.rect(3, 3, 64, 12), C.cream, { b: 4, sh: 0, hi: 0 });
      textOn(b, 'РАССЛАБЬТЕСЬ', 6, 5, C.teal[1], 0);
    }),
    fox: () => sprite(34, 34, P => {
      P.part(P.rect(0, 30, 34, 4), C.wood, { b: 3 });
      P.part(P.poly([10, 30, 24, 30, 22, 22, 12, 22]), C.brick, { b: 3 });
      P.part(P.ell(17, 17, 5.4, 6.4), C.green, { b: 3 });
      for (const [x, y] of [[13, 14], [20, 13], [16, 19], [21, 18]]) P.px(x, y, C.eye);
      P.part(P.ell(8, 18, 3, 2.4), C.green, { b: 2 });
      P.part(P.path('M 9 12 Q 4 8 8 3 Q 11 7 13 11 Z'), C.orange, { b: 3 });
      P.part(P.ell(17, 9, 7, 4.4), C.orange, { b: 3 });
      P.part(P.poly([22, 1, 25, -3, 27, 2]), C.orange, { b: 2, sh: 0 });
      P.part(P.ell(26, 5, 4.6, 4), C.orange, { b: 3 });
      P.part(P.poly([29, 4, 34, 6.4, 29, 8]), C.cream, { b: 4, sh: 0 });
      P.px(33, 6.4, C.black);
      P.px(27, 4, C.pupil);
      P.part(P.poly([23.6, 1.6, 23.2, -1.6, 25, 0.2, 26.4, -2, 27.8, 0.2, 29.4, -1.6, 29, 1.6]), C.gold, { b: 4, sh: 0 });
      P.part(P.ell(7, 5, 2, 2.4), C.cream, { b: 4, sh: 0 });
    }),
    flag: () => sprite(30, 74, P => {
      P.part(P.rect(3, 2, 2, 70), C.oak, { b: 3, sh: 0 });
      P.part(P.ell(4, 72, 5, 1.8), C.oak, { b: 1 });
      P.part(P.ell(4, 2, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
      P.part(P.poly([5, 5, 29, 6, 28, 22, 5, 23]), C.grey, { b: 5 });
      P.part(P.rect(5, 5.4, 6, 17), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(23, 6.2, 5.4, 15.4), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      A.leaf(P, 17, 14, 0.9);
    }),
    hockey: () => sprite(24, 44, P => {
      P.line(16, 2, 8, 38, C.oak[2]);
      P.line(17, 2, 9, 38, C.oak[3]);
      P.part(P.poly([8, 37, 10, 37.4, 3, 43, 1, 41]), C.oak, { b: 3, sh: 0 });
      P.part(P.rect(15, 1, 3.4, 5), C.night, { b: 1, sh: 0 });
      P.part(P.ell(18, 41.4, 4, 1.8), C.night, { b: 1 });
    }),
    desk: g => sprite(64, 56, (P, b) => {
      const Q = new Pen(b).at(0, 8, 1);
      Q.part(Q.poly([2, 12, 62, 10, 64, 18, 0, 20]), C.wood, { b: 3 });
      Q.part(Q.poly([0, 20, 64, 18, 64, 48, 0, 48]), C.wood, { b: 2 });
      Q.part(Q.rect(6, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      Q.part(Q.rect(36, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      A.leaf(Q, 17, 34, 0.9, C.gold);
      A.leaf(Q, 47, 34, 0.9, C.gold);
      Q.part(Q.poly([5, 12, 17, 12, 19, 5, 7, 5]), C.pink, { b: 3 });
      Q.part(Q.cap(5, 4, 19, 4, 2), C.pink, { b: 3 });
      const ring = g && g.vt.ringT && g.time < g.vt.ringT && Math.floor(g.time * 12) % 2;
      if (ring) { Q.line(2, -1, 0, -4, C.lamp); Q.line(22, -1, 24, -4, C.lamp); Q.line(12, -2, 12, -6, C.lamp); }
      Q.part(Q.rect(26, 8, 10, 5), C.red, { b: 2 });
      Q.part(Q.rect(29, 3, 4, 5), C.gold, { b: 3, sh: 0 });
      Q.part(Q.poly([40, 12, 60, 11, 60, 6, 40, 7]), C.cream, { b: 4, sh: 0 });
      Q.part(Q.ell(55, 8.6, 2.2, 2), C.red, { b: 3, sh: 0, hi: 0 });
    })
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
