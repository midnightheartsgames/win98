import { Pix, shade } from './pixel.ts';
import { outlineAuto } from './humanoid.ts';
import type { Facing } from './humanoid.ts';

export interface CreatureLook {
  kind: string;
  c1?: string;
  c2?: string;
  c3?: string;
  eye?: string;
  glow?: string;
  size?: number;
}

type Painter = (l: CreatureLook, dir: Facing, frame: number) => Pix;

function fox(l: CreatureLook, dir: Facing, frame: number): Pix {
  const p = new Pix(16, 32);
  const body = l.c1 ?? '#f4ead8';
  const bodyS = shade(body, -0.18);
  const ear = l.c2 ?? '#e87a40';
  const glow = l.glow ?? '#7af0e0';
  const eye = l.eye ?? '#203040';
  const bob = frame === 1 ? -1 : 0;
  const by = 24 + bob;
  if (dir === 'left' || dir === 'right') {
    const f = dir === 'left' ? -1 : 1;
    const cx = 8;
    p.ellipse(cx, by + 1, 4.5, 2.6, body);
    p.hline(cx - 3, cx + 3, by + 3, bodyS);
    p.ellipse(cx + f * 4, by - 2, 3, 2.8, body);
    p.set(cx + f * 7, by - 1, bodyS);
    p.set(cx + f * 3, by - 5, ear);
    p.set(cx + f * 3, by - 4, ear);
    p.set(cx + f * 5, by - 5, ear);
    p.set(cx + f * 5, by - 4, body);
    p.set(cx + f * 5, by - 2, eye);
    const tx = cx - f * 5;
    p.ellipse(tx, by - 1 + (frame ? 1 : 0), 2.4, 2, body);
    p.set(tx - f, by - 3 + (frame ? 1 : 0), glow);
    p.set(tx - f * 2, by - 2 + (frame ? 1 : 0), glow);
    const lg = frame === 1 ? 1 : 0;
    p.vline(cx - 2 + lg, by + 3, by + 5, bodyS);
    p.vline(cx + 2 - lg, by + 3, by + 5, bodyS);
  } else {
    const cx = 8;
    p.ellipse(cx, by + 1, 3.6, 3, body);
    const tailY = dir === 'up' ? by - 2 : by + 3;
    if (dir === 'up') {
      p.ellipse(cx, tailY, 2.4, 3, body);
      p.set(cx, tailY - 3, glow);
      p.set(cx - 1, tailY - 2, glow);
    }
    p.ellipse(cx, by - 3, 3.6, 3.2, body);
    p.set(cx - 3, by - 7, ear);
    p.set(cx - 3, by - 6, ear);
    p.set(cx - 2, by - 6, ear);
    p.set(cx + 3, by - 7, ear);
    p.set(cx + 3, by - 6, ear);
    p.set(cx + 2, by - 6, ear);
    if (dir === 'down') {
      p.set(cx - 2, by - 3, eye);
      p.set(cx + 2, by - 3, eye);
      p.set(cx, by - 1, '#402830');
      p.set(cx - 3, by - 1, '#f0a0a0');
      p.set(cx + 3, by - 1, '#f0a0a0');
      p.set(cx + 4, by + 2, glow);
      p.set(cx + 5, by + 1, glow);
    }
    const lg = frame === 1 ? 1 : 0;
    p.vline(cx - 2, by + 3, by + 5 - lg, bodyS);
    p.vline(cx + 2, by + 3, by + 4 + lg, bodyS);
  }
  outlineAuto(p, -0.55);
  p.set(8, by - 9, glow);
  return p;
}

