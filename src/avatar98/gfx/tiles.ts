import { Pix, shade, mix } from './pixel.ts';
import { Rng, hashString } from '../core/rng.ts';
import type { TileDef } from '../data/types.ts';

export interface TileArt {
  pix: Pix;
  ox: number;
  oy: number;
}

type Gen = (c: string[], r: Rng, frame: number, v: number) => Pix | TileArt;

const T = 16;

function speckle(p: Pix, r: Rng, n: number, cols: string[]): void {
  for (let i = 0; i < n; i++) p.set(r.int(0, 15), r.int(0, 15), r.pick(cols));
}

function fill(c: string): Pix {
  const p = new Pix(T, T);
  p.rect(0, 0, T, T, c);
  return p;
}

const grass: Gen = (c, r) => {
  const [b, d, l] = [c[0] ?? '#5a9a48', c[1] ?? shade(c[0] ?? '#5a9a48', -0.2), c[2] ?? shade(c[0] ?? '#5a9a48', 0.18)];
  const p = fill(b);
  speckle(p, r, 22, [d]);
  speckle(p, r, 10, [l]);
  for (let i = 0; i < 3; i++) {
    const x = r.int(1, 14);
    const y = r.int(2, 15);
    p.set(x, y, d);
    p.set(x - 1, y - 1, l);
    p.set(x + 1, y - 1, l);
  }
  return p;
};

const flowers: Gen = (c, r, f, v) => {
  const p = grass(c, r, f, v) as Pix;
  const cols = [c[3] ?? '#f0e060', c[4] ?? '#f08080', '#ffffff'];
  for (let i = 0; i < 4; i++) {
    const x = r.int(1, 14);
    const y = r.int(1, 14);
    const col = r.pick(cols);
    p.set(x, y, col);
    p.set(x + 1, y, shade(col, -0.2));
    p.set(x, y + 1, shade(c[0] ?? '#5a9a48', -0.3));
  }
  return p;
};

const dirt: Gen = (c, r) => {
  const b = c[0] ?? '#a07850';
  const p = fill(b);
  speckle(p, r, 18, [c[1] ?? shade(b, -0.15)]);
  speckle(p, r, 8, [c[2] ?? shade(b, 0.12)]);
  for (let i = 0; i < 2; i++) {
    const x = r.int(1, 13);
    const y = r.int(1, 13);
    p.rect(x, y, 2, 1, shade(b, 0.2));
    p.rect(x, y + 1, 2, 1, shade(b, -0.25));
  }
  return p;
};

const sand: Gen = (c, r) => {
  const b = c[0] ?? '#e0c890';
  const p = fill(b);
  speckle(p, r, 26, [shade(b, -0.08), shade(b, 0.08)]);
  return p;
};

const cobble: Gen = (c, r) => {
  const mortar = c[1] ?? '#6a6058';
  const stone = c[0] ?? '#a09888';
  const p = fill(mortar);
  const rows = [0, 5, 10];
  rows.forEach((y0, i) => {
    let x = i % 2 ? -3 : 0;
    while (x < T) {
      const w = r.int(4, 7);
      const h = i === 2 ? 5 : 4;
      const s = shade(stone, r.range(-0.1, 0.08));
      p.rect(x + 1, y0 + 1, w - 1, h, s);
      p.hline(x + 1, x + w - 1, y0 + 1, shade(s, 0.15));
      p.hline(x + 1, x + w - 1, y0 + h, shade(s, -0.2));
      x += w;
    }
  });
  return p;
};

const bricks: Gen = (c, r) => {
  const b = c[0] ?? '#b05838';
  const m = c[1] ?? '#6a3828';
  const p = fill(m);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 4 : 0;
    for (let x = -off; x < T; x += 8) {
      const s = shade(b, r.range(-0.08, 0.08));
      p.rect(x + 1, row * 4 + 1, 7, 3, s);
      p.hline(x + 1, x + 7, row * 4 + 1, shade(s, 0.15));
    }
  }
  return p;
};

const planks: Gen = (c, r, _f, v) => {
  const w = c[0] ?? '#a07048';
  const d = c[1] ?? shade(w, -0.3);
  const p = fill(w);
  const vert = v === 1;
  for (let i = 0; i < 4; i++) {
    const s = shade(w, r.range(-0.08, 0.08));
    if (vert) {
      p.rect(i * 4, 0, 4, T, s);
      p.vline(i * 4, 0, 15, d);
      p.set(i * 4 + 2, r.int(0, 15), d);
    } else {
      p.rect(0, i * 4, T, 4, s);
      p.hline(0, 15, i * 4, d);
      const j = r.int(0, 15);
      p.vline(j, i * 4, i * 4 + 3, d);
      p.set(r.int(0, 15), i * 4 + 2, shade(s, -0.15));
    }
  }
  return p;
};

const tatami: Gen = (c) => {
  const b = c[0] ?? '#c8c080';
  const p = fill(b);
  for (let y = 1; y < T; y += 2) p.hline(0, 15, y, shade(b, -0.06));
  p.rect(0, 0, T, 1, c[1] ?? '#406030');
  p.rect(0, 15, T, 1, c[1] ?? '#406030');
  return p;
};

