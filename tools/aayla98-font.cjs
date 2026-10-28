const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools', 'aayla98-font.txt');
const OUT = path.join(ROOT, 'js', 'apps', 'aayla98', 'ay-font.js');

const RUNTIME = `
  const F = A.Font = { DATA, cache: new Map() };

  F.glyph = (font, ch) => {
    const f = DATA[font];
    return f.glyphs[ch] || f.glyphs['?'];
  };

  F.measure = (font, text) => {
    let w = 0;
    for (const ch of text) w += F.glyph(font, ch)[0];
    return w;
  };

  F.wrap = (font, text, width) => {
    const out = [];
    for (const para of String(text).split('\\n')) {
      const words = para.split(' ');
      let line = '';
      for (const word of words) {
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
    const f = DATA[font], chars = Object.keys(f.glyphs);
    const cols = 32, cw = 20, rows = Math.ceil(chars.length / cols);
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = rows * f.h;
    const g = c.getContext('2d');
    g.fillStyle = color;
    const at = {};
    chars.forEach((ch, i) => {
      const gl = f.glyphs[ch], ox = (i % cols) * cw, oy = Math.floor(i / cols) * f.h, w = gl[2];
      at[ch] = [ox, oy];
      for (let y = 0; y < f.h; y++) {
        const m = gl[3 + y] || 0;
        for (let x = 0; x < w; x++) if (m & (1 << (w - 1 - x))) g.fillRect(ox + x, oy + y, 1, 1);
      }
    });
    const res = { canvas: c, at };
    F.cache.set(key, res);
    return res;
  };

  F.draw = (g, font, text, x, y, color, shadow) => {
    if (shadow) F.draw(g, font, text, x + 1, y + 1, shadow);
    const f = DATA[font], a = F.atlas(font, color);
    let px = Math.round(x);
    for (const ch of text) {
      const gl = F.glyph(font, ch), p = a.at[ch] || a.at['?'];
      if (gl[2]) g.drawImage(a.canvas, p[0], p[1], gl[2], f.h, px + gl[1], Math.round(y), gl[2], f.h);
      px += gl[0];
    }
    return px;
  };
`;

function parse(text) {
  const fonts = {};
  let font = null, glyph = null;
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    const head = /^\[(\w+) asc=(\d+) h=(\d+)\]$/.exec(line);
    if (head) {
      font = fonts[head[1]] = { asc: +head[2], h: +head[3], glyphs: {} };
      glyph = null;
      continue;
    }
    const g = /^@U\+([0-9A-F]{4}) (-?\d+) (-?\d+)$/.exec(line);
    if (g) {
      const ch = String.fromCharCode(parseInt(g[1], 16));
      if (font.glyphs[ch]) throw new Error('duplicate glyph ' + g[1]);
      glyph = font.glyphs[ch] = { adv: +g[2], off: +g[3], rows: [] };
      continue;
    }
    if (!line) continue;
    if (!/^[#.]+$/.test(line) || !glyph) throw new Error('bad line: ' + line);
    glyph.rows.push(line);
  }
  for (const [name, f] of Object.entries(fonts)) {
    for (const [ch, gl] of Object.entries(f.glyphs)) {
      if (gl.rows.length && gl.rows.length !== f.h) throw new Error(`${name} ${ch}: ${gl.rows.length} rows`);
      if (gl.rows.some(r => r.length !== gl.rows[0].length)) throw new Error(`${name} ${ch}: ragged rows`);
    }
  }
  return fonts;
}

function build() {
  const fonts = parse(fs.readFileSync(SRC, 'utf8'));
  const data = {};
  for (const [name, f] of Object.entries(fonts)) {
    const glyphs = {};
    for (const [ch, gl] of Object.entries(f.glyphs)) {
      const w = gl.rows.length ? gl.rows[0].length : 0;
      glyphs[ch] = [gl.adv, gl.off, w, ...gl.rows.map(r => parseInt(r.replace(/#/g, '1').replace(/\./g, '0'), 2))];
    }
    data[name] = { asc: f.asc, h: f.h, glyphs };
  }
  return `(function (A) {\n  'use strict';\n  const DATA = ${JSON.stringify(data)};\n${RUNTIME}})(globalThis.Aayla98 = globalThis.Aayla98 || {});\n`;
}

module.exports = { build, parse, SRC, OUT };

if (require.main === module) {
  fs.writeFileSync(OUT, build());
  console.log(OUT);
}