function quadruped(l: CreatureLook, dir: Facing, frame: number, kind: 'dog' | 'cat' | 'pig'): Pix {
  const p = new Pix(16, 32);
  const body = l.c1 ?? (kind === 'dog' ? '#8a6038' : kind === 'cat' ? '#8a8a98' : '#f0a0b0');
  const bodyS = shade(body, -0.25);
  const acc = l.c2 ?? (kind === 'dog' ? '#e0a040' : kind === 'cat' ? '#d8c8a0' : '#9aa0b8');
  const eye = l.eye ?? '#181818';
  const by = 25 + (frame === 1 ? -1 : 0);
  const cx = 8;
  if (dir === 'left' || dir === 'right') {
    const f = dir === 'left' ? -1 : 1;
    p.ellipse(cx, by, 5, 3, body);
    p.hline(cx - 4, cx + 4, by + 2, bodyS);
    p.ellipse(cx + f * 5, by - 3, 3, 2.8, body);
    if (kind === 'dog') {
      p.rect(cx + f * 7 - (f < 0 ? 1 : 0), by - 3, 2, 2, acc);
      p.rect(cx - f * 6 - (f > 0 ? 2 : 0), by - 1, 3, 2, acc);
    }
    if (kind === 'cat') {
      p.set(cx + f * 4, by - 6, body);
      p.set(cx + f * 6, by - 6, body);
      p.set(cx + f * 6, by - 3, '#f0d040');
      p.rect(cx - 1, by - 3, 3, 2, acc);
      p.set(cx - f * 6, by - 2, body);
      p.set(cx - f * 7, by - 3, body);
    }
    if (kind === 'pig') {
      p.rect(cx - 2, by - 4, 5, 2, acc);
      p.set(cx + f * 8, by - 3, shade(body, -0.35));
    }
    p.set(cx + f * 6, by - 4, eye);
    const lg = frame === 1 ? 1 : 0;
    p.vline(cx - 3 + lg, by + 2, by + 4, bodyS);
    p.vline(cx + 3 - lg, by + 2, by + 4, bodyS);
  } else {
    p.ellipse(cx, by + 1, 4, 3.2, body);
    p.ellipse(cx, by - 3, 3.8, 3.2, body);
    if (dir === 'down') {
      p.set(cx - 2, by - 3, kind === 'cat' ? '#f0d040' : eye);
      p.set(cx + 2, by - 3, kind === 'cat' ? '#f0d040' : eye);
      if (kind === 'dog') p.rect(cx - 2, by - 1, 5, 2, acc);
      if (kind === 'pig') p.rect(cx - 1, by - 1, 3, 2, shade(body, -0.3));
      if (kind === 'cat') p.set(cx, by - 1, '#e08080');
    }
    if (kind === 'cat') {
      p.set(cx - 3, by - 6, body);
      p.set(cx + 3, by - 6, body);
      p.rect(cx - 5, by, 2, 3, acc);
      p.rect(cx + 4, by, 2, 3, acc);
    }
    if (kind === 'dog') {
      p.set(cx - 4, by - 3, bodyS);
      p.set(cx + 4, by - 3, bodyS);
      if (dir === 'up') p.rect(cx - 1, by + 3, 3, 2, acc);
    }
    if (kind === 'pig') {
      p.rect(cx - 5, by - 1, 2, 3, acc);
      p.rect(cx + 4, by - 1, 2, 3, acc);
    }
    const lg = frame === 1 ? 1 : 0;
    p.vline(cx - 2, by + 3, by + 5 - lg, bodyS);
    p.vline(cx + 2, by + 3, by + 4 + lg, bodyS);
  }
  outlineAuto(p);
  return p;
}

function wisp(l: CreatureLook, _dir: Facing, frame: number, w = 16, h = 32, scale = 1): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#a0e8ff';
  const cS = shade(c, -0.3);
  const glow = l.glow ?? '#ffffff';
  const cx = w / 2;
  const cy = h - 10 * scale + (frame ? -1 : 0);
  p.ellipse(cx, cy, 5 * scale, 5 * scale, c);
  for (let i = 0; i < 3; i++) {
    const tx = cx - 4 * scale + i * 4 * scale;
    p.ellipse(tx + (frame && i === 1 ? 1 : 0), cy + 5 * scale, 1.6 * scale, 2.4 * scale, c);
  }
  p.ellipse(cx + 2 * scale, cy + 2 * scale, 2.5 * scale, 2 * scale, cS);
  p.ellipse(cx - 2 * scale, cy - 2 * scale, 1.5 * scale, 1.2 * scale, glow);
  const ey = cy - 1 * scale;
  p.rect(Math.round(cx - 3 * scale), Math.round(ey), Math.max(1, scale), 2 * scale, l.eye ?? '#203050');
  p.rect(Math.round(cx + 2 * scale), Math.round(ey), Math.max(1, scale), 2 * scale, l.eye ?? '#203050');
  outlineAuto(p, -0.5);
  return p;
}

function molerat(l: CreatureLook, dir: Facing, frame: number): Pix {
  const p = new Pix(16, 32);
  const body = l.c1 ?? '#8a7a68';
  const bodyS = shade(body, -0.3);
  const claw = l.c2 ?? '#e0d0b0';
  const by = 25 + (frame ? -1 : 0);
  const cx = 8;
  const f = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  p.ellipse(cx, by, 5.5, 3.8, body);
  p.hline(cx - 4, cx + 4, by + 3, bodyS);
  p.ellipse(cx + f * 4, by - 2 + (f ? 0 : dir === 'up' ? -2 : 1), 3, 2.6, body);
  if (dir !== 'up') {
    p.set(cx + f * 4 - (f ? 0 : 2), by - 3, '#f04030');
    if (!f) p.set(cx + 2, by - 3, '#f04030');
    p.set(cx + f * 7, by - 1, '#e8a0a0');
    if (!f) p.set(cx, by + 1, '#e8a0a0');
  }
  p.set(cx - 5, by + 4 - (frame ? 1 : 0), claw);
  p.set(cx + 5, by + 4 - (frame ? 0 : 1), claw);
  p.set(cx - 4, by + 4, claw);
  p.set(cx + 4, by + 4, claw);
  outlineAuto(p);
  return p;
}