const carpet: Gen = (c) => {
  const b = c[0] ?? '#902828';
  const t = c[1] ?? '#d8a838';
  const p = fill(b);
  p.hline(0, 15, 1, t);
  p.hline(0, 15, 14, t);
  p.rect(6, 6, 4, 4, t);
  p.rect(7, 7, 2, 2, b);
  return p;
};

const checker: Gen = (c) => {
  const a = c[0] ?? '#d8d0c0';
  const b = c[1] ?? '#403830';
  const p = fill(a);
  p.rect(0, 0, 8, 8, b);
  p.rect(8, 8, 8, 8, b);
  p.hline(0, 15, 0, shade(a, 0.1));
  return p;
};

const concrete: Gen = (c, r) => {
  const b = c[0] ?? '#8a8a88';
  const p = fill(b);
  speckle(p, r, 20, [shade(b, -0.06), shade(b, 0.05)]);
  if (r.chance(0.18)) {
    let x = r.int(2, 13);
    const y0 = r.int(0, 6);
    const y1 = y0 + r.int(3, 7);
    for (let y = y0; y < y1; y++) {
      p.set(x, y, shade(b, -0.18));
      if (r.chance(0.3)) x += r.int(-1, 1);
    }
  }
  p.hline(0, 15, 15, shade(b, -0.15));
  p.vline(15, 0, 15, shade(b, -0.12));
  return p;
};

const grate: Gen = (c) => {
  const b = c[0] ?? '#505860';
  const p = fill(shade(b, -0.45));
  for (let i = 0; i < T; i += 4) {
    p.hline(0, 15, i, b);
    p.vline(i, 0, 15, b);
    p.hline(0, 15, i + 1, shade(b, -0.2));
  }
  return p;
};

const metal: Gen = (c) => {
  const b = c[0] ?? '#707888';
  const p = fill(b);
  p.hline(0, 15, 0, shade(b, 0.25));
  p.vline(0, 0, 15, shade(b, 0.15));
  p.hline(0, 15, 15, shade(b, -0.3));
  p.vline(15, 0, 15, shade(b, -0.25));
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) {
    p.set(x, y, shade(b, 0.4));
    p.set(x + 1, y + 1, shade(b, -0.35));
  }
  if (c[1]) {
    for (let i = 0; i < T; i += 4) p.rect(i, 7, 2, 2, c[1]);
  }
  return p;
};

const rock: Gen = (c, r) => {
  const b = c[0] ?? '#5a5048';
  const p = fill(b);
  speckle(p, r, 24, [shade(b, -0.15), shade(b, 0.1)]);
  for (let i = 0; i < 2; i++) {
    const x = r.int(2, 13);
    const y = r.int(2, 13);
    p.ellipse(x, y, 2, 1.4, shade(b, 0.12));
    p.hline(x - 1, x + 1, y + 1, shade(b, -0.25));
  }
  return p;
};

const water: Gen = (c, r, frame) => {
  const b = c[0] ?? '#2860a0';
  const p = fill(b);
  const l = c[1] ?? shade(b, 0.25);
  const d = shade(b, -0.15);
  for (let i = 0; i < 5; i++) {
    const y = (i * 3 + frame) % T;
    const x = (r.int(0, 15) + frame * 2) % T;
    p.hline(x, x + 3, y, l);
    p.hline(x + 5, x + 6, (y + 8) % T, d);
  }
  return p;
};

const ember: Gen = (c, r, frame) => {
  const b = c[0] ?? '#801810';
  const p = fill(b);
  for (let i = 0; i < 16; i++) {
    const x = r.int(0, 15);
    const y = r.int(0, 15);
    p.set(x, y, (i + frame) % 3 === 0 ? '#ffd040' : (i + frame) % 3 === 1 ? '#ff7020' : shade(b, 0.2));
  }
  return p;
};

const vault: Gen = (c, _r, frame) => {
  const b = c[0] ?? '#141a38';
  const g = c[1] ?? '#5080f0';
  const p = fill(b);
  const k = frame % 4;
  p.hline(0, 15, 0, shade(b, 0.2));
  p.vline(0, 0, 15, shade(b, 0.2));
  p.set(8, 8, k < 2 ? g : shade(g, -0.4));
  p.set(4, 4, k === 1 ? g : shade(b, 0.3));
  p.set(12, 12, k === 3 ? g : shade(b, 0.3));
  p.hline(6, 10, 8, shade(g, -0.55));
  p.vline(8, 6, 10, shade(g, -0.55));
  p.set(8, 8, k < 2 ? g : shade(g, -0.2));
  return p;
};

const stars: Gen = (c, r, frame) => {
  const b = c[0] ?? '#0a0c20';
  const p = fill(b);
  for (let i = 0; i < 4; i++) p.set(r.int(0, 15), r.int(0, 15), (i + frame) % 4 === 0 ? '#ffffff' : '#8890c0');
  return p;
};

