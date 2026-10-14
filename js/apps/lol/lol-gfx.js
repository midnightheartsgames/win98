(function (L) {
  'use strict';
  const D = L.DATA;

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function shade(c, f) {
    const [r, g, b] = hex(c);
    const m = f >= 1 ? v => Math.round(v + (255 - v) * (f - 1)) : v => Math.round(v * f);
    return '#' + [m(r), m(g), m(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  function crisp(cv, outline = '#140c08') {
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, id = ctx.getImageData(0, 0, w, h), p = id.data;
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { if (p[i * 4 + 3] > 110) { p[i * 4 + 3] = 255; solid[i] = 1; } else p[i * 4 + 3] = 0; }
    if (outline) {
      const [or, og, ob] = hex(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { p[i * 4] = or; p[i * 4 + 1] = og; p[i * 4 + 2] = ob; p[i * 4 + 3] = 255; }
      }
    }
    ctx.putImageData(id, 0, 0);
    return cv;
  }
  function flip(cv) { const o = mk(cv.width, cv.height), c = o.getContext('2d'); c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(cv, 0, 0); return o; }
  function tint(cv, color, a) { const o = mk(cv.width, cv.height), c = o.getContext('2d'); c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = a; c.fillStyle = color; c.fillRect(0, 0, o.width, o.height); return o; }

  function K(ctx) {
    return {
      ctx,
      ell(x, y, rx, ry, col, rot = 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); ctx.fill(); },
      circ(x, y, r, col) { this.ell(x, y, r, r, col); },
      rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); },
      poly(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); },
      line(x0, y0, x1, y1, col, w = 2) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); },
      limb(x0, y0, x1, y1, w, col) { this.line(x0, y0, x1, y1, shade(col, 0.7), w); this.line(x0 - 0.5, y0 - 0.5, x1 - 0.5, y1 - 0.5, col, Math.max(1, w - 1.5)); },
      blob(x, y, rx, ry, col) { this.ell(x, y, rx, ry, shade(col, 0.7)); this.ell(x - rx * 0.12, y - ry * 0.12, rx * 0.85, ry * 0.85, col); this.ell(x - rx * 0.35, y - ry * 0.4, rx * 0.35, ry * 0.3, shade(col, 1.25)); }
    };
  }

  const TEAM = [{ main: '#3060d0', light: '#80b0ff', dark: '#1a2a70', metal: '#b0c0e0' }, { main: '#c83020', light: '#ff8060', dark: '#601010', metal: '#e0b0a0' }];
  function unitSprite(w, h, ox, oy, draw, frames) {
    const res = [];
    for (let f = 0; f < frames; f++) { const cv = mk(w, h), ctx = cv.getContext('2d'); ctx.translate(ox, oy); draw(K(ctx), f); crisp(cv); res.push([cv, flip(cv)]); }
    return { frames: res, ox, oy };
  }
  function buildMinion(type, team) {
    const T = TEAM[team];
    if (type === 'siege') return unitSprite(48, 40, 24, 36, (k, f) => {
      const bob = f % 2;
      k.circ(-10, -5, 6, '#3a2a1a'); k.circ(10, -5, 6, '#3a2a1a'); k.circ(-10, -5, 3, '#8a6a3a'); k.circ(10, -5, 3, '#8a6a3a');
      k.rect(-15, -15 + bob, 30, 9, T.main); k.rect(-15, -15 + bob, 30, 2, T.light);
      k.limb(-2, -18 + bob, f >= 2 ? 16 : 19, -24 + bob, 7, '#505868'); k.circ(f >= 2 ? 17 : 20, -24 + bob, 3, '#202028');
      k.circ(-8, -20 + bob, 3.5, T.metal);
    }, 4);
    if (type === 'caster') return unitSprite(32, 36, 16, 33, (k, f) => {
      const lg = [-1, 1, -1, 1][f] * (f < 2 ? 1 : 0), up = f >= 2;
      k.poly([-5, -16, 5, -16, 7, -1, -7, -1], T.dark); k.poly([-4, -16, 4, -16, 5, -2, -5, -2], T.main);
      k.circ(0, -19, 4, T.dark); k.circ(0.8, -18.5, 2.5, '#f0d0b0'); k.poly([-4, -20, 4, -20, 0, -27], T.main);
      k.line(5, -3, 6 + (up ? 3 : 0), -21 - (up ? 3 : 0), '#6a4a2a', 1.5); k.circ(6 + (up ? 3 : 0), -22 - (up ? 3 : 0), 2, up ? '#ffffff' : T.light);
      void lg;
    }, 4);
    if (type === 'super') return unitSprite(44, 48, 22, 44, (k, f) => {
      const lg = f === 1 ? 1 : f === 3 ? -1 : 0, atk = f >= 2;
      k.limb(-3, -12, -3 - lg * 3, -1, 5, T.dark); k.limb(3, -12, 3 + lg * 3, -1, 5, T.dark);
      k.blob(0, -20, 10, 10, T.main); k.blob(-8, -26, 5, 4, T.metal); k.blob(8, -26, 5, 4, T.metal);
      k.blob(1, -33, 5, 5, T.metal); k.rect(0, -34, 5, 1.5, '#ffe060');
      k.line(9, -22, atk ? 20 : 12, atk ? -20 : -6, '#707080', 4); k.blob(atk ? 21 : 13, atk ? -21 : -5, 4, 4, '#909098');
    }, 4);
    return unitSprite(32, 36, 16, 33, (k, f) => {
      const lg = f === 1 ? 1 : f === 3 ? -1 : 0, atk = f >= 2 ? f - 2 : -1;
      k.limb(-2, -9, -2 - lg * 3, -1, 3, T.dark); k.limb(2, -9, 2 + lg * 3, -1, 3, T.dark);
      k.poly([-4, -18, 4, -18, 4, -8, -4, -8], T.main); k.rect(-4, -10, 8, 1.5, T.dark);
      k.blob(0, -21, 4, 4, T.metal); k.rect(0.5, -21.5, 3, 1.2, '#202020');
      k.blob(-5, -13, 3.5, 4.5, T.light);
      const sx = atk === 1 ? 11 : atk === 0 ? 2 : 7, sy = atk === 1 ? -14 : atk === 0 ? -24 : -20;
      k.line(4, -14, sx, sy, '#d0d8e0', 2); k.line(4, -14, 5, -13, '#6a4a2a', 3);
    }, 4);
  }
  function buildMonster(type) {
    switch (type) {
      case 'wolf': case 'wolfling': { const s = type === 'wolf' ? 1 : 0.7; return unitSprite(56, 40, 28, 36, (k, f) => { const c = type === 'wolf' ? '#6a6a78' : '#8a8a96'; k.ctx.save(); k.ctx.scale(s, s); const lg = f === 1 ? 2 : 0; k.limb(-10, -8, -12 + lg, -1, 3, shade(c, 0.7)); k.limb(8, -8, 10 - lg, -1, 3, shade(c, 0.7)); k.blob(0, -11, 13, 6, c); k.limb(-10, -12, -18, -18, 3, c); k.blob(13, -15 - (f ? 2 : 0), 6, 5, c); k.poly([15, -13, 23, -12 + (f ? 2 : 0), 15, -10], shade(c, 0.9)); k.poly([10, -19, 12, -25, 14, -19], c); k.rect(14, -17, 2, 1.5, '#ffe040'); k.ctx.restore(); }, 2); }
      case 'raptor': case 'raptorling': { const s = type === 'raptor' ? 1 : 0.65; return unitSprite(48, 44, 24, 40, (k, f) => { const c = type === 'raptor' ? '#c05030' : '#d88050'; k.ctx.save(); k.ctx.scale(s, s); k.limb(-2, -10, -4, -1, 2, '#e0b040'); k.limb(2, -10, 3 + (f ? 3 : 0), -1, 2, '#e0b040'); k.blob(0, -15, 8, 6, c); k.limb(-6, -15, -14, -22, 3, shade(c, 0.8)); k.limb(5, -18, 9, -26, 3, c); k.blob(10, -28, 4, 3, c); k.poly([13, -29, 19, -27 + (f ? 2 : 0), 13, -26], '#f0c040'); k.poly([-4, -21, 0, -30, 3, -21], '#40a0e0'); k.rect(10, -29, 1.5, 1.5, '#101010'); k.ctx.restore(); }, 2); }
      case 'krug': return unitSprite(56, 48, 28, 44, (k, f) => { const c = '#8a7a60'; k.blob(-6, -4, 5, 4, shade(c, 0.8)); k.blob(6, -4, 5, 4, shade(c, 0.8)); k.blob(0, -16, 14, 12, c); k.blob(-5, -22, 6, 5, shade(c, 1.15)); k.blob(12 + (f ? 3 : 0), -14, 6, 7, c); k.rect(3, -20, 3, 2, '#ffa020'); k.rect(8, -20, 3, 2, '#ffa020'); k.poly([0, -27, 3, -34, 6, -27], shade(c, 0.9)); }, 2);
      case 'gromp': return unitSprite(64, 48, 32, 44, (k, f) => { const c = '#5a8a3a'; k.blob(-12, -5, 7, 5, shade(c, 0.8)); k.blob(12, -5, 7, 5, shade(c, 0.8)); k.blob(0, -16 - (f ? 3 : 0), 16, 13, c); k.blob(0, -9 - (f ? 3 : 0), 12, 6, '#c0d080'); k.blob(-7, -28 - (f ? 3 : 0), 5, 5, c); k.blob(7, -28 - (f ? 3 : 0), 5, 5, c); k.circ(-7, -29 - (f ? 3 : 0), 2.5, '#ffe060'); k.circ(7, -29 - (f ? 3 : 0), 2.5, '#ffe060'); k.rect(-8, -30 - (f ? 3 : 0), 1.5, 2, '#101010'); k.rect(6, -30 - (f ? 3 : 0), 1.5, 2, '#101010'); for (let i = 0; i < 5; i++) k.circ(-10 + i * 5, -20 - (f ? 3 : 0), 1.3, '#8ac060'); }, 2);
      case 'blue': return unitSprite(72, 64, 36, 60, (k, f) => { const c = '#5a6aa0'; k.blob(-8, -6, 6, 6, shade(c, 0.7)); k.blob(8, -6, 6, 6, shade(c, 0.7)); k.blob(0, -24, 16, 16, c); k.blob(-15, -24 + (f ? -6 : 0), 7, 10, shade(c, 0.9)); k.blob(15 + (f ? 4 : 0), -24 + (f ? -6 : 0), 7, 10, c); k.blob(0, -42, 8, 7, c); k.rect(-4, -44, 3, 2, '#60e0ff'); k.rect(2, -44, 3, 2, '#60e0ff'); k.blob(0, -27, 6, 6, '#40a0ff'); k.circ(-1, -29, 2, '#c0f0ff'); }, 2);
      case 'red': return unitSprite(72, 64, 36, 60, (k, f) => { const c = '#a04a3a'; k.limb(-6, -14, -8, -1, 6, shade(c, 0.7)); k.limb(6, -14, 8 + (f ? 3 : 0), -1, 6, shade(c, 0.7)); k.blob(0, -24, 16, 14, c); for (let i = 0; i < 5; i++) k.poly([-12 + i * 6, -34, -9 + i * 6, -44, -6 + i * 6, -34], '#e0c080'); k.blob(15 + (f ? 3 : 0), -30, 8, 7, c); k.rect(18 + (f ? 3 : 0), -33, 2, 2, '#ffe040'); k.blob(-2, -22, 6, 6, '#ff5020'); k.circ(-3, -24, 2, '#ffd080'); }, 2);
      case 'dragon': return unitSprite(128, 96, 64, 88, (k, f) => {
        const c = '#c05a20', w = f ? -8 : 0;
        k.poly([-10, -40, -52, -70 + w, -40, -38, -30, -30], shade(c, 0.7)); k.poly([10, -40, 50, -72 + w, 42, -36, 28, -30], shade(c, 0.85));
        k.limb(-30, -20, -52, -10, 7, shade(c, 0.8)); k.limb(-12, -14, -14, -2, 7, shade(c, 0.7)); k.limb(12, -14, 14, -2, 7, shade(c, 0.7));
        k.blob(0, -28, 26, 16, c); k.blob(0, -22, 18, 8, '#f0c060');
        k.limb(18, -34, 30, -54, 9, c); k.blob(36, -58 - (f ? 3 : 0), 11, 8, c); k.poly([42, -56, 56, -52 + (f ? 4 : 0), 42, -50], '#f0c060');
        k.poly([30, -64, 26, -76, 36, -65], '#e0d0a0'); k.poly([38, -65, 40, -78, 44, -64], '#e0d0a0'); k.rect(38, -61, 3, 2, '#ffff60');
        if (f) k.circ(60, -52, 5, '#ffb030');
      }, 2);
      case 'baron': return unitSprite(160, 128, 80, 118, (k, f) => {
        const c = '#6a3a8a', b = f ? -6 : 0;
        k.blob(0, -14, 44, 14, '#3a2050');
        for (let i = 0; i < 6; i++) k.poly([-40 + i * 16, -20, -34 + i * 16, -42 + (i % 2) * 6, -28 + i * 16, -20], '#b070d0');
        k.limb(-6, -24, 2, -70 + b, 28, c); k.limb(-6, -24, 2, -70 + b, 20, shade(c, 1.2));
        k.blob(6, -84 + b, 24, 18, c); k.blob(20, -78 + b, 12, 9, shade(c, 0.8));
        k.poly([-6, -96 + b, -18, -120 + b, 0, -100 + b], '#e0c0ff'); k.poly([14, -98 + b, 16, -124 + b, 24, -98 + b], '#e0c0ff');
        k.rect(10, -90 + b, 5, 3, '#ff60ff'); k.rect(22, -90 + b, 5, 3, '#ff60ff');
        k.limb(-30, -24, -50, -60 + b, 8, c); k.limb(34, -24, 56, -58 + b, 8, c);
        for (let i = 0; i < 4; i++) k.poly([26 + i * 3, -72 + b, 28 + i * 3, -64 + b + (f ? 6 : 0), 30 + i * 3, -72 + b], '#fff0ff');
      }, 2);
    }
    return null;
  }
  function buildTower(team, dead) {
    const T = TEAM[team], cv = mk(64, 112), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(32, 106);
    if (dead) { k.blob(-10, -6, 12, 7, '#6a6a70'); k.blob(10, -5, 10, 6, '#7a7a80'); k.blob(0, -12, 9, 7, '#8a8a90'); k.poly([-4, -14, 4, -30, 8, -14], '#5a5a60'); crisp(cv); return cv; }
    k.poly([-20, 0, 20, 0, 16, -8, -16, -8], '#5a5a62');
    k.poly([-13, -8, 13, -8, 10, -62, -10, -62], '#8a8a94'); k.poly([-13, -8, -3, -8, -2, -62, -10, -62], '#a0a0aa');
    for (let y = -16; y > -60; y -= 9) k.rect(-12, y, 24, 1.2, '#5a5a62');
    k.poly([-16, -62, 16, -62, 12, -72, -12, -72], T.dark); k.rect(-16, -64, 32, 3, T.metal);
    for (let i = -2; i <= 2; i++) k.rect(i * 6 - 2, -78, 4, 6, '#8a8a94');
    k.poly([0, -100, 7, -86, 0, -74, -7, -86], T.main); k.poly([0, -100, 0, -74, -7, -86], T.light);
    k.circ(-1, -90, 1.8, '#ffffff');
    crisp(cv); return cv;
  }
  function buildInhib(team, dead) {
    const T = TEAM[team], cv = mk(72, 80), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(36, 74);
    k.ell(0, -6, 30, 10, '#5a5a62'); k.ell(0, -9, 26, 8, '#8a8a94');
    for (let a = 0; a < 6; a++) { const x = Math.cos(a * 1.047) * 22, y = Math.sin(a * 1.047) * 7 - 10; k.poly([x - 3, y, x + 3, y, x + 1, y - 14, x - 1, y - 14], '#a0a0aa'); }
    if (!dead) { k.poly([0, -58, 11, -34, 0, -16, -11, -34], T.main); k.poly([0, -58, 0, -16, -11, -34], T.light); k.circ(-2, -42, 2.5, '#ffffff'); }
    else { k.poly([-6, -16, -2, -26, 4, -16], shade(T.main, 0.5)); k.poly([2, -14, 7, -22, 10, -13], shade(T.main, 0.4)); }
    crisp(cv); return cv;
  }
  function buildNexus(team, dead) {
    const T = TEAM[team], cv = mk(128, 136), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(64, 128);
    k.ell(0, -10, 58, 18, '#4a4a52'); k.ell(0, -14, 52, 15, '#7a7a84'); k.ell(0, -16, 40, 11, T.dark);
    for (let a = 0; a < 8; a++) { const x = Math.cos(a * 0.785) * 46, y = Math.sin(a * 0.785) * 13 - 16; k.poly([x - 4, y, x + 4, y, x + 2, y - 26, x - 2, y - 26], '#9a9aa6'); k.circ(x, y - 27, 2.5, T.light); }
    if (!dead) {
      k.poly([0, -122, 22, -70, 0, -26, -22, -70], T.main); k.poly([0, -122, 0, -26, -22, -70], T.light);
      k.poly([0, -104, 10, -72, 0, -44, -10, -72], shade(T.light, 1.3)); k.circ(-5, -84, 4, '#ffffff');
    } else { k.poly([-18, -24, -8, -44, 0, -24], shade(T.main, 0.5)); k.poly([2, -22, 14, -40, 22, -20], shade(T.main, 0.4)); }
    crisp(cv); return cv;
  }
  function buildProp(kind, team) {
    const T = TEAM[team || 0];
    if (kind === 'ward' || kind === 'pinkWard') {
      const cv = mk(20, 32), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(10, 30);
      k.limb(0, 0, 0, -16, 3, '#6a4a2a'); k.blob(0, -20, 5, 6, kind === 'pinkWard' ? '#d040a0' : '#40c050'); k.circ(0, -21, 2.2, '#ffffff'); k.circ(0.3, -21, 1, '#101010');
      crisp(cv); return cv;
    }
    if (kind === 'shroom') { const cv = mk(24, 22), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(12, 20); k.rect(-2, -8, 4, 8, '#e8e0c0'); k.ell(0, -9, 9, 6, '#6a9a3a'); k.circ(-3, -11, 1.8, '#c0e080'); k.circ(3, -10, 1.5, '#c0e080'); k.circ(0, -13, 1.3, '#c0e080'); crisp(cv); return cv; }
    if (kind === 'chomper') { const cv = mk(28, 20), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(14, 17); k.ell(0, -4, 11, 5, '#e05050'); for (let i = -3; i <= 3; i++) k.poly([i * 3 - 1.5, -7, i * 3 + 1.5, -7, i * 3, -11], '#f0f0f0'); k.circ(-4, -4, 1.5, '#ffe060'); k.circ(4, -4, 1.5, '#ffe060'); crisp(cv); return cv; }
    if (kind === 'shop') {
      const cv = mk(96, 80), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(48, 76);
      k.rect(-36, -30, 72, 30, '#7a5030'); k.rect(-36, -30, 72, 4, '#a07040');
      k.poly([-42, -30, 42, -30, 34, -52, -34, -52], T.main); for (let i = -3; i <= 3; i += 2) k.poly([i * 10 - 5, -30, i * 10 + 5, -30, i * 9 + 4, -52, i * 9 - 4, -52], '#f0e0c0');
      k.rect(-30, -26, 60, 6, '#c0a060'); k.circ(-18, -30, 4, '#ffd040'); k.circ(-8, -31, 3, '#e04040'); k.circ(20, -30, 4, '#4080ff');
      k.blob(4, -40, 6, 6, '#f0c8a0'); k.ell(4, -46, 7, 2.5, '#6a3a1a'); k.rect(0, -36, 8, 8, '#3a6a3a');
      crisp(cv); return cv;
    }
    if (kind === 'fountain') {
      const cv = mk(160, 96), ctx = cv.getContext('2d'), k = K(ctx); ctx.translate(80, 64);
      k.ell(0, 0, 76, 30, '#50505a'); k.ell(0, -3, 70, 26, '#9a9aa6'); k.ell(0, -4, 58, 20, T.dark);
      k.ell(0, -5, 50, 16, T.main); k.ell(-10, -9, 22, 5, T.light);
      k.rect(-5, -46, 10, 42, '#b0b0ba'); k.poly([-10, -46, 10, -46, 0, -60], T.light);
      crisp(cv, '#101014'); return cv;
    }
    return null;
  }
  function noise2(seed) {
    const P = new Uint8Array(512); let s = seed; for (let i = 0; i < 256; i++) P[i] = i;
    for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [P[i], P[j]] = [P[j], P[i]]; }
    for (let i = 0; i < 256; i++) P[i + 256] = P[i];
    const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
    const fade = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y), u = fade(xf), v = fade(yf);
      const a = P[P[xi] + yi], b = P[P[xi + 1] + yi], c = P[P[xi] + yi + 1], d = P[P[xi + 1] + yi + 1];
      const x1 = grad(a, xf, yf) + (grad(b, xf - 1, yf) - grad(a, xf, yf)) * u, x2 = grad(c, xf, yf - 1) + (grad(d, xf - 1, yf - 1) - grad(c, xf, yf - 1)) * u;
      return (x1 + (x2 - x1) * v) * 0.7;
    };
  }
  const TS = 0.15;
  function buildTerrain(map) {
    const W = Math.round(D.MAP * TS), cv = mk(W, W), ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, W), p = img.data;
    const n1 = noise2(7), n2 = noise2(13), n3 = noise2(29);
    const pal = {
      grass: [[46, 92, 38], [58, 110, 44], [38, 78, 32]], lane: [[150, 122, 80], [132, 106, 68], [168, 140, 96]], river: [[40, 86, 130], [52, 104, 150], [34, 72, 112]],
      base0: [[92, 100, 118], [106, 114, 132], [78, 86, 102]], base1: [[118, 96, 92], [132, 110, 104], [102, 82, 78]], path: [[82, 100, 50], [96, 110, 60], [70, 86, 44]], wall: [[22, 44, 20], [28, 54, 26], [16, 34, 16]]
    };
    const Tt = L.Map.T;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const wx = x / TS, wy = y / TS;
      const jx = wx + n1(wx / 260, wy / 260) * 110, jy = wy + n2(wx / 260, wy / 260) * 110;
      let t = map.terrain(jx, jy);
      if (map.terrain(wx, wy) === 0 && t !== 0) t = 0;
      if (map.terrain(wx, wy) !== 0 && t === 0) t = map.terrain(wx, wy);
      let key = t === Tt.WALL ? 'wall' : t === Tt.LANE ? 'lane' : t === Tt.RIVER ? 'river' : t === Tt.PATH ? 'path' : t === Tt.BASE ? (wy > wx ? 'base0' : 'base1') : 'grass';
      const n = n3(wx / 90, wy / 90) + n1(wx / 35, wy / 35) * 0.5;
      const dither = ((x + y) & 1) ? 0.06 : -0.06;
      const idx = n + dither > 0.18 ? 1 : n + dither < -0.18 ? 2 : 0;
      let [r, g, b] = pal[key][idx];
      if (key === 'base0' || key === 'base1') { const gx = Math.floor(wx / 180), gy = Math.floor(wy / 180); if (wx % 180 < 10 || wy % 180 < 10) { r *= 0.75; g *= 0.75; b *= 0.75; } else if ((gx + gy) & 1) { r *= 1.05; g *= 1.05; b *= 1.05; } }
      if (key === 'lane' && n1(wx / 20, wy / 20) > 0.42) { r = 180; g = 170; b = 150; }
      if (key === 'river') { const w = Math.sin(wx / 40 + n2(wx / 200, wy / 200) * 6) * Math.sin(wy / 50); if (w > 0.75) { r += 40; g += 50; b += 50; } }
      if (key === 'grass' && n2(wx / 12, wy / 12) > 0.5) { r += 20; g += 30; b += 10; }
      const i = (y * W + x) * 4; p[i] = r; p[i + 1] = g; p[i + 2] = b; p[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const rnd = L.RNG(99);
    for (let j = 0; j < map.n; j++) for (let i = 0; i < map.n; i++) {
      if (!map.brushId[j * map.n + i]) continue;
      for (let q = 0; q < 7; q++) {
        const x = (i * 100 + rnd() * 100) * TS, y = (j * 100 + rnd() * 100) * TS, h = 5 + rnd() * 5;
        ctx.strokeStyle = rnd() < 0.5 ? '#2a7a2a' : '#48a038'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2 + rnd() * 4, y - h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 3 + rnd() * 2, y - h * 0.8); ctx.stroke();
      }
    }
    for (let j = 1; j < map.n - 1; j++) for (let i = 1; i < map.n - 1; i++) {
      const k = j * map.n + i; if (map.t[k]) continue;
      const edge = map.t[k - 1] || map.t[k + 1] || map.t[k - map.n] || map.t[k + map.n];
      const count = edge ? 2 : (rnd() < 0.55 ? 1 : 0);
      for (let q = 0; q < count; q++) {
        const x = (i * 100 + rnd() * 100) * TS, y = (j * 100 + rnd() * 100) * TS, r = (edge ? 9 : 11) + rnd() * 6;
        const g1 = ['#1e4a1c', '#245a22', '#2c6a26', '#1a3e18'][Math.floor(rnd() * 4)];
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.5, r, r * 0.55, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = shade(g1, 0.7); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
        ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.82, 0, 6.3); ctx.fill();
        ctx.fillStyle = shade(g1, 1.35); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.4, r * 0.35, 0, 6.3); ctx.fill();
      }
      if (edge && rnd() < 0.12) { const x = (i * 100 + 50) * TS, y = (j * 100 + 50) * TS; ctx.fillStyle = '#6a6a70'; ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#9a9aa2'; ctx.beginPath(); ctx.ellipse(x - 1, y - 1, 4, 2.5, 0, 0, 6.3); ctx.fill(); }
    }
    for (const c of map.camps) {
      const x = c.p[0] * TS, y = c.p[1] * TS, r = (c.side === 2 ? 480 : 300) * TS;
      ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.stroke();
      if (c.side === 2) { ctx.fillStyle = c.id === 'dragon' ? 'rgba(120,60,20,0.35)' : 'rgba(80,30,100,0.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); }
    }
    for (let t = 0; t < 2; t++) {
      const f = map.fountain[t]; ctx.fillStyle = t ? 'rgba(255,90,60,0.18)' : 'rgba(90,140,255,0.18)'; ctx.beginPath(); ctx.arc(f[0] * TS, f[1] * TS, 1000 * TS, 0, 6.3); ctx.fill();
    }
    const mini = mk(140, 140), mctx = mini.getContext('2d'); mctx.imageSmoothingEnabled = true; mctx.drawImage(cv, 0, 0, 140, 140);
    return { canvas: cv, mini, scale: TS };
  }

  function build(map) {
    const A = { minion: [{}, {}], monster: {}, tower: [], inhib: [], nexus: [], prop: {} };
    const steps = [];
    steps.push(() => { A.terrain = buildTerrain(map); });
    steps.push(() => {
      for (const t of [0, 1]) { for (const m of ['melee', 'caster', 'siege', 'super']) A.minion[t][m] = buildMinion(m, t); A.tower[t] = [buildTower(t, false), buildTower(t, true)]; A.inhib[t] = [buildInhib(t, false), buildInhib(t, true)]; A.nexus[t] = [buildNexus(t, false), buildNexus(t, true)]; A.prop['shop' + t] = buildProp('shop', t); A.prop['fountain' + t] = buildProp('fountain', t); }
      for (const m of Object.keys(D.MONSTERS)) A.monster[m] = buildMonster(m);
      for (const p of ['ward', 'pinkWard', 'shroom', 'chomper']) A.prop[p] = buildProp(p);
    });
    for (const cid of D.CHAMP_ORDER) steps.push(() => { L.Art.icon(L.SKINS.baseId(cid), 64); L.Art.icon(L.SKINS.baseId(cid), 24); for (let s = 0; s < 4; s++) { L.Icons.ability(cid, s, 44); L.Icons.ability(cid, s, 32); } });
    steps.push(() => { for (const id in D.ITEMS) { L.Icons.item(id, 32); L.Icons.item(id, 38); } for (const s of D.SPELL_ORDER) { L.Icons.spell(s, 30); L.Icons.spell(s, 36); } });
    return { A, steps };
  }

  L.GFX = { build, shade, mk, crisp, flip, tint, hex, K, TEAM, TS };
})(globalThis.LoL98 = globalThis.LoL98 || {});
