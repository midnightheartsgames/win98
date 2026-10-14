import { SCREEN_H, SCREEN_W } from '../config.ts';

export class Screen {
  readonly buffer: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly display: HTMLCanvasElement;
  private dctx: CanvasRenderingContext2D;
  private host: HTMLElement;
  private ro: ResizeObserver | null = null;
  private scanlines: HTMLCanvasElement | null = null;
  private vignette: HTMLCanvasElement | null = null;
  scale = 1;
  crt = false;

  constructor(host: HTMLElement) {
    this.host = host;
    this.buffer = document.createElement('canvas');
    this.buffer.width = SCREEN_W;
    this.buffer.height = SCREEN_H;
    this.ctx = this.buffer.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;
    this.display = document.createElement('canvas');
    this.display.className = 'av98-screen';
    this.display.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated;image-rendering:crisp-edges;';
    this.dctx = this.display.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    host.appendChild(this.display);
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(host);
    }
    this.resize();
  }

  resize(): void {
    const r = this.host.getBoundingClientRect();
    const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
    const pw = Math.max(1, r.width * dpr);
    const ph = Math.max(1, r.height * dpr);
    const s = Math.max(1, Math.floor(Math.min(pw / SCREEN_W, ph / SCREEN_H)));
    if (s === this.scale && this.display.width === SCREEN_W * s) return;
    this.scale = s;
    this.display.width = SCREEN_W * s;
    this.display.height = SCREEN_H * s;
    this.display.style.width = `${(SCREEN_W * s) / dpr}px`;
    this.display.style.height = `${(SCREEN_H * s) / dpr}px`;
    this.dctx.imageSmoothingEnabled = false;
    this.scanlines = null;
    this.vignette = null;
  }

  private buildOverlays(): void {
    const w = this.display.width;
    const h = this.display.height;
    const s = this.scale;
    const sl = document.createElement('canvas');
    sl.width = w;
    sl.height = h;
    const c = sl.getContext('2d') as CanvasRenderingContext2D;
    if (s >= 2) {
      c.fillStyle = 'rgba(0,0,0,0.28)';
      const lh = Math.max(1, Math.floor(s / 2));
      for (let y = s - lh; y < h; y += s) c.fillRect(0, y, w, lh);
    }
    this.scanlines = sl;
    const vg = document.createElement('canvas');
    vg.width = w;
    vg.height = h;
    const v = vg.getContext('2d') as CanvasRenderingContext2D;
    const g = v.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    v.fillStyle = g;
    v.fillRect(0, 0, w, h);
    this.vignette = vg;
  }

  present(): void {
    const d = this.dctx;
    const w = this.display.width;
    const h = this.display.height;
    if (!this.crt) {
      d.drawImage(this.buffer, 0, 0, w, h);
      return;
    }
    if (!this.scanlines) this.buildOverlays();
    d.fillStyle = '#000';
    d.fillRect(0, 0, w, h);
    const k = 0.035;
    const s = this.scale;
    for (let y = 0; y < SCREEN_H; y++) {
      const ny = (y + 0.5) / SCREEN_H * 2 - 1;
      const shrink = k * ny * ny;
      const rw = w * (1 - shrink);
      const dy = h / 2 + (y - SCREEN_H / 2) * s * (1 - k * 0.5 * ny * ny);
      d.drawImage(this.buffer, 0, y, SCREEN_W, 1, (w - rw) / 2, Math.floor(dy), rw, Math.ceil(s * (1 - k * 0.5 * ny * ny)) + 1);
    }
    d.drawImage(this.scanlines as HTMLCanvasElement, 0, 0);
    d.drawImage(this.vignette as HTMLCanvasElement, 0, 0);
  }

  destroy(): void {
    this.ro?.disconnect();
    this.display.remove();
  }
}