function coal(l: CreatureLook, _dir: Facing, frame: number, w = 16, h = 32, s = 1): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#3a3438';
  const hot = l.glow ?? '#ff8030';
  const cx = w / 2;
  const cy = h - 10 * s + (frame ? -1 : 0);
  p.poly([[cx - 5 * s, cy], [cx - 2 * s, cy - 5 * s], [cx + 3 * s, cy - 5 * s], [cx + 6 * s, cy - 1 * s], [cx + 4 * s, cy + 5 * s], [cx - 3 * s, cy + 5 * s]], c);
  p.line(cx - 2 * s, cy - 3 * s, cx + 1 * s, cy + 3 * s, hot);
  p.line(cx + 3 * s, cy - 2 * s, cx + 2 * s, cy + 2 * s, shade(hot, -0.3));
  p.rect(Math.round(cx - 3 * s), Math.round(cy - 1 * s), s, s, '#fff080');
  p.rect(Math.round(cx + 2 * s), Math.round(cy - 1 * s), s, s, '#fff080');
  p.set(cx - 1, cy - 4 * s - 2 - frame, hot);
  p.set(cx + 2, cy - 4 * s - 3 + frame, '#ffd060');
  outlineAuto(p, -0.4);
  return p;
}

function vine(l: CreatureLook, _dir: Facing, frame: number, w = 16, h = 32, s = 1): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#3a8a58';
  const cS = shade(c, -0.35);
  const glow = l.glow ?? '#80f0d0';
  const cx = w / 2;
  const base = h - 3;
  for (let i = -2; i <= 2; i++) {
    const sway = Math.round(Math.sin(i + frame) * s);
    p.line(cx + i * 2 * s, base, cx + i * s + sway, base - 9 * s, i % 2 ? cS : c);
    p.line(cx + i * 2 * s + 1, base, cx + i * s + sway + 1, base - 9 * s, c);
  }
  p.ellipse(cx, base - 10 * s, 3.5 * s, 3 * s, c);
  p.ellipse(cx, base - 10 * s, 2 * s, 1.6 * s, glow);
  p.rect(Math.round(cx - 1 * s), Math.round(base - 11 * s), Math.max(1, s), Math.max(1, s), '#ffffff');
  for (const [dx, dy] of [[-4, -5], [4, -6], [-3, -2]]) p.ellipse(cx + dx * s, base + dy * s, 1.2 * s, 0.9 * s, shade(c, 0.25));
  outlineAuto(p, -0.5);
  return p;
}

function drone(l: CreatureLook, _dir: Facing, frame: number, w = 16, h = 32, s = 1): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#8890a0';
  const cS = shade(c, -0.35);
  const glow = l.glow ?? '#60f0e0';
  const cx = w / 2;
  const cy = h - 12 * s + (frame ? -1 : 0);
  p.ellipse(cx, cy, 4.5 * s, 4 * s, c);
  p.ellipse(cx + 1 * s, cy + 1.5 * s, 3.2 * s, 2.2 * s, cS);
  p.ellipse(cx, cy, 1.8 * s, 1.8 * s, glow);
  p.rect(Math.round(cx - 0.5 * s), Math.round(cy - 0.5 * s), Math.max(1, s), Math.max(1, s), '#ffffff');
  const rot = frame ? 1 : 0;
  p.hline(cx - 8 * s + rot, cx - 4 * s + rot, cy - 4 * s, '#c0c8d0');
  p.hline(cx + 4 * s - rot, cx + 8 * s - rot, cy - 4 * s, '#c0c8d0');
  p.vline(cx - 5 * s, cy - 4 * s, cy - 2 * s, cS);
  p.vline(cx + 5 * s, cy - 4 * s, cy - 2 * s, cS);
  p.line(cx - 2 * s, cy + 4 * s, cx - 3 * s, cy + 6 * s, cS);
  p.line(cx + 2 * s, cy + 4 * s, cx + 3 * s, cy + 6 * s, cS);
  outlineAuto(p, -0.55);
  return p;
}

