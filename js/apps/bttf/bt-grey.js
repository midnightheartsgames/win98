(function (S, B) {
  'use strict';
  const { Buf, Pen } = S;
  const C = B.C;

  function rect(b, x, y, w, h, ramp, o) {
    new Pen(b).part(new Pen(b).rect(x, y, w, h), ramp, Object.assign({ b: 2, sh: 2, hi: 1 }, o || {}));
  }

  function poly(b, pts, ramp, o) {
    const P = new Pen(b);
    P.part(P.poly(pts), ramp, Object.assign({ b: 2, sh: 0, hi: 0 }, o || {}));
  }

  function ell(b, x, y, rx, ry, ramp, o) {
    const P = new Pen(b);
    P.part(P.ell(x, y, rx, ry), ramp, Object.assign({ b: 3 }, o || {}));
  }

  function label(b, text, cx, y, col) {
    S.font.drawCentered(b, text, cx, y, col === undefined ? C.snow[4] : col);
  }

  function box(b, x, y, w, h, ramp, text, o) {
    rect(b, x, y, w, h, ramp, o);
    if (text) label(b, text, x + w / 2, y + Math.max(2, h / 2 - 4));
  }

  function room(b, wallY, wall, floor) {
    rect(b, 0, 0, b.w, wallY, wall, { sh: 0, hi: 0, ol: 0 });
    for (let x = 0; x < b.w; x += 48) S.line(b, x, 0, x, wallY - 1, wall[1]);
    rect(b, 0, wallY, b.w, b.h - wallY, floor, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (let y = wallY + 14; y < b.h; y += 22) S.line(b, 0, y, b.w - 1, y, floor[0]);
    S.line(b, 0, wallY, b.w - 1, wallY, C.black);
  }

  function layer(w, h, fn) {
    const b = new Buf(w, h);
    fn(b);
    return b;
  }

  B.grey = { rect, poly, ell, label, box, room, layer };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