const wall: Gen = (c, r) => {
  const b = c[0] ?? '#e0c8a0';
  const p = fill(b);
  speckle(p, r, 10, [shade(b, -0.05), shade(b, 0.05)]);
  p.rect(0, 12, T, 4, c[1] ?? shade(b, -0.35));
  p.hline(0, 15, 12, shade(c[1] ?? shade(b, -0.35), 0.2));
  if (c[2]) {
    p.vline(0, 0, 11, c[2]);
    p.vline(15, 0, 11, shade(c[2], -0.2));
  }
  return p;
};

const wallwood: Gen = (c, r) => {
  const b = c[0] ?? '#8a5a38';
  const p = fill(b);
  for (let x = 0; x < T; x += 4) {
    p.vline(x, 0, 15, shade(b, -0.3));
    p.set(x + 2, r.int(0, 15), shade(b, -0.15));
  }
  p.rect(0, 0, T, 2, c[1] ?? shade(b, -0.45));
  p.rect(0, 13, T, 3, c[1] ?? shade(b, -0.45));
  return p;
};

const wallbrick: Gen = (c, r, f, v) => {
  const p = bricks(c, r, f, v) as Pix;
  p.rect(0, 14, T, 2, shade(c[1] ?? '#6a3828', -0.2));
  return p;
};

const wallstone: Gen = (c, r) => {
  const b = c[0] ?? '#8a8478';
  const m = shade(b, -0.35);
  const p = fill(m);
  for (let row = 0; row < 2; row++) {
    const off = row % 2 ? 8 : 0;
    for (let x = -off; x < T; x += 16) {
      const s = shade(b, r.range(-0.06, 0.06));
      p.rect(x + 1, row * 8 + 1, 15, 6, s);
      p.hline(x + 1, x + 15, row * 8 + 1, shade(s, 0.18));
      p.hline(x + 1, x + 15, row * 8 + 6, shade(s, -0.15));
    }
  }
  return p;
};

const wallmetal: Gen = (c) => {
  const b = c[0] ?? '#5a6270';
  const p = fill(b);
  p.vline(0, 0, 15, shade(b, 0.2));
  p.vline(8, 0, 15, shade(b, -0.3));
  p.vline(9, 0, 15, shade(b, 0.15));
  p.hline(0, 15, 15, shade(b, -0.4));
  for (const y of [2, 13]) {
    p.set(3, y, shade(b, 0.4));
    p.set(12, y, shade(b, 0.4));
  }
  if (c[1]) p.rect(0, 6, T, 2, c[1]);
  return p;
};

const wallrock: Gen = (c, r) => {
  const b = c[0] ?? '#6a5a4a';
  const p = fill(shade(b, -0.1));
  for (let i = 0; i < 6; i++) {
    const x = r.int(0, 15);
    const y = r.int(0, 15);
    const s = shade(b, r.range(-0.1, 0.15));
    p.ellipse(x, y, r.range(2, 4), r.range(1.5, 3), s);
    p.hline(x - 2, x + 2, y - 2, shade(s, 0.2));
  }
  p.rect(0, 14, T, 2, shade(b, -0.45));
  return p;
};

const walltop: Gen = (c, r) => {
  const b = c[0] ?? '#3a2a20';
  const p = fill(b);
  speckle(p, r, 8, [shade(b, 0.1), shade(b, -0.1)]);
  if (c[1]) p.hline(0, 15, 15, c[1]);
  return p;
};

const roof: Gen = (c, _r, _f, v) => {
  const t = c[0] ?? '#b83828';
  const d = c[1] ?? shade(t, -0.35);
  const p = fill(d);
  for (let x = 0; x < T; x += 4) {
    p.rect(x, 0, 3, T, t);
    p.vline(x, 0, 15, shade(t, 0.2));
  }
  for (let y = 3; y < T; y += 5) p.hline(0, 15, y, d);
  if (v === 1) {
    p.rect(0, 12, T, 4, c[2] ?? '#e0b040');
    p.hline(0, 15, 12, shade(c[2] ?? '#e0b040', 0.3));
    p.hline(0, 15, 15, shade(c[2] ?? '#e0b040', -0.4));
  }
  if (v === 2) {
    p.rect(0, 0, T, 4, c[2] ?? shade(t, -0.5));
    p.hline(0, 15, 3, shade(t, 0.3));
  }
  return p;
};

const flatroof: Gen = (c, r) => {
  const b = c[0] ?? '#4a4a50';
  const p = fill(b);
  speckle(p, r, 30, [shade(b, -0.12), shade(b, 0.08)]);
  if (c[1]) p.hline(0, 15, 0, c[1]);
  return p;
};