function guardian(l: CreatureLook, _dir: Facing, frame: number, w = 16, h = 32, s = 1): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#d8f0ff';
  const cS = shade(c, -0.25);
  const glow = l.glow ?? '#80d0ff';
  const cx = w / 2;
  const base = h - 2;
  p.ellipse(cx, base - 8 * s, 5 * s, 6 * s, c);
  p.ellipse(cx + 2 * s, base - 6 * s, 3 * s, 4 * s, cS);
  p.ellipse(cx, base - 16 * s, 3.5 * s, 3.2 * s, c);
  for (const side of [-1, 1]) {
    p.line(cx + side * 2 * s, base - 18 * s, cx + side * 5 * s, base - 24 * s, glow);
    p.line(cx + side * 4 * s, base - 21 * s, cx + side * 7 * s, base - 22 * s, glow);
    p.line(cx + side * 3 * s, base - 2 * s, cx + side * 4 * s, base - 1, cS);
  }
  p.rect(Math.round(cx - 2 * s), Math.round(base - 17 * s), Math.max(1, s), Math.max(1, s), '#203060');
  p.rect(Math.round(cx + 1 * s), Math.round(base - 17 * s), Math.max(1, s), Math.max(1, s), '#203060');
  p.ellipse(cx, base - 9 * s, 1.6 * s, 1.6 * s, frame ? '#ffffff' : glow);
  outlineAuto(p, -0.5);
  return p;
}

function hound(l: CreatureLook, dir: Facing, frame: number, w = 32, h = 32, s = 1, core = false): Pix {
  const p = new Pix(w, h);
  const c = l.c1 ?? '#6a7080';
  const cS = shade(c, -0.35);
  const cH = shade(c, 0.25);
  const glow = l.glow ?? '#60f0e0';
  const flip = dir === 'right';
  const X = (x: number) => (flip ? w - 1 - x : x);
  const base = h - 2;
  const legs = [4, 9, 20, 25].map((x) => x * s * (w / (32 * s)));
  const q = (pts: [number, number][], col: string) => p.poly(pts.map(([x, y]) => [X(x), y] as [number, number]), col);
  q([[5 * s, base - 14 * s], [26 * s, base - 16 * s], [28 * s, base - 8 * s], [6 * s, base - 7 * s]], c);
  q([[6 * s, base - 9 * s], [27 * s, base - 10 * s], [28 * s, base - 8 * s], [6 * s, base - 7 * s]], cS);
  q([[0, base - 19 * s], [8 * s, base - 21 * s], [9 * s, base - 13 * s], [1 * s, base - 12 * s]], c);
  q([[0, base - 14 * s], [7 * s, base - 14 * s], [6 * s, base - 12 * s], [1 * s, base - 12 * s]], cS);
  p.rect(X(2 * s), base - 18 * s, Math.max(1, 2 * s), Math.max(1, s), glow);
  legs.forEach((lx, i) => {
    const off = (i + frame) % 2 ? s : 0;
    q([[lx, base - 8 * s], [lx + 3 * s, base - 8 * s], [lx + 3 * s - off, base], [lx - off, base]], i < 2 ? cS : c);
  });
  if (core) {
    p.ellipse(X(16 * s), base - 11 * s, 4 * s, 3.5 * s, glow);
    p.ellipse(X(16 * s), base - 11 * s, 2 * s, 1.8 * s, '#ffffff');
    q([[10 * s, base - 16 * s], [13 * s, base - 22 * s], [15 * s, base - 16 * s]], cS);
    q([[18 * s, base - 16 * s], [21 * s, base - 23 * s], [23 * s, base - 16 * s]], cS);
  } else {
    for (let i = 0; i < 4; i++) q([[8 * s + i * 5 * s, base - 16 * s], [12 * s + i * 5 * s, base - 16 * s], [12 * s + i * 5 * s, base - 10 * s], [8 * s + i * 5 * s, base - 10 * s]], i % 2 ? cH : shade(c, 0.1));
    p.rect(X(15 * s), base - 14 * s, Math.max(1, 2 * s), Math.max(1, 2 * s), glow);
  }
  q([[26 * s, base - 15 * s], [31 * s, base - 22 * s], [30 * s, base - 14 * s]], cS);
  outlineAuto(p, -0.55);
  return p;
}

function pigeonpig(l: CreatureLook, dir: Facing, frame: number): Pix {
  const p = new Pix(16, 32);
  const body = l.c1 ?? '#b0a8b8';
  const pink = l.c2 ?? '#f0a8b0';
  const by = 25 + (frame ? -1 : 0);
  const cx = 8;
  const f = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  p.ellipse(cx, by, 5, 3.6, body);
  p.ellipse(cx - f * 2, by - 1 + frame, 3, 1.8, shade(body, -0.2));
  p.ellipse(cx + f * 4, by - 3, 2.8, 2.6, pink);
  if (dir !== 'up') {
    p.set(cx + f * 5 + (f ? 0 : -1), by - 4, '#201010');
    if (!f) p.set(cx + 1, by - 4, '#201010');
    p.rect(cx + f * 6 - (f ? 0 : 1), by - 3, 2, 2, shade(pink, -0.25));
  }
  p.vline(cx - 2, by + 3, by + 5, '#e08040');
  p.vline(cx + 2, by + 3, by + 5, '#e08040');
  outlineAuto(p);
  return p;
}

