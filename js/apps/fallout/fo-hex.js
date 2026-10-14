(function (FO) {
  'use strict';

  const W = 200;
  FO.HEX_W = W;
  FO.HEXES = W * W;
  FO.SQ_W = 100;
  FO.SQUARES = 100 * 100;

  const ODD_X = [[-1, -1], [-1, 0], [0, 1], [1, 0], [1, -1], [0, -1]];
  const EVEN_X = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [0, -1]];

  FO.hexX = tile => tile % W;
  FO.hexY = tile => (tile / W) | 0;
  FO.hexValid = tile => tile >= 0 && tile < FO.HEXES;

  FO.hexLeft = function (tile) {
    const u = W - 1 - tile % W;
    const y = (tile / W) | 0;
    return 48 * (u >> 1) + (u & 1 ? 32 : 0) + 16 * y;
  };

  FO.hexTop = function (tile) {
    const u = W - 1 - tile % W;
    const y = (tile / W) | 0;
    return -12 * (u >> 1) + 12 * y;
  };

  FO.hexCenter = function (tile) {
    return [FO.hexLeft(tile) + 16, FO.hexTop(tile) + 8];
  };

  FO.squareLeft = function (sq) {
    const a = 99 - sq % 100;
    const b = (sq / 100) | 0;
    return 48 * a + 32 * b - 16;
  };

  FO.squareTop = function (sq) {
    const a = 99 - sq % 100;
    const b = (sq / 100) | 0;
    return -12 * a + 24 * b - 2;
  };

  FO.hexSquare = function (tile) {
    return ((((tile / W) | 0) >> 1) * 100) + ((tile % W) >> 1);
  };

  FO.hexStep = function (tile, dir, n) {
    let t = tile;
    for (let i = 0; i < (n === undefined ? 1 : n); i++) {
      const x = t % W;
      const y = (t / W) | 0;
      const d = (x & 1 ? ODD_X : EVEN_X)[dir];
      const nx = x + d[0];
      const ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= W) return -1;
      t = ny * W + nx;
    }
    return t;
  };

  function axial(tile) {
    const q = W - 1 - tile % W;
    return [q, ((tile / W) | 0) - (q >> 1)];
  }

  FO.hexDist = function (a, b) {
    const [q1, r1] = axial(a);
    const [q2, r2] = axial(b);
    const dq = q2 - q1;
    const dr = r2 - r1;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
  };

  FO.hexDir = function (from, to) {
    const [ax, ay] = FO.hexCenter(from);
    const [bx, by] = FO.hexCenter(to);
    if (ax === bx && ay === by) return 0;
    const ang = Math.atan2(-(by - ay) * 4 / 3, bx - ax) * 180 / Math.PI;
    if (ang > 22.5 && ang <= 90) return 0;
    if (ang > -22.5 && ang <= 22.5) return 1;
    if (ang > -90 && ang <= -22.5) return 2;
    if (ang > -157.5 && ang <= -90) return 3;
    if (ang > 90 && ang <= 157.5) return 5;
    return 4;
  };

  FO.worldHex = function (wx, wy) {
    const X = wx - 16;
    const Y = wy - 8;
    const u0 = Math.round((12 * X - 16 * Y) / 384);
    const y0 = Math.round((6 * X + 24 * Y) / 384);
    let best = -1;
    let bestD = Infinity;
    for (let du = -2; du <= 2; du++) {
      for (let dy = -2; dy <= 2; dy++) {
        const u = u0 + du;
        const y = y0 + dy;
        if (u < 0 || y < 0 || u >= W || y >= W) continue;
        const tile = y * W + (W - 1 - u);
        const cx = FO.hexLeft(tile) + 16;
        const cy = FO.hexTop(tile) + 8;
        const ex = Math.abs(wx - cx);
        const ey = Math.abs(wy - cy);
        const d = Math.max(ex, (ex + ey * 2.67) / 2);
        if (d < bestD) {
          bestD = d;
          best = tile;
        }
      }
    }
    return best;
  };
})(globalThis.FO = globalThis.FO || {});