const windowG: Gen = (c, _r, frame) => {
  const w = c[0] ?? '#e0c8a0';
  const fr = c[1] ?? '#5a3820';
  const gl = c[2] ?? '#f0d890';
  const p = wall([w, c[3] ?? shade(w, -0.35)], new Rng(3), 0, 0) as Pix;
  p.rect(3, 2, 10, 9, fr);
  p.rect(4, 3, 8, 7, frame % 2 && c[4] ? c[4] : gl);
  p.vline(8, 3, 9, fr);
  p.hline(4, 11, 6, fr);
  p.set(5, 4, shade(gl, 0.5));
  return p;
};

const door: Gen = (c) => {
  const w = c[0] ?? '#7a4a28';
  const p = fill(c[2] ?? '#3a2418');
  p.rect(2, 1, 12, 15, w);
  p.vline(8, 1, 15, shade(w, -0.35));
  p.rect(2, 1, 12, 1, shade(w, 0.25));
  p.set(6, 9, c[1] ?? '#e0b040');
  p.set(10, 9, c[1] ?? '#e0b040');
  return p;
};

const doorway: Gen = (c) => {
  const p = fill(c[0] ?? '#1a1010');
  p.rect(0, 0, T, 2, c[1] ?? '#3a2418');
  p.rect(0, 0, 2, T, c[1] ?? '#3a2418');
  p.rect(14, 0, 2, T, c[1] ?? '#3a2418');
  return p;
};

const noren: Gen = (c) => {
  const p = fill(c[2] ?? '#1a1010');
  const cl = c[0] ?? '#304a80';
  p.rect(0, 0, T, 9, cl);
  p.vline(5, 3, 8, shade(cl, -0.4));
  p.vline(10, 3, 8, shade(cl, -0.4));
  p.rect(6, 2, 4, 3, c[1] ?? '#f0f0f0');
  p.hline(0, 15, 0, '#3a2418');
  return p;
};

const stairs: Gen = (c) => {
  const b = c[0] ?? '#8a7a68';
  const p = fill(b);
  for (let y = 0; y < T; y += 4) {
    p.hline(0, 15, y, shade(b, 0.2));
    p.hline(0, 15, y + 3, shade(b, -0.3));
  }
  return p;
};

const ladder: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#8a6a3a';
  p.vline(3, 0, 15, w);
  p.vline(12, 0, 15, w);
  for (let y = 2; y < T; y += 4) p.hline(3, 12, y, shade(w, 0.15));
  return p;
};

const fence: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#8a6038';
  p.rect(0, 5, T, 2, w);
  p.rect(0, 10, T, 2, w);
  p.rect(2, 3, 2, 12, shade(w, 0.15));
  p.rect(12, 3, 2, 12, shade(w, 0.15));
  p.hline(0, 15, 7, shade(w, -0.4));
  return p;
};

const railing: Gen = (c) => {
  const p = new Pix(T, T);
  const m = c[0] ?? '#8890a0';
  p.hline(0, 15, 4, shade(m, 0.3));
  p.hline(0, 15, 5, m);
  for (let x = 1; x < T; x += 5) p.vline(x, 5, 14, m);
  p.hline(0, 15, 14, shade(m, -0.3));
  return p;
};

const crate: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#a07840';
  p.rect(1, 1, 14, 14, w);
  p.rect(1, 1, 14, 2, shade(w, 0.3));
  p.line(2, 3, 13, 14, shade(w, -0.3));
  p.line(13, 3, 2, 14, shade(w, -0.3));
  p.hline(1, 14, 14, shade(w, -0.4));
  p.vline(14, 1, 14, shade(w, -0.3));
  return p;
};

const barrel: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#8a5a30';
  p.ellipse(8, 9, 6, 6.5, w);
  p.ellipse(8, 4, 5.5, 2.5, shade(w, 0.25));
  p.hline(3, 13, 7, '#505058');
  p.hline(3, 13, 12, '#505058');
  p.vline(11, 5, 14, shade(w, -0.3));
  return p;
};

const pot: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#b06038';
  p.ellipse(8, 11, 5, 4.5, w);
  p.rect(5, 6, 6, 2, shade(w, 0.2));
  p.ellipse(8, 4, 5, 3.5, c[1] ?? '#50a040');
  p.set(7, 2, c[2] ?? '#f06060');
  p.set(10, 4, c[2] ?? '#f06060');
  return p;
};

const table: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#8a5a30';
  p.rect(0, 3, T, 7, w);
  p.hline(0, 15, 3, shade(w, 0.3));
  p.hline(0, 15, 9, shade(w, -0.4));
  p.vline(1, 10, 15, shade(w, -0.3));
  p.vline(14, 10, 15, shade(w, -0.3));
  if (c[1]) {
    p.rect(4, 4, 3, 3, c[1]);
    p.rect(10, 5, 2, 2, c[2] ?? '#f0f0f0');
  }
  return p;
};

const counter: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#6a4028';
  p.rect(0, 2, T, 14, shade(w, -0.2));
  p.rect(0, 2, T, 5, w);
  p.hline(0, 15, 2, shade(w, 0.35));
  p.hline(0, 15, 7, shade(w, -0.45));
  return p;
};

