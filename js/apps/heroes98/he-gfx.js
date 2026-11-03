(function (H) {
  'use strict';
  const METAL = { line: '#0c0806', hi: ['#d8aa5c', '#b08a4a', '#8a6a34'], lo: ['#4a3418', '#36260e', '#24180a'], moon: '#ecd07a', velvet: ['#16224a', '#121c40'], plate: ['#6a5028', '#3a2a12'], tip: '#0e1630' };

  const fontFor = o => {
    if (o.font) return o.font;
    if (o.serif) return o.size >= 20 ? 'big' : 'title';
    if (o.size && o.size <= 10) return 'small';
    return o.bold ? 'bold' : 'text';
  };

  const CURSOR_GRIDS = {
    arrow: { hot: [0, 0], rows: ['k...............', 'kk..............', 'kwk.............', 'kwwk............', 'kwwwk...........', 'kwwwwk..........', 'kwwwwwk.........', 'kwwwwwwk........', 'kwwwwwwwk.......', 'kwwwwwkkkk......', 'kwwkwwk.........', 'kwk.kwwk........', 'kk...kwwk.......', 'k....kwwk.......', '......kwwk......', '.......kk.......'] }
  };
  const CURSOR_RECTS = {
    step: { hot: [8, 8], rects: [[5, 2, 5, 8, 'b'], [5, 10, 8, 3, 'b'], [6, 3, 1, 6, 'y']] },
    fly: { hot: [8, 8], rects: [[2, 9, 3, 2, 'w'], [4, 7, 3, 2, 'w'], [6, 5, 3, 2, 'w'], [8, 3, 3, 2, 'w'], [10, 2, 3, 2, 'w'], [3, 11, 6, 2, 'w'], [8, 9, 4, 2, 'w']] },
    sword: { hot: [15, 8], rects: [[1, 7, 2, 2, 'y'], [3, 7, 3, 2, 'b'], [6, 4, 2, 8, 'y'], [8, 7, 6, 2, 'g'], [14, 7, 1, 2, 'w']] },
    bow: { hot: [8, 8], rects: [[4, 1, 2, 2, 'b'], [5, 3, 2, 2, 'b'], [6, 5, 2, 6, 'b'], [5, 11, 2, 2, 'b'], [4, 13, 2, 2, 'b'], [3, 2, 1, 12, 'w'], [2, 7, 11, 1, 'g'], [13, 6, 2, 3, 'g']] },
    bowfar: { hot: [8, 8], rects: [[4, 1, 2, 2, 'b'], [5, 3, 2, 2, 'b'], [6, 5, 2, 6, 'b'], [5, 11, 2, 2, 'b'], [4, 13, 2, 2, 'b'], [3, 2, 1, 12, 'w'], [2, 7, 11, 1, 'g'], [13, 6, 2, 3, 'g'], [10, 10, 5, 2, 'r'], [12, 12, 2, 2, 'r']] },
    bell: { hot: [8, 8], rects: [[7, 1, 2, 2, 'y'], [5, 3, 6, 6, 'y'], [4, 9, 8, 2, 'y'], [7, 11, 2, 2, 'b']] },
    no: { hot: [8, 8], rects: [[5, 1, 6, 2, 'r'], [3, 3, 2, 2, 'r'], [11, 3, 2, 2, 'r'], [1, 5, 2, 6, 'r'], [13, 5, 2, 6, 'r'], [3, 11, 2, 2, 'r'], [11, 11, 2, 2, 'r'], [5, 13, 6, 2, 'r'], [5, 5, 2, 2, 'r'], [7, 7, 2, 2, 'r'], [9, 9, 2, 2, 'r']] },
    hand: { hot: [6, 1], rects: [[4, 6, 8, 8, 'w'], [4, 2, 2, 5, 'w'], [6, 1, 2, 6, 'w'], [8, 1, 2, 6, 'w'], [10, 2, 2, 5, 'w'], [1, 8, 3, 2, 'w']] },
    info: { hot: [8, 8], rects: [[5, 2, 6, 2, 'w'], [10, 4, 2, 3, 'w'], [7, 7, 3, 2, 'w'], [7, 9, 2, 2, 'w'], [7, 12, 2, 2, 'w']] },
    spell: { hot: [8, 8], rects: [[7, 1, 2, 14, 'y'], [1, 7, 14, 2, 'y'], [4, 4, 2, 2, 'w'], [10, 4, 2, 2, 'w'], [4, 10, 2, 2, 'w'], [10, 10, 2, 2, 'w'], [7, 7, 2, 2, 'w']] }
  };
  const CURSOR_COLORS = { k: '#000000', w: '#ffffff', y: '#f0c850', b: '#8a5a2a', g: '#c8ccd0', r: '#e02818' };

  const cursorCanvas = name => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const g = c.getContext('2d');
    const grid = CURSOR_GRIDS[name], rects = CURSOR_RECTS[name];
    if (grid) {
      grid.rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        g.fillStyle = CURSOR_COLORS[ch];
        g.fillRect(x * 2, y * 2, 2, 2);
      }));
    } else {
      g.fillStyle = '#000000';
      for (const [x, y, w, h] of rects.rects) g.fillRect(x * 2 - 2, y * 2 - 2, w * 2 + 4, h * 2 + 4);
      for (const [x, y, w, h, col] of rects.rects) {
        g.fillStyle = CURSOR_COLORS[col];
        g.fillRect(x * 2, y * 2, w * 2, h * 2);
      }
    }
    return { canvas: c, hot: (grid || rects).hot.map(v => v * 2) };
  };

  const cursorCache = new Map();
  H.cursorCss = (name, angle, digit) => {
    const turn = angle ? Math.round(angle / (Math.PI / 3)) % 6 : 0, key = name + ':' + turn + ':' + (digit || '');
    if (cursorCache.has(key)) return cursorCache.get(key);
    const base = cursorCanvas(name);
    let canvas = base.canvas, hot = base.hot;
    if (turn) {
      const a = turn * Math.PI / 3, c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.translate(16, 16);
      g.rotate(a);
      g.drawImage(canvas, -16, -16);
      canvas = c;
      const dx = hot[0] - 16, dy = hot[1] - 16;
      hot = [Math.round(16 + dx * Math.cos(a) - dy * Math.sin(a)), Math.round(16 + dx * Math.sin(a) + dy * Math.cos(a))].map(v => H.clamp(v, 0, 31));
    }
    if (digit && H.Font) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const g = c.getContext('2d');
      g.drawImage(canvas, 0, 0);
      H.Font.draw(g, 'bold', String(digit), 21, 19, '#000000');
      H.Font.draw(g, 'bold', String(digit), 20, 18, '#fff6c8');
      canvas = c;
    }
    const css = 'url(' + canvas.toDataURL() + ') ' + hot[0] + ' ' + hot[1] + ', auto';
    cursorCache.set(key, css);
    return css;
  };
  H.CURSORS = [...Object.keys(CURSOR_GRIDS), ...Object.keys(CURSOR_RECTS)];
  H.cursorImage = name => cursorCanvas(name).canvas;

  H.tint = (img, mask, color) => {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    if (!mask) return c;
    const m = document.createElement('canvas');
    m.width = img.width;
    m.height = img.height;
    const mg = m.getContext('2d');
    mg.drawImage(mask, 0, 0);
    mg.globalCompositeOperation = 'multiply';
    mg.fillStyle = color;
    mg.fillRect(0, 0, m.width, m.height);
    mg.globalCompositeOperation = 'destination-in';
    mg.drawImage(mask, 0, 0);
    g.drawImage(m, 0, 0);
    return c;
  };

  class Gfx {
    constructor(root) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = H.W;
      this.canvas.height = H.H;
      this.canvas.className = 'he-canvas';
      root.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      const tile = document.createElement('canvas');
      tile.width = 2;
      tile.height = 2;
      const tg = tile.getContext('2d');
      tg.fillStyle = METAL.velvet[0];
      tg.fillRect(0, 0, 2, 2);
      tg.fillStyle = METAL.velvet[1];
      tg.fillRect(0, 0, 1, 1);
      tg.fillRect(1, 1, 1, 1);
      this.velvet = this.ctx.createPattern(tile, 'repeat');
      this.cursorName = '';
    }

    place(view) {
      const s = this.canvas.style;
      s.left = view.x + 'px';
      s.top = view.y + 'px';
      s.width = view.width + 'px';
      s.height = view.height + 'px';
      this.canvas.classList.toggle('he-sharp', view.scale >= 1);
    }

    cursor(name, angle, digit) {
      const key = name + ':' + (angle || 0) + ':' + (digit || '');
      if (key === this.cursorName) return;
      this.cursorName = key;
      this.canvas.style.cursor = name === 'arrow' || !name ? H.cursorCss('arrow') : H.cursorCss(name, angle, digit);
    }

    bevel(x, y, w, h, down) {
      const c = this.ctx, hi = down ? METAL.lo : METAL.hi, lo = down ? METAL.hi : METAL.lo;
      c.fillStyle = METAL.line;
      c.fillRect(x, y, w, h);
      for (let i = 0; i < 3; i++) {
        c.fillStyle = hi[i];
        c.fillRect(x + 1 + i, y + 1 + i, w - 2 - i * 2, 1);
        c.fillRect(x + 1 + i, y + 1 + i, 1, h - 2 - i * 2);
        c.fillStyle = lo[i];
        c.fillRect(x + 1 + i, y + h - 2 - i, w - 2 - i * 2, 1);
        c.fillRect(x + w - 2 - i, y + 1 + i, 1, h - 2 - i * 2);
      }
      c.fillStyle = METAL.line;
      c.fillRect(x + 4, y + 4, w - 8, h - 8);
    }

    moon(x, y, flip) {
      const c = this.ctx, rows = ['.kkk.', 'kyyk.', 'kyk..', 'kyyk.', '.kkk.'];
      rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
        if (ch === '.') return;
        c.fillStyle = ch === 'k' ? METAL.line : METAL.moon;
        c.fillRect(x + (flip ? 4 - rx : rx), y + ry, 1, 1);
      }));
    }

    panel(x, y, w, h, kind) {
      const c = this.ctx;
      if (kind === 'tip') {
        c.fillStyle = METAL.line;
        c.fillRect(x, y, w, h);
        c.fillStyle = METAL.hi[1];
        c.fillRect(x + 1, y + 1, w - 2, h - 2);
        c.fillStyle = METAL.tip;
        c.fillRect(x + 2, y + 2, w - 4, h - 4);
        return;
      }
      if (kind === 'plate') {
        this.bevel(x, y, w, h);
        const g = c.createLinearGradient(0, y + 5, 0, y + h - 5);
        g.addColorStop(0, METAL.plate[0]);
        g.addColorStop(1, METAL.plate[1]);
        c.fillStyle = g;
        c.fillRect(x + 5, y + 5, w - 10, h - 10);
        return;
      }
      this.bevel(x, y, w, h);
      c.fillStyle = this.velvet;
      c.fillRect(x + 5, y + 5, w - 10, h - 10);
      if (w >= 40 && h >= 40) {
        this.moon(x + 6, y + 6, false);
        this.moon(x + w - 11, y + 6, true);
        this.moon(x + 6, y + h - 11, false);
        this.moon(x + w - 11, y + h - 11, true);
      }
    }

    measure(s, o) {
      return H.Font.measure(fontFor(o || {}), s);
    }

    text(s, x, y, o) {
      const opt = o || {}, font = fontFor(opt), f = H.Font.DATA[font], str = String(s);
      const w = H.Font.measure(font, str);
      let tx = x;
      if (opt.align === 'center') tx = x - w / 2;
      else if (opt.align === 'right') tx = x - w;
      let ty = y;
      if (!opt.base || opt.base === 'middle') ty = y - f.h / 2;
      else if (opt.base === 'bottom') ty = y - f.h;
      if (opt.shadow !== false) H.Font.draw(this.ctx, font, str, tx + 1, ty + 1, '#000000');
      H.Font.draw(this.ctx, font, str, tx, ty, opt.color || '#f0e2b8');
      return w;
    }

    button(b) {
      const c = this.ctx, down = !!b.down && !b.off;
      c.fillStyle = METAL.line;
      c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = down ? METAL.lo[0] : METAL.hi[1];
      c.fillRect(b.x + 1, b.y + 1, b.w - 2, 1);
      c.fillRect(b.x + 1, b.y + 1, 1, b.h - 2);
      c.fillStyle = down ? METAL.hi[1] : METAL.lo[0];
      c.fillRect(b.x + 1, b.y + b.h - 2, b.w - 2, 1);
      c.fillRect(b.x + b.w - 2, b.y + 1, 1, b.h - 2);
      c.fillStyle = b.off ? '#2a2c34' : b.hot ? '#22336e' : '#142048';
      c.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      this.text(b.label, b.x + b.w / 2 + (down ? 1 : 0), b.y + b.h / 2 + (down ? 1 : 0), { align: 'center', color: b.off ? '#80786a' : b.hot ? '#fff6d0' : '#f0e2b8' });
    }

    destroy() {
      this.canvas.remove();
      this.canvas.width = 0;
      this.canvas.height = 0;
    }
  }

  H.Gfx = Gfx;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
