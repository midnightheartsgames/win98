import type { Dir, EntityDef, MapDef, TileDef } from '../data/types.ts';
import type { Sprites } from '../gfx/sprites.ts';
import type { Game } from './state.ts';
import { TILE, SCREEN_W, SCREEN_H } from '../config.ts';
import { makeCanvas, rgba } from '../gfx/pixel.ts';
import { hashString } from '../core/rng.ts';

export const DIRV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function dirFrom(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export const OBJECT_GENS = new Set(['fence', 'railing', 'crate', 'barrel', 'pot', 'table', 'forge', 'tree', 'bush', 'boulder', 'lamppost', 'statue', 'ladder', 'pillar', 'pipe', 'crt', 'banner', 'support', 'chimney', 'tank', 'acunit', 'signboard', 'rug', 'scroll', 'counter', 'machine', 'roots', 'cables', 'vine', 'empty', 'reactor']);

export function liftObjects(ground: (string | null)[][], deco: (string | null)[][], over: (string | null)[][], tiles: Record<string, TileDef>): void {
  const h = ground.length;
  const w = h ? ground[0].length : 0;
  const isFloor = (id: string | null | undefined) => {
    if (!id) return false;
    const d = tiles[id];
    return !!d && !OBJECT_GENS.has(d.gen) && !d.over && !d.solid;
  };
  const infer = (x: number, y: number): string | null => {
    for (let r = 1; r <= 3; r++) {
      for (const [dx, dy] of [[-r, 0], [0, -r], [r, 0], [0, r], [-r, -r], [r, -r], [-r, r], [r, r]]) {
        const id = ground[y + dy]?.[x + dx];
        if (isFloor(id)) return id as string;
      }
    }
    return null;
  };
  const moved: [number, number, string][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = ground[y][x];
      if (!id) continue;
      const d = tiles[id];
      if (!d) continue;
      if (d.over) {
        if (!over[y][x]) over[y][x] = id;
        moved.push([x, y, id]);
      } else if (OBJECT_GENS.has(d.gen) && !deco[y][x]) {
        deco[y][x] = id;
        moved.push([x, y, id]);
      }
    }
  }
  for (const [x, y] of moved) ground[y][x] = infer(x, y) ?? ground[y][x];
}

export function opposite(d: Dir): Dir {
  return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
}

export interface Bubble {
  icon: string;
  t: number;
}

export class Ent {
  def: EntityDef;
  id: string;
  kind: EntityDef['kind'];
  tx: number;
  ty: number;
  px: number;
  py: number;
  dir: Dir;
  look: string | null;
  hidden = false;
  removed = false;
  moving: { fx: number; fy: number; tx: number; ty: number; t: number; dur: number } | null = null;
  path: string[] = [];
  speed = 1;
  animT = 0;
  walkFrame = 0;
  pose: string | null = null;
  wanderT = 0;
  stunT = 0;
  bubble: Bubble | null = null;
  open = false;
  on = false;
  temp = false;
  aura = false;
  lookOverride: string | null = null;
  hazardOn = false;
  flashT = 0;
  jumpT = 0;

  constructor(def: EntityDef) {
    this.def = def;
    this.id = def.id;
    this.kind = def.kind;
    this.tx = def.x;
    this.ty = def.y;
    this.px = def.x * TILE;
    this.py = def.y * TILE;
    this.dir = def.dir ?? 'down';
    this.look = def.look ?? null;
    this.speed = def.move?.speed ?? 1;
  }

  get currentLook(): string | null {
    return this.lookOverride ?? this.look;
  }

  get busy(): boolean {
    return this.moving !== null || this.path.length > 0;
  }

  place(x: number, y: number): void {
    this.tx = x;
    this.ty = y;
    this.px = x * TILE;
    this.py = y * TILE;
    this.moving = null;
  }
}

interface AnimCell {
  x: number;
  y: number;
  id: string;
  layer: 'ground' | 'deco' | 'over';
}

interface Light {
  x: number;
  y: number;
  r: number;
  color: string;
}

