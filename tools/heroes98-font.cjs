const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools', 'heroes98-font.txt');
const OUT = path.join(ROOT, 'js', 'apps', 'heroes98', 'he-font.js');

const RUNTIME = `
  const F = H.Font = { DATA, cache: new Map() };

  F.glyph = (font, ch) => DATA[font].glyphs[ch] || DATA[font].glyphs['?'];

  F.measure = (font, text) => {
    let w = 0;
    for (const ch of String(text)) w += F.glyph(font, ch)[0];
    return w;
  };

  F.wrap = (font, text, width) => {
    const out = [];
    for (const para of String(text).split('\\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (line && F.measure(font, next) > width) {
          out.push(line);
          line = word;
        } else line = next;
      }
      out.push(line);
    }
    return out;
  };

  F.atlas = (font, color) => {
    const key = font + color;
    if (F.cache.has(key)) return F.cache.get(key);
    const f = DATA[font], chars = Object.keys(f.glyphs), cw = f.wide + 1, cols = 32;
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = Math.ceil(chars.length / cols) * f.h;
    const g = c.getContext('2d');
    g.fillStyle = color;
    const at = {};
    chars.forEach((ch, i) => {
      const gl = f.glyphs[ch], ox = (i % cols) * cw, oy = Math.floor(i / cols) * f.h, w = gl[2];
      at[ch] = [ox, oy];
      for (let y = 0; y < f.h; y++) {
        const m = gl[3 + y] || 0;
        for (let x = 0; x < w; x++) if (m & (2 ** (w - 1 - x))) g.fillRect(ox + x, oy + y, 1, 1);
      }
    });
    const res = { canvas: c, at };
    F.cache.set(key, res);
    return res;
  };

  F.draw = (ctx, font, text, x, y, color) => {
    const f = DATA[font], a = F.atlas(font, color);
    let cx = Math.round(x);
    const cy = Math.round(y);
    for (const ch of String(text)) {
      const gl = F.glyph(font, ch), p = a.at[ch] || a.at['?'];
      if (gl[2]) ctx.drawImage(a.canvas, p[0], p[1], gl[2], f.h, cx + gl[1], cy, gl[2], f.h);
      cx += gl[0];
    }
    return cx - Math.round(x);
  };
`;

const parse = () => {
  const data = {};
  let cur = null, glyph = null;
  for (const line of fs.readFileSync(SRC, 'utf8').split('\n')) {
    const head = /^\[(\w+) asc=(\d+) h=(\d+)\]$/.exec(line);
    if (head) {
      cur = data[head[1]] = { asc: +head[2], h: +head[3], wide: 1, glyphs: {} };
      continue;
    }
    const g = /^@U\+([0-9A-F]{4}) (-?\d+) (-?\d+)$/.exec(line);
    if (g) {
      glyph = { ch: String.fromCharCode(parseInt(g[1], 16)), adv: +g[2], off: +g[3], rows: [] };
      cur.glyphs[glyph.ch] = glyph;
      continue;
    }
    if (glyph && /^[#.]+$/.test(line)) glyph.rows.push(line);
  }
  for (const f of Object.values(data)) {
    for (const [ch, g] of Object.entries(f.glyphs)) {
      const w = g.rows.length ? g.rows[0].length : 0;
      f.wide = Math.max(f.wide, w);
      const masks = g.rows.map(r => [...r].reduce((m, c) => m * 2 + (c === '#' ? 1 : 0), 0));
      f.glyphs[ch] = [ch === ' ' ? Math.max(g.adv, Math.round(f.h / 3)) : g.adv, g.off, w, ...masks];
    }
  }
  return data;
};

const data = parse();
const out = `(function (H) {\n  'use strict';\n  const DATA = ${JSON.stringify(data)};\n${RUNTIME}})(globalThis.Heroes98 = globalThis.Heroes98 || {});\n`;
fs.writeFileSync(OUT, out);
console.log(OUT, Object.keys(data).map(k => k + ':' + Object.keys(data[k].glyphs).length).join(' '));
