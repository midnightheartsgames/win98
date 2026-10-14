import type { Dir, EntityDef, MapDef, TilesData } from './types.ts';

interface TmjProperty {
  name: string;
  type?: string;
  value: unknown;
}

interface TmjObject {
  id?: number;
  name?: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  gid?: number;
  properties?: TmjProperty[];
}

interface TmjLayer {
  type: 'tilelayer' | 'objectgroup' | string;
  name: string;
  width?: number;
  height?: number;
  data?: number[];
  objects?: TmjObject[];
  properties?: TmjProperty[];
}

interface TmjTileset {
  firstgid: number;
  name?: string;
  source?: string;
  tiles?: { id: number; properties?: TmjProperty[]; type?: string; class?: string }[];
  tilecount?: number;
  columns?: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
}

export interface TmjMap {
  type?: string;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TmjLayer[];
  tilesets: TmjTileset[];
  properties?: TmjProperty[];
  orientation?: string;
  renderorder?: string;
  infinite?: boolean;
  version?: string;
  tiledversion?: string;
  nextlayerid?: number;
  nextobjectid?: number;
}

const FLIP_MASK = 0x1fffffff;
const LEGEND_CHARS = '.,:;#%&*+=-_~^`\'"!?/\\|<>[]{}()$@0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const JSON_PROPS = new Set(['move', 'to', 'hazard', 'script', 'chase_cfg']);
const NUM_PROPS = new Set(['chase', 'count', 'gold', 'w', 'h', 'z']);

function propMap(props?: TmjProperty[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of props ?? []) out[p.name] = p.value;
  return out;
}

export function tilesetIndex(tiles: TilesData): string[] {
  return Object.keys(tiles.tiles);
}

export function importTmj(id: string, tmj: TmjMap, tiles: TilesData): MapDef {
  if (tmj.tilewidth !== 16 || tmj.tileheight !== 16) throw new Error(`${id}.tmj: tiles must be 16x16 (got ${tmj.tilewidth}x${tmj.tileheight})`);
  const gidToTile = new Map<number, string>();
  const order = tilesetIndex(tiles);
  for (const ts of tmj.tilesets) {
    if (ts.source) throw new Error(`${id}.tmj: external tilesets (${ts.source}) are not supported, embed the tileset in the map`);
    const named = new Map<number, string>();
    for (const t of ts.tiles ?? []) {
      const p = propMap(t.properties);
      const name = (p.tile as string) ?? t.class ?? t.type;
      if (name) named.set(t.id, name);
    }
    const count = ts.tilecount ?? order.length;
    for (let i = 0; i < count; i++) {
      const name = named.get(i) ?? order[i];
      if (name) gidToTile.set(ts.firstgid + i, name);
    }
  }
  const legend: Record<string, string> = {};
  const byTile = new Map<string, string>();
  let next = 0;
  const charFor = (tile: string): string => {
    let c = byTile.get(tile);
    if (!c) {
      if (next >= LEGEND_CHARS.length) throw new Error(`${id}.tmj: more than ${LEGEND_CHARS.length} distinct tiles`);
      c = LEGEND_CHARS[next++];
      if (c === ' ') c = LEGEND_CHARS[next++];
      byTile.set(tile, c);
      legend[c] = tile;
    }
    return c;
  };
  const layerRows = (layer: TmjLayer | undefined): string[] | undefined => {
    if (!layer || !layer.data) return undefined;
    const rows: string[] = [];
    for (let y = 0; y < tmj.height; y++) {
      let row = '';
      for (let x = 0; x < tmj.width; x++) {
        const gid = layer.data[y * tmj.width + x] & FLIP_MASK;
        if (!gid) {
          row += ' ';
          continue;
        }
        const tile = gidToTile.get(gid);
        if (!tile) throw new Error(`${id}.tmj: layer "${layer.name}" uses unknown gid ${gid} at ${x},${y}`);
        if (!tiles.tiles[tile]) throw new Error(`${id}.tmj: tile "${tile}" is not defined in tiles.json`);
        row += charFor(tile);
      }
      rows.push(row);
    }
    return rows;
  };
  const find = (name: string) => tmj.layers.find((l) => l.type === 'tilelayer' && l.name.toLowerCase() === name);
  const ground = layerRows(find('ground'));
  if (!ground) throw new Error(`${id}.tmj: a tile layer named "ground" is required`);
  const props = propMap(tmj.properties);
  const spawns: MapDef['spawns'] = {};
  const entities: EntityDef[] = [];
  for (const layer of tmj.layers) {
    if (layer.type !== 'objectgroup') continue;
    for (const o of layer.objects ?? []) {
      const p = propMap(o.properties);
      const kind = (o.class || o.type || (p.kind as string) || '').toLowerCase();
      const tx = Math.floor(o.x / 16);
      const ty = Math.floor((o.gid ? o.y - 1 : o.y) / 16);
      if (kind === 'spawn') {
        spawns[o.name || 'default'] = { x: tx, y: ty, dir: (p.dir as Dir) || 'down' };
        continue;
      }
      const e: Record<string, unknown> = { id: o.name || `obj${o.id ?? entities.length}`, kind, x: tx, y: ty };
      if (o.width && o.height && !o.gid) {
        const w = Math.max(1, Math.round(o.width / 16));
        const h = Math.max(1, Math.round(o.height / 16));
        if (w > 1) e.w = w;
        if (h > 1) e.h = h;
      }
      for (const k of Object.keys(p)) {
        if (k === 'kind') continue;
        let v = p[k];
        if (JSON_PROPS.has(k) && typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch (err) {
            throw new Error(`${id}.tmj: object "${e.id}" property "${k}" must be valid JSON (${(err as Error).message})`);
          }
        }
        if (NUM_PROPS.has(k) && typeof v === 'string') v = Number(v);
        e[k] = v;
      }
      entities.push(e as unknown as EntityDef);
    }
  }
  const map: MapDef = {
    id,
    name: (props.name as string) || `map.${id}`,
    w: tmj.width,
    h: tmj.height,
    music: (props.music as string) || '',
    region: (props.region as string) || '',
    bg: (props.bg as string) || '#000000',
    legend,
    layers: { ground },
    spawns,
    entities,
    source: 'tmj'
  };
  const deco = layerRows(find('deco'));
  const over = layerRows(find('over'));
  if (deco) map.layers.deco = deco;
  if (over) map.layers.over = over;
  for (const k of ['battleBg', 'onEnter', 'dark', 'night', 'radio', 'chase']) {
    if (props[k] === undefined) continue;
    let v = props[k];
    if (k === 'chase' && typeof v === 'string') v = JSON.parse(v);
    (map as unknown as Record<string, unknown>)[k] = v;
  }
  return map;
}