const PAINTERS: Record<string, Painter> = {
  fox,
  platydog: (l, d, f) => quadruped(l, d, f, 'dog'),
  catowl: (l, d, f) => quadruped(l, d, f, 'cat'),
  pigeonpig,
  wisp: (l, d, f) => wisp(l, d, f),
  molerat,
  coalspirit: (l, d, f) => coal(l, d, f),
  vinecrawler: (l, d, f) => vine(l, d, f),
  drone: (l, d, f) => drone(l, d, f),
  guardian: (l, d, f) => guardian(l, d, f),
  hound: (l, d, f) => hound(l, d, f),
  pig: (l, d, f) => quadruped(l, d, f, 'pig')
};

export function hasCreature(kind: string): boolean {
  return kind in PAINTERS;
}

export function drawCreature(l: CreatureLook, dir: Facing, frame: number): Pix {
  const painter = PAINTERS[l.kind];
  if (!painter) throw new Error(`no creature painter for kind "${l.kind}"`);
  return painter(l, dir, frame);
}

export function drawBattleCreature(l: CreatureLook, frame: number, variant = ''): Pix {
  switch (l.kind) {
    case 'wisp':
      return wisp(l, 'right', frame, 28, 30, 2);
    case 'molerat': {
      const b = new Pix(36, 28);
      const body = l.c1 ?? '#8a7a68';
      const bodyS = shade(body, -0.3);
      const claw = l.c2 ?? '#e0d0b0';
      const bob = frame ? 1 : 0;
      b.ellipse(16, 17 + bob, 12, 8, body);
      b.ellipse(18, 21 + bob, 10, 4, bodyS);
      b.ellipse(27, 12 + bob, 6.5, 5.5, body);
      b.set(29, 10 + bob, '#ff4030');
      b.set(30, 10 + bob, '#ff4030');
      b.ellipse(33, 14 + bob, 1.8, 1.5, '#f0a0a0');
      for (let i = 0; i < 3; i++) {
        b.line(24 + i * 2, 24, 26 + i * 2, 27, claw);
        b.line(8 + i * 2, 24, 7 + i * 2, 27, claw);
      }
      for (let i = 0; i < 5; i++) b.set(8 + i * 3, 10 + bob + (i % 2), shade(body, 0.25));
      b.line(4, 17, 0, 14, bodyS);
      outlineAuto(b);
      return b;
    }
    case 'coalspirit':
      return coal(l, 'right', frame, 32, 34, 2);
    case 'vinecrawler':
      return vine(l, 'right', frame, 36, 40, 2);
    case 'drone':
      return drone(l, 'right', frame, 34, 34, 2);
    case 'guardian':
      return guardian(l, 'right', frame, 56, 64, 2);
    case 'hound':
      return hound(l, 'right', frame, 76, 60, 2.3, variant === 'core');
    case 'pigeonpig': {
      const b = new Pix(30, 26);
      const body = l.c1 ?? '#b0a8b8';
      const pink = l.c2 ?? '#f0a8b0';
      const bob = frame ? 1 : 0;
      b.ellipse(13, 15 + bob, 10, 7, body);
      b.ellipse(10, 13 + bob - frame, 6, 3.5, shade(body, -0.2));
      b.ellipse(22, 9 + bob, 6, 5, pink);
      b.set(24, 7 + bob, '#201010');
      b.rect(27, 9 + bob, 3, 3, shade(pink, -0.3));
      b.vline(10, 21, 25, '#e08040');
      b.vline(16, 21, 25, '#e08040');
      b.hline(2, 5, 13 + bob, shade(body, -0.3));
      outlineAuto(b);
      return b;
    }
    case 'platydog':
    case 'catowl':
    case 'fox':
    case 'pig': {
      const small = drawCreature(l, 'right', frame);
      const b = new Pix(32, 32);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const v = small.data[(y + 16) * 16 + x];
        if (v) b.rect(x * 2, y * 2, 2, 2, '#000000'), b.set(x * 2, y * 2, v), b.set(x * 2 + 1, y * 2, v), b.set(x * 2, y * 2 + 1, v), b.set(x * 2 + 1, y * 2 + 1, v);
      }
      return b;
    }
  }
  throw new Error(`no battle painter for kind "${l.kind}"`);
}

