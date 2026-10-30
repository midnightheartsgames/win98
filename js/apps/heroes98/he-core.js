(function (H) {
  'use strict';
  H.TITLE = 'Heroes 98';
  H.W = 800;
  H.H = 600;
  H.TILE = 32;
  H.live = H.live || { uis: 0, loops: 0, audio: 0 };

  H.rng = seed => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  H.roll = o => {
    o.rs = (o.rs + 0x6d2b79f5) >>> 0;
    let t = o.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  H.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  H.plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
  };

  H.fit = (w, h) => {
    const raw = Math.max(0.25, Math.min(w / H.W, h / H.H));
    const scale = raw >= 1 ? Math.floor(raw) : raw;
    const width = Math.round(H.W * scale), height = Math.round(H.H * scale);
    return { scale, width, height, x: Math.max(0, Math.floor((w - width) / 2)), y: Math.max(0, Math.floor((h - height) / 2)) };
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
