import type { Font } from '../gfx/font.ts';
import type { Sprites } from '../gfx/sprites.ts';
import type { Input } from '../core/input.ts';
import type { Emotion } from '../gfx/portraits.ts';
import { Pix, makeCanvas } from '../gfx/pixel.ts';

export const COLORS = {
  text: '#ffffff',
  dim: '#8890b8',
  disabled: '#6a6a88',
  gold: '#f8d860',
  hp: '#60e070',
  hpLow: '#f0c040',
  hpCrit: '#f05050',
  mp: '#60b0f8',
  atb: '#f0f0f0',
  atbFull: '#f8e040',
  limit: '#f07040',
  title: '#c8e0ff',
  heal: '#70f0a0',
  shadow: '#101030'
};

const HAND = ['.xx.......', 'xwwx......', 'xwwxxxxx..', 'xwwwwwwwx.', 'xwwwwxxxxx', 'xwwwwwwwwx', 'xwwwwxxxx.', '.xxxxx....'];

export type IconName = string;

function iconPix(name: string): Pix {
  const p = new Pix(8, 8);
  const o = '#181828';
  switch (name) {
    case 'potion':
      p.rect(3, 0, 2, 2, '#c0a080');
      p.rect(2, 2, 4, 6, '#60c0f0');
      p.rect(2, 2, 4, 2, '#a0e0ff');
      p.set(3, 4, '#ffffff');
      break;
    case 'elixir':
      p.rect(3, 0, 2, 2, '#e0c060');
      p.ellipse(4, 5, 3, 3, '#f06090');
      p.set(3, 4, '#ffffff');
      break;
    case 'tea':
      p.rect(1, 3, 5, 4, '#f0f0e8');
      p.rect(2, 3, 3, 1, '#70a040');
      p.rect(6, 4, 1, 2, '#f0f0e8');
      p.set(3, 1, '#c0c0c0');
      p.set(4, 0, '#c0c0c0');
      break;
    case 'cure':
      p.rect(3, 1, 2, 6, '#f04040');
      p.rect(1, 3, 6, 2, '#f04040');
      break;
    case 'phoenix':
      p.line(1, 7, 6, 1, '#f0a030');
      p.line(2, 7, 7, 1, '#f06020');
      p.set(6, 0, '#ffe080');
      break;
    case 'bomb':
      p.ellipse(4, 5, 3, 3, '#404048');
      p.set(5, 1, '#f0a030');
      p.set(6, 0, '#ffe060');
      p.set(3, 4, '#8080a0');
      break;
    case 'net':
      for (let i = 0; i < 8; i += 3) {
        p.hline(0, 7, i, '#c0a070');
        p.vline(i, 0, 7, '#c0a070');
      }
      break;
    case 'gloves':
      p.rect(1, 2, 5, 5, '#a04030');
      p.rect(1, 1, 1, 3, '#a04030');
      p.rect(6, 3, 1, 2, '#a04030');
      p.hline(1, 5, 6, '#e0b040');
      break;
    case 'staff':
      p.line(1, 7, 6, 1, '#a07040');
      p.rect(5, 0, 3, 2, '#b0b0c0');
      break;
    case 'knuckles':
      p.rect(1, 3, 6, 3, '#c0a040');
      for (let i = 1; i < 7; i += 2) p.set(i, 2, '#e0c060');
      break;
    case 'armor':
      p.rect(1, 1, 6, 6, '#6080a0');
      p.rect(0, 1, 1, 3, '#6080a0');
      p.rect(7, 1, 1, 3, '#6080a0');
      p.vline(3, 1, 6, '#a0c0e0');
      break;
    case 'charm':
      p.ellipse(4, 4, 3, 3, '#e0b040');
      p.ellipse(4, 4, 1.5, 1.5, '#f06040');
      break;
    case 'gem':
      p.poly([[1, 3], [4, 0], [7, 3], [4, 7]], '#80d0ff');
      p.set(3, 2, '#ffffff');
      break;
    case 'sign':
      p.poly([[4, 0], [7, 2], [7, 5], [4, 7], [1, 5], [1, 2]], '#c08040');
      p.ellipse(4, 4, 1.6, 1.6, '#f0e0a0');
      break;
    case 'radio':
      p.rect(1, 3, 6, 4, '#8a6040');
      p.rect(2, 4, 3, 2, '#e0d0a0');
      p.line(2, 3, 0, 0, '#c0c0c0');
      break;
    case 'book':
      p.rect(1, 1, 6, 6, '#6040a0');
      p.vline(2, 1, 6, '#f0e0c0');
      break;
    default:
      p.poly([[3, 0], [5, 0], [5, 4], [7, 4], [4, 7], [1, 4], [3, 4]], '#e0c040');
      p.rect(3, 1, 2, 2, '#f0e080');
  }
  p.outline(o);
  return p;
}