function toProps(obj: Record<string, unknown>): TmjProperty[] {
  const out: TmjProperty[] = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined) continue;
    if (typeof v === 'object') out.push({ name: k, type: 'string', value: JSON.stringify(v) });
    else if (typeof v === 'number') out.push({ name: k, type: Number.isInteger(v) ? 'int' : 'float', value: v });
    else if (typeof v === 'boolean') out.push({ name: k, type: 'bool', value: v });
    else out.push({ name: k, type: 'string', value: v });
  }
  return out;
}

export function exportTmj(map: MapDef, tiles: TilesData, globalLegend: Record<string, string>): TmjMap {
  const order = tilesetIndex(tiles);
  const legend = { ...globalLegend, ...(map.legend ?? {}) };
  const gidOf = (c: string): number => {
    if (c === ' ') return 0;
    const t = legend[c];
    const i = order.indexOf(t);
    if (i < 0) throw new Error(`${map.id}: legend char '${c}' has no tile`);
    return i + 1;
  };
  const layer = (name: string, rows: string[] | undefined, lid: number): TmjLayer & { id: number; opacity: number; visible: boolean; x: number; y: number } => ({
    id: lid,
    type: 'tilelayer',
    name,
    width: map.w,
    height: map.h,
    opacity: 1,
    visible: true,
    x: 0,
    y: 0,
    data: Array.from({ length: map.w * map.h }, (_, i) => {
      const row = rows?.[Math.floor(i / map.w)] ?? '';
      return gidOf(row[i % map.w] ?? ' ');
    })
  });
  let oid = 1;
  const objects: TmjObject[] = [];
  for (const name of Object.keys(map.spawns)) {
    const s = map.spawns[name];
    objects.push({ id: oid++, name, type: 'spawn', x: s.x * 16, y: s.y * 16, width: 16, height: 16, properties: toProps({ dir: s.dir ?? 'down' }) });
  }
  for (const e of map.entities) {
    const { id, kind, x, y, w, h, ...rest } = e;
    objects.push({ id: oid++, name: id, type: kind, x: x * 16, y: y * 16, width: (w ?? 1) * 16, height: (h ?? 1) * 16, properties: toProps(rest as Record<string, unknown>) });
  }
  const mapProps: Record<string, unknown> = { name: map.name, music: map.music, region: map.region, bg: map.bg };
  for (const k of ['battleBg', 'onEnter', 'dark', 'night', 'radio', 'chase'] as const) if (map[k] !== undefined) mapProps[k] = map[k];
  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width: map.w,
    height: map.h,
    tilewidth: 16,
    tileheight: 16,
    nextlayerid: 5,
    nextobjectid: oid,
    properties: toProps(mapProps),
    tilesets: [
      {
        firstgid: 1,
        name: 'avatar98',
        image: 'avatar98_tiles.png',
        tilewidth: 16,
        tileheight: 16,
        columns: 16,
        tilecount: order.length,
        imagewidth: 256,
        imageheight: Math.ceil(order.length / 16) * 16,
        tiles: order.map((t, i) => ({ id: i, properties: [{ name: 'tile', type: 'string', value: t }] }))
      }
    ],
    layers: [
      layer('ground', map.layers.ground, 1),
      layer('deco', map.layers.deco, 2),
      layer('over', map.layers.over, 3),
      { id: 4, type: 'objectgroup', name: 'entities', objects } as TmjLayer
    ]
  };
}
