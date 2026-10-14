(function (S, B) {
  'use strict';
  const C = B.C;
  const R = B.rig;
  const COSTUMES = S.COSTUMES;

  function hairFront(P, h, rx, ry, ramp, br, style) {
    if (style === 'swept') {
      P.part(P.path(`M ${h.x - rx - 1} ${h.y + 3} Q ${h.x - rx - 4} ${h.y - ry - 3} ${h.x - 1} ${h.y - ry - 4} Q ${h.x + rx + 5} ${h.y - ry - 1} ${h.x + rx + 1.5} ${h.y + 4} L ${h.x + rx - 1.5} ${h.y - 3} Q ${h.x + 3} ${h.y - 10} ${h.x - 5} ${h.y - 5} Q ${h.x - rx + 1} ${h.y - 4} ${h.x - rx + 0.5} ${h.y + 3} Z`), ramp, { b: br });
      P.curve(`M ${h.x - 6} ${h.y - ry} Q ${h.x + 2} ${h.y - ry - 1} ${h.x + 7} ${h.y - 7}`, ramp[1]);
      P.curve(`M ${h.x - 9} ${h.y - 8} Q ${h.x - 4} ${h.y - 12} ${h.x + 3} ${h.y - 11}`, ramp[1]);
    } else if (style === 'part') {
      P.part(P.path(`M ${h.x - rx - 0.5} ${h.y} Q ${h.x - rx - 1} ${h.y - ry - 1} ${h.x} ${h.y - ry - 2} Q ${h.x + rx + 1} ${h.y - ry - 1} ${h.x + rx + 0.5} ${h.y} L ${h.x + rx - 1} ${h.y - 5} Q ${h.x + 4} ${h.y - 9} ${h.x - 3} ${h.y - 9} Q ${h.x - rx + 1} ${h.y - 7} ${h.x - rx + 0.5} ${h.y} Z`), ramp, { b: br });
      P.line(h.x - 3, h.y - ry - 1, h.x - 4, h.y - 9, ramp[1]);
    } else {
      P.part(P.path(`M ${h.x - rx - 1} ${h.y + 1} Q ${h.x - rx - 2} ${h.y - ry - 2} ${h.x + 1} ${h.y - ry - 3} Q ${h.x + rx + 2} ${h.y - ry - 1} ${h.x + rx + 1} ${h.y + 1} L ${h.x + rx - 1} ${h.y - 4} Q ${h.x} ${h.y - 11} ${h.x - rx + 1} ${h.y - 4} Z`), ramp, { b: br });
      P.curve(`M ${h.x - 7} ${h.y - ry + 1} Q ${h.x + 2} ${h.y - ry - 2} ${h.x + 8} ${h.y - ry + 3}`, ramp[1]);
    }
  }

  function hairSide(P, h, rx, ry, ramp, br, style) {
    const fx = style === 'swept' ? 3 : 1;
    P.part(P.path(`M ${h.x + rx - 2} ${h.y - 6} Q ${h.x + rx} ${h.y - ry - 3} ${h.x - 2} ${h.y - ry - 3} Q ${h.x - rx - 5} ${h.y - ry + 1} ${h.x - rx - 2} ${h.y + (style === 'swept' ? 9 : 5)} L ${h.x - 3} ${h.y + 5} Q ${h.x - 1} ${h.y - 2} ${h.x + 2} ${h.y - 5} L ${h.x + rx + fx} ${h.y - 4} Z`), ramp, { b: br });
    P.curve(`M ${h.x + rx - 3} ${h.y - ry} Q ${h.x - 3} ${h.y - ry - 1} ${h.x - rx} ${h.y - 4}`, ramp[1]);
  }

  function hairBack(P, h, rx, ry, ramp, br, style) {
    P.part(P.ell(h.x, h.y - 1, rx + 1.5, ry + 1.5), ramp, { b: br });
    if (style === 'swept') P.part(P.ell(h.x, h.y + 9, rx - 1, 5), ramp, { b: br - 1, sh: 0 });
    P.curve(`M ${h.x - 6} ${h.y - ry + 1} Q ${h.x} ${h.y - 3} ${h.x + 3} ${h.y + 8}`, ramp[1]);
  }

  function hairOf(ramp, br, style) {
    return (P, J) => {
      const h = J.head, d = J.d;
      if (J.back) hairBack(P, h, d.rx, d.ry, ramp, br, style);
      else if (J.side) hairSide(P, h, d.rx, d.ry, ramp, br, style);
      else hairFront(P, h, d.rx, d.ry, ramp, br, style);
    };
  }

  function quilt(P, x0, x1, y0, y1, ramp) {
    for (let y = y0 + 6; y < y1 - 2; y += 6) P.line(x0 + 1, y, x1 - 1, y, ramp[1]);
  }

  const MARTY = {
    h: 150, legs: C.jeans, shoes: C.snow, sole: C.tan, coat: C.denim, sleeve: C.denim, cuff: C.cream, eyes: C.sky, brow: C.hair[1], hem: 4,
    hair: hairOf(C.hair, 3, 'swept'),
    over(P, J, T) {
      if (J.back) {
        P.part(P.poly([-T.sw - 1, T.top + 1, T.sw + 1, T.top + 1, T.hw + 0.5, T.bot - 3, -T.hw - 0.5, T.bot - 3]), C.vest, { b: 3 });
        quilt(P, -T.hw, T.hw, T.top, T.bot - 3, C.vest);
        return;
      }
      if (J.side) {
        P.part(P.rect(T.f - 4, T.top + 3, 3, 16), C.maroon, { b: 2, sh: 0, hi: 0 });
        P.part(P.path(`M ${T.b - 1} ${T.top + 1} Q ${T.f - 6} ${T.top - 3} ${T.f - 5} ${T.top + 4} L ${T.f - 5} ${T.bot - 3} L ${T.b} ${T.bot - 3} Z`), C.vest, { b: 3 });
        quilt(P, T.b, T.f - 5, T.top + 2, T.bot - 3, C.vest);
        P.part(P.path(`M ${T.b + 1} ${T.top} Q ${T.b + 6} ${T.top - 5} ${T.f - 7} ${T.top - 1} L ${T.f - 6} ${T.top + 3} L ${T.b + 2} ${T.top + 4} Z`), C.vest, { b: 4, sh: 0 });
        return;
      }
      P.part(P.poly([-5, T.top - 1, 5, T.top - 1, 4, T.bot - 4, -4, T.bot - 4]), C.maroon, { b: 2, sh: 0, hi: 0 });
      for (const s of [-1, 1]) {
        P.part(P.poly([s * 4.5, T.top - 1, s * 8, T.top + 2, s * 7, T.top + 22, s * 4, T.top + 18]), C.snow, { b: 3, sh: 0, hi: 0 });
        P.line(s * 5, T.top + 6, s * 7.5, T.top + 6, C.sky[2]);
        P.line(s * 6, T.top + 1, s * 6, T.top + 20, C.sky[2]);
      }
      for (const s of [-1, 1]) {
        const px = [s * 6.5, T.top - 2, s * (T.sw + 1), T.top + 2, s * (T.hw + 0.5), T.bot - 3, s * 5.5, T.bot - 3];
        P.part(P.poly(px), C.vest, { b: 3 });
        quilt(P, Math.min(s * 6.5, s * (T.hw + 0.5)), Math.max(s * 6.5, s * (T.hw + 0.5)), T.top, T.bot - 3, C.vest);
      }
      P.part(P.path(`M -7 ${T.top - 3} Q 0 ${T.top - 6} 7 ${T.top - 3} L 6 ${T.top + 1} L -6 ${T.top + 1} Z`), C.vest, { b: 4, sh: 0 });
    }
  };

  const GEORGE = {
    h: 156, legs: C.khaki, shoes: C.wood, sole: C.hair, coat: C.tan, sleeve: C.tan, eyes: C.hair, brow: C.snow[1], hem: 10, headW: 0.96,
    hair: hairOf(C.snow, 2, 'part'),
    over(P, J, T) {
      if (J.back) { P.line(0, T.top + 4, 0, T.bot - 2, C.tan[1]); return; }
      if (J.side) {
        P.part(P.poly([T.f - 5, T.top - 1, T.f - 1, T.top + 2, T.f - 2, T.top + 14, T.f - 6, T.top + 8]), C.red, { b: 2, sh: 0, hi: 0 });
        P.line(T.f - 3, T.top + 16, T.f - 3, T.bot - 4, C.tan[1]);
        return;
      }
      P.part(P.poly([-6, T.top - 2, 6, T.top - 2, 2, T.top + 16, -2, T.top + 16]), C.red, { b: 2, sh: 0, hi: 0 });
      P.part(P.poly([-1, T.top + 4, 1, T.top + 4, 0, T.top + 9]), C.skin, { b: 2, sh: 0, hi: 0, ol: 0 });
      for (const s of [-1, 1]) P.part(P.poly([s * 2, T.top + 16, s * 7, T.top - 2, s * 10, T.top + 1, s * 4, T.top + 26]), C.tan, { b: 4, sh: 0 });
      P.part(P.ell(-0.5, T.top + 32, 1.2, 1.2), C.wood, { b: 1, sh: 0, hi: 0, ol: 0 });
    }
  };

  const BIFF = {
    h: 162, wide: 1.22, belly: 3, legs: C.green, shoes: C.snow, sole: C.grey, coat: C.green, sleeve: C.green, stripe: C.snow[4], eyes: C.hair, brow: C.tan[1], hem: 4, headW: 1.08, face: 'angry',
    hair: (P, J) => {
      const h = J.head, d = J.d;
      if (!J.back && !J.side) {
        P.part(P.path(`M ${h.x - d.rx - 1} ${h.y + 2} L ${h.x - d.rx} ${h.y - 7} L ${h.x - d.rx + 3} ${h.y - 3} Z`), C.tan, { b: 3 });
        P.part(P.path(`M ${h.x + d.rx + 1} ${h.y + 2} L ${h.x + d.rx} ${h.y - 7} L ${h.x + d.rx - 3} ${h.y - 3} Z`), C.tan, { b: 3 });
      } else if (J.side) P.part(P.path(`M ${h.x - d.rx - 1} ${h.y + 7} L ${h.x - d.rx - 1} ${h.y - 6} L ${h.x - 2} ${h.y - 5} L ${h.x - 2} ${h.y + 4} Z`), C.tan, { b: 3 });
      else P.part(P.ell(h.x, h.y - 1, d.rx + 1, d.ry), C.tan, { b: 3 });
      helmet(P, J);
    },
    collar(P, J, T) {
      P.part(P.rect(-6.5, T.top - 6, 13, 7), C.red, { b: 3, sh: 0 });
      if (J.back) return;
      P.part(P.poly([-7, T.top - 1, 7, T.top - 1, 0, T.top + 12]), C.red, { b: 2, sh: 0, hi: 0 });
      P.line(0, T.top + 12, 0, T.bot - 2, C.green[1]);
    },
    over(P, J, T) {
      if (J.side) P.part(P.rect(J.neck.x - 4, T.top - 6, 9, 7), C.red, { b: 3, sh: 0 });
    },
    hand(P, J, o) {
      if (o.act === 'guitar' || o.act === 'sit' && o.v === 'dazed') return;
      const a = J.arms[1].hand;
      can(P, a.x + (J.side ? 1 : 0), a.y - 1);
    }
  };

  function can(P, x, y) {
    P.part(P.rect(x - 3, y - 6, 6, 10), C.red, { b: 3, sh: 1 });
    P.part(P.rect(x - 3, y - 2, 6, 2), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
  }

  function helmet(P, J) {
    const h = J.head, d = J.d;
    const top = h.y - d.ry - 1;
    P.part(P.path(`M ${h.x - d.rx - 3} ${h.y - 4} Q ${h.x - d.rx - 3} ${top - 7} ${h.x} ${top - 8} Q ${h.x + d.rx + 3} ${top - 7} ${h.x + d.rx + 3} ${h.y - 4} Z`), C.steel, { b: 3 });
    P.part(P.rect(h.x - d.rx - 4, h.y - 6, (d.rx + 4) * 2, 4), C.steel, { b: 1, sh: 0, hi: 0 });
    for (const sx of J.side ? [-1] : [-1, 1]) {
      const cx = h.x + sx * (d.rx - 1);
      P.part(P.rect(cx - 3.5, top - 15, 7, 11), C.red, { b: 3, sh: 1 });
      P.part(P.rect(cx - 3.5, top - 11, 7, 2), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.line(cx, top - 4, h.x, top - 7, C.gold[2]);
    }
    for (let i = -2; i <= 2; i++) P.part(P.ell(h.x + i * 4, top - 3, 1.2, 1.2), i % 2 ? C.ledG : C.ledR, { b: 0, sh: 0, hi: 0, ol: 0 });
  }

  function guitarProp(P, J) {
    const x = J.side ? 6 : -4, y = J.hipY - 8;
    P.part(P.poly(J.side ? [x + 10, y - 6, x + 42, y - 24, x + 44, y - 20, x + 13, y - 2] : [x + 6, y - 5, x - 30, y - 26, x - 27, y - 30, x + 9, y - 9]), C.wood, { b: 2, sh: 0 });
    P.part(P.ell(x, y, 11, 9), C.gold, { b: 3 });
    P.part(P.ell(x + (J.side ? 7 : -7), y - 2, 8, 7), C.gold, { b: 3 });
    P.part(P.ell(x + 1, y, 2.6, 2.6), C.grey, { b: 0, sh: 0, hi: 0 });
  }

  for (const L of [MARTY, GEORGE, BIFF]) {
    const prop = L.prop;
    L.prop = (P, J, o) => { if (o.act === 'guitar') guitarProp(P, J); if (prop) prop(P, J, o); };
  }

  const LOOKS = { marty: MARTY, george: GEORGE, biff: BIFF };
  for (const [id, L] of Object.entries(LOOKS)) {
    COSTUMES['bt_' + id] = { h: L.h + 4, w: 46 * (L.wide || 1), draw(P, o) { R.draw(P, o, L); } };
  }

  B.art = B.art || {};
  Object.assign(B.art, { LOOKS, hairOf, helmet, can, guitarProp });
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