export interface MenuItem {
  label: string;
  enabled?: boolean;
  right?: string;
  color?: string;
  icon?: string;
  value?: unknown;
  help?: string;
}

export class UI {
  readonly font: Font;
  readonly sprites: Sprites;
  private hand: HTMLCanvasElement;
  private icons = new Map<string, HTMLCanvasElement>();
  private gradient = new Map<string, CanvasGradient>();
  t = 0;

  constructor(font: Font, sprites: Sprites) {
    this.font = font;
    this.sprites = sprites;
    const p = new Pix(10, 8);
    HAND.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'x') p.set(x, y, '#202040');
        if (row[x] === 'w') p.set(x, y, '#ffffff');
      }
    });
    this.hand = p.toCanvas();
  }

  tick(): void {
    this.t++;
  }

  window(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, style: 'blue' | 'dark' | 'red' | 'gold' = 'blue', alpha = 0.92): void {
    x = Math.round(x);
    y = Math.round(y);
    const key = `${style}:${y}:${h}`;
    let g = this.gradient.get(key);
    if (!g) {
      g = ctx.createLinearGradient(0, y, 0, y + h);
      const top = style === 'dark' ? '#202038' : style === 'red' ? '#602028' : style === 'gold' ? '#584018' : '#3048a8';
      const bot = style === 'dark' ? '#08080f' : style === 'red' ? '#200810' : style === 'gold' ? '#201408' : '#0c1450';
      g.addColorStop(0, top);
      g.addColorStop(1, bot);
      this.gradient.set(key, g);
    }
    ctx.save();
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.globalAlpha = base;
    ctx.fillStyle = '#b8c0d8';
    ctx.fillRect(x + 2, y, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
    ctx.fillRect(x, y + 2, 1, h - 4);
    ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + w - 2, y + 1, 1, 1);
    ctx.fillRect(x + 1, y + h - 2, 1, 1);
    ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
    ctx.fillRect(x + 1, y + 2, 1, h - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
    ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
    ctx.restore();
  }

  text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = COLORS.text, maxChars = Infinity): number {
    return this.font.draw(ctx, s, x, y, color, COLORS.shadow, maxChars);
  }

  textRight(ctx: CanvasRenderingContext2D, s: string, rx: number, y: number, color = COLORS.text): void {
    this.font.drawRight(ctx, s, rx, y, color, COLORS.shadow);
  }

  textCenter(ctx: CanvasRenderingContext2D, s: string, cx: number, y: number, color = COLORS.text): void {
    this.font.drawCentered(ctx, s, cx, y, color, COLORS.shadow);
  }

  cursor(ctx: CanvasRenderingContext2D, x: number, y: number, still = false): void {
    const bob = still ? 0 : Math.round(Math.sin(this.t / 6) * 1.5);
    ctx.drawImage(this.hand, Math.round(x - 12 + bob), Math.round(y));
  }

  cursorDown(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const bob = Math.round(Math.sin(this.t / 6) * 1.5);
    ctx.save();
    ctx.translate(Math.round(x + 4), Math.round(y - 12 + bob));
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(this.hand, 0, -4);
    ctx.restore();
  }

  bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string, back = '#101028'): void {
    ctx.fillStyle = back;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), 1);
  }

  icon(ctx: CanvasRenderingContext2D, name: string, x: number, y: number): void {
    let c = this.icons.get(name);
    if (!c) {
      c = iconPix(name).toCanvas();
      this.icons.set(name, c);
    }
    ctx.drawImage(c, Math.round(x), Math.round(y));
  }

  hpColor(frac: number): string {
    return frac < 0.25 ? COLORS.hpCrit : frac < 0.5 ? COLORS.hpLow : COLORS.text;
  }

  portrait(ctx: CanvasRenderingContext2D, look: string, emo: Emotion, x: number, y: number, frame = true): boolean {
    const p = this.sprites.portrait(look, emo);
    if (!p) return false;
    if (frame) {
      ctx.fillStyle = '#0a1040';
      ctx.fillRect(x, y, 48, 48);
      ctx.strokeStyle = '#8890c0';
      ctx.strokeRect(x - 0.5, y - 0.5, 49, 49);
    }
    ctx.drawImage(p, x, y);
    return true;
  }
}

