(function (FO) {
  'use strict';

  const MAX_LEVEL = 9;
  const LEVELS = Uint8Array.from({ length: MAX_LEVEL + 1 }, (_, i) => i);

  FO.FONT_LEVELS = MAX_LEVEL;

  const CP1251 = new Map([[0x401, 0xA8], [0x451, 0xB8], [0x2013, 0x96], [0x2014, 0x97], [0x2026, 0x85], [0x2018, 0x91], [0x2019, 0x92], [0x201C, 0x93], [0x201D, 0x94], [0x201E, 0x84], [0x2116, 0xB9]]);
  for (let c = 0x410; c <= 0x44F; c++) CP1251.set(c, c - 0x410 + 0xC0);
  const UNKNOWN = 0x3F;
  const GENDER_FORM = /~([^~|]*)\|([^~]*)~/g;
  const SPEAKER_FORM = /`([^`|]*)\|([^`]*)`/g;

  FO.glyphCode = c => c < 256 ? c : (CP1251.get(c) || UNKNOWN);
  FO.textGender = 0;
  FO.speakerText = function (text, female) {
    const s = String(text);
    return s.indexOf('`') < 0 ? s : s.replace(SPEAKER_FORM, (_, male, fem) => female ? fem : male);
  };

  FO.genderText = function (text) {
    const s = FO.speakerText(text, false);
    return s.indexOf('~') < 0 ? s : s.replace(GENDER_FORM, (_, male, female) => FO.textGender ? female : male);
  };

  class Font {
    constructor(src) {
      this.src = src;
      this.aaf = src.kind === 'aaf';
      this.height = src.height;
      this.gap = this.aaf ? src.gapH : src.spacing;
      this.lineGap = this.aaf ? src.gapV : 0;
      this.shadeCache = new Map();
    }

    glyphWidth(code) {
      const g = this.src.glyphs[code];
      if (!g) return 0;
      if (this.aaf && code === 32) return this.src.space;
      return g.w;
    }

    width(raw) {
      const text = FO.genderText(raw);
      let w = 0;
      for (let i = 0; i < text.length; i++) {
        const gw = this.glyphWidth(FO.glyphCode(text.charCodeAt(i)));
        if (gw || text.charCodeAt(i) === 32) w += gw + this.gap;
      }
      return w ? w - this.gap : 0;
    }

    ramp(colors, color) {
      let r = this.shadeCache.get(color);
      if (r) return r;
      r = new Uint8Array(10);
      const R = colors.base[color * 3];
      const G = colors.base[color * 3 + 1];
      const B = colors.base[color * 3 + 2];
      for (let i = 1; i < 10; i++) r[i] = colors.nearest(R * i / 9, G * i / 9, B * i / 9) || color;
      r[9] = color;
      this.shadeCache.set(color, r);
      return r;
    }

    draw(scr, text, x, y, color, colors) {
      return this.render(scr, text, x, y, this.aaf ? this.ramp(colors, color) : null, color);
    }

    levels(scr, text, x, y) {
      return this.render(scr, text, x, y, LEVELS, MAX_LEVEL);
    }

    render(scr, raw, x, y, ramp, color) {
      const text = FO.genderText(raw);
      const src = this.src;
      const data = src.data;
      const W = scr.w;
      const H = scr.h;
      let cx = x | 0;
      const top = y | 0;
      for (let i = 0; i < text.length; i++) {
        const code = FO.glyphCode(text.charCodeAt(i));
        const g = src.glyphs[code];
        if (!g) continue;
        const gw = this.glyphWidth(code);
        if (this.aaf) {
          const gy = top + this.height - g.h;
          for (let j = 0; j < g.h; j++) {
            const py = gy + j;
            if (py < 0 || py >= H) continue;
            for (let k = 0; k < g.w; k++) {
              const v = data[g.off + j * g.w + k];
              const px = cx + k;
              if (v && px >= 0 && px < W) scr.px[py * W + px] = ramp[v];
            }
          }
        } else {
          const bpr = (g.w + 7) >> 3;
          for (let j = 0; j < this.height; j++) {
            const py = top + j;
            if (py < 0 || py >= H) continue;
            for (let k = 0; k < g.w; k++) {
              const bit = data[g.off + j * bpr + (k >> 3)] & (0x80 >> (k & 7));
              const px = cx + k;
              if (bit && px >= 0 && px < W) scr.px[py * W + px] = color;
            }
          }
        }
        cx += gw + this.gap;
      }
      return cx;
    }

    advance(text) {
      return text ? this.width(text) + this.gap : 0;
    }

    breakLines(text, maxW) {
      const s = FO.genderText(text);
      if (this.advance(s) < maxW) return [s];
      const lines = [];
      let start = 0;
      let w = 0;
      let brk = -1;
      for (let i = 0; i < s.length; i++) {
        w += this.glyphWidth(FO.glyphCode(s.charCodeAt(i))) + this.gap;
        if (w > maxW) {
          if (brk >= 0) {
            lines.push(s.slice(start, brk + 1));
            start = brk + 1;
            i = brk;
          } else {
            lines.push(s.slice(start, i));
            start = i;
            i--;
          }
          w = 0;
          brk = -1;
          continue;
        }
        if (s[i] === ' ' || s[i] === '-') brk = i;
      }
      lines.push(s.slice(start));
      return lines;
    }

    wrap(text, maxW) {
      const lines = [];
      for (const para of FO.genderText(text).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const next = line ? line + ' ' + word : word;
          if (line && this.width(next) > maxW) {
            lines.push(line);
            line = word;
          } else {
            line = next;
          }
        }
        lines.push(line);
      }
      return lines;
    }
  }

  FO.Font = Font;

  FO.loadFonts = async function (data) {
    const fonts = {};
    for (const n of [0, 1, 2, 3, 4, 5]) {
      if (data.has('FONT' + n + '.FON')) fonts[n] = new Font(FO.readFon(await data.get('FONT' + n + '.FON')));
      if (data.has('FONT' + n + '.AAF')) fonts[100 + n] = new Font(FO.readAaf(await data.get('FONT' + n + '.AAF')));
    }
    return fonts;
  };
})(globalThis.FO = globalThis.FO || {});