function drawShip(kind: string, frame: number): Pix {
  const kupol = kind === 'kupolship';
  const w = kupol ? 96 : 112;
  const h = kupol ? 52 : 60;
  const p = new Pix(w, h);
  const hull = kupol ? '#e8ecf2' : '#6a4428';
  const hullS = shade(hull, -0.3);
  const base = h - 4;
  p.poly([[0, base - 16], [w, base - 16], [w - 10, base], [8, base]], hull);
  p.poly([[4, base - 6], [w - 4, base - 6], [w - 10, base], [8, base]], hullS);
  p.hline(0, w - 1, base - 16, kupol ? '#3070c0' : '#c0a060');
  for (let x = 12; x < w - 12; x += 10) p.ellipse(x, base - 10, 1.6, 1.6, kupol ? '#80e0f0' : '#f0d890');
  if (kupol) {
    p.rect(26, base - 30, 44, 14, '#d0d6e0');
    p.rect(26, base - 30, 44, 2, '#3070c0');
    for (let x = 30; x < 68; x += 6) p.rect(x, base - 25, 3, 4, '#60c0f0');
    p.ellipse(48, base - 34, 12, 8, '#f0f4f8');
    p.ellipse(48, base - 34, 6, 4, '#60f0e0');
    p.rect(72, base - 40, 6, 12, '#8890a0');
    if (frame % 2) p.ellipse(75, base - 44, 3, 2, '#c0c8d0');
  } else {
    p.rect(30, base - 26, 40, 10, '#8a5a34');
    p.rect(30, base - 26, 40, 2, '#c0a060');
    for (let x = 34; x < 68; x += 7) p.rect(x, base - 22, 3, 3, '#f0d070');
    p.vline(52, base - 56, base - 26, '#5a3a20');
    p.poly([[53, base - 54], [80, base - 34], [53, base - 30]], '#e8e0c8');
    p.rect(74, base - 40, 6, 14, '#303030');
    p.rect(12, base - 22, 14, 6, '#8a6a3a');
  }
  outlineAuto(p, -0.6);
  return p;
}

