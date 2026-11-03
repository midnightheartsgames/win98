(function (S) {
  'use strict';
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], TIP_ICON = 24;
  const FACES = {
    pale: { rim: [[20, 48, 108], [95, 144, 218]], shine: [244, 252, 255], low: [106, 158, 224], top: [206, 235, 253], bottom: [134, 190, 240] },
    deep: { rim: [[14, 28, 78], [44, 86, 166]], shine: [111, 154, 228], low: [28, 58, 132], top: [66, 106, 186], bottom: [30, 58, 128] },
    slate: { rim: [[20, 48, 108], [74, 114, 190]], shine: [188, 212, 246], low: [94, 130, 200], top: [128, 160, 220], bottom: [90, 122, 190] },
    night: { rim: [[10, 18, 48], [38, 52, 94]], shine: [62, 80, 136], low: [32, 44, 90], top: [44, 58, 104], bottom: [28, 38, 78] },
    white: { rim: [[20, 48, 108], [111, 154, 228]], shine: [255, 255, 255], low: [186, 212, 240], top: [252, 254, 255], bottom: [214, 232, 250] },
    well: { rim: [[66, 110, 182], [150, 192, 236]], shine: [132, 180, 232], low: [214, 236, 252], top: [160, 204, 244], bottom: [188, 222, 250] },
    wellDark: { rim: [[40, 70, 140], [74, 110, 182]], shine: [70, 104, 176], low: [120, 152, 214], top: [88, 122, 192], bottom: [104, 138, 206] }
  };
  const BUTTONS = {
    normal: { top: [36, 80, 170], bottom: [100, 166, 236], rim: [18, 44, 104], ring: [130, 178, 240], gloss: 0.55 },
    hover: { top: [60, 116, 214], bottom: [148, 206, 255], rim: [18, 44, 104], ring: [190, 226, 255], gloss: 0.65 },
    down: { top: [22, 50, 124], bottom: [54, 100, 190], rim: [12, 28, 76], ring: [60, 100, 176], gloss: 0 },
    on: { top: [20, 110, 200], bottom: [150, 236, 255], rim: [12, 40, 104], ring: [232, 252, 255], gloss: 0.6 },
    off: { top: [118, 132, 158], bottom: [158, 170, 194], rim: [66, 78, 104], ring: [176, 186, 204], gloss: 0.2 },
    red: { top: [146, 22, 18], bottom: [232, 72, 58], rim: [70, 8, 8], ring: [250, 160, 150], gloss: 0.5 },
    good: { top: [22, 112, 40], bottom: [118, 210, 104], rim: [8, 52, 16], ring: [172, 240, 160], gloss: 0.5 },
    bad: { top: [124, 34, 30], bottom: [208, 98, 82], rim: [60, 12, 10], ring: [238, 172, 160], gloss: 0.45 }
  };

  const dithered = (rgb, x, y) => {
    const d = (BAYER[(x & 3) + (y & 3) * 4] + 0.5) / 16 - 0.5;
    return [
      S.clamp(Math.round((rgb[0] + d * 8) / 8) * 8, 0, 255),
      S.clamp(Math.round((rgb[1] + d * 4) / 4) * 4, 0, 255),
      S.clamp(Math.round((rgb[2] + d * 8) / 8) * 8, 0, 255)
    ];
  };

  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  const insideRound = (x, y, w, h, r, inset) => {
    const ww = w - inset * 2, hh = h - inset * 2, rr = Math.max(0, r - inset), ax = x + 0.5 - inset, ay = y + 0.5 - inset;
    if (ax < 0 || ay < 0 || ax > ww || ay > hh) return false;
    const dx = ax < rr ? rr - ax : ax > ww - rr ? ax - (ww - rr) : 0, dy = ay < rr ? rr - ay : ay > hh - rr ? ay - (hh - rr) : 0;
    return dx * dx + dy * dy <= rr * rr;
  };

  const shapes = new Map();

  const shapeOf = (key, w, h, paint) => {
    if (shapes.has(key)) return shapes.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d'), image = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = paint(x, y);
        if (!c) continue;
        const o = (x + y * w) * 4;
        image.data[o] = c[0];
        image.data[o + 1] = c[1];
        image.data[o + 2] = c[2];
        image.data[o + 3] = 255;
      }
    }
    g.putImageData(image, 0, 0);
    shapes.set(key, canvas);
    return canvas;
  };

  const glassPaint = (w, h, face, r) => (x, y) => {
    if (!insideRound(x, y, w, h, r, 0)) return null;
    if (!insideRound(x, y, w, h, r, 1)) return face.rim[0];
    if (!insideRound(x, y, w, h, r, 2)) return face.rim[1];
    if (!insideRound(x, y - 1, w, h, r, 2)) return face.shine;
    if (!insideRound(x, y + 1, w, h, r, 2)) return face.low;
    return dithered(mix(face.top, face.bottom, (y - 2) / Math.max(1, h - 5)), x, y);
  };

  const platePaint = (w, h, r, look) => (x, y) => {
    if (!insideRound(x, y, w, h, r, 0)) return null;
    if (!insideRound(x, y, w, h, r, 1)) return look.rim;
    if (!insideRound(x, y, w, h, r, 2)) return look.ring;
    const base = mix(look.top, look.bottom, (y - 2) / Math.max(1, h - 5));
    const band = y < h * 0.46 && insideRound(x, y, w, h * 0.92, r, 3) ? look.gloss * (1 - y / (h * 0.46)) : 0;
    return dithered(mix(base, [255, 255, 255], band), x, y);
  };

  const bubblePaint = (size, look) => {
    const r = size / 2;
    return (x, y) => {
      const px = x + 0.5 - r, py = y + 0.5 - r, d = Math.hypot(px, py);
      if (d > r) return null;
      if (d > r - 1) return look.rim;
      if (d > r - 2.1) return look.ring;
      const base = mix(look.top, look.bottom, S.clamp((py + r) / (2 * r), 0, 1));
      const ex = px / (r * 0.66), ey = (py + r * 0.46) / (r * 0.4), inGloss = ex * ex + ey * ey;
      return dithered(mix(base, [255, 255, 255], inGloss < 1 ? look.gloss * (1 - inGloss * 0.6) : 0), x, y);
    };
  };

  class Layer {
    constructor(canvas) {
      this.canvas = canvas;
      this.g = canvas.getContext('2d');
      this.base = document.createElement('canvas');
      this.items = [];
      this.seen = new Map();
      this.hover = null;
      this.part = null;
      this.down = null;
      this.hoverAt = 0;
      this.full = true;
      this.hidden = false;
      this.blank = false;
      this.redraws = 0;
    }

    set(items, paintBase) {
      const { canvas, base } = this;
      this.items = items;
      this.seen.clear();
      base.width = canvas.width;
      base.height = canvas.height;
      paintBase(base.getContext('2d'));
      this.full = true;
      this.hover = null;
      this.down = null;
    }

    stateOf(item) {
      return { hover: this.hover === item, part: this.hover === item ? this.part : null, down: this.down === item };
    }

    keyOf(item) {
      const state = this.stateOf(item);
      return (item.key ? item.key() : '') + '|' + (item.parts ? state.part + (state.down ? 'd' : '') : (state.hover ? 'h' : '') + (state.down ? 'd' : ''));
    }

    update() {
      const { g, canvas, base } = this;
      if (this.hidden) {
        if (!this.blank) g.clearRect(0, 0, canvas.width, canvas.height);
        this.blank = true;
        return;
      }
      if (this.blank) this.full = true;
      this.blank = false;
      if (this.full) {
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(base, 0, 0);
      }
      for (const item of this.items) {
        if (!item.draw) continue;
        const key = this.keyOf(item);
        if (!this.full && this.seen.get(item) === key) continue;
        if (!this.full) {
          g.clearRect(item.x, item.y, item.w, item.h);
          g.drawImage(base, item.x, item.y, item.w, item.h, item.x, item.y, item.w, item.h);
        }
        item.draw(g, this.stateOf(item));
        this.seen.set(item, key);
        this.redraws++;
      }
      this.full = false;
    }

    at(x, y) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.when && !item.when()) continue;
        if (x < item.x || y < item.y || x >= item.x + item.w || y >= item.y + item.h) continue;
        if (item.round && Math.hypot(x - item.x - item.w / 2, y - item.y - item.h / 2) > item.w / 2) continue;
        return item;
      }
      return null;
    }

    move(x, y, now) {
      const item = x === null ? null : this.at(x, y), part = item && item.parts ? item.parts(x, y) : null;
      if (item !== this.hover || part !== this.part) {
        this.hover = item;
        this.part = part;
        this.hoverAt = now;
      }
      return item;
    }

    press(x, y, button, now) {
      const item = this.move(x, y, now);
      if (!item) return false;
      this.down = item;
      if (item.click) item.click(button, this.part, x, y, now);
      return true;
    }

    release() {
      this.down = null;
    }

    tip(now, delay) {
      const item = this.hover;
      if (!item || !item.tip || now - this.hoverAt < delay) return null;
      return item.tip(this.part);
    }
  }

  S.Kit = {
    FACES, BUTTONS, Layer, insideRound, dithered,

    glass(g, x, y, w, h, face, r) {
      const key = 'g' + w + 'x' + h + face + r;
      g.drawImage(shapeOf(key, w, h, glassPaint(w, h, FACES[face], r === undefined ? 8 : r)), x, y);
    },

    plate(g, x, y, w, h, state, r) {
      const key = 'p' + w + 'x' + h + state + r;
      g.drawImage(shapeOf(key, w, h, platePaint(w, h, r === undefined ? 5 : r, BUTTONS[state])), x, y);
      if (state === 'down') return 1;
      return 0;
    },

    bubble(g, cx, cy, size, state) {
      const key = 'b' + size + state;
      g.drawImage(shapeOf(key, size, size, bubblePaint(size, BUTTONS[state])), Math.round(cx - size / 2), Math.round(cy - size / 2));
    },

    stateName(state, on, enabled) {
      if (enabled === false) return 'off';
      if (state.down) return 'down';
      if (on) return 'on';
      return state.hover ? 'hover' : 'normal';
    },

    bar(g, x, y, w, h, k, color, hollow) {
      g.fillStyle = '#14306c';
      g.fillRect(x, y, w, h);
      g.fillStyle = hollow || '#3e5a96';
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      const fill = Math.round((w - 2) * S.clamp(k, 0, 1));
      if (fill <= 0) return;
      g.fillStyle = color;
      g.fillRect(x + 1, y + 1, fill, h - 2);
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      g.fillRect(x + 1, y + 1, fill, 1);
    },

    tipLines(tip, width) {
      const lines = [];
      if (tip.title) {
        for (const text of S.Font.wrap('bold', tip.title, width)) lines.push({ font: 'bold', text, color: '#102a66' });
      }
      if (tip.text) {
        for (const text of S.Font.wrap('small', tip.text, width)) lines.push({ font: 'small', text, color: '#102a66' });
      }
      if (tip.line) {
        for (const text of S.Font.wrap('smallb', tip.line, width)) lines.push({ font: 'smallb', text, color: tip.lineColor || '#102a66' });
      }
      if (tip.keys) {
        for (const text of S.Font.wrap('smallb', tip.keys, width)) lines.push({ font: 'smallb', text, color: '#2a4fa8' });
      }
      if (tip.later) {
        for (const text of S.Font.wrap('small', tip.later, width)) lines.push({ font: 'small', text, color: '#5c6c94' });
      }
      return lines;
    },

    tipBox(tip, sw, sh, x, y) {
      const width = 236, pad = 8, indent = tip.icon ? TIP_ICON : 0, lines = S.Kit.tipLines(tip, width - indent), rowH = 14;
      const w = Math.min(width, Math.max(...lines.map(l => S.Font.measure(l.font, l.text))) + indent) + pad * 2, h = Math.max(lines.length * rowH, indent) + pad * 2 - 2;
      return { lines, rowH, pad, indent, w, h, x: S.clamp(Math.round(x - w / 2), 2, sw - w - 2), y: S.clamp(Math.round(y - h - 6), 2, sh - h - 2) };
    },

    drawTip(g, sw, sh, x, y, tip) {
      const box = S.Kit.tipBox(tip, sw, sh, x, y);
      S.Kit.glass(g, box.x, box.y, box.w, box.h, 'pale', 7);
      if (tip.icon) S.Icons.draw(g, tip.icon, box.x + box.pad - 2, box.y + box.pad - 2, tip.iconTone || 'blue');
      box.lines.forEach((line, i) => S.Font.draw(g, line.font, line.text, box.x + box.pad + box.indent, box.y + box.pad - 1 + i * box.rowH, line.color));
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
