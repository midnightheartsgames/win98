import { Rng } from '../core/rng.ts';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number;
  life: number;
  max: number;
  size: number;
  color: string;
  color2?: string;
  shape: 'sq' | 'ring' | 'line' | 'star' | 'glow';
  drag: number;
  grow: number;
  len?: number;
}

const rng = new Rng(4242);

export class Particles {
  list: Particle[] = [];

  add(p: Partial<Particle> & { x: number; y: number }): void {
    this.list.push({ vx: 0, vy: 0, ay: 0, life: 30, size: 2, color: '#ffffff', shape: 'sq', drag: 1, grow: 0, ...p, max: p.life ?? 30 });
  }

  burst(kind: string, x: number, y: number, scale = 1): void {
    const r = rng;
    const n = (k: number) => Math.round(k * scale);
    switch (kind) {
      case 'fire':
      case 'fire_fist':
        for (let i = 0; i < n(26); i++) this.add({ x: x + r.range(-4, 4), y: y + r.range(-4, 4), vx: r.range(-1.6, 1.6), vy: r.range(-2.4, -0.4), ay: -0.02, life: r.int(16, 32), size: r.int(2, 4), color: r.pick(['#ffd040', '#ff8020', '#ff4010', '#fff0a0']), color2: '#402010', drag: 0.94, grow: -0.08 });
        break;
      case 'embers':
        for (let i = 0; i < n(20); i++) this.add({ x: x + r.range(-10, 10), y: y + r.range(-8, 8), vx: r.range(-0.4, 0.4), vy: r.range(-1, -0.2), life: r.int(30, 60), size: r.int(1, 2), color: r.pick(['#ff6020', '#ffa030', '#c02010']), drag: 0.98 });
        break;
      case 'earth':
      case 'rock':
      case 'stone_step':
      case 'quake':
        for (let i = 0; i < n(18); i++) this.add({ x: x + r.range(-6, 6), y: y + r.range(-2, 4), vx: r.range(-2, 2), vy: r.range(-3.5, -1), ay: 0.22, life: r.int(20, 36), size: r.int(2, 4), color: r.pick(['#8a6a48', '#6a5038', '#a08060', '#504030']), drag: 0.98 });
        for (let i = 0; i < n(8); i++) this.add({ x: x + r.range(-8, 8), y: y + 4, vx: r.range(-0.6, 0.6), vy: r.range(-0.4, -0.1), life: r.int(24, 40), size: 3, color: '#c0b0a0', shape: 'glow', grow: 0.15, drag: 0.96 });
        break;
      case 'metal':
      case 'cable':
      case 'metal_storm':
        for (let i = 0; i < n(20); i++) this.add({ x: x + r.range(-6, 6), y: y + r.range(-6, 6), vx: r.range(-3, 3), vy: r.range(-3, 3), life: r.int(12, 24), size: 1, color: r.pick(['#e0e8f0', '#a0a8b8', '#ffffff']), shape: 'line', len: 4, drag: 0.9 });
        break;
      case 'chi':
      case 'chi_big':
      case 'jab':
        for (let i = 0; i < n(14); i++) {
          const a = (i / 14) * Math.PI * 2;
          this.add({ x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 18, size: 2, color: r.pick(['#f0f0ff', '#80c0ff', '#c0a0ff']), shape: 'star', drag: 0.9 });
        }
        break;
      case 'spirit':
      case 'spirit_wave':
        for (let i = 0; i < n(18); i++) this.add({ x: x + r.range(-8, 8), y: y + r.range(-8, 8), vx: r.range(-0.8, 0.8), vy: r.range(-1.2, -0.2), life: r.int(24, 44), size: r.int(2, 3), color: r.pick(['#a0e8ff', '#e0f8ff', '#80a0ff']), shape: 'glow', drag: 0.97, grow: 0.05 });
        break;
      case 'heal':
      case 'heal_fire':
      case 'regen':
        for (let i = 0; i < n(16); i++) this.add({ x: x + r.range(-8, 8), y: y + r.range(0, 10), vx: 0, vy: r.range(-1.2, -0.5), life: r.int(24, 40), size: 2, color: kind === 'heal_fire' ? r.pick(['#ffd080', '#ffa060', '#ffffff']) : r.pick(['#80ffb0', '#c0ffd0', '#ffffff']), shape: 'star', drag: 0.99 });
        break;
      case 'buff':
      case 'buff_fire':
        for (let i = 0; i < n(10); i++) this.add({ x: x + r.range(-8, 8), y: y + 8, vx: 0, vy: -1.4, life: 26, size: 2, color: kind === 'buff_fire' ? '#ff9040' : '#ffe060', shape: 'line', len: 5, drag: 0.98 });
        break;
      case 'debuff':
      case 'heatwave':
        for (let i = 0; i < n(12); i++) this.add({ x: x + r.range(-8, 8), y: y - 8, vx: 0, vy: 1.2, life: 26, size: 2, color: kind === 'heatwave' ? '#ff6040' : '#a060c0', shape: 'line', len: 5, drag: 0.98 });
        break;
      case 'smoke':
        for (let i = 0; i < n(16); i++) this.add({ x: x + r.range(-10, 10), y: y + r.range(-6, 6), vx: r.range(-0.6, 0.6), vy: r.range(-0.6, -0.1), life: r.int(30, 50), size: r.int(4, 7), color: r.pick(['#707078', '#909098', '#58585f']), shape: 'glow', drag: 0.97, grow: 0.12 });
        break;
      case 'explosion':
      case 'boom':
        for (let i = 0; i < n(30); i++) this.add({ x, y, vx: r.range(-3, 3), vy: r.range(-3, 2), life: r.int(14, 28), size: r.int(2, 5), color: r.pick(['#fff0a0', '#ffb040', '#ff5020', '#606060']), drag: 0.9, grow: -0.05 });
        this.add({ x, y, life: 16, size: 4, color: '#ffffff', shape: 'ring', grow: 1.6 });
        break;
      case 'beam':
      case 'barrage':
      case 'static':
        for (let i = 0; i < n(14); i++) this.add({ x: x + r.range(-6, 6), y: y + r.range(-6, 6), vx: r.range(-2, 2), vy: r.range(-2, 2), life: r.int(10, 20), size: 2, color: r.pick(['#80fff0', '#ffffff', '#40c0ff']), shape: 'star', drag: 0.88 });
        break;
      case 'drain':
        for (let i = 0; i < n(16); i++) {
          const a = r.range(0, Math.PI * 2);
          this.add({ x: x + Math.cos(a) * 16, y: y + Math.sin(a) * 16, vx: -Math.cos(a) * 1, vy: -Math.sin(a) * 1, life: 16, size: 2, color: '#c060f0', shape: 'glow', drag: 1 });
        }
        break;
      case 'vine':
      case 'spores':
        for (let i = 0; i < n(16); i++) this.add({ x: x + r.range(-10, 10), y: y + r.range(-10, 6), vx: r.range(-0.8, 0.8), vy: r.range(-0.8, 0.2), life: r.int(20, 40), size: 2, color: r.pick(['#60e0a0', '#a0ffd0', '#2a8a68']), shape: 'glow', drag: 0.96 });
        break;
      case 'glow':
      case 'sparkle':
      case 'scan':
        for (let i = 0; i < n(12); i++) this.add({ x: x + r.range(-10, 10), y: y + r.range(-10, 10), life: r.int(16, 30), size: 2, color: r.pick(['#ffffff', '#fff0a0', '#a0e0ff']), shape: 'star' });
        this.add({ x, y, life: 20, size: 3, color: '#ffffff', shape: 'ring', grow: 1.2 });
        break;
      case 'avatar':
      case 'avatar_flash':
        for (let i = 0; i < n(40); i++) {
          const a = (i / 40) * Math.PI * 2;
          this.add({ x, y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, life: 34, size: 2, color: r.pick(['#ffffff', '#a0f0ff', '#ffe0a0']), shape: 'line', len: 6, drag: 0.95 });
        }
        this.add({ x, y, life: 30, size: 6, color: '#e0ffff', shape: 'ring', grow: 2.4 });
        break;
      case 'shield':
      case 'guard':
      case 'earth_wall':
        this.add({ x, y, life: 24, size: 10, color: kind === 'earth_wall' ? '#c0a070' : '#d0e0f0', shape: 'ring', grow: 0.3 });
        break;
      case 'slash':
      case 'claw':
      case 'hit':
        for (let i = 0; i < n(8); i++) this.add({ x: x + r.range(-4, 4), y: y + r.range(-4, 4), vx: r.range(-2, 2), vy: r.range(-2, 2), life: 10, size: 1, color: '#ffffff', shape: 'line', len: 5, drag: 0.85 });
        break;
      case 'seal':
        this.add({ x, y, life: 30, size: 14, color: '#b080ff', shape: 'ring', grow: -0.3 });
        break;
      case 'charge':
        for (let i = 0; i < n(14); i++) {
          const a = r.range(0, Math.PI * 2);
          this.add({ x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 20, vx: -Math.cos(a) * 1.2, vy: -Math.sin(a) * 1.2, life: 16, size: 2, color: '#80fff0', shape: 'star' });
        }
        break;
      case 'splash':
        for (let i = 0; i < n(14); i++) this.add({ x: x + r.range(-4, 4), y, vx: r.range(-1.5, 1.5), vy: r.range(-2.5, -1), ay: 0.18, life: 24, size: 2, color: r.pick(['#a0d0ff', '#ffffff']), drag: 0.99 });
        break;
      default:
        for (let i = 0; i < n(10); i++) this.add({ x, y, vx: r.range(-1.5, 1.5), vy: r.range(-1.5, 1.5), life: 16, size: 2, color: '#ffffff', shape: 'star', drag: 0.92 });
    }
  }

