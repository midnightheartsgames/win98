import type { App, Scene } from '../app.ts';
import type { Game } from './state.ts';
import type { WorldNode } from '../data/types.ts';
import { COLORS } from './ui.ts';
import { str } from '../core/i18n.ts';
import { makeCanvas } from '../gfx/pixel.ts';
import { Rng } from '../core/rng.ts';

function paintWorld(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(320, 240);
  const g = ctx.createLinearGradient(0, 0, 0, 240);
  g.addColorStop(0, '#16406a');
  g.addColorStop(1, '#0c2848');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 320, 240);
  const r = new Rng(5150);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = r.chance(0.5) ? '#1e5080' : '#0a2440';
    ctx.fillRect(r.int(0, 320), r.int(0, 240), r.int(2, 6), 1);
  }
  const land = (pts: [number, number][], col: string, edge: string) => {
    ctx.fillStyle = edge;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 1, y + 2) : ctx.moveTo(x + 1, y + 2)));
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
  };
  land([[0, 150], [40, 140], [80, 150], [110, 170], [100, 205], [60, 225], [20, 240], [0, 240]], '#8a6a48', '#4a3020');
  land([[118, 200], [140, 192], [160, 204], [150, 222], [124, 220]], '#8a6a48', '#4a3020');
  land([[170, 0], [320, 0], [320, 120], [290, 110], [262, 96], [240, 70], [210, 60], [190, 40], [175, 20]], '#6a8a4a', '#3a5028');
  land([[0, 0], [120, 0], [110, 30], [70, 44], [30, 40], [0, 50]], '#6a8a4a', '#3a5028');
  ctx.fillStyle = '#5a3a28';
  ctx.beginPath();
  ctx.moveTo(40, 190);
  ctx.lineTo(52, 170);
  ctx.lineTo(64, 190);
  ctx.fill();
  ctx.fillStyle = '#e04020';
  ctx.fillRect(50, 170, 4, 2);
  ctx.fillStyle = '#c0c0c8';
  for (let i = 0; i < 6; i++) ctx.fillRect(244 + i * 5, 64 - (i % 3) * 5, 3, 8 + (i % 3) * 5);
  ctx.fillStyle = '#e0e8f0';
  land([[270, 170], [300, 166], [314, 182], [296, 196], [272, 192]], '#b0b8a0', '#606850');
  return c;
}

export class WorldMapScene implements Scene {
  opaque = true;
  countsPlaytime = true;
  private app: App;
  private g: Game;
  private done: (d: { map: string; spawn: string } | null) => void;
  private cur: string;
  private sel: string;
  private bg: HTMLCanvasElement;
  private t = 0;
  private travel: { from: WorldNode; to: WorldNode; t: number } | null = null;

  constructor(app: App, node: string, done: (d: { map: string; spawn: string } | null) => void) {
    this.app = app;
    this.g = app.game as Game;
    this.done = done;
    this.cur = node;
    this.bg = paintWorld();
    const reach = this.reachable();
    this.sel = reach[0]?.id ?? node;
  }

  enter(): void {
    this.app.music('sea');
    this.app.setFade(0);
  }

  private node(id: string): WorldNode {
    return this.g.data.world.nodes.find((n) => n.id === id) as WorldNode;
  }

  private visible(): WorldNode[] {
    return this.g.data.world.nodes;
  }

  private reachable(): WorldNode[] {
    const w = this.g.data.world;
    const out: WorldNode[] = [];
    for (const e of w.edges) {
      if (!this.g.test(e.if)) continue;
      const other = e.a === this.cur ? e.b : e.b === this.cur ? e.a : null;
      if (!other) continue;
      const n = this.node(other);
      if (n && this.g.test(n.if)) out.push(n);
    }
    return out;
  }

  update(): void {
    this.t++;
    const inp = this.app.input;
    if (this.travel) {
      this.travel.t++;
      if (this.travel.t === 90) {
        const to = this.travel.to;
        this.g.s.node = to.id;
        this.app.pop();
        this.done({ map: to.map, spawn: to.spawn });
      }
      return;
    }
    const opts = [this.node(this.cur), ...this.reachable()];
    const idx = opts.findIndex((n) => n.id === this.sel);
    if (inp.repeat('left') || inp.repeat('up')) {
      this.sel = opts[(idx - 1 + opts.length) % opts.length].id;
      this.app.sfx('cursor');
    }
    if (inp.repeat('right') || inp.repeat('down')) {
      this.sel = opts[(idx + 1) % opts.length].id;
      this.app.sfx('cursor');
    }
    if (inp.pressed('confirm')) {
      if (this.sel === this.cur) {
        this.app.sfx('error');
        return;
      }
      this.app.sfx('confirm');
      this.travel = { from: this.node(this.cur), to: this.node(this.sel), t: 0 };
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.drawImage(this.bg, 0, 0);
    for (const e of this.g.data.world.edges) {
      const a = this.node(e.a);
      const b = this.node(e.b);
      const open = this.g.test(e.if) && this.g.test(a.if) && this.g.test(b.if);
      ctx.strokeStyle = open ? 'rgba(255,240,200,0.8)' : 'rgba(120,120,140,0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const n of this.visible()) {
      const known = this.g.test(n.if);
      const isCur = n.id === this.cur;
      ctx.fillStyle = !known ? '#505060' : isCur ? '#ff6040' : '#f8e0a0';
      ctx.beginPath();
      ctx.arc(n.x, n.y, isCur ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#201008';
      ctx.stroke();
      const label = known ? str.t(n.name) : '???';
      ui.textCenter(ctx, label, n.x, n.y + 7, known ? COLORS.text : COLORS.disabled);
      if (n.id === this.sel && !this.travel) ui.cursor(ctx, n.x - 6, n.y - 4);
    }
    if (this.travel) {
      const k = Math.min(1, this.travel.t / 80);
      const x = this.travel.from.x + (this.travel.to.x - this.travel.from.x) * k;
      const y = this.travel.from.y + (this.travel.to.y - this.travel.from.y) * k;
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 4);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 9, 1, 7);
      ctx.fillRect(Math.round(x), Math.round(y) - 8, 4, 4);
    }
    const sel = this.node(this.sel);
    ui.window(ctx, 4, 200, 312, 36);
    ui.text(ctx, str.t(sel.name), 12, 206, COLORS.gold);
    ui.text(ctx, str.t(sel.desc), 12, 218, COLORS.title);
    ui.window(ctx, 4, 4, 140, 18, 'dark', 0.8);
    ui.text(ctx, str.t('world.title'), 10, 9, COLORS.title);
  }
}
