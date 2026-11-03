(function (H) {
  'use strict';
  const PI = 3.141592653589793, TWO_PI = 6.283185307179586, HALF_PI = 1.5707963267948966;

  function fold(x) {
    const r = x - Math.round(x / TWO_PI) * TWO_PI;
    if (r > HALF_PI) return [PI - r, -1];
    if (r < -HALF_PI) return [-PI - r, -1];
    return [r, 1];
  }

  function sinOf(r) {
    const q = r * r;
    return r * (1 - q / 6 * (1 - q / 20 * (1 - q / 42 * (1 - q / 72 * (1 - q / 110 * (1 - q / 156 * (1 - q / 210 * (1 - q / 272))))))));
  }

  function cosOf(r) {
    const q = r * r;
    return 1 - q / 2 * (1 - q / 12 * (1 - q / 30 * (1 - q / 56 * (1 - q / 90 * (1 - q / 132 * (1 - q / 182 * (1 - q / 240)))))));
  }

  function atanOf(t) {
    if (t < 0) return -atanOf(-t);
    if (t > 1) return HALF_PI - atanOf(1 / t);
    const u = t / (1 + Math.sqrt(1 + t * t)), v = u / (1 + Math.sqrt(1 + u * u)), q = v * v;
    let sum = 0;
    for (let k = 10; k >= 0; k--) sum = 1 / (2 * k + 1) - q * sum;
    return 4 * v * sum;
  }

  function atan2(y, x) {
    if (x > 0) return atanOf(y / x);
    if (x < 0) return atanOf(y / x) + (y >= 0 ? PI : -PI);
    return y > 0 ? HALF_PI : y < 0 ? -HALF_PI : 0;
  }

  H.HD.N = {
    hypot: (x, y) => Math.sqrt(x * x + y * y),
    sin: x => sinOf(fold(x)[0]),
    cos: x => { const f = fold(x); return cosOf(f[0]) * f[1]; },
    atan2,
    asin: x => atan2(x, Math.sqrt(1 - x * x))
  };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
