import looks from '../content/avatar98/data/looks.json';
import tiles from '../content/avatar98/data/tiles.json';
import { Sprites } from '../src/avatar98/gfx/sprites.ts';
import type { LookDef, TileDef } from '../src/avatar98/data/types.ts';

const sp = new Sprites(looks as Record<string, LookDef>, (tiles as { tiles: Record<string, TileDef> }).tiles);
const c = document.createElement('canvas');
c.width = 640;
c.height = 900;
c.style.cssText = 'width:1280px;height:1800px;image-rendering:pixelated';
document.body.style.margin = '0';
document.body.style.background = '#223';
document.body.appendChild(c);
const ctx = c.getContext('2d') as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = '#3a3a50';
ctx.fillRect(0, 0, 640, 900);
let x = 2;
let y = 2;
const ids = Object.keys(looks).filter((k) => (looks as Record<string, LookDef>)[k].kind !== 'prop');
for (const id of ids) {
  for (const d of ['down', 'up', 'left', 'right'] as const) for (let f = 0; f < 3; f++) {
    ctx.drawImage(sp.walkFrame(id, d, f === 0 ? 0 : f === 1 ? 1 : 3), x, y);
    x += 17;
  }
  x += 4;
  if (x > 600) {
    x = 2;
    y += 34;
  }
}
y += 36;
x = 2;
for (const id of ['isa', 'tao', 'miri', 'captain_rou', 'kupol_soldier', 'hana']) {
  for (const p of ['stand', 'strike', 'cast', 'hurt', 'guard', 'victory', 'kneel'] as const) {
    ctx.drawImage(sp.pose(id, p, 'left'), x, y);
    x += 17;
  }
  ctx.drawImage(sp.pose(id, 'ko', 'left'), x, y + 16);
  x += 40;
  if (x > 560) {
    x = 2;
    y += 34;
  }
}
y += 36;
x = 2;
for (const id of ['isa', 'tao', 'miri', 'hana', 'pipo', 'captain_rou', 'inspector_mei', 'sage', 'lin', 'shen', 'granny_ou', 'jinhai', 'korra', 'catowl', 'kupol_soldier', 'harbormaster']) {
  for (const e of ['normal', 'happy', 'angry', 'sad', 'surprised'] as const) {
    const pc = sp.portrait(id, e);
    if (pc) {
      ctx.fillStyle = '#20306a';
      ctx.fillRect(x, y, 48, 48);
      ctx.drawImage(pc, x, y);
    }
    x += 50;
    if (x > 600) {
      x = 2;
      y += 50;
    }
  }
}
y += 52;
x = 2;
for (const id of ['bluewisp', 'molerat', 'coalspirit', 'pigeonpig', 'vinecrawler', 'corruptvine', 'drone', 'guardian', 'hound', 'hound_core', 'kupol_trooper', 'thug']) {
  const b = sp.battleSprite(id, 0, id === 'hound_core' ? 'core' : '');
  ctx.drawImage(b, x, y);
  x += b.width + 4;
  if (x > 560) {
    x = 2;
    y += 66;
  }
}
y += 70;
x = 2;
for (const id of Object.keys(looks).filter((k) => (looks as Record<string, LookDef>)[k].kind === 'prop')) {
  for (let f = 0; f < 3; f++) {
    ctx.drawImage(sp.propFrame(id, f), x, y);
    x += 17;
  }
  x += 3;
  if (x > 600) {
    x = 2;
    y += 34;
  }
}
y += 36;
const tids = Object.keys((tiles as { tiles: Record<string, TileDef> }).tiles);
ctx.drawImage(sp.tileSheet(tids), 2, y);
x = 280;
for (const t of ['canopy', 'canopy_blossom']) {
  const ti = sp.tile(t);
  ctx.drawImage(ti.canvas, x, y + 20);
  x += 40;
}
(window as unknown as { galleryDone: boolean }).galleryDone = true;