  update(): void {
    for (const p of this.list) {
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.ay;
      p.x += p.vx;
      p.y += p.vy;
      p.size = Math.max(0, p.size + p.grow);
      p.life--;
    }
    this.list = this.list.filter((p) => p.life > 0 && p.size > 0);
  }

  render(ctx: CanvasRenderingContext2D, ox = 0, oy = 0): void {
    for (const p of this.list) {
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.globalAlpha = a;
      const x = Math.round(p.x - ox);
      const y = Math.round(p.y - oy);
      const s = Math.max(1, Math.round(p.size));
      ctx.fillStyle = p.color2 && p.life < p.max * 0.35 ? p.color2 : p.color;
      switch (p.shape) {
        case 'sq':
          ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
          break;
        case 'glow':
          ctx.globalAlpha = a * 0.6;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
          ctx.fillRect(x, y - 1, 1, 3);
          ctx.fillRect(x - 1, y, 3, 1);
          break;
        case 'line': {
          const len = p.len ?? 4;
          const m = Math.hypot(p.vx, p.vy) || 1;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 0.5, y + 0.5);
          ctx.lineTo(x + 0.5 - (p.vx / m) * len, y + 0.5 - (p.vy / m) * len);
          ctx.stroke();
          break;
        }
        case 'ring':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