export class World {
  readonly map: MapDef;
  readonly w: number;
  readonly h: number;
  readonly game: Game;
  readonly sprites: Sprites;
  ground: (string | null)[][] = [];
  deco: (string | null)[][] = [];
  over: (string | null)[][] = [];
  ents: Ent[] = [];
  player: Ent;
  followers: Ent[] = [];
  trail: { x: number; y: number; dir: Dir }[] = [];
  lowCanvas: HTMLCanvasElement;
  decoCanvas: HTMLCanvasElement;
  overCanvas: HTMLCanvasElement;
  animCells: AnimCell[] = [];
  lights: Light[] = [];
  camX = 0;
  camY = 0;
  camTarget: { x: number; y: number } | null = null;
  camFollow: Ent | null = null;
  t = 0;
  private tiles: Record<string, TileDef>;
  private darkCanvas: HTMLCanvasElement | null = null;

  constructor(map: MapDef, game: Game, sprites: Sprites) {
    this.map = map;
    this.w = map.w;
    this.h = map.h;
    this.game = game;
    this.sprites = sprites;
    this.tiles = game.data.tiles.tiles;
    const legend = { ...game.data.tiles.legend, ...(map.legend ?? {}) };
    const parse = (rows: string[] | undefined): (string | null)[][] =>
      Array.from({ length: map.h }, (_, y) => Array.from({ length: map.w }, (_, x) => {
        const c = rows?.[y]?.[x] ?? ' ';
        return c === ' ' ? null : legend[c] ?? null;
      }));
    this.ground = parse(map.layers.ground);
    this.deco = parse(map.layers.deco);
    this.over = parse(map.layers.over);
    liftObjects(this.ground, this.deco, this.over, this.tiles);
    const [lc] = makeCanvas(map.w * TILE, map.h * TILE);
    const [oc] = makeCanvas(map.w * TILE, map.h * TILE);
    const [dc] = makeCanvas(map.w * TILE, map.h * TILE);
    this.decoCanvas = dc;
    this.lowCanvas = lc;
    this.overCanvas = oc;
    this.prerender();
    this.player = new Ent({ id: 'player', kind: 'npc', x: 0, y: 0, look: 'isa' });
    for (const d of map.entities) this.ents.push(new Ent(d));
    this.refresh();
  }

  tileDef(id: string | null): TileDef | null {
    return id ? this.tiles[id] ?? null : null;
  }

