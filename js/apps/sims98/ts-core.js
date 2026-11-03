(function (S) {
  'use strict';
  S.TITLE = 'The Sims 98';
  S.W = 800;
  S.H = 600;
  S.MAX_W = 1920;
  S.MAX_H = 1200;
  S.live = S.live || { uis: 0, loops: 0, gl: 0, audio: 0 };

  S.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  S.smooth = (a, b, v) => {
    const t = S.clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  S.roll = o => {
    o.rs = (o.rs + 0x6d2b79f5) >>> 0;
    let t = o.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  S.hash = value => {
    const text = JSON.stringify(value);
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  S.fit = (w, h, sw = S.W, sh = S.H) => {
    const raw = Math.max(0.25, Math.min(w / sw, h / sh));
    const scale = raw >= 1 ? Math.floor(raw) : raw;
    const width = Math.round(sw * scale), height = Math.round(sh * scale);
    return { scale, width, height, x: Math.max(0, Math.floor((w - width) / 2)), y: Math.max(0, Math.floor((h - height) / 2)) };
  };

  S.screenFor = (mode, w, h) => {
    if (mode !== 'window') {
      const sw = mode === '1024' ? 1024 : S.W, sh = mode === '1024' ? 768 : S.H;
      return Object.assign({ mode, sw, sh }, S.fit(w, h, sw, sh));
    }
    const whole = Math.max(1, Math.floor(Math.min(w / S.W, h / S.H)));
    const sw = S.clamp(Math.floor(w / whole), S.W, S.MAX_W), sh = S.clamp(Math.floor(h / whole), S.H, S.MAX_H);
    return Object.assign({ mode, sw, sh }, S.fit(w, h, sw, sh));
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
