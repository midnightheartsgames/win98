(function (C) {
  'use strict';
  const { clamp, valueNoise, hash01, fbm } = C;

  function canvas(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }

  function paint(w, h, fn) {
    const cv = canvas(w, h), cx = cv.getContext('2d'), im = cx.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = fn(x, y), i = (y * w + x) * 4;
      d[i] = clamp(c[0], 0, 255); d[i + 1] = clamp(c[1], 0, 255); d[i + 2] = clamp(c[2], 0, 255); d[i + 3] = c[3] == null ? 255 : c[3];
    }
    cx.putImageData(im, 0, 0);
    return cv;
  }

  const tile = (x, y, s, sc, seed, oct = 3) => {
    const fx = x / s, fy = y / s;
    const a = fbm(x / sc, y / sc, seed, oct), b = fbm((x - s) / sc, y / sc, seed, oct), c = fbm(x / sc, (y - s) / sc, seed, oct), d = fbm((x - s) / sc, (y - s) / sc, seed, oct);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };

  function metal(s = 128) {
    return paint(s, s, (x, y) => {
      const n = tile(x, y, s, 14, 3, 4), m = tile(x, y, s, 5, 5, 2), h = hash01(x, y, 7);
      const scratch = (hash01(Math.floor((x + y * 0.3) / 2), Math.floor(y / 9), 9) > 0.985) ? 1.25 : 1;
      const rust = clamp((n - 0.56) * 3 + (m - 0.5) * 0.6, 0, 1);
      const k = (0.8 + n * 0.3 + (h - 0.5) * 0.08) * scratch;
      return [(38 + rust * 34) * k, (37 + rust * 16) * k, (34 + rust * 4) * k];
    });
  }

  function frame(s = 48, b = 12) {
    const base = metal(s).getContext('2d').getImageData(0, 0, s, s).data;
    return paint(s, s, (x, y) => {
      const i = (y * s + x) * 4;
      let r = base[i], g = base[i + 1], bl = base[i + 2];
      const edge = Math.min(x, y, s - 1 - x, s - 1 - y);
      if (edge < b) {
        const out = edge === 0 || edge === b - 1 ? 0.35 : 1;
        const lit = (x < b && x <= y && x <= s - 1 - y) || (y < b && y <= x && y <= s - 1 - x) ? 1.35 : 0.72;
        const k = (edge === 1 ? 1.5 : edge === b - 2 ? 0.55 : lit) * out;
        r = (r + 22) * k; g = (g + 18) * k; bl = (bl + 12) * k;
        for (const [cx, cy] of [[b / 2, b / 2], [s - b / 2, b / 2], [b / 2, s - b / 2], [s - b / 2, s - b / 2]]) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (d < 3.2) { const sh = 1.6 - d / 3.2 + ((x + 0.5 - cx) + (y + 0.5 - cy) < 0 ? 0.4 : -0.2); r = 120 * sh; g = 112 * sh; bl = 96 * sh; }
        }
      } else { r *= 0.45; g *= 0.45; bl *= 0.42; }
      return [r, g, bl, edge < b ? 255 : 0];
    });
  }

  function mesh(s = 20) {
    return paint(s, s * 2, (x, y) => {
      const cy = y % s, row = Math.floor(y / s), ox = row % 2 ? s / 2 : 0;
      const dx = ((x + ox) % s) - s / 2, dy = cy - s / 2;
      const hex = Math.max(Math.abs(dx) * 0.866 + Math.abs(dy) * 0.5, Math.abs(dy));
      const hole = hex < s * 0.36;
      const rim = hex >= s * 0.36 && hex < s * 0.42;
      const n = 0.9 + hash01(x, y, 11) * 0.15;
      if (hole) return [13 * n, 13 * n, 12 * n];
      if (rim) return [(dy < 0 ? 58 : 30) * n, (dy < 0 ? 56 : 29) * n, (dy < 0 ? 50 : 26) * n];
      return [38 * n, 37 * n, 33 * n];
    });
  }

  function plate(s = 16) {
    return paint(s, s, (x, y) => {
      const a = ((x + y) % s + s) % s, b = ((x - y) % s + s) % s;
      const d1 = Math.abs(a - s / 2), d2 = Math.abs(b - s / 2);
      const bump = (x % s < s / 2) === (y % s < s / 2) ? d1 < 2.2 && Math.abs(b - s / 2) < 6 : d2 < 2.2 && Math.abs(a - s / 2) < 6;
      const n = 0.9 + hash01(x, y, 13) * 0.14;
      if (bump) return [96 * n, 92 * n, 84 * n];
      return [52 * n, 50 * n, 46 * n];
    });
  }

  let SKIN = null;
  function skinVars() {
    if (SKIN) return SKIN;
    SKIN = {
      '--cp-metal': `url(${metal().toDataURL()})`,
      '--cp-frame': `url(${frame().toDataURL()})`,
      '--cp-mesh': `url(${mesh().toDataURL()})`,
      '--cp-plate': `url(${plate().toDataURL()})`
    };
    return SKIN;
  }

  const TAU = Math.PI * 2;
  const G = {
    rad(c, s) { c.beginPath(); c.arc(0, 0, s * 0.12, 0, TAU); c.fill(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3; c.beginPath(); c.moveTo(Math.cos(a - 0.52) * s * 0.18, Math.sin(a - 0.52) * s * 0.18); c.arc(0, 0, s * 0.44, a - 0.52, a + 0.52); c.arc(0, 0, s * 0.18, a + 0.52, a - 0.52, true); c.fill(); } },
    bleed(c, s) { c.beginPath(); c.moveTo(0, -s * 0.45); c.bezierCurveTo(s * 0.12, -s * 0.2, s * 0.34, 0, s * 0.34, s * 0.14); c.arc(0, s * 0.14, s * 0.34, 0, Math.PI); c.bezierCurveTo(-s * 0.34, 0, -s * 0.12, -s * 0.2, 0, -s * 0.45); c.fill(); },
    hunger(c, s) { c.beginPath(); c.ellipse(0, s * 0.05, s * 0.44, s * 0.24, -0.35, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(k * s * 0.18, s * 0.02 - k * s * 0.07, s * 0.04, s * 0.14, -0.35 + 0.9, 0, TAU); c.fill(); } c.globalCompositeOperation = 'source-over'; },
    weight(c, s) { c.beginPath(); c.moveTo(-s * 0.36, s * 0.42); c.lineTo(s * 0.36, s * 0.42); c.lineTo(s * 0.26, -s * 0.12); c.lineTo(-s * 0.26, -s * 0.12); c.fill(); c.lineWidth = s * 0.11; c.beginPath(); c.arc(0, -s * 0.22, s * 0.16, Math.PI, 0); c.stroke(); },
    psy(c, s) { c.lineWidth = s * 0.1; c.beginPath(); for (let x = -0.45; x <= 0.45; x += 0.05) c.lineTo(x * s, Math.sin(x * 18) * s * 0.22 * (1 - Math.abs(x) * 1.2)); c.stroke(); },
    drunk(c, s) { c.fillRect(-s * 0.14, -s * 0.12, s * 0.28, s * 0.54); c.fillRect(-s * 0.06, -s * 0.44, s * 0.12, s * 0.34); },
    safe(c, s) { c.beginPath(); c.moveTo(0, -s * 0.44); c.lineTo(s * 0.36, -s * 0.28); c.lineTo(s * 0.3, s * 0.14); c.lineTo(0, s * 0.44); c.lineTo(-s * 0.3, s * 0.14); c.lineTo(-s * 0.36, -s * 0.28); c.fill(); },
    stamina(c, s) { c.beginPath(); c.moveTo(s * 0.1, -s * 0.46); c.lineTo(-s * 0.26, s * 0.06); c.lineTo(-s * 0.02, s * 0.06); c.lineTo(-s * 0.12, s * 0.46); c.lineTo(s * 0.26, -s * 0.08); c.lineTo(s * 0.02, -s * 0.08); c.fill(); },
    health(c, s) { c.fillRect(-s * 0.12, -s * 0.4, s * 0.24, s * 0.8); c.fillRect(-s * 0.4, -s * 0.12, s * 0.8, s * 0.24); },
    bullet(c, s) { c.beginPath(); c.moveTo(-s * 0.1, s * 0.44); c.lineTo(-s * 0.1, -s * 0.12); c.quadraticCurveTo(0, -s * 0.5, s * 0.1, -s * 0.12); c.lineTo(s * 0.1, s * 0.44); c.fill(); },
    burn(c, s) { c.beginPath(); c.moveTo(0, -s * 0.46); c.bezierCurveTo(s * 0.4, -s * 0.1, s * 0.34, s * 0.44, 0, s * 0.44); c.bezierCurveTo(-s * 0.34, s * 0.44, -s * 0.36, s * 0.04, -s * 0.12, -s * 0.16); c.quadraticCurveTo(-s * 0.04, s * 0.06, 0, -s * 0.46); c.fill(); },
    shock(c, s) { G.stamina(c, s); },
    chem(c, s) { c.beginPath(); c.moveTo(-s * 0.1, -s * 0.44); c.lineTo(s * 0.1, -s * 0.44); c.lineTo(s * 0.1, -s * 0.1); c.lineTo(s * 0.38, s * 0.4); c.lineTo(-s * 0.38, s * 0.4); c.lineTo(-s * 0.1, -s * 0.1); c.fill(); },
    carry(c, s) { c.fillRect(-s * 0.3, -s * 0.24, s * 0.6, s * 0.66); c.lineWidth = s * 0.1; c.beginPath(); c.arc(0, -s * 0.24, s * 0.18, Math.PI, 0); c.stroke(); },
    regen(c, s) { c.beginPath(); c.moveTo(0, s * 0.42); c.bezierCurveTo(-s * 0.6, 0, -s * 0.3, -s * 0.52, 0, -s * 0.18); c.bezierCurveTo(s * 0.3, -s * 0.52, s * 0.6, 0, 0, s * 0.42); c.fill(); },
    money(c, s) { c.fillRect(-s * 0.44, -s * 0.24, s * 0.88, s * 0.48); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, s * 0.13, 0, TAU); c.fill(); c.fillRect(-s * 0.36, -s * 0.16, s * 0.08, s * 0.08); c.fillRect(s * 0.28, s * 0.08, s * 0.08, s * 0.08); c.globalCompositeOperation = 'source-over'; },
    item(c, s) { c.beginPath(); c.moveTo(0, -s * 0.42); c.lineTo(s * 0.4, -s * 0.2); c.lineTo(s * 0.4, s * 0.24); c.lineTo(0, s * 0.44); c.lineTo(-s * 0.4, s * 0.24); c.lineTo(-s * 0.4, -s * 0.2); c.fill(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.2); c.lineTo(0, 0); c.lineTo(s * 0.4, -s * 0.2); c.moveTo(0, 0); c.lineTo(0, s * 0.44); c.stroke(); c.globalCompositeOperation = 'source-over'; },
    pda(c, s) { c.fillRect(-s * 0.28, -s * 0.44, s * 0.56, s * 0.88); c.globalCompositeOperation = 'destination-out'; c.fillRect(-s * 0.2, -s * 0.34, s * 0.4, s * 0.4); c.globalCompositeOperation = 'source-over'; c.fillRect(-s * 0.14, -s * 0.26, s * 0.28, s * 0.04); c.fillRect(-s * 0.14, -s * 0.16, s * 0.2, s * 0.04); },
    quest(c, s) { c.fillRect(-s * 0.34, -s * 0.44, s * 0.08, s * 0.88); c.beginPath(); c.moveTo(-s * 0.26, -s * 0.42); c.lineTo(s * 0.38, -s * 0.24); c.lineTo(-s * 0.26, -s * 0.04); c.fill(); },
    warn(c, s) { c.beginPath(); c.moveTo(0, -s * 0.44); c.lineTo(s * 0.46, s * 0.4); c.lineTo(-s * 0.46, s * 0.4); c.fill(); c.globalCompositeOperation = 'destination-out'; c.fillRect(-s * 0.05, -s * 0.14, s * 0.1, s * 0.3); c.fillRect(-s * 0.05, s * 0.22, s * 0.1, s * 0.09); c.globalCompositeOperation = 'source-over'; },
    info(c, s) { c.beginPath(); c.arc(0, 0, s * 0.44, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; c.fillRect(-s * 0.06, -s * 0.06, s * 0.12, s * 0.32); c.fillRect(-s * 0.06, -s * 0.28, s * 0.12, s * 0.12); c.globalCompositeOperation = 'source-over'; },
    loc(c, s) { c.beginPath(); c.arc(0, -s * 0.12, s * 0.28, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(0, s * 0.46); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, -s * 0.12, s * 0.11, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; },
    stash(c, s) { c.fillRect(-s * 0.4, -s * 0.2, s * 0.8, s * 0.56); c.fillRect(-s * 0.44, -s * 0.34, s * 0.88, s * 0.14); c.globalCompositeOperation = 'destination-out'; c.fillRect(-s * 0.08, -s * 0.2, s * 0.16, s * 0.16); c.globalCompositeOperation = 'source-over'; },
    target(c, s) { c.lineWidth = s * 0.1; c.beginPath(); c.arc(0, 0, s * 0.34, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.12, 0, TAU); c.fill(); for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2); c.fillRect(-s * 0.04, -s * 0.5, s * 0.08, s * 0.14); c.restore(); } },
    shelter(c, s) { c.beginPath(); c.moveTo(0, -s * 0.44); c.lineTo(s * 0.44, -s * 0.04); c.lineTo(s * 0.32, -s * 0.04); c.lineTo(s * 0.32, s * 0.42); c.lineTo(-s * 0.32, s * 0.42); c.lineTo(-s * 0.32, -s * 0.04); c.lineTo(-s * 0.44, -s * 0.04); c.fill(); },
    trader(c, s) { c.beginPath(); c.arc(-s * 0.1, s * 0.12, s * 0.26, 0, TAU); c.fill(); c.beginPath(); c.arc(s * 0.16, -s * 0.12, s * 0.26, 0, TAU); c.fill(); },
    anomaly(c, s) { c.lineWidth = s * 0.09; c.beginPath(); for (let t = 0; t < 12; t += 0.2) c.lineTo(Math.cos(t) * t * s * 0.037, Math.sin(t) * t * s * 0.037); c.stroke(); },
    lock(c, s) { c.fillRect(-s * 0.3, -s * 0.04, s * 0.6, s * 0.46); c.lineWidth = s * 0.1; c.beginPath(); c.arc(0, -s * 0.06, s * 0.2, Math.PI, 0); c.stroke(); },
    check(c, s) { c.lineWidth = s * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 0.32, 0); c.lineTo(-s * 0.08, s * 0.26); c.lineTo(s * 0.34, -s * 0.3); c.stroke(); },
    w_recoil(c, s) { c.lineWidth = s * 0.08; c.beginPath(); for (let t = 0; t <= 1; t += 0.02) c.lineTo(-s * 0.4 + t * s * 0.8, Math.sin(t * TAU * 4) * s * 0.2); c.stroke(); c.fillRect(-s * 0.46, -s * 0.28, s * 0.08, s * 0.56); c.fillRect(s * 0.38, -s * 0.28, s * 0.08, s * 0.56); },
    w_sight(c, s) { c.beginPath(); c.moveTo(-s * 0.44, s * 0.3); c.lineTo(-s * 0.44, -s * 0.24); c.lineTo(-s * 0.1, -s * 0.24); c.lineTo(0, -s * 0.06); c.lineTo(s * 0.1, -s * 0.24); c.lineTo(s * 0.44, -s * 0.24); c.lineTo(s * 0.44, s * 0.3); c.fill(); },
    w_mag(c, s) { c.beginPath(); c.moveTo(-s * 0.16, -s * 0.44); c.lineTo(s * 0.12, -s * 0.44); c.quadraticCurveTo(s * 0.18, s * 0.1, s * 0.4, s * 0.38); c.lineTo(s * 0.1, s * 0.46); c.quadraticCurveTo(-s * 0.12, s * 0.16, -s * 0.16, -s * 0.44); c.fill(); },
    w_barrel(c, s) { c.fillRect(-s * 0.46, -s * 0.1, s * 0.92, s * 0.2); c.fillRect(s * 0.3, -s * 0.16, s * 0.16, s * 0.32); c.fillRect(-s * 0.46, -s * 0.18, s * 0.18, s * 0.36); },
    w_rate(c, s) { for (let k = 0; k < 8; k++) { c.save(); c.rotate(k * TAU / 8); c.fillRect(-s * 0.07, -s * 0.46, s * 0.14, s * 0.2); c.restore(); } c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, s * 0.12, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; },
    w_reliable(c, s) { c.beginPath(); c.moveTo(-s * 0.3, s * 0.42); c.lineTo(-s * 0.3, -s * 0.06); c.lineTo(s * 0.06, -s * 0.06); c.lineTo(s * 0.44, -s * 0.36); c.lineTo(s * 0.2, s * 0.02); c.lineTo(s * 0.2, s * 0.42); c.fill(); },
    o_light(c, s) { c.beginPath(); c.moveTo(-s * 0.38, s * 0.42); c.quadraticCurveTo(-s * 0.1, -s * 0.1, s * 0.38, -s * 0.44); c.quadraticCurveTo(s * 0.2, s * 0.2, -s * 0.38, s * 0.42); c.fill(); },
    o_plates(c, s) { c.beginPath(); c.moveTo(-s * 0.36, -s * 0.4); c.lineTo(s * 0.36, -s * 0.4); c.lineTo(s * 0.3, s * 0.2); c.lineTo(0, s * 0.44); c.lineTo(-s * 0.3, s * 0.2); c.fill(); c.globalCompositeOperation = 'destination-out'; c.fillRect(-s * 0.36, -s * 0.06, s * 0.72, s * 0.06); c.globalCompositeOperation = 'source-over'; },
    o_belt(c, s) { c.fillRect(-s * 0.2, -s * 0.36, s * 0.4, s * 0.72); c.fillRect(-s * 0.26, -s * 0.44, s * 0.52, s * 0.1); c.fillRect(-s * 0.26, s * 0.34, s * 0.52, s * 0.1); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, s * 0.1, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; },
    o_belt2(c, s) { G.o_belt(c, s * 0.8); c.fillRect(s * 0.26, -s * 0.44, s * 0.08, s * 0.24); c.fillRect(s * 0.18, -s * 0.36, s * 0.24, s * 0.08); },
    o_chem(c, s) { G.chem(c, s); },
    o_carry(c, s) { G.carry(c, s); }
  };

  function drawGlyph(c, name, x, y, size, color) {
    const f = G[name]; if (!f) return;
    c.save(); c.translate(x, y); c.fillStyle = color; c.strokeStyle = color; f(c, size); c.restore();
  }

  const urls = new Map();
  function glyphUrl(name, size, color) {
    const key = name + '|' + size + '|' + color;
    if (!urls.has(key)) {
      const cv = canvas(size, size), c = cv.getContext('2d');
      c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowOffsetX = 1; c.shadowOffsetY = 1;
      drawGlyph(c, name, size / 2, size / 2, size * 0.86, color);
      urls.set(key, cv.toDataURL());
    }
    return urls.get(key);
  }

  function segBar(c, x, y, w, h, v, col, back = 'rgba(20,18,14,0.85)', seg = 3) {
    c.fillStyle = back; c.fillRect(x, y, w, h);
    const n = Math.max(4, Math.floor(w / (seg + 1))), on = Math.round(clamp(v, 0, 1) * n);
    const sw = w / n;
    c.fillStyle = col;
    for (let k = 0; k < on; k++) c.fillRect(Math.round(x + k * sw + 1), y + 1, Math.max(1, Math.round(sw - 1.5)), h - 2);
  }

  function imageToUrl(img) {
    const cv = canvas(img.w, img.h), cx = cv.getContext('2d'), im = cx.createImageData(img.w, img.h);
    new Uint32Array(im.data.buffer).set(img.data);
    cx.putImageData(im, 0, 0);
    return cv.toDataURL();
  }

  function imageToCanvas(img) {
    const cv = canvas(img.w, img.h), cx = cv.getContext('2d'), im = cx.createImageData(img.w, img.h);
    new Uint32Array(im.data.buffer).set(img.data);
    cx.putImageData(im, 0, 0);
    return cv;
  }

  C.Skin = { vars: skinVars, glyph: drawGlyph, glyphUrl, segBar, imageToUrl, imageToCanvas, GLYPHS: Object.keys(G) };
})(globalThis.Cop98 = globalThis.Cop98 || {});