export class ListMenu {
  items: MenuItem[];
  index = 0;
  top = 0;
  rows: number;
  lineH = 11;
  columns = 1;
  colW = 0;
  wrap = true;
  soundMove: (() => void) | null = null;
  soundBuzz: (() => void) | null = null;

  constructor(items: MenuItem[], rows = 8) {
    this.items = items;
    this.rows = rows;
  }

  get current(): MenuItem | undefined {
    return this.items[this.index];
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
    if (this.index >= items.length) this.index = Math.max(0, items.length - 1);
    this.clampTop();
  }

  private clampTop(): void {
    const perPage = this.rows * this.columns;
    const row = Math.floor(this.index / this.columns);
    if (row < this.top) this.top = row;
    if (row >= this.top + this.rows) this.top = row - this.rows + 1;
    const maxTop = Math.max(0, Math.ceil(this.items.length / this.columns) - this.rows);
    this.top = Math.max(0, Math.min(this.top, maxTop));
    void perPage;
  }

  update(input: Input): 'confirm' | 'cancel' | null {
    const n = this.items.length;
    if (n > 0) {
      let moved = false;
      if (input.repeat('down')) {
        const ni = this.index + this.columns;
        this.index = ni < n ? ni : this.wrap ? this.index % this.columns : this.index;
        moved = true;
      } else if (input.repeat('up')) {
        const ni = this.index - this.columns;
        this.index = ni >= 0 ? ni : this.wrap ? Math.min(n - 1, (Math.ceil(n / this.columns) - 1) * this.columns + (this.index % this.columns)) : this.index;
        moved = true;
      } else if (this.columns > 1 && input.repeat('right')) {
        this.index = Math.min(n - 1, this.index + 1);
        moved = true;
      } else if (this.columns > 1 && input.repeat('left')) {
        this.index = Math.max(0, this.index - 1);
        moved = true;
      }
      if (moved) {
        this.clampTop();
        this.soundMove?.();
      }
    }
    if (input.pressed('confirm')) {
      const it = this.items[this.index];
      if (!it || it.enabled === false) {
        this.soundBuzz?.();
        return null;
      }
      return 'confirm';
    }
    if (input.pressed('cancel')) return 'cancel';
    return null;
  }

  render(ctx: CanvasRenderingContext2D, ui: UI, x: number, y: number, w: number, active = true): void {
    const colW = this.columns > 1 ? this.colW || Math.floor(w / this.columns) : w;
    const start = this.top * this.columns;
    const end = Math.min(this.items.length, start + this.rows * this.columns);
    for (let i = start; i < end; i++) {
      const it = this.items[i];
      const k = i - start;
      const cx = x + (k % this.columns) * colW;
      const cy = y + Math.floor(k / this.columns) * this.lineH;
      const col = it.enabled === false ? COLORS.disabled : it.color ?? COLORS.text;
      let tx = cx;
      if (it.icon) {
        ui.icon(ctx, it.icon, cx, cy);
        tx += 11;
      }
      ui.text(ctx, it.label, tx, cy, col);
      if (it.right !== undefined) ui.textRight(ctx, it.right, cx + colW - 6, cy, col);
      if (i === this.index && active) ui.cursor(ctx, cx - 2, cy, false);
      else if (i === this.index) ui.cursor(ctx, cx - 2, cy, true);
    }
    const totalRows = Math.ceil(this.items.length / this.columns);
    if (this.top > 0) ui.text(ctx, '▲', x + w - 10, y - 9, COLORS.dim);
    if (this.top + this.rows < totalRows) ui.text(ctx, '▼', x + w - 10, y + this.rows * this.lineH - 2, COLORS.dim);
  }
}

export interface Speech {
  speaker: string | null;
  name: string;
  look: string | null;
  emo: Emotion;
  text: string;
}