const shelf: Gen = (c, r) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#6a4028';
  p.rect(0, 0, T, T, shade(w, -0.3));
  for (const y of [5, 10, 15]) p.hline(0, 15, y, w);
  const cols = c.slice(1).length ? c.slice(1) : ['#c04030', '#3060a0', '#e0c040', '#50a050', '#e0e0d0'];
  for (const y of [1, 6, 11]) {
    let x = 1;
    while (x < 14) {
      const w2 = r.int(1, 3);
      const h = r.int(2, 4);
      p.rect(x, y + 4 - h, w2, h, r.pick(cols));
      x += w2 + (r.chance(0.3) ? 1 : 0);
    }
  }
  return p;
};

const forge: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const st = c[0] ?? '#5a5050';
  p.rect(0, 4, T, 12, st);
  p.hline(0, 15, 4, shade(st, 0.3));
  p.rect(2, 6, 12, 8, '#1a0c08');
  const fl = ['#ff5020', '#ff9030', '#ffd050'];
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 2;
    const h = 3 + ((i + frame) % 3);
    p.vline(x, 13 - h, 13, fl[(i + frame) % 3]);
    p.vline(x + 1, 14 - h, 13, fl[(i + frame + 1) % 3]);
  }
  return p;
};

const tree: Gen = (c) => {
  const p = new Pix(T, T);
  const tr = c[1] ?? '#6a4428';
  p.rect(6, 4, 4, 11, tr);
  p.vline(9, 4, 14, shade(tr, -0.35));
  p.hline(4, 11, 15, shade(tr, -0.45));
  p.ellipse(8, 2, 7, 4, c[0] ?? '#3a7a38');
  return p;
};

const canopy: Gen = (c, r) => {
  const p = new Pix(32, 32);
  const g = c[0] ?? '#3a7a38';
  p.ellipse(16, 18, 14, 12, shade(g, -0.25));
  p.ellipse(15, 15, 12.5, 11, g);
  for (let i = 0; i < 10; i++) p.ellipse(r.int(6, 24), r.int(6, 22), 3, 2.5, shade(g, r.range(0.05, 0.22)));
  for (let i = 0; i < 8; i++) p.set(r.int(6, 26), r.int(8, 26), shade(g, -0.4));
  if (c[2]) for (let i = 0; i < 5; i++) p.set(r.int(8, 24), r.int(6, 22), c[2]);
  return { pix: p, ox: -8, oy: -18 };
};

const bush: Gen = (c, r) => {
  const p = new Pix(T, T);
  const g = c[0] ?? '#3a8a40';
  p.ellipse(8, 10, 7.5, 5.5, shade(g, -0.2));
  p.ellipse(7, 8, 6, 4.5, g);
  for (let i = 0; i < 4; i++) p.set(r.int(3, 12), r.int(5, 11), shade(g, 0.25));
  if (c[1]) for (let i = 0; i < 3; i++) p.set(r.int(3, 12), r.int(5, 11), c[1]);
  return p;
};

const boulder: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#807870';
  p.ellipse(8, 10, 7, 5.5, shade(b, -0.2));
  p.ellipse(7, 8, 6, 4.5, b);
  p.ellipse(5, 6, 2.5, 1.5, shade(b, 0.25));
  return p;
};

const lamppost: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  p.vline(7, 0, 14, c[0] ?? '#303038');
  p.vline(8, 0, 14, shade(c[0] ?? '#303038', 0.3));
  p.rect(5, 13, 6, 3, c[0] ?? '#303038');
  void frame;
  return p;
};

const lamptop: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const glow = c[1] ?? '#ffe080';
  p.vline(7, 10, 15, c[0] ?? '#303038');
  p.vline(8, 10, 15, shade(c[0] ?? '#303038', 0.3));
  p.rect(4, 2, 8, 8, c[0] ?? '#303038');
  p.rect(5, 3, 6, 6, frame % 2 ? glow : shade(glow, -0.08));
  p.rect(3, 1, 10, 1, c[0] ?? '#303038');
  return p;
};

const lanternHang: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  p.vline(8, 0, 3, '#302020');
  p.ellipse(8, 8, 4, 5, c[0] ?? '#e03828');
  p.ellipse(8, 8, 2, 3.5, frame % 2 ? '#ffd060' : '#ffb040');
  p.hline(6, 10, 3, '#302020');
  p.hline(6, 10, 13, '#302020');
  p.vline(8, 14, 15, c[1] ?? '#e0b040');
  return p;
};

const neon: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const on = frame % 4 !== 3;
  const col = on ? c[0] ?? '#40f0c0' : shade(c[0] ?? '#40f0c0', -0.6);
  p.rect(1, 2, 14, 10, '#181820');
  p.hline(3, 12, 4, col);
  p.hline(3, 8, 7, col);
  p.hline(10, 12, 7, c[1] && on ? c[1] : col);
  p.hline(3, 12, 9, col);
  p.vline(3, 4, 9, col);
  return p;
};

