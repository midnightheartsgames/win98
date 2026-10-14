(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const CACHE = new Map();
  const ICONS = {};

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }

  function cheeseWedge(P, x, y, s, ramp, holes) {
    P.part(P.poly([x - 9 * s, y + 5 * s, x + 9 * s, y + 5 * s, x + 9 * s, y - 1 * s, x - 5 * s, y - 6 * s]), ramp, { b: 3 });
    P.part(P.poly([x + 9 * s, y + 5 * s, x + 11 * s, y + 3 * s, x + 11 * s, y - 3 * s, x + 9 * s, y - 1 * s]), ramp, { b: 2, sh: 0, hi: 0 });
    if (holes) for (const [dx, dy] of [[-4, 1], [2, 2], [5, -1], [-1, -2]]) P.part(P.ell(x + dx * s, y + dy * s, 1.3 * s, 1.1 * s), ramp, { b: 0, sh: 0, hi: 0, ol: ramp[1] });
  }

  ICONS.max = () => { const b = new Buf(24, 20); const s = S.sprite('max', { act: 'head' }, 0.6); S.blit(b, s.buf, 12 - s.ox, 17 - s.oy); return b; };
  ICONS.maxhead = () => { const b = new Buf(24, 20); const s = S.sprite('max', { act: 'head', hypno: true }, 0.6); S.blit(b, s.buf, 12 - s.ox, 17 - s.oy); return b; };
  ICONS.gun = () => mk(24, 20, P => {
    P.part(P.poly([3, 6, 20, 6, 20, 9.5, 9, 10, 9, 12, 7, 17, 3, 17, 4, 10]), C.grey, { b: 1 });
    P.part(P.ell(10.5, 11, 2.5, 2.2), C.grey, { b: 1, sh: 0 });
    P.part(P.poly([4, 11, 7.5, 11, 6.5, 17, 3.5, 17]), C.wood, { b: 2, sh: 0 });
    P.px(19, 5, C.grey[4]); P.line(9, 7, 19, 7, C.grey[3]);
  });
  ICONS.swiss = () => mk(24, 20, P => cheeseWedge(P, 11, 11, 1, C.cheese, true));
  ICONS.cheese = () => mk(24, 20, P => {
    P.part(P.ell(12, 13, 10, 5), C.orange, { b: 3 });
    P.part(P.rect(2, 8, 20, 5), C.orange, { b: 3, sh: 0 });
    P.part(P.ell(12, 8, 10, 4.5), C.orange, { b: 4, sh: 0 });
    P.part(P.poly([12, 8, 22, 6, 22, 11, 12, 13]), C.cheese, { b: 3, sh: 0 });
  });
  ICONS.glove = () => mk(24, 20, P => {
    P.part(P.ell(10, 10, 8, 7), C.red, { b: 3 });
    P.part(P.ell(4.5, 9, 3.5, 4), C.red, { b: 3 });
    P.part(P.rect(16, 6, 6, 9), C.grey, { b: 5, sh: 1 });
    P.line(17, 10, 21, 10, C.grey[2]);
  });
  ICONS.ball = () => mk(24, 20, P => {
    P.part(P.ell(12, 10, 8, 8), C.purple, { b: 2 });
    P.px(10, 6, C.black); P.px(13, 6, C.black); P.px(11, 9, C.black); P.px(8, 8, C.purple[4]);
  });
  ICONS.hanger = () => mk(24, 20, P => {
    P.curve('M 12 3 Q 15 3 14 6 L 12 8 L 2 15 L 22 15 L 12 8', C.grey[4]);
    P.curve('M 12 4 Q 14 4 13 6', C.grey[1]);
    P.line(3, 16, 21, 16, C.grey[1]);
  });
  ICONS.antenna = ICONS.hanger;
  ICONS.tape = () => mk(24, 20, P => {
    P.part(P.rect(2, 5, 20, 11), C.grey, { b: 0 });
    P.part(P.rect(5, 6, 14, 5), C.eye, { sh: 0, hi: 0 });
    P.part(P.ell(8.5, 8.5, 2.6, 1.8), C.red, { b: 3, sh: 0, hi: 0 });
    P.px(8.5, 8.5, C.pupil);
    P.line(12, 7, 17, 7, C.red[2]); P.line(12, 9, 16, 9, C.red[2]);
    P.part(P.ell(8, 13.5, 1.6, 1.6), C.grey, { b: 3, sh: 0, hi: 0 });
    P.part(P.ell(16, 13.5, 1.6, 1.6), C.grey, { b: 3, sh: 0, hi: 0 });
  });
  ICONS.tapes = () => mk(24, 20, P => {
    P.part(P.poly([2, 8, 20, 7, 22, 18, 3, 19]), C.oak, { b: 3 });
    P.part(P.rect(4, 3, 7, 6), C.grey, { b: 0, sh: 0 });
    P.part(P.rect(11, 2, 7, 6), C.grey, { b: 0, sh: 0 });
    P.px(7, 5, C.red[3]); P.px(14, 4, C.red[3]);
    P.line(3, 12, 21, 11, C.oak[1]);
  });
  ICONS.spray = () => mk(24, 20, P => {
    P.part(P.rect(8, 6, 8, 13), C.green, { b: 3 });
    P.part(P.rect(9.5, 3, 5, 3), C.grey, { b: 4, sh: 0 });
    P.part(P.rect(11, 1, 2, 2), C.grey, { b: 1, sh: 0, hi: 0 });
    P.part(P.rect(8, 10, 8, 3), C.yellow, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) P.px(16 + i * 1.5, 2 - (i % 2), C.green[4]);
  });
  ICONS.cash = () => mk(24, 20, P => {
    P.part(P.path('M 6 18 Q 2 12 7 8 L 9 6 L 7 3 L 17 3 L 15 6 L 17 8 Q 22 12 18 18 Z'), C.sand, { b: 3 });
    P.line(8, 6, 16, 6, C.sand[0]);
    S.font.draw(P.b, '$', 9, 8, C.green[2], 0);
  });
  ICONS.launcher = () => mk(24, 20, P => {
    P.part(P.poly([2, 7, 17, 5, 18, 11, 3, 12]), C.olive, { b: 2 });
    P.part(P.ell(18, 8, 3.5, 3.8), C.olive, { b: 3 });
    P.part(P.ell(19, 8, 2, 2.4), C.grey, { b: 0, sh: 0, hi: 0 });
    P.part(P.poly([6, 11, 10, 11, 9, 18, 5, 18]), C.wood, { b: 2, sh: 0 });
    P.part(P.poly([11, 11, 13, 11, 12.5, 15, 11, 15]), C.grey, { b: 1, sh: 0, hi: 0 });
    P.px(8, 8, C.yellow[3]); P.px(10, 8, C.yellow[3]);
  });
  const paper = (P, signed) => {
    P.part(P.poly([5, 2, 17, 2, 20, 5, 20, 19, 5, 19]), C.grey, { b: 5, sh: 1 });
    P.part(P.poly([17, 2, 17, 5, 20, 5]), C.grey, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 5; i++) P.line(7, 6 + i * 2.4, 17, 6 + i * 2.4, C.grey[2]);
    P.part(P.ell(9, 5, 1.5, 1.2), C.red, { b: 3, sh: 0, hi: 0 });
    if (signed) P.curve('M 8 17 Q 10 13 12 17 Q 14 14 16 16 L 19 14', C.blue[2]);
  };
  ICONS.form = () => mk(24, 20, P => paper(P, false));
  ICONS.formok = () => mk(24, 20, P => paper(P, true));
  ICONS.pump = () => mk(24, 20, P => {
    P.part(P.rect(10, 5, 4, 12), C.grey, { b: 3 });
    P.part(P.rect(5, 2, 14, 3), C.grey, { b: 1, sh: 0 });
    P.part(P.rect(7, 17, 10, 2), C.grey, { b: 1, sh: 0 });
    P.curve('M 14 15 Q 20 16 20 11', C.black);
  });
  ICONS.diagram = () => mk(24, 20, P => {
    P.part(P.poly([2, 3, 22, 2, 22, 18, 3, 18]), C.blue, { b: 2 });
    P.curve('M 7 14 Q 7 6 12 6 Q 17 6 17 14 Z', C.sky[4]);
    P.line(12, 6, 12, 3, C.sky[4]);
    P.line(5, 15, 19, 15, C.sky[4]);
    P.px(6, 5, C.sky[4]); P.px(18, 5, C.sky[4]);
  });
  ICONS.helmet = () => mk(24, 20, P => {
    P.part(P.path('M 3 15 Q 3 5 12 5 Q 21 5 21 15 Z'), C.grey, { b: 4 });
    for (let i = 0; i < 4; i++) P.px(7 + i * 3, 10 + (i % 2), C.grey[1]);
    P.part(P.rect(2, 14, 20, 3), C.grey, { b: 3, sh: 0 });
    P.line(12, 5, 13, 1, C.grey[1]);
    P.part(P.poly([4, 10, 20, 9, 20, 11, 4, 12]), C.gold, { b: 3, sh: 0, hi: 0 });
  });
  ICONS.money = () => mk(24, 20, P => { P.part(P.ell(12, 10, 8, 8), C.gold, { b: 3 }); S.font.draw(P.b, '$', 10, 6, C.gold[1], 0); });
  ICONS.star = () => mk(24, 20, P => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.8 : 8.5; pts.push(12 + Math.cos(a) * r, 10.5 + Math.sin(a) * r); }
    P.part(P.poly(pts), C.gold, { b: 3 });
  });
  ICONS.bug = () => mk(24, 20, P => {
    P.part(P.ell(12, 11, 5, 6), C.green, { b: 2 });
    P.part(P.ell(12, 5, 3, 2.5), C.green, { b: 1 });
    for (const y of [8, 11, 14]) { P.line(7, y, 3, y - 1, C.black); P.line(17, y, 21, y - 1, C.black); }
    P.line(12, 6, 12, 16, C.black);
  });
  ICONS.cloud = () => mk(24, 20, P => {
    P.part(P.ell(8, 11, 5, 4), C.grey, { b: 5, sh: 1 });
    P.part(P.ell(14, 9, 6, 5), C.grey, { b: 5, sh: 1 });
    P.part(P.ell(17, 12, 4.5, 3.5), C.grey, { b: 5, sh: 1 });
  });
  ICONS.duck = () => mk(24, 20, P => {
    P.part(P.ell(11, 13, 8, 5), C.yellow, { b: 3 });
    P.part(P.ell(15, 6.5, 4.2, 4), C.yellow, { b: 3 });
    P.part(P.poly([18, 7, 23, 8, 18, 9.5]), C.orange, { b: 3, sh: 0 });
    P.px(16, 5.5, C.pupil);
    P.curve('M 6 12 Q 9 10 12 12', C.yellow[1]);
  });
  function bigGlyph(b, ch, x, y, s, col, hi) {
    const g = S.font.glyph(ch);
    const m = new S.Mask(0, 0, b.w, b.h);
    for (let i = 0; i < g.bits.length; i += 2) for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) m.put(x + g.bits[i] * s + dx, y + g.bits[i + 1] * s + dy, 1);
    m.each((px, py) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!m.has(px + dx, py + dy)) b.set(px + dx, py + dy, C.black); });
    m.each((px, py) => b.set(px, py, !m.has(px - 1, py - 1) && hi ? hi : col));
  }
  ICONS.q = () => mk(24, 20, (P, b) => bigGlyph(b, '?', 8, 2, 2, C.yellow[3], C.yellow[4]));
  ICONS.ex = () => mk(24, 20, P => { P.part(P.poly([9, 1, 15, 1, 13.5, 13, 10.5, 13]), C.red, { b: 3 }); P.part(P.ell(12, 16.5, 2.5, 2.3), C.red, { b: 3 }); });
  ICONS.bye = () => mk(24, 20, P => {
    P.part(P.ell(12, 13, 6, 5.5), C.skin, { b: 3 });
    for (let i = 0; i < 4; i++) P.part(P.cap(7.5 + i * 3, 11, 6.5 + i * 3.4, 3 + Math.abs(i - 1.5), 1.5), C.skin, { b: 3, sh: 0 });
    P.part(P.cap(17, 13, 21, 9, 1.5), C.skin, { b: 3, sh: 0 });
    P.part(P.rect(8, 17, 8, 3), C.suit, { b: 3, sh: 0 });
  });
  ICONS.phone = () => mk(24, 20, P => {
    P.part(P.poly([4, 18, 6, 10, 18, 10, 20, 18]), C.grey, { b: 1 });
    P.part(P.cap(3, 7, 21, 7, 3), C.grey, { b: 1 });
    P.part(P.ell(12, 14, 3, 2.5), C.grey, { b: 3, sh: 0, hi: 0 });
  });
  ICONS.tooth = () => mk(24, 20, P => P.part(P.path('M 6 4 Q 12 1 18 4 Q 19 10 16 17 L 14 11 L 10 11 L 8 17 Q 5 10 6 4 Z'), C.eye, { sh: 0, hi: 0 }));
  ICONS.comb = () => mk(24, 20, P => { P.part(P.rect(3, 5, 18, 4), C.pink, { b: 3 }); for (let i = 0; i < 8; i++) P.line(4 + i * 2.2, 9, 4 + i * 2.2, 15, C.pink[1]); });
  ICONS.fist = () => mk(24, 20, P => { P.part(P.ell(12, 10, 7, 6), C.fur, { b: 3 }); for (let i = 0; i < 3; i++) P.line(8 + i * 3, 6, 8 + i * 3, 10, C.fur[0]); P.part(P.rect(9, 15, 7, 4), C.suit, { b: 3, sh: 0 }); });
  ICONS.cake = () => mk(24, 20, P => { P.part(P.rect(4, 9, 16, 9), C.pink, { b: 3 }); P.part(P.rect(4, 7, 16, 3), C.grey, { b: 5, sh: 0 }); for (const x of [8, 12, 16]) { P.line(x, 3, x, 6, C.sky[3]); P.px(x, 2, C.yellow[4]); } });
  ICONS.wcake = () => mk(24, 20, P => { P.part(P.rect(3, 12, 18, 7), C.grey, { b: 5 }); P.part(P.rect(6, 7, 12, 5), C.grey, { b: 5 }); P.part(P.rect(9, 3, 6, 4), C.grey, { b: 5 }); P.px(11, 1, C.pink[3]); P.px(13, 1, C.pink[3]); });
  ICONS.donut = () => mk(24, 20, P => { P.part(P.ell(12, 11, 9, 6), C.pink, { b: 3 }); P.part(P.ell(12, 11, 3, 2), C.oak, { b: 1, sh: 0, hi: 0 }); for (const [x, y] of [[6, 9], [16, 13], [9, 14], [17, 8]]) P.px(x, y, C.yellow[4]); });
  ICONS.pizza = () => mk(24, 20, P => { P.part(P.poly([3, 4, 21, 4, 12, 19]), C.cheese, { b: 3 }); P.part(P.rect(3, 3, 18, 3), C.oak, { b: 3, sh: 0 }); for (const [x, y] of [[9, 8], [14, 9], [12, 13]]) P.part(P.ell(x, y, 1.6, 1.4), C.red, { b: 2, sh: 0, hi: 0 }); });
  ICONS.heart = () => mk(24, 20, P => P.part(P.path('M 12 18 L 3 9 Q 3 3 8 3 Q 11 3 12 6 Q 13 3 16 3 Q 21 3 21 9 Z'), C.red, { b: 3 }));
  ICONS.zzz = () => mk(24, 20, P => { S.font.draw(P.b, 'Z', 4, 9, C.sky[4]); S.font.draw(P.b, 'Z', 10, 5, C.sky[4]); S.font.draw(P.b, 'z', 16, 2, C.sky[4]); });
  ICONS.note = () => mk(24, 20, P => { P.part(P.ell(8, 15, 3.5, 2.6), C.grey, { b: 0 }); P.part(P.ell(17, 13, 3.5, 2.6), C.grey, { b: 0 }); P.part(P.poly([10, 15, 10, 4, 20, 2, 20, 13, 19, 13, 19, 5, 11, 7, 11, 15]), C.grey, { b: 0, sh: 0, hi: 0 }); });
  ICONS.pray = () => mk(24, 20, P => { P.part(P.path('M 12 2 Q 17 8 16 18 L 8 18 Q 7 8 12 2 Z'), C.skin, { b: 3 }); P.line(12, 4, 12, 17, C.skin[1]); for (const [x, y] of [[4, 5], [20, 5], [3, 11], [21, 11]]) P.px(x, y, C.yellow[4]); });
  ICONS.mask = () => mk(24, 20, P => { P.part(P.path('M 3 5 Q 12 2 21 5 Q 21 16 12 18 Q 3 16 3 5 Z'), C.gold, { b: 3 }); P.part(P.ell(8.5, 9, 2, 1.5), C.black, { b: 0, sh: 0, hi: 0 }); P.part(P.ell(15.5, 9, 2, 1.5), C.black, { b: 0, sh: 0, hi: 0 }); P.curve('M 8 13 Q 12 16 16 13', C.black); });
  ICONS.eye = () => mk(24, 20, P => { P.part(P.path('M 2 10 Q 12 1 22 10 Q 12 19 2 10 Z'), C.eye, { sh: 0, hi: 0 }); P.part(P.ell(12, 10, 4, 4), C.blue, { b: 2, sh: 0, hi: 0 }); P.part(P.ell(12, 10, 1.6, 1.6), C.black, { b: 0, sh: 0, hi: 0 }); });
  ICONS.tv = () => mk(24, 20, P => { P.part(P.rect(2, 4, 20, 14), C.grey, { b: 2 }); P.part(P.rect(4, 6, 13, 10), C.sky, { b: 3, sh: 0, hi: 0 }); P.line(8, 4, 5, 0, C.black); P.line(14, 4, 17, 0, C.black); });
  ICONS.popcorn = () => mk(24, 20, P => { P.part(P.poly([6, 8, 18, 8, 16, 19, 8, 19]), C.red, { b: 3 }); P.line(10, 8, 10, 19, C.grey[5]); P.line(14, 8, 14, 19, C.grey[5]); for (const [x, y] of [[8, 6], [12, 4], [16, 6], [10, 3], [14, 5]]) P.part(P.ell(x, y, 2.2, 2), C.cream, { b: 4, sh: 0 }); });
  ICONS.car = () => mk(24, 20, P => {
    P.part(P.poly([8, 10, 10, 5, 12, 5, 11, 10]), C.sky, { b: 3, sh: 0 });
    P.part(P.rect(12, 8, 5, 2), C.red, { b: 2, sh: 0, hi: 0 });
    P.part(P.path('M 1 15 L 1 11 Q 2 10 5 10 L 19 10 L 23 5 L 23 15 Z'), C.grey, { b: 0, sh: 0 });
    P.part(P.rect(9, 10, 7, 5), C.grey, { b: 5, sh: 0 });
    for (const wx of [6, 18]) { P.part(P.ell(wx, 15, 3, 3), C.grey, { b: 0 }); P.part(P.ell(wx, 15, 1.5, 1.5), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 }); }
  });
  ICONS.badge = () => mk(24, 20, P => { const pts = []; for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6, r = i % 2 ? 5 : 8.5; pts.push(12 + Math.cos(a) * r, 10 + Math.sin(a) * r); } P.part(P.poly(pts), C.gold, { b: 3 }); });
  ICONS.skull = () => mk(24, 20, P => { P.part(P.ell(12, 9, 7, 7), C.cream, { b: 4 }); P.part(P.rect(8, 14, 8, 4), C.cream, { b: 4, sh: 0 }); P.part(P.ell(9, 9, 2, 2), C.black, { b: 0, sh: 0, hi: 0 }); P.part(P.ell(15, 9, 2, 2), C.black, { b: 0, sh: 0, hi: 0 }); });
  ICONS.basket = () => mk(26, 16, P => {
    P.part(P.poly([2, 5, 24, 5, 21, 15, 5, 15]), C.oak, { b: 3 });
    for (let i = 4; i <= 22; i += 3) P.line(i, 6, i - (i - 13) * 0.15, 14, C.oak[1]);
    P.line(3, 9, 23, 9, C.oak[1]);
    P.curve('M 5 5 Q 13 -4 21 5', C.oak[1]);
  });
  ICONS.cheesebit = () => mk(16, 10, P => {
    P.part(P.poly([1, 8, 14, 8, 13, 3, 4, 1]), C.orange, { b: 3 });
  });
  ICONS.box = () => mk(28, 22, P => {
    P.part(P.poly([3, 8, 22, 6, 25, 20, 4, 21]), C.oak, { b: 3 });
    P.part(P.poly([3, 8, 0, 3, 12, 2, 13, 7]), C.oak, { b: 4, sh: 0 });
    P.part(P.poly([22, 6, 27, 1, 16, 1, 13, 7]), C.oak, { b: 2, sh: 0 });
    P.part(P.poly([11, 7, 15, 6.6, 16.5, 20.4, 12.5, 20.8]), C.sand, { b: 4, sh: 0, hi: 0 });
    P.line(6, 15, 9, 13, C.oak[1]); P.line(18, 16, 22, 14, C.oak[1]);
  });
  ICONS.boxOpen = () => mk(28, 22, P => {
    P.part(P.poly([3, 8, 22, 6, 25, 20, 4, 21]), C.oak, { b: 3 });
    P.part(P.poly([3, 8, 13, 7, 12, 10, 4, 11]), C.oak, { b: 0, sh: 0, hi: 0 });
    P.part(P.poly([3, 8, -1, 0, 3, 0, 7, 7]), C.oak, { b: 4, sh: 0 });
    P.part(P.poly([22, 6, 28, 0, 24, 0, 18, 7]), C.oak, { b: 2, sh: 0 });
    P.part(P.poly([11, 10, 15, 9.6, 16.5, 20.4, 12.5, 20.8]), C.sand, { b: 4, sh: 0, hi: 0 });
  });
  for (const id of ['jimmy', 'bosco', 'sybil', 'brady', 'specs', 'whizzer', 'peepers', 'poppers', 'monkey', 'sam']) ICONS['f:' + id] = () => S.art.portrait(id);
  ICONS['f:max'] = ICONS.max;

  const CURSORS = {
    walk: ['..##.....', '.####....', '.####....', '..##..##.', '......####', '......####', '.......##.'],
    look: ['..#####..', '.#.....#.', '#..###..#', '#..#.#..#', '#..###..#', '.#.....#.', '..#####..'],
    use: ['...#.#.#..', '...#.#.#.#', '.#.#.#.#.#', '.#########', '.########.', '..#######.', '...#####..'],
    talk: ['.#######.', '#########', '##.#.#.##', '#########', '.##...##.', '..#####..'],
    wait: ['#######', '.#####.', '..###..', '...#...', '..#.#..', '.#...#.', '#######']
  };
  const CURSOR_COL = { walk: C.yellow, look: C.sky, use: C.orange, talk: C.pink, wait: C.grey };

  function cursor(verb, hot) {
    const key = 'cur:' + verb + (hot ? 1 : 0);
    if (CACHE.has(key)) return CACHE.get(key);
    const rows = CURSORS[verb] || CURSORS.walk;
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const b = new Buf(w + 2, h + 2);
    const ramp = CURSOR_COL[verb] || C.grey;
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '#') {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!b.get(x + 1 + dx, y + 1 + dy)) b.set(x + 1 + dx, y + 1 + dy, C.black);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '#') b.set(x + 1, y + 1, hot ? ramp[4] : ramp[2]);
    const r = { buf: b, hx: Math.floor((w + 2) / 2), hy: Math.floor((h + 2) / 2) };
    CACHE.set(key, r);
    return r;
  }

  function icon(id) {
    if (CACHE.has(id)) return CACHE.get(id);
    let b = null;
    if (ICONS[id]) b = ICONS[id]();
    else if (S.ITEMS && S.ITEMS[id] && S.ITEMS[id].icon && ICONS[S.ITEMS[id].icon]) b = ICONS[S.ITEMS[id].icon]();
    if (!b) b = ICONS.q();
    CACHE.set(id, b);
    return b;
  }

  S.ICONS = ICONS;
  S.icon = icon;
  S.cursor = cursor;
  S.iconCache = CACHE;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