export function parseLine(line: string, speakers: Record<string, { name: string; look?: string }>, playerName: string): Speech {
  const bar = line.indexOf('|');
  if (bar < 0) return { speaker: null, name: '', look: null, emo: 'normal', text: line };
  const head = line.slice(0, bar).trim();
  const text = line.slice(bar + 1).trim();
  if (!head) return { speaker: null, name: '', look: null, emo: 'normal', text };
  const [sid, emoRaw] = head.split(':');
  const sp = speakers[sid];
  const emo = (['normal', 'happy', 'angry', 'sad', 'surprised'].includes(emoRaw) ? emoRaw : 'normal') as Emotion;
  const name = sid === 'isa' ? playerName : sp ? sp.name : sid;
  return { speaker: sid, name, look: sp?.look ?? null, emo, text };
}

export class DialogueBox {
  private ui: UI;
  queue: Speech[] = [];
  cur: Speech | null = null;
  private wrapped: string[] = [];
  private page = 0;
  private shown = 0;
  private acc = 0;
  speed = 1;
  pos: 'bottom' | 'top' = 'bottom';
  onBlip: (() => void) | null = null;
  onAdvance: (() => void) | null = null;
  private blipT = 0;
  readonly linesPerPage = 3;

  constructor(ui: UI) {
    this.ui = ui;
  }

  get active(): boolean {
    return this.cur !== null;
  }

  push(lines: Speech[]): void {
    this.queue.push(...lines);
    if (!this.cur) this.next();
  }

  clear(): void {
    this.queue = [];
    this.cur = null;
    this.hold = false;
  }

  private textWidth(): number {
    return this.cur && this.cur.look ? 244 : 296;
  }

  private next(): void {
    this.cur = this.queue.shift() ?? null;
    this.page = 0;
    this.shown = 0;
    this.acc = 0;
    if (this.cur) this.wrapped = this.ui.font.wrap(this.cur.text, this.textWidth());
  }

  private pageText(): string[] {
    return this.wrapped.slice(this.page * this.linesPerPage, this.page * this.linesPerPage + this.linesPerPage);
  }

  private pageLen(): number {
    return this.pageText().reduce((s, l) => s + [...l].length, 0);
  }

  hold = false;

  update(input: Input): void {
    if (!this.cur) return;
    const holdChoice = this.hold;
    const len = this.pageLen();
    if (this.shown < len) {
      this.acc += this.speed;
      while (this.acc >= 1 && this.shown < len) {
        this.acc -= 1;
        this.shown++;
      }
      this.blipT++;
      if (this.blipT % 4 === 0) this.onBlip?.();
      if (input.pressed('confirm') || input.pressed('cancel')) {
        this.shown = len;
        input.consume('confirm');
        input.consume('cancel');
      }
      return;
    }
    if (holdChoice && this.queue.length === 0 && (this.page + 1) * this.linesPerPage >= this.wrapped.length) return;
    if (input.pressed('confirm') || input.pressed('cancel')) {
      input.consume('confirm');
      input.consume('cancel');
      this.onAdvance?.();
      if ((this.page + 1) * this.linesPerPage < this.wrapped.length) {
        this.page++;
        this.shown = 0;
      } else this.next();
    }
  }

  get finishedTyping(): boolean {
    return !!this.cur && this.shown >= this.pageLen();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.cur;
    if (!s) return;
    const ui = this.ui;
    const h = 62;
    const y = this.pos === 'bottom' ? 240 - h - 4 : 4;
    const x = 4;
    const w = 312;
    ui.window(ctx, x, y, w, h);
    let tx = x + 8;
    if (s.look) {
      ui.portrait(ctx, s.look, s.emo, x + 7, y + 7, true);
      tx = x + 62;
    }
    let ty = y + 8;
    if (s.name) {
      ui.text(ctx, s.name, tx, ty, COLORS.gold);
      ty += 12;
    }
    let left = this.shown;
    for (const line of this.pageText()) {
      if (left <= 0) break;
      ui.text(ctx, line, tx, ty, COLORS.text, left);
      left -= [...line].length;
      ty += 11;
    }
    if (this.finishedTyping && Math.floor(ui.t / 16) % 2 === 0) ui.text(ctx, '▼', x + w - 12, y + h - 11, COLORS.text);
  }
}

export function formatTime(frames: number): string {
  const sec = Math.floor(frames / 60);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function blank(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  return makeCanvas(w, h);
}