  private prerender(): void {
    const lctx = this.lowCanvas.getContext('2d') as CanvasRenderingContext2D;
    const octx = this.overCanvas.getContext('2d') as CanvasRenderingContext2D;
    const dctx = this.decoCanvas.getContext('2d') as CanvasRenderingContext2D;
    lctx.fillStyle = this.map.bg;
    lctx.fillRect(0, 0, this.lowCanvas.width, this.lowCanvas.height);
    const variant = (x: number, y: number) => hashString(`${x},${y}`) & 3;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const g = this.ground[y][x];
        const gd = this.tileDef(g);
        if (g && gd) {
          if (gd.anim) this.animCells.push({ x, y, id: g, layer: 'ground' });
          else this.drawTile(lctx, g, x, y, 0, variant(x, y));
          if (gd.light) this.lights.push({ x: x * TILE + 8, y: y * TILE + 8, r: 28, color: gd.light });
        }
      }
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const g = this.ground[y][x];
        const gd = this.tileDef(g);
        if (!gd || gd.solid) continue;
        const up = this.tileDef(this.ground[y - 1]?.[x] ?? null);
        const upDeco = this.tileDef(this.deco[y - 1]?.[x] ?? null);
        if ((up && up.solid && !up.water && /^(wall|roof|walltop|flatroof|ship|window|door|pillar|machine|shelf|counter)/.test(up.gen)) || (upDeco && upDeco.solid && /^(wall|shelf|counter|machine|cargo|crate|pillar)/.test(upDeco.gen))) {
          lctx.fillStyle = 'rgba(0,0,20,0.28)';
          lctx.fillRect(x * TILE, y * TILE, TILE, 3);
          lctx.fillStyle = 'rgba(0,0,20,0.14)';
          lctx.fillRect(x * TILE, y * TILE + 3, TILE, 2);
        }
      }
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const d = this.deco[y][x];
        const dd = this.tileDef(d);
        if (d && dd) {
          if (dd.anim) this.animCells.push({ x, y, id: d, layer: 'deco' });
          else this.drawTile(dctx, d, x, y, 0, variant(x, y));
          if (dd.light) this.lights.push({ x: x * TILE + 8, y: y * TILE + 8, r: 34, color: dd.light });
        }
        const o = this.over[y][x];
        const od = this.tileDef(o);
        if (o && od) {
          if (od.anim) this.animCells.push({ x, y, id: o, layer: 'over' });
          else this.drawTile(octx, o, x, y, 0, variant(x, y));
          if (od.light) this.lights.push({ x: x * TILE + 8, y: y * TILE + 6, r: 40, color: od.light });
        }
      }
    }
  }

  private drawTile(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, frame: number, variant: number): void {
    const t = this.sprites.tile(id, frame, variant);
    ctx.drawImage(t.canvas, x * TILE + t.ox, y * TILE + t.oy);
  }

  private shoreSides(x: number, y: number): number {
    let s = 0;
    const land = (xx: number, yy: number) => {
      const d = this.tileDef(this.ground[yy]?.[xx] ?? null);
      return !!d && !d.water;
    };
    if (land(x, y - 1)) s |= 1;
    if (land(x + 1, y)) s |= 2;
    if (land(x, y + 1)) s |= 4;
    if (land(x - 1, y)) s |= 8;
    return s;
  }

  refresh(): void {
    for (const e of this.ents) {
      if (e.temp) continue;
      const d = e.def;
      let vis = this.game.test(d.if);
      if (d.once && this.game.flag(d.once)) vis = false;
      if (d.kind === 'chest') e.open = this.game.s.opened.includes(this.chestKey(e));
      if (d.kind === 'hidden' && this.game.s.opened.includes(this.chestKey(e))) vis = false;
      e.removed = !vis;
    }
  }

  chestKey(e: Ent): string {
    return `${this.map.id}.${e.id}`;
  }

  ent(id: string): Ent | undefined {
    if (id === 'player') return this.player;
    return this.ents.find((e) => e.id === id && !e.removed) ?? this.followers.find((f) => f.id === id);
  }

  solidEnt(e: Ent): boolean {
    if (e.removed || e.hidden) return false;
    const d = e.def;
    if (d.solidIf !== undefined) return this.game.test(d.solidIf);
    if (d.solid !== undefined) return d.solid;
    switch (d.kind) {
      case 'npc':
      case 'chest':
      case 'switch':
      case 'shrine':
      case 'vines':
      case 'door':
        return true;
      case 'prop':
        return !!d.look;
      default:
        return false;
    }
  }

  tileSolid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const g = this.tileDef(this.ground[y][x]);
    if (!g || g.solid) return true;
    const d = this.tileDef(this.deco[y][x]);
    if (d && d.solid) return true;
    return false;
  }

  entsAt(x: number, y: number): Ent[] {
    return this.ents.filter((e) => {
      if (e.removed) return false;
      const w = e.def.w ?? 1;
      const h = e.def.h ?? 1;
      const ex = e.moving ? e.moving.tx : e.tx;
      const ey = e.moving ? e.moving.ty : e.ty;
      if (x >= e.tx && x < e.tx + w && y >= e.ty && y < e.ty + h) return true;
      return ex === x && ey === y;
    });
  }

  blocked(x: number, y: number, mover: Ent | null, ignoreEnts = false): boolean {
    if (this.tileSolid(x, y)) return true;
    if (ignoreEnts) return false;
    for (const e of this.entsAt(x, y)) if (e !== mover && this.solidEnt(e)) return true;
    if (mover && mover !== this.player) {
      const p = this.player;
      if ((p.tx === x && p.ty === y) || (p.moving && p.moving.tx === x && p.moving.ty === y)) return true;
    }
    return false;
  }

  startMove(e: Ent, dir: Dir, dur: number, force = false): boolean {
    e.dir = dir;
    const [dx, dy] = DIRV[dir];
    const nx = e.tx + dx;
    const ny = e.ty + dy;
    if (!force && this.blocked(nx, ny, e, e.kind === 'enemy' ? false : false)) return false;
    e.moving = { fx: e.tx, fy: e.ty, tx: nx, ty: ny, t: 0, dur: Math.max(1, Math.round(dur)) };
    if (e === this.player) this.trail.unshift({ x: e.tx, y: e.ty, dir });
    if (this.trail.length > 8) this.trail.length = 8;
    return true;
  }

  stepEnt(e: Ent): boolean {
    if (!e.moving) return false;
    const m = e.moving;
    m.t++;
    const k = Math.min(1, m.t / m.dur);
    e.px = (m.fx + (m.tx - m.fx) * k) * TILE;
    e.py = (m.fy + (m.ty - m.fy) * k) * TILE;
    e.animT++;
    if (k >= 1) {
      e.tx = m.tx;
      e.ty = m.ty;
      e.px = e.tx * TILE;
      e.py = e.ty * TILE;
      e.moving = null;
      return true;
    }
    return false;
  }

  setupFollowers(ids: string[]): void {
    this.followers = ids.map((id) => {
      const f = new Ent({ id: `follow_${id}`, kind: 'npc', x: this.player.tx, y: this.player.ty, look: this.game.data.characters[id]?.look ?? id });
      f.dir = this.player.dir;
      return f;
    });
    this.trail = [];
  }

  updateFollowers(): void {
    this.followers.forEach((f, i) => {
      if (f.moving) {
        this.stepEnt(f);
        return;
      }
      const target = this.trail[i];
      if (!target) return;
      if (f.tx === target.x && f.ty === target.y) return;
      const dx = target.x - f.tx;
      const dy = target.y - f.ty;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        f.place(target.x, target.y);
        f.dir = target.dir;
        return;
      }
      const dir = dirFrom(dx, dy);
      const p = this.player.moving;
      f.dir = dir;
      f.moving = { fx: f.tx, fy: f.ty, tx: f.tx + DIRV[dir][0], ty: f.ty + DIRV[dir][1], t: 0, dur: p ? p.dur : 12 };
    });
  }

  updateCamera(): void {
    let cx: number;
    let cy: number;
    const f = this.camFollow ?? this.player;
    if (this.camTarget) {
      cx = this.camTarget.x;
      cy = this.camTarget.y;
    } else {
      cx = f.px + 8;
      cy = f.py + 4;
    }
    let x = cx - SCREEN_W / 2;
    let y = cy - SCREEN_H / 2;
    const mw = this.w * TILE;
    const mh = this.h * TILE;
    x = mw <= SCREEN_W ? (mw - SCREEN_W) / 2 : Math.max(0, Math.min(mw - SCREEN_W, x));
    y = mh <= SCREEN_H ? (mh - SCREEN_H) / 2 : Math.max(0, Math.min(mh - SCREEN_H, y));
    this.camX = x;
    this.camY = y;
  }

  frameOf(e: Ent): HTMLCanvasElement | null {
    const look = e.currentLook;
    if (!look) return null;
    const lk = this.sprites.look(look);
    if (lk.kind === 'prop') {
      let fr = 0;
      if (e.kind === 'chest') fr = e.open ? 1 : 0;
      else if (e.kind === 'switch') fr = e.on ? 1 : 0;
      else if (e.kind === 'hazard') fr = e.hazardOn ? 1 + (Math.floor(this.t / 6) % 2) : 0;
      else if (e.def.frame === 'on' || e.on) fr = 1 + (Math.floor(this.t / 10) % Math.max(1, this.sprites.frameCount(look) - 1));
      else if (this.sprites.frameCount(look) > 1 && e.def.frame === 'anim') fr = Math.floor(this.t / 12) % this.sprites.frameCount(look);
      else if (e.kind === 'shrine' || e.kind === 'hidden') fr = Math.floor(this.t / 10) % this.sprites.frameCount(look);
      return this.sprites.propFrame(look, fr);
    }
    if (e.pose && lk.kind === 'human') {
      if (e.pose === 'ko') return this.sprites.pose(look, 'ko', e.dir === 'right' ? 'right' : 'left');
      return this.sprites.pose(look, e.pose as never, e.dir);
    }
    const walking = e.moving !== null;
    let wf = 0;
    if (walking) wf = Math.floor(e.animT / 6) % 4;
    else if (lk.kind !== 'human' && (e.kind === 'enemy' || lk.kind === 'wisp' || lk.kind === 'drone' || lk.kind === 'coalspirit' || lk.kind === 'fox' || lk.kind === 'guardian')) wf = Math.floor(this.t / 20) % 2 ? 1 : 0;
    return this.sprites.walkFrame(look, e.dir, wf);
  }

  render(ctx: CanvasRenderingContext2D, extraDraw?: (ctx: CanvasRenderingContext2D, ox: number, oy: number) => void): void {
    const ox = Math.round(this.camX);
    const oy = Math.round(this.camY);
    ctx.fillStyle = this.map.bg;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.drawImage(this.lowCanvas, ox, oy, SCREEN_W, SCREEN_H, 0, 0, SCREEN_W, SCREEN_H);
    const x0 = Math.floor(ox / TILE) - 1;
    const y0 = Math.floor(oy / TILE) - 1;
    const x1 = x0 + SCREEN_W / TILE + 3;
    const y1 = y0 + SCREEN_H / TILE + 3;
    for (const c of this.animCells) {
      if (c.layer !== 'ground' || c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
      const d = this.tileDef(c.id) as TileDef;
      const fr = Math.floor(this.t / 14 + (c.x * 3 + c.y) * 0.37) % (d.anim ?? 1);
      const t = this.sprites.tile(c.id, fr, 0);
      ctx.drawImage(t.canvas, c.x * TILE + t.ox - ox, c.y * TILE + t.oy - oy);
      if (d.water) {
        const s = this.shoreSides(c.x, c.y);
        if (s) {
          ctx.fillStyle = 'rgba(230,240,255,0.55)';
          const px = c.x * TILE - ox;
          const py = c.y * TILE - oy;
          const wob = Math.floor(this.t / 20) % 2;
          if (s & 1) ctx.fillRect(px, py, TILE, 1 + wob);
          if (s & 4) ctx.fillRect(px, py + TILE - 1 - wob, TILE, 1 + wob);
          if (s & 8) ctx.fillRect(px, py, 1 + wob, TILE);
          if (s & 2) ctx.fillRect(px + TILE - 1 - wob, py, 1 + wob, TILE);
        }
      }
    }
    ctx.drawImage(this.decoCanvas, ox, oy, SCREEN_W, SCREEN_H, 0, 0, SCREEN_W, SCREEN_H);
    for (const c of this.animCells) {
      if (c.layer !== 'deco' || c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
      const d = this.tileDef(c.id) as TileDef;
      const fr = Math.floor(this.t / 14 + (c.x * 3 + c.y) * 0.37) % (d.anim ?? 1);
      const t = this.sprites.tile(c.id, fr, 0);
      ctx.drawImage(t.canvas, c.x * TILE + t.ox - ox, c.y * TILE + t.oy - oy);
    }
    const drawables: { y: number; draw: () => void }[] = [];
    const addEnt = (e: Ent) => {
      if (e.removed || e.hidden) return;
      if (e.kind === 'warp' || e.kind === 'trigger') return;
      if (e.kind === 'hidden' && !this.game.s.pipo) return;
      const img = this.frameOf(e);
      if (!img) return;
      const ex = Math.round(e.px - ox + (TILE - img.width) / 2);
      const bob = e.jumpT > 0 ? -Math.round(Math.sin((e.jumpT / 12) * Math.PI) * 5) : 0;
      const ey = Math.round(e.py - oy + TILE - img.height) + bob + (e.def.z ?? 0);
      const sortY = e.kind === 'hazard' && e.def.look === 'searchlight' ? e.py - 1000 : e.py + (e.def.z ?? 0);
      drawables.push({
        y: sortY,
        draw: () => {
          if (e.kind !== 'hazard' && e.kind !== 'hidden' && this.sprites.look(e.currentLook as string).kind !== 'prop') {
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(Math.round(e.px - ox) + 3, Math.round(e.py - oy) + 13, 10, 3);
          }
          if (e.aura) {
            const a = 0.35 + Math.sin(this.t / 5) * 0.15;
            ctx.fillStyle = rgba('#a0f0ff', a);
            ctx.beginPath();
            ctx.ellipse(Math.round(e.px - ox) + 8, Math.round(e.py - oy) + 2, 11, 18, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.drawImage(img, ex, ey);
          if (e.flashT > 0) {
            ctx.globalAlpha = e.flashT / 20;
            ctx.drawImage(this.sprites.silhouette(img), ex, ey);
            ctx.globalAlpha = 1;
          }
          if (e.bubble) this.drawBubble(ctx, e, ox, oy);
        }
      });
    };
    for (const e of this.ents) addEnt(e);
    for (const f of this.followers) addEnt(f);
    addEnt(this.player);
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();
    if (extraDraw) extraDraw(ctx, ox, oy);
    ctx.drawImage(this.overCanvas, ox, oy, SCREEN_W, SCREEN_H, 0, 0, SCREEN_W, SCREEN_H);
    for (const c of this.animCells) {
      if (c.layer !== 'over' || c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
      const d = this.tileDef(c.id) as TileDef;
      const fr = Math.floor(this.t / 14 + c.x * 0.37) % (d.anim ?? 1);
      const t = this.sprites.tile(c.id, fr, 0);
      ctx.drawImage(t.canvas, c.x * TILE + t.ox - ox, c.y * TILE + t.oy - oy);
    }
    if (this.map.night) {
      ctx.fillStyle = 'rgba(10,20,70,0.38)';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    if (this.map.dark) this.renderDark(ctx, ox, oy);
  }

  private renderDark(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    if (!this.darkCanvas) this.darkCanvas = makeCanvas(SCREEN_W, SCREEN_H)[0];
    const d = this.darkCanvas.getContext('2d') as CanvasRenderingContext2D;
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, SCREEN_W, SCREEN_H);
    d.fillStyle = `rgba(4,2,10,${this.map.dark})`;
    d.fillRect(0, 0, SCREEN_W, SCREEN_H);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x: number, y: number, r: number) => {
      const g = d.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g;
      d.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const flick = Math.sin(this.t / 7) * 2;
    hole(this.player.px - ox + 8, this.player.py - oy + 4, 58 + flick);
    for (const l of this.lights) {
      const x = l.x - ox;
      const y = l.y - oy;
      if (x < -60 || y < -60 || x > SCREEN_W + 60 || y > SCREEN_H + 60) continue;
      hole(x, y, l.r + flick);
    }
    for (const e of this.ents) {
      if (e.removed || e.hidden) continue;
      if ((e.def.look === 'furnace' && e.on) || e.def.look === 'lantern' || e.def.look === 'shrine' || e.def.look === 'core' || e.def.look === 'glow' || e.def.look === 'terminal') hole(e.px - ox + 8, e.py - oy + 4, 40 + flick);
      if (e.kind === 'enemy' && (e.def.look === 'coalspirit' || e.def.look === 'bluewisp' || e.def.look === 'drone' || e.def.look === 'vinecrawler' || e.def.look === 'corruptvine')) hole(e.px - ox + 8, e.py - oy + 4, 18);
    }
    d.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.darkCanvas, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const x = l.x - ox;
      const y = l.y - oy;
      if (x < -60 || y < -60 || x > SCREEN_W + 60 || y > SCREEN_H + 60) continue;
      const g = ctx.createRadialGradient(x, y, 0, x, y, l.r * 0.8);
      g.addColorStop(0, rgba(l.color, 0.16));
      g.addColorStop(1, rgba(l.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawBubble(ctx: CanvasRenderingContext2D, e: Ent, ox: number, oy: number): void {
    const b = e.bubble as Bubble;
    const x = Math.round(e.px - ox) + 3;
    const pop = b.t < 6 ? 6 - b.t : 0;
    const y = Math.round(e.py - oy) - 28 + pop;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 12, 10);
    ctx.fillRect(x + 4, y + 10, 3, 2);
    ctx.fillStyle = '#202040';
    ctx.fillRect(x - 1, y + 1, 1, 8);
    ctx.fillRect(x + 12, y + 1, 1, 8);
    ctx.fillRect(x + 1, y - 1, 10, 1);
    ctx.fillRect(x + 1, y + 10, 3, 1);
    ctx.fillRect(x + 7, y + 10, 4, 1);
    const icons: Record<string, string> = { '!': '!', '?': '?', '...': '…', heart: '♥', anger: '#', note: '♪', sweat: '’', idea: '★' };
    const colors: Record<string, string> = { '!': '#e02020', '?': '#2050e0', heart: '#e04070', anger: '#e02020', note: '#3070c0', idea: '#e0a020' };
    const s = icons[b.icon] ?? b.icon;
    const w = s === '…' ? 5 : 3;
    this.bubbleGlyph(ctx, s, x + 6 - Math.floor(w / 2), y + 1, colors[b.icon] ?? '#202040');
  }

  bubbleGlyph: (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string) => void = () => undefined;
}