const vineTile: Gen = (c, r, frame) => {
  const p = new Pix(T, T);
  const v = c[0] ?? '#2a8a68';
  const g = c[1] ?? '#80f0d0';
  for (let i = 0; i < 3; i++) {
    let x = r.int(0, 15);
    for (let y = 0; y < T; y++) {
      p.set(x, y, v);
      p.set(x + 1, y, shade(v, -0.25));
      if (r.chance(0.3)) x += r.int(-1, 1);
    }
  }
  for (let i = 0; i < 3; i++) p.set(r.int(0, 15), r.int(0, 15), (i + frame) % 3 === 0 ? '#ffffff' : g);
  return p;
};

const roots: Gen = (c, r, frame) => {
  const p = new Pix(T, T);
  const v = c[0] ?? '#2a7a60';
  let x = 0;
  let y = r.int(4, 11);
  while (x < T) {
    p.set(x, y, v);
    p.set(x, y + 1, shade(v, -0.3));
    x++;
    if (r.chance(0.35)) y += r.int(-1, 1);
  }
  if (frame % 2) p.set(r.int(2, 13), y, c[1] ?? '#80f0d0');
  return p;
};

const rail: Gen = (c, _r, _f, v) => {
  const p = fill(c[2] ?? '#5a5048');
  const tie = c[1] ?? '#5a3a20';
  const steel = c[0] ?? '#a0a0a8';
  if (v === 1) {
    for (let x = 1; x < T; x += 4) p.rect(x, 1, 2, 14, tie);
    p.hline(0, 15, 4, steel);
    p.hline(0, 15, 11, steel);
    p.hline(0, 15, 5, shade(steel, -0.4));
    p.hline(0, 15, 12, shade(steel, -0.4));
  } else {
    for (let y = 1; y < T; y += 4) p.rect(1, y, 14, 2, tie);
    p.vline(4, 0, 15, steel);
    p.vline(11, 0, 15, steel);
    p.vline(5, 0, 15, shade(steel, -0.4));
    p.vline(12, 0, 15, shade(steel, -0.4));
  }
  return p;
};

const edgeline: Gen = (c) => {
  const p = concrete([c[0] ?? '#8a8a88'], new Rng(7), 0, 0) as Pix;
  const y = c[1] ?? '#e0c030';
  p.rect(0, 13, T, 3, y);
  for (let x = 0; x < T; x += 4) p.rect(x, 13, 2, 3, '#303030');
  return p;
};

const pillar: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#8a8a88';
  p.rect(3, 0, 10, T, b);
  p.vline(3, 0, 15, shade(b, 0.25));
  p.vline(12, 0, 15, shade(b, -0.35));
  p.hline(3, 12, 15, shade(b, -0.4));
  if (c[1]) p.rect(3, 6, 10, 2, c[1]);
  return p;
};

const pipe: Gen = (c, _r, frame, v) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#707888';
  const g = c[1];
  if (v === 1) {
    p.rect(5, 0, 6, T, b);
    p.vline(5, 0, 15, shade(b, 0.3));
    p.vline(10, 0, 15, shade(b, -0.35));
    if (g) p.rect(7, (frame * 4) % T, 2, 3, g);
  } else {
    p.rect(0, 5, T, 6, b);
    p.hline(0, 15, 5, shade(b, 0.3));
    p.hline(0, 15, 10, shade(b, -0.35));
    if (g) p.rect((frame * 4) % T, 7, 3, 2, g);
  }
  return p;
};

const machine: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#5a6270';
  p.rect(0, 1, T, 15, b);
  p.hline(0, 15, 1, shade(b, 0.3));
  p.rect(2, 3, 12, 6, '#102018');
  p.hline(3, 3 + ((frame * 3) % 10), 5, c[1] ?? '#50e070');
  p.hline(3, 3 + ((frame * 5 + 4) % 10), 7, c[1] ?? '#50e070');
  for (let i = 0; i < 4; i++) p.set(3 + i * 3, 11, (i + frame) % 3 ? '#f04040' : '#40f040');
  p.hline(0, 15, 15, shade(b, -0.4));
  return p;
};

const crt: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  p.rect(0, 9, T, 7, c[0] ?? '#6a4028');
  p.hline(0, 15, 9, shade(c[0] ?? '#6a4028', 0.3));
  p.rect(2, 0, 12, 10, '#a8a090');
  p.rect(3, 1, 10, 7, frame % 2 ? '#406890' : '#305878');
  p.hline(4, 11, 2 + (frame % 5), '#80b0e0');
  p.set(4, 2, '#ffffff');
  return p;
};

const banner: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#2850a0';
  p.rect(3, 0, 10, 14, b);
  p.poly([[3, 14], [13, 14], [8, 16]], b);
  p.ellipse(8, 7, 3.5, 3, c[1] ?? '#f0f0f0');
  p.rect(4, 7, 8, 3, b);
  p.hline(4, 12, 9, c[1] ?? '#f0f0f0');
  p.vline(3, 0, 13, shade(b, 0.2));
  return p;
};

