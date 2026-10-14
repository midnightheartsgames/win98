import { makeCanvas, shade } from '../../gfx/pixel.ts';
import { Rng, hashString } from '../../core/rng.ts';

const W = 320;
const H = 168;
const HORIZON = 74;

function sky(ctx: CanvasRenderingContext2D, top: string, bottom: string, to = HORIZON): void {
  const g = ctx.createLinearGradient(0, 0, 0, to);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, to);
}

function ground(ctx: CanvasRenderingContext2D, near: string, far: string, lines: string | null, r: Rng, speck?: string[]): void {
  const g = ctx.createLinearGradient(0, HORIZON, 0, H);
  g.addColorStop(0, far);
  g.addColorStop(1, near);
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  if (lines) {
    ctx.strokeStyle = lines;
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(160 + i * 12, HORIZON);
      ctx.lineTo(160 + i * 60, H);
      ctx.stroke();
    }
    let y = HORIZON + 2;
    let step = 2;
    while (y < H) {
      ctx.fillStyle = lines;
      ctx.fillRect(0, Math.round(y), W, 1);
      y += step;
      step *= 1.35;
    }
  }
  if (speck) for (let i = 0; i < 260; i++) {
    const y = HORIZON + Math.pow(r.next(), 0.7) * (H - HORIZON);
    ctx.fillStyle = r.pick(speck);
    ctx.fillRect(Math.floor(r.next() * W), Math.floor(y), 1 + (y > 130 ? 1 : 0), 1);
  }
}

function roofs(ctx: CanvasRenderingContext2D, r: Rng, base: number, col: string, roofCol: string, count: number, lit?: string): void {
  let x = -10;
  for (let i = 0; i < count && x < W; i++) {
    const w = r.int(34, 60);
    const h = r.int(16, 30);
    const y = base - h;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = roofCol;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 2);
    ctx.quadraticCurveTo(x + w / 2, y - 16, x + w + 6, y + 2);
    ctx.lineTo(x + w + 2, y + 5);
    ctx.lineTo(x - 2, y + 5);
    ctx.fill();
    if (lit) for (let k = 0; k < 3; k++) {
      ctx.fillStyle = lit;
      ctx.fillRect(x + 6 + k * 12, y + 10, 5, 5);
    }
    x += w + r.int(2, 12);
  }
}

function blocks(ctx: CanvasRenderingContext2D, r: Rng, base: number, col: string, win: string | null, count: number, hmin = 30, hmax = 60): void {
  let x = -5;
  for (let i = 0; i < count && x < W; i++) {
    const w = r.int(24, 46);
    const h = r.int(hmin, hmax);
    ctx.fillStyle = col;
    ctx.fillRect(x, base - h, w, h);
    if (win) for (let yy = base - h + 5; yy < base - 6; yy += 8) for (let xx = x + 4; xx < x + w - 4; xx += 7) {
      if (r.chance(0.55)) {
        ctx.fillStyle = win;
        ctx.fillRect(xx, yy, 3, 4);
      }
    }
    x += w + r.int(1, 6);
  }
}

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string, a = 0.5): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  ctx.globalAlpha = 1;
}

