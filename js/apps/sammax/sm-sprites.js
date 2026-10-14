(function (S) {
  'use strict';
  const { C, Buf, Pen, crop } = S;
  const TAU = Math.PI * 2;
  const COSTUMES = {};
  const CACHE = new Map();

  function walkPose(ph, amp) {
    const a = Math.sin(ph * TAU) * (amp || 0.42);
    const lift = Math.max(0, Math.sin(ph * TAU + Math.PI / 2));
    const bob = -Math.abs(Math.sin(ph * TAU)) * 1.2;
    return { a, lift, bob };
  }

  function legSide(P, hx, hy, ang, len, lift, ramp, footRamp, fb, pantsB) {
    const ax = hx + Math.sin(ang) * len;
    const ay = hy + Math.cos(ang) * len - lift;
    P.part(P.cap(hx, hy, ax, ay, 3.6, 3.1), ramp, { b: pantsB === undefined ? 3 : pantsB, sh: 1 });
    P.part(P.ell(ax + 3, ay + 1.4, 5, 2.3), footRamp, { b: fb, sh: 1 });
    return { ax, ay };
  }

  function samArmSide(P, sx, sy, fa, len, b) {
    const hx = sx + Math.sin(fa) * len, hy = sy + Math.cos(fa) * len;
    P.part(P.cap(sx, sy, hx, hy, 3.1, 2.7), C.suit, { b, sh: 1 });
    P.part(P.ell(hx + 0.8, hy + 1, 3, 2.7), C.fur, { b, sh: 1 });
    return { hx, hy };
  }

  function samSide(P, o) {
    const w = o.walk >= 0 ? walkPose(o.walk, 0.5) : { a: 0, lift: 0, bob: 0 };
    const by = w.bob;
    const act = o.act || '';
    const fur = C.fur, suit = C.suit;
    let back = w.a * 0.8;
    if (act === 'box') back = 1.0;
    if (act === 'hypno') back = 1.45;
    samArmSide(P, -2, -40 + by, back, 10, 2);
    legSide(P, -1.5, -16 + by, -w.a, 13, w.a < 0 ? w.lift * 2 : 0, suit, fur, 2, 2);
    legSide(P, 1.5, -16 + by, w.a, 13, w.a > 0 ? w.lift * 2 : 0, suit, fur, 3, 3);
    P.part(P.path(`M -6 ${-44 + by} Q -11.5 ${-36 + by} -11 ${-25 + by} L -10.5 ${-14 + by} L 11.5 ${-14 + by} Q 14.5 ${-20 + by} 13.5 ${-28 + by} Q 11.5 ${-38 + by} 6 ${-44 + by} Z`), suit, { b: 3 });
    P.line(-10, -14 + by, 11, -14 + by, C.black);
    P.line(-2, -16 + by, 2, -17 + by, suit[1]);
    P.part(P.poly([3, -44 + by, 7, -43 + by, 8.5, -35 + by, 5.5, -37 + by]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.part(P.poly([5.5, -43 + by, 7.5, -42.5 + by, 10, -30 + by, 8, -29.5 + by]), C.navy, { b: 2, sh: 0, hi: 0 });
    P.line(6.5, -39 + by, 8.5, -40 + by, C.navy[3]);
    P.line(7.5, -34.5 + by, 9.5, -35.5 + by, C.navy[3]);
    samHeadSide(P.scaled(0, -44 + by, 1.12), 0, by, o);
    let fa = -w.a * 0.8, len = 10;
    if (act === 'reach' || act === 'use') { fa = 1.3; len = 13; }
    if (act === 'shoot' || act === 'spray') { fa = 1.55; len = 13; }
    if (act === 'point') { fa = 2.2; len = 13; }
    if (act === 'phone') { fa = 2.85; len = 11; }
    if (act === 'hypno') { fa = 1.5; len = 13; }
    if (act === 'box') fa = 1.0;
    if (act === 'throw') { fa = 3.0; len = 12; }
    if (act === 'box') samBox(P, 8, -27 + by);
    const h = samArmSide(P, 2, -40 + by, fa, len, 3);
    if (act === 'shoot') {
      P.part(P.poly([h.hx + 1, h.hy - 3.5, h.hx + 13, h.hy - 3.5, h.hx + 13, h.hy - 1, h.hx + 4, h.hy, h.hx + 3, h.hy + 3, h.hx, h.hy + 3]), C.grey, { b: 1, sh: 0 });
      P.px(h.hx + 12, h.hy - 4, C.grey[4]);
    }
    if (act === 'spray') {
      P.part(P.rect(h.hx + 1, h.hy - 5, 3.5, 7), C.red, { b: 3, sh: 0 });
      P.px(h.hx + 2, h.hy - 6, C.grey[4]);
    }
    if (act === 'phone') P.part(P.cap(h.hx - 1, h.hy + 1, h.hx + 5, h.hy - 7, 1.7), C.grey, { b: 1, sh: 0 });
  }

  function samBox(P, x, y) {
    P.part(P.poly([x - 7, y - 7, x + 9, y - 8, x + 10, y + 5, x - 6, y + 6]), C.oak, { b: 3 });
    P.line(x - 6, y - 2, x + 9, y - 3, C.oak[1]);
    P.part(P.rect(x - 3, y - 11, 5, 3.5), C.grey, { b: 1, sh: 0, hi: 0 });
    P.part(P.rect(x + 2, y - 11.5, 5, 4), C.grey, { b: 1, sh: 0, hi: 0 });
    P.px(x - 1, y - 10, C.yellow[3]); P.px(x + 4, y - 10, C.yellow[3]);
  }

  function samEye(P, x, y, o, side) {
    const hyp = o.act === 'hypno' || o.hypno;
    if (o.v === 'blind') {
      P.part(P.rect(x - 3, y - 2, 6, 3.6), C.night, { b: 0, sh: 0, hi: 0 });
      P.px(x - 1, y - 1, C.night[2]);
    } else if (hyp) {
      P.part(P.ell(x, y, 2.2, 2.6), C.eye, { sh: 0, hi: 0 });
      P.px(x, y, C.cycle[0]); P.px(x + 1, y, C.cycle[2]); P.px(x, y - 1, C.cycle[4]); P.px(x - 1, y, C.cycle[6]);
    } else if (o.blink) {
      P.line(x - 1.5, y, x + 1.5, y, C.black);
    } else {
      P.part(P.ell(x, y, 2, 2.5), C.eye, { sh: 0, hi: 0 });
      P.px(x + side, y, C.pupil); P.px(x + side, y + 1, C.pupil);
    }
  }

  function samHeadSide(P, x, by, o) {
    const fur = C.fur;
    const talk = o.talk ? 1 : 0;
    const jaw = talk * 2.4;
    P.part(P.ell(x + 0.5, -49.5 + by, 9.5, 8.5), fur, { b: 3 });
    if (talk) P.part(P.poly([x + 6, -47 + by, x + 17, -48 + by, x + 15, -44 + by, x + 6, -43.5 + by]), C.red, { b: 1, sh: 0, hi: 0 });
    P.part(P.path(`M ${x + 4} ${-43 + by + jaw} Q ${x + 10} ${-40 + by + jaw} ${x + 16.5} ${-44 + by + jaw * 0.6} L ${x + 15.5} ${-47 + by + jaw * 0.4} L ${x + 5} ${-47.5 + by + jaw * 0.6} Z`), fur, { b: 2, sh: 1 });
    P.part(P.path(`M ${x + 4} ${-56 + by} C ${x + 10} ${-59 + by} ${x + 18} ${-58.5 + by} ${x + 20.5} ${-54 + by} C ${x + 22} ${-50 + by} ${x + 19} ${-46.5 + by} ${x + 13} ${-46.5 + by} L ${x + 5} ${-46 + by} Z`), fur, { b: 3 });
    P.part(P.ell(x + 20, -55 + by, 2.7, 2.2), C.grey, { b: 0, sh: 0, hi: 1 });
    P.px(x + 19, -56 + by, C.grey[3]);
    P.curve(`M ${x + 20} ${-49.5 + by} Q ${x + 15} ${-47.3 + by} ${x + 8} ${-47.2 + by}`, C.fur[0]);
    samEye(P, x + 8, -55 + by, o, 1);
    P.line(x + 5.5, -58 + by, x + 10, -58.6 + by, C.fur[1]);
    if (o.v === 'foam') samFoam(P, [[x + 8, -44.5 + by, 1.9], [x + 11, -43.5 + by, 2.1], [x + 14.2, -44.8 + by, 1.7], [x + 9.5, -41.8 + by, 1.4], [x + 12.8, -40.8 + by, 1.3], [x + 16.3, -46.2 + by, 1.2]], [[x + 10, -39.5 + by], [x + 13.5, -38.6 + by]]);
    P.part(P.path(`M ${x - 1} ${-55 + by} Q ${x - 6.5} ${-52 + by} ${x - 6.5} ${-44 + by} Q ${x - 6} ${-37 + by} ${x - 3.5} ${-37 + by} Q ${x - 1} ${-38 + by} ${x - 1} ${-44 + by} Q ${x + 0.5} ${-50 + by} ${x + 2} ${-54 + by} Z`), fur, { b: 2, sh: 1 });
    if (o.helmet) samHelmet(P, x, by);
    else samHat(P, x, by);
  }

  function samFoam(P, blobs, drips) {
    for (const [fx, fy, r] of blobs) P.part(P.ell(fx, fy, r, r * 0.85), C.grey, { b: 5, sh: 0, hi: 0 });
    for (const [dx, dy] of drips) { P.line(dx, dy - 1.5, dx, dy + 1, C.grey[5]); P.px(dx, dy + 2, C.grey[4]); }
  }

  function samHat(P, x, by) {
    P.part(P.path(`M ${x - 7} ${-57 + by} L ${x - 6} ${-64.5 + by} Q ${x + 1} ${-68 + by} ${x + 8.5} ${-64.5 + by} L ${x + 9.5} ${-57 + by} Z`), C.suit, { b: 3 });
    P.part(P.poly([x - 7, -59.8 + by, x + 9.3, -59.8 + by, x + 9.5, -57.2 + by, x - 7, -57.2 + by]), C.navy, { b: 2, sh: 0, hi: 0 });
    P.part(P.ell(x + 1.5, -57 + by, 13.5, 2.5), C.suit, { b: 3, sh: 1 });
    P.line(x - 1, -66 + by, x + 3.5, -66 + by, C.suit[1]);
  }

  function samHelmet(P, x, by) {
    P.part(P.ell(x + 1, -59 + by, 10.5, 8), C.grey, { b: 4 });
    for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) P.px(x + 1 + i * 3 + j, -61 + by + j * 3 - Math.abs(i), C.grey[1]);
    P.part(P.rect(x - 10, -57 + by, 22, 2.2), C.grey, { b: 3, sh: 0 });
    P.part(P.poly([x - 7, -62 + by, x + 9, -63 + by, x + 9, -61 + by, x - 7, -60 + by]), C.gold, { b: 3, sh: 0, hi: 0 });
    P.line(x + 1, -67 + by, x + 2, -74 + by, C.grey[1]);
    P.line(x + 2, -67 + by, x + 3, -74 + by, C.grey[4]);
    P.curve(`M ${x + 2} ${-74 + by} Q ${x - 4} ${-78 + by} ${x + 2} ${-80 + by} Q ${x + 7} ${-78 + by} ${x + 2} ${-74 + by}`, C.grey[4]);
  }

  function samKO(P, o) {
    P.part(P.ell(2, -5.5, 16, 5.5), C.suit, { b: 3 });
    P.part(P.cap(14, -3.5, 24, -3, 3.4, 3), C.suit, { b: 2 });
    P.part(P.ell(26.5, -3, 4.5, 2.4, 1.3), C.fur, { b: 3 });
    P.part(P.cap(10, -4, 18, -1.5, 3.2, 3), C.suit, { b: 3 });
    P.part(P.ell(20, -1.5, 4.5, 2.2, 1.2), C.fur, { b: 3 });
    P.part(P.ell(-17, -8, 9, 7.5), C.fur, { b: 3 });
    P.part(P.path('M -20 -12 C -26 -13 -33 -11 -35 -7 C -36 -3 -32 -1 -27 -1.5 L -20 -3 Z'), C.fur, { b: 3 });
    P.part(P.ell(-34.5, -8, 2.5, 2), C.grey, { b: 0, sh: 0, hi: 1 });
    P.line(-22, -12, -19, -10, C.black); P.line(-22, -10, -19, -12, C.black);
    P.part(P.ell(-8, -14, 12, 2.4, 0.5), C.suit, { b: 3 });
    for (let i = 0; i < 3; i++) {
      const a = (o.t || 0) * 3 + i * TAU / 3;
      P.part(P.ell(-17 + Math.cos(a) * 10, -21 + Math.sin(a) * 2.5, 1.7, 1.7), C.yellow, { b: 4, sh: 0, hi: 0 });
    }
  }

  function samFront(P, o) {
    const w = o.walk >= 0 ? walkPose(o.walk, 0.3) : { a: 0, lift: 0, bob: 0 };
    const by = w.bob;
    const act = o.act || '';
    const fur = C.fur, suit = C.suit;
    const l1 = w.a > 0 ? w.lift * 2.5 : 0, l2 = w.a < 0 ? w.lift * 2.5 : 0;
    P.part(P.cap(-5, -16 + by, -5.5, -3 - l1, 3.9, 3.4), suit, { b: 3, sh: 1 });
    P.part(P.cap(5, -16 + by, 5.5, -3 - l2, 3.9, 3.4), suit, { b: 3, sh: 1 });
    P.part(P.ell(-7, -2 - l1, 4.8, 2.5), fur, { b: 3, sh: 1 });
    P.part(P.ell(7, -2 - l2, 4.8, 2.5), fur, { b: 3, sh: 1 });
    const sw = act === 'box' || act === 'hypno' ? 0 : w.a * 5;
    const armY = act === 'hypno' ? -34 : -25;
    P.part(P.cap(-9, -41 + by, -13.5, armY + by + sw, 3.1, 2.7), suit, { b: 3, sh: 1 });
    P.part(P.cap(9, -41 + by, 13.5, armY + by - sw, 3.1, 2.7), suit, { b: 3, sh: 1 });
    P.part(P.path(`M -8 ${-44 + by} Q -14 ${-33 + by} -12.5 ${-14 + by} L 12.5 ${-14 + by} Q 14 ${-33 + by} 8 ${-44 + by} Z`), suit, { b: 3 });
    P.line(-12, -14 + by, 12, -14 + by, C.black);
    P.line(0, -28 + by, 0, -15 + by, suit[1]);
    P.part(P.poly([-3.5, -44 + by, 3.5, -44 + by, 0, -32 + by]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.part(P.poly([-1.4, -43 + by, 1.4, -43 + by, 2.2, -28 + by, 0, -26 + by, -2.2, -28 + by]), C.navy, { b: 2, sh: 0, hi: 0 });
    P.line(-1, -39 + by, 1, -40 + by, C.navy[3]); P.line(-1.5, -35 + by, 1.5, -36 + by, C.navy[3]); P.line(-1.5, -31 + by, 1.5, -32 + by, C.navy[3]);
    if (act === 'box') samBox(P, -1, -27 + by);
    P.part(P.ell(-14, armY + 1.5 + by + sw, 3, 2.7), fur, { b: 3, sh: 1 });
    P.part(P.ell(14, armY + 1.5 + by - sw, 3, 2.7), fur, { b: 3, sh: 1 });
    samHeadFront(P.scaled(0, -44 + by, 1.12), by, o);
  }

  function samHeadFront(P, by, o) {
    const fur = C.fur, suit = C.suit;
    P.part(P.ell(-9.5, -45 + by, 3.6, 8.5, -0.18), fur, { b: 2, sh: 1 });
    P.part(P.ell(9.5, -45 + by, 3.6, 8.5, 0.18), fur, { b: 2, sh: 1 });
    P.part(P.ell(0, -50 + by, 9.5, 8.5), fur, { b: 3 });
    if (o.talk) P.part(P.ell(0, -42.5 + by, 4, 2.6), C.red, { b: 1, sh: 0, hi: 0 });
    P.part(P.ell(0, -40.5 + by + (o.talk ? 1.5 : 0), 4.2, 2.2), fur, { b: 2, sh: 1 });
    P.part(P.ell(0, -46 + by, 6.8, 4.4), fur, { b: 4, sh: 1 });
    P.part(P.ell(0, -48.5 + by, 3.2, 2.3), C.grey, { b: 0, sh: 0, hi: 1 });
    P.px(-1, -49.5 + by, C.grey[3]);
    P.curve(`M -4 ${-44 + by} Q 0 ${-42.5 + by} 4 ${-44 + by}`, C.fur[1]);
    if (o.v === 'foam') samFoam(P, [[-4.5, -41.5 + by, 1.8], [-1.2, -40.2 + by, 2.1], [2.4, -40.4 + by, 2], [5, -41.8 + by, 1.6], [0.6, -38 + by, 1.4]], [[-3, -37.5 + by], [3.5, -37 + by]]);
    samEye(P, -3.8, -54 + by, o, 1);
    samEye(P, 3.8, -54 + by, o, -1);
    if (o.helmet) samHelmet(P, -1, by);
    else {
      P.part(P.path(`M -8 ${-57 + by} L -7 ${-64.5 + by} Q 0 ${-68 + by} 7 ${-64.5 + by} L 8 ${-57 + by} Z`), suit, { b: 3 });
      P.part(P.poly([-7.9, -59.8 + by, 7.9, -59.8 + by, 8, -57.2 + by, -8, -57.2 + by]), C.navy, { b: 2, sh: 0, hi: 0 });
      P.part(P.ell(0, -57 + by, 14.5, 3), suit, { b: 3, sh: 1 });
    }
  }

  function samBack(P, o) {
    const w = o.walk >= 0 ? walkPose(o.walk, 0.3) : { a: 0, lift: 0, bob: 0 };
    const by = w.bob;
    const fur = C.fur, suit = C.suit;
    const l1 = w.a > 0 ? w.lift * 2.5 : 0, l2 = w.a < 0 ? w.lift * 2.5 : 0;
    P.part(P.cap(-5, -16 + by, -5.5, -3 - l1, 3.9, 3.4), suit, { b: 3, sh: 1 });
    P.part(P.cap(5, -16 + by, 5.5, -3 - l2, 3.9, 3.4), suit, { b: 3, sh: 1 });
    P.part(P.ell(-6, -1.5 - l1, 3.8, 2), fur, { b: 2, sh: 1 });
    P.part(P.ell(6, -1.5 - l2, 3.8, 2), fur, { b: 2, sh: 1 });
    P.part(P.cap(-9, -41 + by, -13.5, -25 + by - w.a * 4, 3.1, 2.7), suit, { b: 3, sh: 1 });
    P.part(P.cap(9, -41 + by, 13.5, -25 + by + w.a * 4, 3.1, 2.7), suit, { b: 3, sh: 1 });
    P.part(P.ell(-14, -23.5 + by - w.a * 4, 3, 2.7), fur, { b: 3, sh: 1 });
    P.part(P.ell(14, -23.5 + by + w.a * 4, 3, 2.7), fur, { b: 3, sh: 1 });
    P.part(P.path(`M -8 ${-44 + by} Q -14 ${-33 + by} -12.5 ${-14 + by} L 12.5 ${-14 + by} Q 14 ${-33 + by} 8 ${-44 + by} Z`), suit, { b: 3 });
    P.line(0, -42 + by, 0, -15 + by, suit[1]);
    P.line(-12, -14 + by, 12, -14 + by, C.black);
    samHeadBack(P.scaled(0, -44 + by, 1.12), by, o);
  }

  function samHeadBack(P, by, o) {
    const fur = C.fur, suit = C.suit;
    P.part(P.ell(0, -50 + by, 9.5, 8.5), fur, { b: 3 });
    P.part(P.ell(-8.5, -45 + by, 3.6, 8.5, -0.18), fur, { b: 2, sh: 1 });
    P.part(P.ell(8.5, -45 + by, 3.6, 8.5, 0.18), fur, { b: 2, sh: 1 });
    if (o.helmet) samHelmet(P, -1, by);
    else {
      P.part(P.path(`M -8 ${-57 + by} L -7 ${-64.5 + by} Q 0 ${-68 + by} 7 ${-64.5 + by} L 8 ${-57 + by} Z`), suit, { b: 3 });
      P.part(P.poly([-7.9, -59.8 + by, 7.9, -59.8 + by, 8, -57.2 + by, -8, -57.2 + by]), C.navy, { b: 2, sh: 0, hi: 0 });
      P.part(P.ell(0, -57 + by, 14.5, 3), suit, { b: 3, sh: 1 });
    }
  }

  COSTUMES.sam = {
    h: 68, w: 40,
    draw(P, o) {
      if (o.act === 'ko') return samKO(P, o);
      if (o.dir === 's') return samFront(P, o);
      if (o.dir === 'n') return samBack(P, o);
      return samSide(P, o);
    }
  };

  function maxSide(P, o) {
    const hop = o.walk >= 0 ? Math.abs(Math.sin(o.walk * TAU)) : 0;
    const by = -hop * 4;
    const act = o.act || '';
    const W = C.maxw;
    const legA = o.walk >= 0 ? Math.sin(o.walk * TAU) * 0.5 : 0;
    P.part(P.cap(-2, -6 + by, -2 - Math.sin(legA) * 3, -1.5 + by, 2.4, 2.2), W, { b: 2, sh: 1 });
    P.part(P.ell(0 - Math.sin(legA) * 3, -1.2 + by, 4.8, 1.8), W, { b: 2, sh: 1 });
    P.part(P.ell(-5.5, -14 + by, 2.4, 1.8, 0.4), W, { b: 3, sh: 1 });
    P.part(P.ell(0, -12 + by, 6.8, 7.8), W, { b: 3 });
    P.part(P.cap(2, -6 + by, 2 + Math.sin(legA) * 3, -1.5 + by, 2.4, 2.2), W, { b: 3, sh: 1 });
    P.part(P.ell(4 + Math.sin(legA) * 3, -1.2 + by, 4.8, 1.8), W, { b: 3, sh: 1 });
    const earSw = o.walk >= 0 ? Math.sin(o.walk * TAU + 1) * 0.12 : 0;
    const e1 = earSw * 20, e2 = earSw * 30;
    P.part(P.path(`M -5 ${-29 + by} Q ${-11 - e1} ${-40 + by} ${-10 - e2} ${-50 + by} Q ${-6.5 - e2} ${-53 + by} ${-4 - e1} ${-48 + by} Q -2.5 ${-39 + by} -0.5 ${-31 + by} Z`), W, { b: 2, sh: 1 });
    P.part(P.ell(3, -23.5 + by, 10.5, 9), W, { b: 3 });
    P.part(P.path(`M -0.5 ${-31 + by} Q ${-5 - e1} ${-42 + by} ${-3 - e2} ${-52 + by} Q ${0.5 - e2} ${-55 + by} ${2.5 - e1} ${-50 + by} Q 3 ${-41 + by} 4.5 ${-32 + by} Z`), W, { b: 3, sh: 1 });
    maxMouthSide(P, by, o.talk || act === 'grin' || act === 'hypno' || act === 'cry');
    maxEyes(P, [8.5], -28.5 + by, o);
    let aa = o.walk >= 0 ? Math.sin(o.walk * TAU) * 0.6 : 0.2;
    if (act === 'reach' || act === 'use') aa = 1.4;
    if (act === 'grin') aa = 2.4;
    if (act === 'punch') aa = 1.7;
    const reach = act === 'punch' ? 10 : 7;
    const hx = 2 + Math.sin(aa) * reach, hy = -14 + by + Math.cos(aa) * reach;
    P.part(P.cap(2, -14 + by, hx, hy, 1.8, 1.6), W, { b: 3, sh: 1 });
    if (act === 'punch') P.part(P.ell(hx + 2.5, hy, 4.4, 3.8), C.red, { b: 3 });
    else P.part(P.ell(hx + 0.5, hy + 0.5, 2, 1.8), W, { b: 3, sh: 0 });
  }

  function maxBody(P) {
    const W = C.maxw;
    P.part(P.cap(-3, -6, -3.5, -1.5, 2.4, 2.2), W, { b: 3, sh: 1 });
    P.part(P.cap(3, -6, 3.5, -1.5, 2.4, 2.2), W, { b: 3, sh: 1 });
    P.part(P.ell(-4.5, -1.3, 3.5, 1.8), W, { b: 3, sh: 1 });
    P.part(P.ell(4.5, -1.3, 3.5, 1.8), W, { b: 3, sh: 1 });
    P.part(P.ell(0, -12, 7, 7.8), W, { b: 3 });
    P.part(P.cap(-6, -14, -9, -8, 1.8, 1.6), W, { b: 3, sh: 1 });
    P.part(P.cap(6, -14, 9, -8, 1.8, 1.6), W, { b: 3, sh: 1 });
  }

  function maxFront(P, o, back) {
    const hop = o.walk >= 0 ? Math.abs(Math.sin(o.walk * TAU)) : 0;
    const by = -hop * 4;
    const W = C.maxw;
    const act = o.act || '';
    P.part(P.cap(-3, -6 + by, -3.5, -1.5 + by, 2.4, 2.2), W, { b: 3, sh: 1 });
    P.part(P.cap(3, -6 + by, 3.5, -1.5 + by, 2.4, 2.2), W, { b: 3, sh: 1 });
    P.part(P.ell(-4.5, -1.3 + by, 3.5, 1.8), W, { b: 3, sh: 1 });
    P.part(P.ell(4.5, -1.3 + by, 3.5, 1.8), W, { b: 3, sh: 1 });
    P.part(P.ell(0, -12 + by, 7, 7.8), W, { b: 3 });
    P.part(P.path(`M -7 ${-29 + by} Q -13 ${-40 + by} -10.5 ${-51 + by} Q -7 ${-54 + by} -5 ${-48 + by} Q -4 ${-39 + by} -2.5 ${-31 + by} Z`), W, { b: 3, sh: 1 });
    P.part(P.path(`M 7 ${-29 + by} Q 13 ${-40 + by} 10.5 ${-51 + by} Q 7 ${-54 + by} 5 ${-48 + by} Q 4 ${-39 + by} 2.5 ${-31 + by} Z`), W, { b: 3, sh: 1 });
    P.part(P.ell(0, -23.5 + by, 11, 9), W, { b: 3 });
    const arm = act === 'grin' ? -6 : 0;
    P.part(P.cap(-6, -14 + by, -9, -8 + by + arm, 1.8, 1.6), W, { b: 3, sh: 1 });
    P.part(P.cap(6, -14 + by, 9, -8 + by + arm, 1.8, 1.6), W, { b: 3, sh: 1 });
    if (back) return;
    maxMouthFront(P, 0, -20 + by, o.talk || act === 'grin' || act === 'hypno' || act === 'cry');
    maxEyes(P, [-3.8, 3.8], -28 + by, o);
  }

  function maxEyes(P, xs, y, o) {
    for (const ex of xs) {
      if (o.act === 'cry') {
        P.line(ex - 2, y + 1, ex + 1, y + 1.5, C.black);
        P.line(ex - 1.5, y + 2.5, ex - 1.5, y + 8, C.sky[3]);
        P.line(ex - 0.5, y + 2.5, ex - 0.5, y + 6, C.sky[4]);
        P.part(P.ell(ex - 1, y + 9.5, 1.1, 1.6), C.sky, { b: 3, sh: 0, hi: 0 });
      } else if (o.act === 'hypno' || o.hypno) {
        P.px(ex, y, C.cycle[0]); P.px(ex - 1, y, C.cycle[3]); P.px(ex, y + 1, C.cycle[5]); P.px(ex - 1, y + 1, C.cycle[1]); P.px(ex, y + 2, C.cycle[6]);
      } else if (o.blink) P.line(ex - 1.5, y + 1, ex + 1, y + 1, C.black);
      else for (let dy = 0; dy < 3; dy++) { P.px(ex, y + dy, C.pupil); P.px(ex - 1, y + dy, C.pupil); }
    }
  }

  function maxMouthSide(P, by, open) {
    if (open) {
      P.part(P.path(`M -1.5 ${-21 + by} Q 6 ${-19.5 + by} 13.3 ${-23 + by} Q 12 ${-13 + by} 6 ${-13 + by} Q 1 ${-14 + by} -1.5 ${-21 + by} Z`), C.red, { b: 1, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) {
        const tx = 1 + i * 2.4, ty = -20.4 + by - i * 0.35;
        P.part(P.poly([tx, ty, tx + 2, ty - 0.2, tx + 1, ty + 2.3]), C.eye, { sh: 0, hi: 0, ol: 0 });
      }
      for (let i = 0; i < 3; i++) P.px(4 + i * 2.5, -14.5 + by, C.grey[5]);
      P.curve(`M -1.5 ${-21 + by} Q 6 ${-19.5 + by} 13.3 ${-23 + by}`, C.black);
    } else {
      P.part(P.path(`M 0 ${-20 + by} Q 6.5 ${-17 + by} 12.8 ${-21.5 + by} L 12 ${-19.5 + by} Q 6.5 ${-15.5 + by} 1 ${-18.5 + by} Z`), C.eye, { sh: 0, hi: 0 });
      for (let i = 0; i < 4; i++) P.line(3 + i * 2.4, -18.5 + by + (i === 0 ? 0.4 : 0), 3 + i * 2.4, -17.2 + by, C.grey[2]);
      P.curve(`M -1.5 ${-21.5 + by} Q 0 ${-20 + by} 0 ${-20 + by}`, C.black);
    }
  }

  function maxMouthFront(P, cx, y, open) {
    if (open) {
      P.part(P.path(`M ${cx - 9} ${y} Q ${cx} ${y + 2} ${cx + 9} ${y} Q ${cx + 6} ${y + 8} ${cx} ${y + 8} Q ${cx - 6} ${y + 8} ${cx - 9} ${y} Z`), C.red, { b: 1, sh: 0, hi: 0 });
      for (let i = 0; i < 6; i++) {
        const tx = cx - 7.5 + i * 2.6;
        P.part(P.poly([tx, y + 0.6, tx + 2, y + 0.6, tx + 1, y + 2.8]), C.eye, { sh: 0, hi: 0, ol: 0 });
      }
      for (let i = 0; i < 3; i++) P.px(cx - 3 + i * 3, y + 7, C.grey[5]);
      P.curve(`M ${cx - 9} ${y} Q ${cx} ${y + 2} ${cx + 9} ${y}`, C.black);
    } else {
      P.part(P.path(`M ${cx - 9} ${y} Q ${cx} ${y + 4.5} ${cx + 9} ${y} L ${cx + 8} ${y + 2} Q ${cx} ${y + 6} ${cx - 8} ${y + 2} Z`), C.eye, { sh: 0, hi: 0 });
      for (let i = -2; i <= 2; i++) P.line(cx + i * 2.8, y + 2.2 + Math.abs(i) * -0.3, cx + i * 2.8, y + 3.6 - Math.abs(i) * 0.4, C.grey[2]);
    }
  }

  function maxDead(P, o) {
    const W = C.maxw;
    P.part(P.path('M -22 -4 Q -31 -3 -37 -6 Q -39 -9 -35 -10 Q -28 -9 -21 -8 Z'), W, { b: 2, sh: 1 });
    P.part(P.path('M -20 -9 Q -29 -12 -34 -17 Q -34 -20 -30 -19 Q -25 -15 -19 -12 Z'), W, { b: 3, sh: 1 });
    P.part(P.ell(2, -6.5, 13, 6.5), W, { b: 3 });
    P.part(P.cap(10, -9, 15, -19, 2.3, 2), W, { b: 2, sh: 1 });
    P.part(P.cap(13, -8, 20, -16, 2.3, 2), W, { b: 3, sh: 1 });
    P.part(P.ell(15.5, -20.5, 2.4, 3.4, -0.4), W, { b: 2, sh: 1 });
    P.part(P.ell(21, -17.5, 2.4, 3.4, -0.9), W, { b: 3, sh: 1 });
    P.part(P.cap(-2, -11, -5, -17, 1.8, 1.6), W, { b: 3, sh: 1 });
    P.part(P.ell(-14, -9, 9.5, 8), W, { b: 3 });
    for (const ex of [-17.5, -11]) { P.line(ex - 1.5, -13.5, ex + 1.5, -10.5, C.black); P.line(ex - 1.5, -10.5, ex + 1.5, -13.5, C.black); }
    P.part(P.path('M -20 -5 Q -14 -3 -8 -5 Q -9 -1 -14 -1 Q -19 -1 -20 -5 Z'), C.red, { b: 1, sh: 0, hi: 0 });
    P.part(P.ell(-12, -1.2, 2.2, 1.8), C.pink, { b: 3, sh: 0, hi: 0 });
  }

  COSTUMES.max = {
    h: 52, w: 26,
    draw(P, o) {
      if (o.act === 'head') return maxHeadOnly(P, o);
      if (o.act === 'dead') return maxDead(P, o);
      if (o.dir === 's') return maxFront(P, o, false);
      if (o.dir === 'n') return maxFront(P, o, true);
      return maxSide(P, o);
    }
  };

  function maxHeadOnly(P, o) {
    const W = C.maxw;
    P.part(P.path('M -6 -8 Q -11 -18 -9 -28 Q -6 -30 -4.5 -25 Q -3.5 -17 -2 -9 Z'), W, { b: 3, sh: 1 });
    P.part(P.path('M 6 -8 Q 11 -18 9 -28 Q 6 -30 4.5 -25 Q 3.5 -17 2 -9 Z'), W, { b: 3, sh: 1 });
    P.part(P.ell(0, -2.5, 11, 9), W, { b: 3 });
    maxMouthFront(P, 0, 1, true);
    maxEyes(P, [-3.8, 3.8], -7, o);
  }

  function poseKey(id, o, s, anim) {
    return id + '|' + (o.dir || 'e') + '|' + (o.walk >= 0 ? Math.floor(o.walk * 8) : -1) + '|' + (o.talk ? 1 : 0) + '|' + (o.act || '') + '|' + (o.blink ? 1 : 0) + '|' + (o.hypno ? 1 : 0) + '|' + (o.helmet ? 1 : 0) + '|' + (o.v || '') + '|' + Math.round(s * 20) + '|' + (o.act === 'ko' ? Math.floor((o.t || 0) * 6) % 12 : 0) + (o.upside ? 'u' : '') + (o.frame !== undefined ? 'f' + o.frame : '') + (anim !== undefined ? 'a' + anim : '');
  }

  function sprite(id, o, s) {
    s = s || 1;
    const cos = COSTUMES[id];
    if (!cos) return null;
    const anim = cos.anim ? cos.anim(o) : undefined;
    const key = poseKey(id, o, s, anim);
    let spr = CACHE.get(key);
    if (spr) return spr;
    const q = {};
    for (const k in o) q[k] = o[k];
    if (anim !== undefined) q.anim = anim;
    if (q.walk >= 0) q.walk = Math.floor(q.walk * 8) / 8;
    if (q.act === 'ko') q.t = Math.floor((o.t || 0) * 6) % 12 / 6;
    const size = Math.ceil(Math.max(cos.h, cos.w * 2) * s * 2.2) + 40;
    const b = new Buf(size, size);
    const P = new Pen(b).at(size / 2, size - 20, s, o.dir === 'w');
    cos.draw(P, q);
    if (o.upside) {
      const row = new Uint8Array(size);
      for (let y = 0; y < size / 2; y++) {
        const a = y * size, z = (size - 1 - y) * size;
        row.set(b.px.subarray(a, a + size));
        b.px.copyWithin(a, z, z + size);
        b.px.set(row, z);
      }
    }
    const c = crop(b);
    spr = { buf: c.buf, ox: size / 2 - c.x, oy: (o.upside ? 19 : size - 20) - c.y };
    if (CACHE.size > 4000) CACHE.clear();
    CACHE.set(key, spr);
    return spr;
  }

  S.COSTUMES = COSTUMES;
  S.sprite = sprite;
  S.spriteCache = CACHE;
  S.art = S.art || {};
  Object.assign(S.art, { walkPose, legSide, samHat, samHelmet, maxBody, maxEyes, maxMouthFront, samHeadFront, maxDead, TAU });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
