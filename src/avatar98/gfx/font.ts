import type { FontData } from '../data/types.ts';
import { makeCanvas } from './pixel.ts';

interface Glyph {
  w: number;
  x: number;
  rows: string[];
}

export class Font {
  private glyphs = new Map<string, Glyph>();
  private atlases = new Map<string, HTMLCanvasElement>();
  private atlasW = 0;
  readonly height: number;
  readonly lineH = 10;
  spacing = 1;

  constructor(data: FontData) {
    this.height = data.height;
    let x = 0;
    for (const ch of Object.keys(data.glyphs)) {
      const rows = data.glyphs[ch];
      const w = rows[0].length;
      this.glyphs.set(ch, { w, x, rows });
      x += w + 1;
    }
    this.atlasW = x;
  }

  private glyph(ch: string): Glyph {
    return this.glyphs.get(ch) ?? this.glyphs.get(ch.toUpperCase()) ?? (this.glyphs.get('?') as Glyph);
  }

  private atlas(color: string): HTMLCanvasElement {
    let a = this.atlases.get(color);
    if (a) return a;
    const [c, ctx] = makeCanvas(this.atlasW, this.height);
    ctx.fillStyle = color;
    for (const g of this.glyphs.values()) {
      g.rows.forEach((row, y) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect(g.x + i, y, 1, 1);
      });
    }
    this.atlases.set(color, c);
    a = c;
    return a;
  }

  charWidth(ch: string): number {
    return this.glyph(ch).w;
  }

  measure(text: string): number {
    let w = 0;
    for (const ch of text) w += this.glyph(ch).w + this.spacing;
    return Math.max(0, w - this.spacing);
  }

  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#ffffff', shadow: string | null = '#101030', maxChars = Infinity): number {
    x = Math.round(x);
    y = Math.round(y);
    if (shadow) this.drawRaw(ctx, text, x + 1, y + 1, shadow, maxChars);
    return this.drawRaw(ctx, text, x, y, color, maxChars);
  }

  private drawRaw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, maxChars: number): number {
    const atlas = this.atlas(color);
    let cx = x;
    let n = 0;
    for (const ch of text) {
      if (n++ >= maxChars) break;
      const g = this.glyph(ch);
      if (ch !== ' ') ctx.drawImage(atlas, g.x, 0, g.w, this.height, cx, y, g.w, this.height);
      cx += g.w + this.spacing;
    }
    return cx - x;
  }

  drawCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color = '#ffffff', shadow: string | null = '#101030'): void {
    this.draw(ctx, text, cx - this.measure(text) / 2, y, color, shadow);
  }

  drawRight(ctx: CanvasRenderingContext2D, text: string, rx: number, y: number, color = '#ffffff', shadow: string | null = '#101030'): void {
    this.draw(ctx, text, rx - this.measure(text), y, color, shadow);
  }

  wrap(text: string, maxW: number): string[] {
    const out: string[] = [];
    for (const para of text.split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const trial = line ? `${line} ${w}` : w;
        if (this.measure(trial) <= maxW || !line) line = trial;
        else {
          out.push(line);
          line = w;
        }
      }
      out.push(line);
    }
    return out;
  }
}
