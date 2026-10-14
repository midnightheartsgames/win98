import type { LookDef, TileDef } from '../data/types.ts';
import { drawHumanoid, drawKO, type Facing, type HumanLook, type Pose } from './humanoid.ts';
import { drawBattleCreature, drawCreature, drawProp, hasCreature, type CreatureLook } from './creatures.ts';
import { drawCreaturePortrait, drawPortrait, type Emotion } from './portraits.ts';
import { NOISY, paintTile } from './tiles.ts';
import { Pix } from './pixel.ts';

export interface TileImage {
  canvas: HTMLCanvasElement;
  ox: number;
  oy: number;
}

const DIRS: Facing[] = ['down', 'up', 'left', 'right'];

export class Sprites {
  private looks: Record<string, LookDef>;
  private tiles: Record<string, TileDef>;
  private walk = new Map<string, HTMLCanvasElement[]>();
  private poses = new Map<string, HTMLCanvasElement>();
  private portraits = new Map<string, HTMLCanvasElement | null>();
  private battle = new Map<string, HTMLCanvasElement>();
  private props = new Map<string, HTMLCanvasElement>();
  private tileCache = new Map<string, TileImage>();
  private silhouettes = new Map<HTMLCanvasElement, HTMLCanvasElement>();

  constructor(looks: Record<string, LookDef>, tiles: Record<string, TileDef>) {
    this.looks = looks;
    this.tiles = tiles;
  }

  look(id: string): LookDef {
    const l = this.looks[id];
    if (!l) throw new Error(`unknown look "${id}"`);
    return l;
  }

  isHuman(id: string): boolean {
    return this.look(id).kind === 'human';
  }

  isProp(id: string): boolean {
    return this.look(id).kind === 'prop';
  }

  frameCount(id: string): number {
    const l = this.look(id);
    if (l.kind === 'human') return 3;
    if (l.kind === 'prop') return Number(l.frames ?? 1);
    return 2;
  }

  walkFrame(id: string, dir: Facing, frame: number): HTMLCanvasElement {
    let arr = this.walk.get(id);
    if (!arr) {
      arr = [];
      const l = this.look(id);
      for (const d of DIRS) {
        if (l.kind === 'human') {
          arr.push(drawHumanoid(l as unknown as HumanLook, d, 'stand').toCanvas());
          arr.push(drawHumanoid(l as unknown as HumanLook, d, 'walk1').toCanvas());
          arr.push(drawHumanoid(l as unknown as HumanLook, d, 'walk2').toCanvas());
        } else if (l.kind === 'prop') {
          const n = Number(l.frames ?? 1);
          for (let f = 0; f < 3; f++) arr.push(drawProp(String(l.prop), Math.min(f, n - 1), l.c1 as string | undefined, l.c2 as string | undefined).toCanvas());
        } else if (hasCreature(l.kind)) {
          const a = drawCreature(l as unknown as CreatureLook, d, 0).toCanvas();
          const b = drawCreature(l as unknown as CreatureLook, d, 1).toCanvas();
          arr.push(a, b, a);
        } else throw new Error(`look "${id}" has unknown kind "${l.kind}"`);
      }
      this.walk.set(id, arr);
    }
    const di = DIRS.indexOf(dir);
    const walkSeq = [0, 1, 0, 2];
    const idx = this.look(id).kind === 'prop' ? Math.min(frame, 2) : walkSeq[frame % 4];
    return arr[di * 3 + idx];
  }

  propFrame(id: string, frame: number): HTMLCanvasElement {
    const l = this.look(id);
    const key = `${id}:${frame}`;
    let c = this.props.get(key);
    if (!c) {
      c = drawProp(String(l.prop), frame, l.c1 as string | undefined, l.c2 as string | undefined).toCanvas();
      this.props.set(key, c);
    }
    return c;
  }

  pose(id: string, pose: Pose | 'ko', facing: Facing = 'left'): HTMLCanvasElement {
    const key = `${id}:${pose}:${facing}`;
    let c = this.poses.get(key);
    if (!c) {
      const l = this.look(id);
      if (l.kind === 'human') {
        if (pose === 'ko') {
          const ko = drawKO(l as unknown as HumanLook);
          c = (facing === 'right' ? ko.mirror() : ko).toCanvas();
        } else {
          const p = drawHumanoid(l as unknown as HumanLook, facing, pose);
          c = p.toCanvas();
        }
      } else {
        c = this.walkFrame(id, facing, 0);
      }
      this.poses.set(key, c);
    }
    return c;
  }

  portrait(id: string, emo: Emotion): HTMLCanvasElement | null {
    const key = `${id}:${emo}`;
    if (this.portraits.has(key)) return this.portraits.get(key) as HTMLCanvasElement | null;
    const l = this.looks[id];
    let c: HTMLCanvasElement | null = null;
    if (l && l.kind === 'human') c = drawPortrait(l as unknown as HumanLook, emo).toCanvas();
    else if (l && hasCreature(l.kind)) c = drawCreaturePortrait(l as unknown as CreatureLook, emo).toCanvas();
    this.portraits.set(key, c);
    return c;
  }

  battleSprite(id: string, frame: number, variant = ''): HTMLCanvasElement {
    const key = `${id}:${frame}:${variant}`;
    let c = this.battle.get(key);
    if (!c) {
      const l = this.look(id);
      if (l.kind === 'human') c = drawHumanoid(l as unknown as HumanLook, 'right', frame === 1 ? 'strike' : frame === 2 ? 'cast' : frame === 3 ? 'hurt' : 'stand').toCanvas();
      else c = drawBattleCreature(l as unknown as CreatureLook, frame % 2, variant).toCanvas();
      this.battle.set(key, c);
    }
    return c;
  }

  silhouette(src: HTMLCanvasElement, color = '#ffffff'): HTMLCanvasElement {
    let c = this.silhouettes.get(src);
    if (!c) {
      c = document.createElement('canvas');
      c.width = src.width;
      c.height = src.height;
      const ctx = c.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, c.width, c.height);
      this.silhouettes.set(src, c);
    }
    return c;
  }

  tile(id: string, frame = 0, variant = 0): TileImage {
    const def = this.tiles[id];
    if (!def) throw new Error(`unknown tile "${id}"`);
    const v = NOISY.has(def.gen) ? variant % 4 : 0;
    const f = def.anim ? frame % def.anim : 0;
    const key = `${id}:${f}:${v}`;
    let t = this.tileCache.get(key);
    if (!t) {
      const art = paintTile(id, def, f, v);
      t = { canvas: art.pix.toCanvas(), ox: art.ox, oy: art.oy };
      this.tileCache.set(key, t);
    }
    return t;
  }

  tileSheet(ids: string[]): HTMLCanvasElement {
    const cols = 16;
    const rows = Math.ceil(ids.length / cols);
    const p = new Pix(cols * 16, rows * 16);
    const c = p.toCanvas();
    const ctx = c.getContext('2d') as CanvasRenderingContext2D;
    ids.forEach((id, i) => {
      const t = this.tile(id);
      ctx.drawImage(t.canvas, 0, 0, 16, 16, (i % cols) * 16, Math.floor(i / cols) * 16, 16, 16);
    });
    return c;
  }
}