const cargo: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#a04030';
  p.rect(0, 0, T, T, b);
  for (let x = 1; x < T; x += 3) p.vline(x, 0, 15, shade(b, -0.25));
  p.hline(0, 15, 0, shade(b, 0.3));
  p.hline(0, 15, 15, shade(b, -0.4));
  return p;
};

const hull: Gen = (c) => {
  const b = c[0] ?? '#5a3a24';
  const p = fill(b);
  for (let y = 0; y < T; y += 4) p.hline(0, 15, y, shade(b, -0.3));
  p.hline(0, 15, 0, c[1] ?? '#c0a060');
  return p;
};

const statue: Gen = (c) => {
  const p = new Pix(T, T);
  const s = c[0] ?? '#a09888';
  p.rect(2, 11, 12, 5, shade(s, -0.25));
  p.rect(5, 3, 6, 8, s);
  p.ellipse(8, 3, 3, 3, s);
  p.vline(10, 3, 10, shade(s, -0.3));
  return p;
};

const pit: Gen = (c, r) => {
  const p = fill(c[0] ?? '#060408');
  speckle(p, r, 4, [shade(c[0] ?? '#060408', 0.08)]);
  return p;
};

const ore: Gen = (c, r, frame) => {
  const p = rock([c[0] ?? '#5a5048'], r, 0, 0) as Pix;
  const g = c[1] ?? '#f0a040';
  for (let i = 0; i < 3; i++) {
    const x = r.int(2, 12);
    const y = r.int(2, 12);
    p.poly([[x, y + 3], [x + 1, y], [x + 3, y + 3]], (i + frame) % 3 ? g : shade(g, 0.5));
  }
  return p;
};

const support: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#7a5a30';
  p.rect(1, 0, 3, T, w);
  p.rect(12, 0, 3, T, w);
  p.vline(3, 0, 15, shade(w, -0.35));
  p.vline(14, 0, 15, shade(w, -0.35));
  return p;
};

const beam: Gen = (c) => {
  const p = new Pix(T, T);
  const w = c[0] ?? '#7a5a30';
  p.rect(0, 2, T, 4, w);
  p.hline(0, 15, 2, shade(w, 0.25));
  p.hline(0, 15, 5, shade(w, -0.4));
  return p;
};

const chimney: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#8a4a38';
  p.rect(3, 4, 10, 12, b);
  p.rect(2, 3, 12, 2, shade(b, 0.2));
  for (let y = 6; y < T; y += 3) p.hline(3, 12, y, shade(b, -0.3));
  p.set(7 + (frame % 2), 1, '#a0a0a8');
  p.set(8, 0, '#c0c0c8');
  return p;
};

const tank: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#6a5040';
  p.ellipse(8, 8, 7, 7, b);
  p.ellipse(6, 6, 3, 2.5, shade(b, 0.25));
  for (let i = 0; i < 3; i++) p.hline(2, 13, 4 + i * 4, shade(b, -0.25));
  return p;
};

const acunit: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#a0a4a8';
  p.rect(1, 3, 14, 12, b);
  p.ellipse(8, 9, 4.5, 4.5, shade(b, -0.4));
  p.line(8 - (frame % 2 ? 3 : 0), 9 - (frame % 2 ? 0 : 3), 8 + (frame % 2 ? 3 : 0), 9 + (frame % 2 ? 0 : 3), '#d0d4d8');
  p.hline(1, 14, 3, shade(b, 0.3));
  return p;
};

const laundry: Gen = (c) => {
  const p = new Pix(T, T);
  p.hline(0, 15, 2, '#d0d0c0');
  p.rect(2, 3, 4, 6, c[0] ?? '#e04040');
  p.rect(9, 3, 5, 5, c[1] ?? '#4080e0');
  p.rect(10, 8, 3, 2, c[1] ?? '#4080e0');
  return p;
};

const cables: Gen = (c) => {
  const p = new Pix(T, T);
  p.line(0, 5, 15, 7, c[0] ?? '#202428');
  p.line(0, 10, 15, 9, c[1] ?? '#303840');
  p.line(0, 11, 15, 10, c[0] ?? '#202428');
  return p;
};

const stripe: Gen = (c) => {
  const p = fill(c[0] ?? '#e0c030');
  for (let i = -16; i < 16; i += 6) p.line(i, 15, i + 15, 0, c[1] ?? '#303030'), p.line(i + 1, 15, i + 16, 0, c[1] ?? '#303030');
  return p;
};

const reactor: Gen = (c, _r, frame) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#404858';
  const g = c[1] ?? '#60f0e0';
  p.rect(0, 0, T, T, b);
  p.rect(2, 2, 12, 12, shade(b, -0.35));
  p.ellipse(8, 8, 4 + (frame % 2), 4 + (frame % 2), g);
  p.ellipse(8, 8, 2, 2, '#ffffff');
  p.hline(0, 15, 0, shade(b, 0.3));
  return p;
};

const pagoda: Gen = (c) => {
  const p = new Pix(T, T);
  p.rect(0, 0, T, T, c[0] ?? '#2a1a14');
  return p;
};

