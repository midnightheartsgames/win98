const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools', 'sims98-font.txt');
const OUT = path.join(ROOT, 'js', 'apps', 'sims98', 'ts-font.js');

const RUNTIME = `
  const atlases = new Map();

  const glyphOf = (font, ch) => DATA[font].glyphs[ch] || DATA[font].glyphs['?'];

  const atlasOf = (font, color) => {
    const key = font + color;
    if (atlases.has(key)) return atlases.get(key);
    const f = DATA[font], chars = Object.keys(f.glyphs), cell = f.wide + 1, cols = 32, canvas = document.createElement('canvas');
    canvas.width = cols * cell;
    canvas.height = Math.ceil(chars.length / cols) * f.h;
    const g = canvas.getContext('2d'), at = {};
    g.fillStyle = color;
    chars.forEach((ch, i) => {
      const glyph = f.glyphs[ch], ox = (i % cols) * cell, oy = Math.floor(i / cols) * f.h, w = glyph[2];
      at[ch] = [ox, oy];
      for (let y = 0; y < f.h; y++) {
        const mask = glyph[3 + y] || 0;
        for (let x = 0; x < w; x++) {
          if (mask & (2 ** (w - 1 - x))) g.fillRect(ox + x, oy + y, 1, 1);
        }
      }
    });
    const made = { canvas, at };
    atlases.set(key, made);
    return made;
  };

  S.Font = {
    DATA,

    height: font => DATA[font].h,

    has: (font, ch) => !!DATA[font].glyphs[ch],

    measure(font, text) {
      let w = 0;
      for (const ch of String(text)) w += glyphOf(font, ch)[0];
      return w;
    },

    wrap(font, text, width) {
      const out = [];
      for (const para of String(text).split('\\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const next = line ? line + ' ' + word : word;
          if (line && S.Font.measure(font, next) > width) {
            out.push(line);
            line = word;
          } else {
            line = next;
          }
        }
        out.push(line);
      }
      return out;
    },

    draw(g, font, text, x, y, color) {
      const f = DATA[font], atlas = atlasOf(font, color), left = Math.round(x), top = Math.round(y);
      let cx = left;
      for (const ch of String(text)) {
        const glyph = glyphOf(font, ch), at = atlas.at[ch] || atlas.at['?'];
        if (glyph[2]) g.drawImage(atlas.canvas, at[0], at[1], glyph[2], f.h, cx + glyph[1], top, glyph[2], f.h);
        cx += glyph[0];
      }
      return cx - left;
    },

    shadowed(g, font, text, x, y, color, shade) {
      S.Font.draw(g, font, text, x + 1, y + 1, shade || '#000');
      return S.Font.draw(g, font, text, x, y, color);
    }
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
fs.writeFileSync(OUT, `(function (S) {\n  'use strict';\n  const DATA = ${JSON.stringify(data)};\n${RUNTIME}})(globalThis.Sims98 = globalThis.Sims98 || {});\n`);
console.log(OUT, Object.keys(data).map(k => k + ':' + Object.keys(data[k].glyphs).length).join(' '));