function vines(ctx: CanvasRenderingContext2D, r: Rng, color: string, glow: string, n: number, top = 0, bottom = HORIZON + 20): void {
  for (let i = 0; i < n; i++) {
    let x = r.range(0, W);
    ctx.strokeStyle = color;
    ctx.lineWidth = r.int(2, 4);
    ctx.beginPath();
    ctx.moveTo(x, top);
    for (let y = top; y < bottom; y += 8) {
      x += r.range(-5, 5);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    glowDot(ctx, x, bottom - r.int(0, 30), 6, glow, 0.6);
  }
}

export function paintBattleBg(id: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(W, H);
  const r = new Rng(hashString(id) + 99);
  switch (id) {
    case 'market': {
      sky(ctx, '#f09058', '#f8d8a0');
      ctx.fillStyle = '#fff4d0';
      ctx.beginPath();
      ctx.arc(250, 40, 16, 0, Math.PI * 2);
      ctx.fill();
      roofs(ctx, r, HORIZON, '#c8a888', '#8a2a20', 9, '#f8e0a0');
      ground(ctx, '#8a7060', '#b8a088', '#9a8470', r, ['#a89078', '#7a6250']);
      break;
    }
    case 'hill': {
      sky(ctx, '#5890d8', '#c8e0f0');
      ctx.fillStyle = '#80a870';
      ctx.beginPath();
      ctx.moveTo(0, HORIZON);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, HORIZON - 14 - Math.sin(x / 40) * 10);
      ctx.lineTo(W, HORIZON);
      ctx.fill();
      ctx.fillStyle = '#5a8a4a';
      ctx.beginPath();
      ctx.moveTo(0, HORIZON);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, HORIZON - 4 - Math.sin(x / 25 + 2) * 5);
      ctx.lineTo(W, HORIZON);
      ctx.fill();
      ground(ctx, '#4a7a3a', '#7aa058', null, r, ['#5a8a48', '#3a6a30', '#8ab068']);
      ctx.fillStyle = '#a88a60';
      ctx.beginPath();
      ctx.moveTo(140, HORIZON);
      ctx.lineTo(180, HORIZON);
      ctx.lineTo(240, H);
      ctx.lineTo(80, H);
      ctx.fill();
      break;
    }
    case 'mines':
    case 'depot': {
      sky(ctx, '#0c0806', '#2a1c14', HORIZON);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = shade('#3a2c20', r.range(-0.3, 0.2));
        ctx.beginPath();
        ctx.ellipse(r.range(0, W), r.range(10, HORIZON), r.range(20, 50), r.range(10, 25), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const x of [40, 150, 260]) {
        ctx.fillStyle = '#5a3c20';
        ctx.fillRect(x, 10, 8, HORIZON);
        ctx.fillRect(x + 50, 10, 8, HORIZON);
        ctx.fillRect(x - 4, 8, 66, 8);
        glowDot(ctx, x + 29, 30, 30, '#ffa040', 0.45);
        ctx.fillStyle = '#ffd060';
        ctx.fillRect(x + 27, 26, 4, 5);
      }
      ground(ctx, '#2a2018', '#4a3a2c', '#3a2c20', r, ['#5a4838', '#1a120c']);
      if (id === 'depot') {
        ctx.fillStyle = '#8a8a90';
        ctx.fillRect(0, HORIZON + 30, W, 2);
        ctx.fillRect(0, HORIZON + 44, W, 2);
        for (let x = 0; x < W; x += 14) {
          ctx.fillStyle = '#4a3018';
          ctx.fillRect(x, HORIZON + 29, 6, 18);
        }
        ctx.fillStyle = '#6a6a70';
        ctx.fillRect(10, HORIZON + 10, 44, 22);
        ctx.fillStyle = '#3a2a20';
        ctx.fillRect(12, HORIZON + 12, 40, 6);
      }
      break;
    }
    case 'docks': {
      sky(ctx, '#3a70b8', '#a8c8e0');
      ctx.fillStyle = '#2a5a80';
      ctx.fillRect(0, HORIZON - 16, W, 16);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#6a98c0';
        ctx.fillRect(r.int(0, W), r.int(HORIZON - 15, HORIZON - 2), r.int(4, 12), 1);
      }
      blocks(ctx, r, HORIZON - 16, '#4a5a70', '#a0b8d0', 10, 12, 40);
      ctx.strokeStyle = '#2a3040';
      ctx.lineWidth = 2;
      for (const x of [60, 230]) {
        ctx.beginPath();
        ctx.moveTo(x, HORIZON);
        ctx.lineTo(x, 8);
        ctx.lineTo(x + 50, 8);
        ctx.lineTo(x + 50, 20);
        ctx.stroke();
      }
      ground(ctx, '#6a4a2c', '#9a7448', '#5a3c20', r, ['#7a5836', '#4a3018']);
      break;
    }
    case 'vinemarket': {
      sky(ctx, '#2a1848', '#8a4a80');
      blocks(ctx, r, HORIZON, '#2a2038', '#f0c060', 12, 20, 60);
      vines(ctx, r, '#1a6a58', '#80f0d0', 9, 0, HORIZON + 10);
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 52;
        ctx.fillStyle = i % 2 ? '#c03030' : '#2a8a5a';
        ctx.fillRect(x, HORIZON - 24, 36, 8);
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(x + 2, HORIZON - 16, 3, 16);
        ctx.fillRect(x + 31, HORIZON - 16, 3, 16);
      }
      ground(ctx, '#3a3440', '#5a5068', '#4a4458', r, ['#6a6078', '#2a2430']);
      break;
    }
    case 'alley': {
      sky(ctx, '#080810', '#1a1828');
      ctx.fillStyle = '#4a2a28';
      ctx.fillRect(0, 0, 90, HORIZON + 10);
      ctx.fillRect(230, 0, 90, HORIZON + 10);
      for (let y = 4; y < HORIZON + 10; y += 5) {
        ctx.fillStyle = '#3a1e1c';
        ctx.fillRect(0, y, 90, 1);
        ctx.fillRect(230, y, 90, 1);
      }
      for (const [x, y, col] of [[20, 20, '#f060c0'], [250, 30, '#40f0c0'], [60, 50, '#f0e060']] as [number, number, string][]) {
        glowDot(ctx, x + 12, y + 4, 30, col, 0.4);
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 24, 8);
      }
      ctx.fillStyle = '#e03828';
      for (const x of [110, 160, 210]) {
        ctx.beginPath();
        ctx.ellipse(x, 18, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        glowDot(ctx, x, 18, 18, '#ff8040', 0.4);
      }
      ctx.strokeStyle = '#303030';
      ctx.beginPath();
      ctx.moveTo(90, 10);
      ctx.lineTo(230, 12);
      ctx.stroke();
      ground(ctx, '#1e1c24', '#3a3440', '#2a2630', r, ['#4a4450', '#141218']);
      break;
    }
    case 'station':
    case 'tunnel': {
      const tun = id === 'tunnel';
      sky(ctx, tun ? '#06080a' : '#141c28', tun ? '#141c20' : '#2a3448');
      if (!tun) {
        for (let x = 10; x < W; x += 70) {
          ctx.fillStyle = '#4a5468';
          ctx.fillRect(x, 0, 14, HORIZON);
          ctx.fillStyle = '#3070c0';
          ctx.fillRect(x, 30, 14, 3);
          glowDot(ctx, x + 7, 12, 22, '#80e0ff', 0.35);
        }
        ctx.fillStyle = '#5a6070';
        ctx.fillRect(0, HORIZON - 12, W, 6);
        ctx.fillStyle = '#80f0e0';
        ctx.fillRect(0, HORIZON - 9, W, 1);
      } else {
        ctx.fillStyle = '#10161a';
        ctx.beginPath();
        ctx.ellipse(160, HORIZON, 120, 60, 0, Math.PI, 0);
        ctx.fill();
        vines(ctx, r, '#3a2a58', '#e060ff', 6, 0, HORIZON);
        vines(ctx, r, '#1a5a48', '#80f0d0', 5, 0, HORIZON);
      }
      ground(ctx, tun ? '#141a1c' : '#4a4e58', tun ? '#2a3034' : '#6a707c', tun ? '#1e2428' : '#5a606a', r, ['#7a808a', '#3a3e46']);
      if (!tun) {
        ctx.fillStyle = '#e0c030';
        ctx.fillRect(0, HORIZON + 4, W, 2);
      }
      break;
    }
    case 'reactor': {
      sky(ctx, '#040a10', '#10202a');
      glowDot(ctx, 160, 40, 90, '#60f0e0', 0.35);
      ctx.fillStyle = '#2a3440';
      ctx.fillRect(120, 0, 80, HORIZON);
      ctx.fillStyle = '#60f0e0';
      ctx.fillRect(140, 0, 40, HORIZON);
      ctx.fillStyle = '#c0fff8';
      ctx.fillRect(155, 0, 10, HORIZON);
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = '#1a6a58';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(i < 4 ? 0 : W, r.range(0, HORIZON));
        ctx.quadraticCurveTo(i < 4 ? 80 : 240, r.range(0, HORIZON), i < 4 ? 130 : 190, r.range(10, HORIZON));
        ctx.stroke();
      }
      ground(ctx, '#1a2028', '#303a46', '#40505e', r, ['#4a5a68']);
      break;
    }
    case 'secret': {
      sky(ctx, '#0a1830', '#3a5890');
      for (let i = 0; i < 7; i++) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#e0f0ff';
        ctx.beginPath();
        const x = 30 + i * 45;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 18, 0);
        ctx.lineTo(x + 40, H);
        ctx.lineTo(x + 10, H);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      vines(ctx, r, '#2a8a78', '#c0fff0', 10, 0, HORIZON + 30);
      ground(ctx, '#1a3448', '#3a6080', null, r, ['#6090b0', '#a0d0f0', '#2a4a60']);
      break;
    }
    default: {
      sky(ctx, '#202040', '#404080');
      ground(ctx, '#303040', '#505060', '#404050', r);
    }
  }
  return c;
}
