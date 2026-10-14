export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amt < 0) return rgbToHex([r * (1 + amt), g * (1 + amt), b * (1 + amt)]);
  return rgbToHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

const packCache = new Map<string, number>();

export function pack(hex: string, alpha = 255): number {
  const key = hex + alpha;
  let v = packCache.get(key);
  if (v === undefined) {
    const [r, g, b] = hexToRgb(hex);
    v = ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
    packCache.set(key, v);
  }
  return v;
}

export function unpackHex(v: number): string {
  return rgbToHex([v & 255, (v >> 8) & 255, (v >> 16) & 255]);
}

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly data: Uint32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint32Array(w * h);
  }

  set(x: number, y: number, c: string | number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = typeof c === 'number' ? c : pack(c);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x];
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    const p = pack(c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, p);
  }

  hline(x0: number, x1: number, y: number, c: string): void {
    const p = pack(c);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, p);
  }

  vline(x: number, y0: number, y1: number, c: string): void {
    const p = pack(c);
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, p);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const p = pack(c);
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, p);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string): void {
    const p = pack(c);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, p);
      }
    }
  }

  ring(cx: number, cy: number, rx: number, ry: number, c: string): void {
    const p = pack(c);
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d <= 1 && d > 0.62) this.set(x, y, p);
      }
    }
  }

  poly(pts: [number, number][], c: string): void {
    const p = pack(c);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        const yy = y + 0.5;
        if ((y0 <= yy && y1 > yy) || (y1 <= yy && y0 > yy)) xs.push(x0 + ((yy - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, p);
    }
  }

  replace(from: string, to: string): void {
    const a = pack(from);
    const b = pack(to);
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === a) this.data[i] = b;
  }

  outline(c: string, diagonal = false): void {
    const p = pack(c);
    const src = this.data.slice();
    const w = this.w;
    const h = this.h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x]) continue;
        const n = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < w && yy < h && src[yy * w + xx] !== 0;
        if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1) || (diagonal && (n(x - 1, y - 1) || n(x + 1, y - 1) || n(x - 1, y + 1) || n(x + 1, y + 1)))) this.data[y * w + x] = p;
      }
    }
  }

  mirror(): Pix {
    const out = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out.data[y * this.w + x] = this.data[y * this.w + (this.w - 1 - x)];
    return out;
  }

  blit(src: Pix, dx: number, dy: number): void {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const v = src.data[y * src.w + x];
        if (v) this.set(dx + x, dy + y, v);
      }
    }
  }

  shift(dx: number, dy: number): Pix {
    const out = new Pix(this.w, this.h);
    out.blit(this, dx, dy);
    return out;
  }

  rotate90(): Pix {
    const out = new Pix(this.h, this.w);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out.data[x * out.w + (out.w - 1 - y)] = this.data[y * this.w + x];
    return out;
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d') as CanvasRenderingContext2D;
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.data);
    ctx.putImageData(img, 0, 0);
    return c;
  }

  drawTo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.data);
    const tmp = document.createElement('canvas');
    tmp.width = this.w;
    tmp.height = this.h;
    (tmp.getContext('2d') as CanvasRenderingContext2D).putImageData(img, 0, 0);
    ctx.drawImage(tmp, x, y);
  }
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