export function drawProp(kind: string, frame: number, c1?: string, c2?: string): Pix {
  if (kind === 'kupolship' || kind === 'ferryship') return drawShip(kind, frame);
  const p = new Pix(16, 32);
  const base = 31;
  switch (kind) {
    case 'signal': {
      p.vline(8, base - 22, base - 1, '#505868');
      p.vline(9, base - 22, base - 1, '#707888');
      p.rect(5, base - 28, 7, 8, '#303640');
      p.ellipse(8, base - 24, 2.4, 2.4, frame > 0 ? '#60f080' : '#f04040');
      p.set(7, base - 25, '#ffffff');
      p.rect(5, base - 2, 7, 2, '#404650');
      break;
    }
    case 'wallpiece': {
      const b = c1 ?? '#5a3434';
      p.rect(0, base - 30, 16, 30, b);
      for (let y = base - 30; y < base; y += 4) {
        p.hline(0, 15, y, shade(b, -0.35));
        const off = ((y - base) / 4) % 2 ? 0 : 4;
        for (let x = off; x < 16; x += 8) p.vline(x, y, y + 3, shade(b, -0.35));
      }
      p.hline(0, 15, base - 30, shade(b, 0.2));
      break;
    }
    case 'gate': {
      p.rect(0, base - 22, 16, 21, '#4a5060');
      for (let x = 1; x < 16; x += 3) p.vline(x, base - 21, base - 2, '#8890a0');
      p.hline(0, 15, base - 12, '#8890a0');
      p.hline(0, 15, base - 22, '#a0a8b8');
      p.rect(6, base - 14, 4, 4, '#c0a040');
      break;
    }
    case 'chest': {
      const wood = c1 ?? '#9a5a28';
      const band = c2 ?? '#e0b040';
      if (frame === 0) {
        p.rect(2, base - 11, 12, 10, wood);
        p.rect(2, base - 11, 12, 4, shade(wood, 0.15));
        p.hline(2, 13, base - 7, shade(wood, -0.35));
        p.vline(4, base - 11, base - 2, band);
        p.vline(11, base - 11, base - 2, band);
        p.rect(7, base - 8, 2, 3, band);
      } else {
        p.rect(2, base - 8, 12, 7, wood);
        p.rect(3, base - 8, 10, 2, '#2a1810');
        p.rect(2, base - 14, 12, 4, shade(wood, 0.15));
        p.vline(4, base - 8, base - 2, band);
        p.vline(11, base - 8, base - 2, band);
      }
      break;
    }
    case 'shrine': {
      const stone = c1 ?? '#a0988c';
      p.rect(3, base - 5, 10, 4, shade(stone, -0.2));
      p.rect(5, base - 14, 6, 9, stone);
      p.rect(4, base - 16, 8, 2, shade(stone, 0.2));
      p.rect(6, base - 13, 4, 3, '#302020');
      const fl = frame % 2 ? '#ffd040' : '#ff8030';
      p.rect(7, base - 13 + (frame % 2), 2, 2, fl);
      p.set(7 + (frame % 2), base - 14, '#fff0a0');
      p.rect(7, base - 20, 2, 4, c2 ?? '#e04030');
      p.set(8, base - 21, '#ffd040');
      break;
    }
    case 'switch': {
      p.rect(4, base - 8, 8, 7, '#606878');
      p.rect(5, base - 7, 6, 5, '#404650');
      const on = frame === 1;
      p.line(8, base - 5, on ? 11 : 5, base - 12, '#c0c0c8');
      p.rect(on ? 10 : 4, base - 14, 3, 3, on ? '#60f060' : '#f04040');
      break;
    }
    case 'furnace': {
      const brick = c1 ?? '#8a4a38';
      p.rect(1, base - 18, 14, 17, brick);
      for (let y = base - 18; y < base; y += 3) p.hline(1, 14, y, shade(brick, -0.3));
      p.rect(4, base - 10, 8, 7, '#1a1010');
      p.rect(5, base - 22, 6, 4, shade(brick, -0.15));
      if (frame > 0) {
        p.rect(5, base - 8, 6, 5, frame % 2 ? '#ff8020' : '#ffb030');
        p.rect(6, base - 7, 4, 3, '#fff080');
        p.set(7, base - 24, '#a0a0a0');
        p.set(8, base - 26, '#808080');
      }
      break;
    }
    case 'vines': {
      const v = c1 ?? '#2a9a78';
      const g = c2 ?? '#90ffe0';
      for (let i = 0; i < 6; i++) {
        const x = 1 + i * 3;
        p.line(x, base, x + ((i + frame) % 2 ? 1 : -1), base - 26, i % 2 ? v : shade(v, -0.25));
        p.line(x + 1, base, x + 1 + ((i + frame) % 2 ? 1 : -1), base - 26, v);
      }
      for (const [x, y] of [[3, 8], [9, 14], [12, 5], [5, 20], [11, 22]]) {
        p.rect(x, base - 26 + y, 2, 2, g);
      }
      break;
    }
    case 'steam': {
      p.rect(4, base - 4, 8, 3, '#505860');
      p.rect(6, base - 5, 4, 1, '#303840');
      if (frame > 0) {
        for (let i = 0; i < 12; i++) {
          const y = base - 6 - i * 2;
          const w = 3 + (i % 3) + (frame % 2);
          p.hline(8 - w, 8 + w, y, i % 2 ? '#e8f0f8' : '#c8d4e0');
        }
      }
      break;
    }
    case 'spark': {
      p.rect(6, base - 3, 4, 2, '#404040');
      if (frame > 0) {
        for (let i = 0; i < 8; i++) p.line(8, base - 4, 8 + Math.round(Math.cos(i + frame) * 6), base - 4 - Math.abs(Math.round(Math.sin(i * 1.3 + frame) * 12)), i % 2 ? '#fff080' : '#80e0ff');
      }
      break;
    }
    case 'searchlight': {
      if (frame > 0) p.ellipse(8, base - 6, 7.5, 5.5, '#fff8c8');
      break;
    }
    case 'crumble': {
      const w = c1 ?? '#8a6a40';
      if (frame === 0) {
        p.rect(0, base - 12, 16, 10, w);
        for (let x = 0; x < 16; x += 4) p.vline(x, base - 12, base - 3, shade(w, -0.35));
      } else if (frame === 1) {
        p.rect(0, base - 12, 16, 10, shade(w, -0.2));
        p.line(2, base - 11, 13, base - 4, '#1a1008');
        for (let x = 0; x < 16; x += 4) p.vline(x, base - 12, base - 3, shade(w, -0.45));
      }
      break;
    }
    case 'sparkle': {
      const c = frame % 2 ? '#ffffff' : '#fff080';
      p.set(8, base - 6, c);
      if (frame % 3 !== 2) {
        p.set(7, base - 6, c);
        p.set(9, base - 6, c);
        p.set(8, base - 7, c);
        p.set(8, base - 5, c);
      }
      break;
    }
    case 'radio': {
      p.rect(3, base - 9, 10, 7, c1 ?? '#6a4a30');
      p.rect(4, base - 8, 5, 5, '#c8b890');
      p.rect(10, base - 8, 2, 2, '#303030');
      p.line(4, base - 9, 1, base - 16, '#a0a0a0');
      if (frame) p.set(11, base - 5, '#f04040');
      break;
    }
    case 'minecart': {
      p.rect(1, base - 11, 14, 8, c1 ?? '#6a6a70');
      p.rect(2, base - 10, 12, 2, '#3a2a20');
      p.hline(1, 14, base - 11, '#a0a0a8');
      p.ellipse(4, base - 2, 2, 2, '#303030');
      p.ellipse(12, base - 2, 2, 2, '#303030');
      break;
    }
    case 'elevator': {
      p.rect(0, base - 20, 16, 19, '#586070');
      p.rect(1, base - 19, 14, 17, frame ? '#e0c060' : '#3a4250');
      p.vline(8, base - 19, base - 2, '#202830');
      p.rect(6, base - 24, 4, 3, frame ? '#60f060' : '#f04040');
      break;
    }
    case 'terminal': {
      p.rect(2, base - 14, 12, 12, '#a8a090');
      p.rect(3, base - 13, 10, 7, '#102018');
      for (let i = 0; i < 3; i++) p.hline(4, 4 + ((i * 3 + frame * 2) % 8), base - 12 + i * 2, '#50e070');
      p.rect(3, base - 5, 10, 2, '#807868');
      break;
    }
    case 'core': {
      const g = c1 ?? '#60f0e0';
      p.ellipse(8, base - 10, 6, 8, '#404858');
      p.ellipse(8, base - 10, 4, 6, frame % 2 ? g : shade(g, -0.2));
      p.ellipse(8, base - 11, 2, 3, '#ffffff');
      break;
    }
    case 'barrier': {
      p.rect(0, base - 10, 16, 3, '#e0c030');
      for (let x = 0; x < 16; x += 4) p.rect(x, base - 10, 2, 3, '#303030');
      p.vline(1, base - 10, base - 1, '#606060');
      p.vline(14, base - 10, base - 1, '#606060');
      break;
    }
    case 'paisho': {
      p.rect(1, base - 9, 14, 6, '#7a4a28');
      p.rect(2, base - 12, 12, 5, '#e8d8b0');
      p.line(2, base - 12, 13, base - 8, '#a04030');
      p.line(13, base - 12, 2, base - 8, '#a04030');
      p.set(5, base - 11, '#ffffff');
      p.set(10, base - 9, '#303030');
      p.vline(3, base - 4, base - 1, '#5a3418');
      p.vline(12, base - 4, base - 1, '#5a3418');
      break;
    }
    case 'lantern': {
      p.vline(8, base - 26, base - 20, '#303030');
      p.ellipse(8, base - 16, 3.5, 4.5, frame % 2 ? '#f04030' : '#e03828');
      p.ellipse(8, base - 16, 1.5, 3, '#ffd060');
      p.hline(6, 10, base - 21, '#302020');
      p.hline(6, 10, base - 11, '#302020');
      break;
    }
    case 'sign': {
      p.rect(2, base - 16, 12, 8, c1 ?? '#8a6a3a');
      p.hline(4, 11, base - 13, '#3a2a1a');
      p.hline(4, 9, base - 11, '#3a2a1a');
      p.vline(7, base - 8, base - 1, '#5a4020');
      p.vline(8, base - 8, base - 1, '#5a4020');
      break;
    }
    case 'boat': {
      p.poly([[0, base - 10], [16, base - 10], [13, base - 2], [3, base - 2]], c1 ?? '#6a4a2a');
      p.hline(0, 15, base - 10, '#a07a48');
      break;
    }
    case 'poster': {
      p.rect(3, base - 26, 10, 13, c1 ?? '#e0d0a0');
      p.rect(4, base - 25, 8, 6, c2 ?? '#c03030');
      p.hline(4, 11, base - 17, '#303030');
      p.hline(4, 9, base - 15, '#303030');
      break;
    }
    case 'bed': {
      p.rect(1, base - 14, 14, 13, '#7a5030');
      p.rect(2, base - 13, 12, 11, c1 ?? '#e8e0d0');
      p.rect(2, base - 13, 12, 3, '#ffffff');
      p.rect(2, base - 8, 12, 6, c2 ?? '#b03030');
      break;
    }
    case 'anvil': {
      p.rect(3, base - 9, 10, 3, '#505058');
      p.rect(6, base - 6, 4, 3, '#404048');
      p.rect(4, base - 3, 8, 2, '#303038');
      p.hline(3, 12, base - 9, '#8a8a98');
      p.poly([[13, base - 9], [16, base - 8], [13, base - 7]], '#505058');
      break;
    }
    case 'crate': {
      p.rect(2, base - 12, 12, 11, c1 ?? '#a07840');
      p.rect(2, base - 12, 12, 1, shade(c1 ?? '#a07840', 0.3));
      p.line(2, base - 12, 13, base - 2, shade(c1 ?? '#a07840', -0.3));
      p.line(13, base - 12, 2, base - 2, shade(c1 ?? '#a07840', -0.3));
      break;
    }
    case 'glow': {
      p.ellipse(8, base - 8, 5, 5, c1 ?? '#80f0ff');
      p.ellipse(8, base - 8, 2.5, 2.5, '#ffffff');
      break;
    }
    case 'rubble': {
      p.ellipse(5, base - 3, 4, 2.5, c1 ?? '#6a6058');
      p.ellipse(11, base - 4, 4.5, 3, shade(c1 ?? '#6a6058', 0.15));
      p.ellipse(8, base - 7, 3.5, 2.5, shade(c1 ?? '#6a6058', -0.1));
      break;
    }
    case 'none':
      break;
    default:
      throw new Error(`no prop painter for "${kind}"`);
  }
  outlineAuto(p, -0.6);
  return p;
}