const empty: Gen = () => new Pix(T, T);

const solidColor: Gen = (c) => fill(c[0] ?? '#000000');

const signboard: Gen = (c) => {
  const p = new Pix(T, T);
  p.rect(1, 3, 14, 9, c[0] ?? '#3a2418');
  p.rect(2, 4, 12, 7, c[1] ?? '#e0b040');
  p.hline(4, 11, 6, c[0] ?? '#3a2418');
  p.hline(4, 9, 8, c[0] ?? '#3a2418');
  return p;
};

const awning: Gen = (c, _r, _f, v) => {
  const p = new Pix(T, T);
  const a = c[0] ?? '#c03030';
  const b = c[1] ?? '#f0e0c0';
  for (let x = 0; x < T; x += 4) {
    p.rect(x, 0, 2, 11, a);
    p.rect(x + 2, 0, 2, 11, b);
  }
  for (let x = 0; x < T; x += 4) p.ellipse(x + 2, 11, 2, 2, x % 8 ? b : a);
  if (v === 1) p.hline(0, 15, 0, shade(a, -0.4));
  return p;
};

const rug: Gen = (c) => {
  const p = new Pix(T, T);
  p.rect(1, 1, 14, 14, c[0] ?? '#803030');
  p.rect(3, 3, 10, 10, c[1] ?? '#d0a040');
  p.rect(5, 5, 6, 6, c[0] ?? '#803030');
  return p;
};

const scroll: Gen = (c) => {
  const p = new Pix(T, T);
  p.rect(4, 1, 8, 13, c[0] ?? '#f0e8d0');
  p.hline(3, 12, 1, '#5a3820');
  p.hline(3, 12, 14, '#5a3820');
  p.vline(8, 3, 11, c[1] ?? '#202020');
  p.hline(6, 10, 6, c[1] ?? '#202020');
  return p;
};

const ship: Gen = (c) => {
  const p = new Pix(T, T);
  const b = c[0] ?? '#6a6a70';
  p.rect(0, 0, T, T, b);
  p.hline(0, 15, 0, shade(b, 0.3));
  for (let x = 2; x < T; x += 6) p.ellipse(x + 1, 8, 1.5, 1.5, '#303038');
  return p;
};

const GENS: Record<string, Gen> = {
  grass, flowers, dirt, sand, cobble, bricks, planks, tatami, carpet, checker, concrete, grate, metal, rock, water, ember, vault, stars,
  wall, wallwood, wallbrick, wallstone, wallmetal, wallrock, walltop, roof, flatroof, window: windowG, door, doorway, noren, stairs, ladder,
  fence, railing, crate, barrel, pot, table, counter, shelf, forge, tree, canopy, bush, boulder, lamppost, lamptop, lantern: lanternHang, neon,
  vine: vineTile, roots, rail, edgeline, pillar, pipe, machine, crt, banner, cargo, hull, statue, pit, ore, support, beam, chimney, tank,
  acunit, laundry, cables, stripe, reactor, pagoda, empty, solid: solidColor, signboard, awning, rug, scroll, ship
};

export const NOISY = new Set(['grass', 'flowers', 'dirt', 'sand', 'cobble', 'concrete', 'rock', 'wallrock', 'bush', 'walltop', 'flatroof', 'wall', 'ore', 'shelf', 'canopy', 'vine', 'roots', 'stars', 'pit']);

export function hasGen(name: string): boolean {
  return name in GENS;
}

export function paintTile(id: string, def: TileDef, frame: number, variant: number): TileArt {
  const gen = GENS[def.gen];
  if (!gen) throw new Error(`tile "${id}": unknown generator "${def.gen}"`);
  const r = new Rng(hashString(id) + variant * 7919 + 1);
  const out = gen(def.c ?? [], r, frame, def.v ?? 0);
  if (out instanceof Pix) return { pix: out, ox: 0, oy: 0 };
  return out;
}

export function edgeOverlay(kind: 'shore' | 'shadow', sides: number, color: string): Pix {
  const p = new Pix(T, T);
  if (kind === 'shore') {
    const foam = color;
    if (sides & 1) for (let x = 0; x < T; x++) p.set(x, (x * 7) % 3 === 0 ? 1 : 0, foam), p.set(x, 0, foam);
    if (sides & 2) for (let y = 0; y < T; y++) p.set(15, y, foam), p.set((y * 5) % 3 === 0 ? 14 : 15, y, foam);
    if (sides & 4) for (let x = 0; x < T; x++) p.set(x, 15, foam), p.set(x, (x * 3) % 4 === 0 ? 14 : 15, foam);
    if (sides & 8) for (let y = 0; y < T; y++) p.set(0, y, foam), p.set((y * 7) % 3 === 0 ? 1 : 0, y, foam);
  } else {
    const a = mix(color, '#000000', 0);
    for (let y = 0; y < 4; y++) for (let x = 0; x < T; x++) if ((x + y) % (y + 1) === 0 || y < 2) p.set(x, y, a);
  }
  return p;
}
