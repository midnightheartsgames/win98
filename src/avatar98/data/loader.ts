import type { Command, GameData, Manifest, MapDef, TilesData } from './types.ts';
import { MAP, SCHEMAS, ValidationErrors, check, checkCommands } from './validate.ts';
import { importTmj, type TmjMap } from './tmj.ts';
import { exprIdentifiers, compileExpr } from '../core/expr.ts';

export type ReadText = (path: string) => Promise<string>;

const BUILTIN_ACTIONS = new Set(['attack', 'defend', 'wait']);
const REQUIRED_DATA = ['statuses', 'techniques', 'stances', 'characters', 'items', 'enemies', 'troops', 'looks', 'tiles', 'shops', 'quests', 'world', 'music', 'sfx', 'paisho', 'radio', 'avatarForms', 'chapters', 'elements', 'speakers', 'font', 'progression'];

function parse(path: string, text: string, errors: string[]): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    errors.push(`${path}: invalid JSON (${(err as Error).message})`);
    return undefined;
  }
}

const basename = (p: string): string => p.replace(/^.*[\\/]/, '').replace(/\.(json|tmj)$/i, '');

export async function loadGameData(read: ReadText): Promise<GameData> {
  const errors: string[] = [];
  const manifest = parse('manifest.json', await read('manifest.json'), errors) as Manifest;
  if (!manifest) throw new ValidationErrors(errors);
  const data: Record<string, unknown> = { manifest };
  const dataKeys = Object.keys(manifest.data);
  const texts = await Promise.all(dataKeys.map((k) => read(manifest.data[k]).catch((e: Error) => (errors.push(`${manifest.data[k]}: cannot read (${e.message})`), 'null'))));
  dataKeys.forEach((k, i) => {
    const v = parse(manifest.data[k], texts[i], errors);
    if (SCHEMAS[k]) check(v, SCHEMAS[k], manifest.data[k], errors);
    data[k] = v;
  });
  for (const k of REQUIRED_DATA) if (!(k in data)) errors.push(`manifest.json: data file "${k}" is not listed`);
  const lang: GameData['lang'] = {};
  for (const l of Object.keys(manifest.lang)) {
    lang[l] = [];
    for (const p of manifest.lang[l]) {
      const v = parse(p, await read(p).catch((e: Error) => (errors.push(`${p}: cannot read (${e.message})`), '{}')), errors) as GameData['lang'][string][number];
      check(v, { object: { strings: { record: 'string', optional: true }, dialogue: { record: 'any', optional: true } }, strict: true }, p, errors);
      if (v) lang[l].push({ strings: v.strings ?? {}, dialogue: v.dialogue ?? {} });
    }
  }
  data.lang = lang;
  if (errors.length) throw new ValidationErrors(errors);
  const tiles = data.tiles as TilesData;
  const maps: Record<string, MapDef> = {};
  const mapTexts = await Promise.all(manifest.maps.map((p) => read(p).catch((e: Error) => (errors.push(`${p}: cannot read (${e.message})`), 'null'))));
  manifest.maps.forEach((p, i) => {
    const id = basename(p);
    const raw = parse(p, mapTexts[i], errors);
    if (raw === undefined || raw === null) return;
    let map: MapDef;
    if (/\.tmj$/i.test(p)) {
      try {
        map = importTmj(id, raw as TmjMap, tiles);
      } catch (err) {
        errors.push((err as Error).message);
        return;
      }
    } else map = raw as MapDef;
    const before = errors.length;
    check(map, MAP, p, errors);
    if (errors.length > before) return;
    if (map.id !== id) errors.push(`${p}: map id "${map.id}" must match file name "${id}"`);
    if (maps[id]) errors.push(`${p}: duplicate map id "${id}"`);
    maps[id] = map;
  });
  data.maps = maps;
  const events: Record<string, Command[]> = {};
  for (const p of manifest.events) {
    const v = parse(p, await read(p).catch((e: Error) => (errors.push(`${p}: cannot read (${e.message})`), '{}')), errors) as Record<string, Command[]>;
    if (!v) continue;
    for (const k of Object.keys(v)) {
      if (events[k]) errors.push(`${p}: event "${k}" is already defined in another file`);
      events[k] = v[k];
    }
  }
  data.events = events;
  if (errors.length) throw new ValidationErrors(errors);
  const game = data as unknown as GameData;
  crossCheck(game, errors);
  if (errors.length) throw new ValidationErrors(errors);
  return game;
}

export function dialogueKeys(game: GameData): Set<string> {
  const s = new Set<string>();
  for (const l of Object.keys(game.lang)) for (const f of game.lang[l]) for (const k of Object.keys(f.dialogue)) s.add(k);
  return s;
}

export function stringKeys(game: GameData, lang = 'ru'): Set<string> {
  const s = new Set<string>();
  for (const f of game.lang[lang] ?? []) for (const k of Object.keys(f.strings)) s.add(k);
  return s;
}

export function crossCheck(g: GameData, errors: string[]): void {
  const has = <T>(rec: Record<string, T>, id: string | undefined, where: string, what: string): void => {
    if (id !== undefined && !(id in rec)) errors.push(`${where}: unknown ${what} "${id}"`);
  };
  for (const [k, rec] of Object.entries({ statuses: g.statuses, techniques: g.techniques, stances: g.stances, characters: g.characters, items: g.items, enemies: g.enemies, troops: g.troops, shops: g.shops, quests: g.quests, music: g.music, sfx: g.sfx } as Record<string, Record<string, { id: string }>>)) {
    for (const id of Object.keys(rec)) if (rec[id].id !== id) errors.push(`${k}.${id}: id field "${rec[id].id}" does not match key`);
  }
  const dlg = dialogueKeys(g);
  const strs = stringKeys(g);
  const condition = (src: string | undefined, where: string): void => {
    if (!src) return;
    try {
      compileExpr(src);
      for (const id of exprIdentifiers(src)) {
        const [ns, key] = id.split('.');
        if (ns === 'item' && key && !g.items[key]) errors.push(`${where}: condition references unknown item "${key}"`);
        if (ns === 'party' && key && !g.characters[key]) errors.push(`${where}: condition references unknown character "${key}"`);
        if (ns === 'quest' && key && !g.quests[key]) errors.push(`${where}: condition references unknown quest "${key}"`);
      }
    } catch (err) {
      errors.push(`${where}: ${(err as Error).message}`);
    }
  };
  const effects = (list: { type: string; id?: string; ids?: string[] }[], where: string): void => {
    list.forEach((e, i) => {
      if (e.type === 'status' || e.type === 'shield') has(g.statuses, e.id, `${where}.effects[${i}]`, 'status');
      for (const s of e.ids ?? []) has(g.statuses, s, `${where}.effects[${i}]`, 'status');
    });
  };
  for (const t of Object.values(g.techniques)) {
    if (!['enemy', 'item', 'sign', 'any'].includes(t.user)) has(g.characters, t.user, `techniques.${t.id}`, 'character');
    effects(t.effects, `techniques.${t.id}`);
    has(g.sfx, t.sfx, `techniques.${t.id}`, 'sfx');
    if (t.group && !g.stances[t.group] && !['earth', 'metal', 'chi', 'art', 'avatar', 'enemy', 'sign', 'fire'].includes(t.group)) errors.push(`techniques.${t.id}: unknown group "${t.group}"`);
    for (const a of t.after ?? []) has(g.statuses, a.status, `techniques.${t.id}.after`, 'status');
  }
  for (const c of Object.values(g.characters)) {
    has(g.looks, c.look, `characters.${c.id}`, 'look');
    for (const s of c.stances ?? []) has(g.stances, s, `characters.${c.id}`, 'stance');
    for (const slot of Object.keys(c.startEquip ?? {})) has(g.items, (c.startEquip as Record<string, string>)[slot], `characters.${c.id}.startEquip`, 'item');
    for (const f of c.limitForms ?? []) if (!g.avatarForms.find((a) => a.id === f)) errors.push(`characters.${c.id}: unknown avatar form "${f}"`);
  }
  for (const f of g.avatarForms) has(g.techniques, f.tech, `avatarForms.${f.id}`, 'technique');
  for (const it of Object.values(g.items)) {
    if (it.use) effects(it.use.effects, `items.${it.id}.use`);
    for (const w of it.equip?.who ?? []) has(g.characters, w, `items.${it.id}.equip.who`, 'character');
    for (const l of it.sign?.levels ?? []) has(g.techniques, l.tech, `items.${it.id}.sign`, 'technique');
    if (it.type === 'sign' && !it.sign) errors.push(`items.${it.id}: sign items need a "sign" block`);
    if (['weapon', 'armor', 'accessory'].includes(it.type) && !it.equip) errors.push(`items.${it.id}: equipment needs an "equip" block`);
    if (it.type === 'consumable' && !it.use) errors.push(`items.${it.id}: consumables need a "use" block`);
  }
  for (const e of Object.values(g.enemies)) {
    has(g.looks, e.look, `enemies.${e.id}`, 'look');
    if (e.fieldLook) has(g.looks, e.fieldLook, `enemies.${e.id}`, 'look');
    for (const d of [...(e.drops ?? []), ...(e.steal ?? []), ...(e.rare ? [e.rare] : [])]) has(g.items, d.item, `enemies.${e.id}`, 'item');
    const rules = [...e.ai, ...(e.phases ?? []).flatMap((p) => p.ai ?? [])];
    for (const r of rules) {
      if (!BUILTIN_ACTIONS.has(r.use)) has(g.techniques, r.use, `enemies.${e.id}.ai`, 'technique');
      condition(r.if, `enemies.${e.id}.ai(${r.use})`);
    }
    for (const p of e.phases ?? []) {
      condition(p.when, `enemies.${e.id}.phases`);
      if (p.look) has(g.looks, p.look, `enemies.${e.id}.phases`, 'look');
      if (p.say && !dlg.has(p.say)) errors.push(`enemies.${e.id}.phases: unknown dialogue "${p.say}"`);
    }
    if (!dlg.has(e.scan) && !strs.has(e.scan)) errors.push(`enemies.${e.id}: scan text "${e.scan}" is not in the language files`);
    for (const s of e.statusImmune ?? []) has(g.statuses, s, `enemies.${e.id}.statusImmune`, 'status');
  }
  for (const t of Object.values(g.troops)) {
    if (t.enemies.length > 4) errors.push(`troops.${t.id}: at most 4 enemies per battle`);
    for (const e of t.enemies) has(g.enemies, e.enemy, `troops.${t.id}`, 'enemy');
    if (t.music) has(g.music, t.music, `troops.${t.id}`, 'music track');
    if (t.intro && !dlg.has(t.intro)) errors.push(`troops.${t.id}: unknown dialogue "${t.intro}"`);
  }
  for (const s of Object.values(g.shops)) for (const it of s.stock) {
    has(g.items, it.item, `shops.${s.id}`, 'item');
    condition(it.if, `shops.${s.id}`);
  }
  for (const sp of Object.keys(g.speakers)) if (g.speakers[sp].look) has(g.looks, g.speakers[sp].look, `speakers.${sp}`, 'look');
  for (const n of g.world.nodes) {
    has(g.maps, n.map, `world.${n.id}`, 'map');
    if (g.maps[n.map] && !g.maps[n.map].spawns[n.spawn]) errors.push(`world.${n.id}: map ${n.map} has no spawn "${n.spawn}"`);
    condition(n.if, `world.${n.id}`);
  }
  for (const e of g.world.edges) {
    if (!g.world.nodes.find((n) => n.id === e.a)) errors.push(`world.edges: unknown node ${e.a}`);
    if (!g.world.nodes.find((n) => n.id === e.b)) errors.push(`world.edges: unknown node ${e.b}`);
    if (e.event) has(g.events, e.event, 'world.edges', 'event');
  }
  for (const r of g.radio) {
    if (!dlg.has(r.lines)) errors.push(`radio.${r.id}: unknown dialogue "${r.lines}"`);
    condition(r.if, `radio.${r.id}`);
  }
  const ptiles = new Set(g.paisho.tiles.map((t) => t.id));
  for (const t of g.paisho.starter) if (!ptiles.has(t)) errors.push(`paisho.starter: unknown tile ${t}`);
  for (const o of g.paisho.opponents) {
    for (const t of o.deck) if (!ptiles.has(t)) errors.push(`paisho.${o.id}.deck: unknown tile ${t}`);
    if (!ptiles.has(o.reward)) errors.push(`paisho.${o.id}.reward: unknown tile ${o.reward}`);
    has(g.looks, o.look, `paisho.${o.id}`, 'look');
  }
  for (const tr of Object.values(g.music)) for (const [i, ch] of tr.channels.entries()) if (!ch.notes && !ch.chords && !ch.drums) errors.push(`music.${tr.id}.channels[${i}]: needs notes, chords or drums`);
  const legend = g.tiles.legend;
  for (const [c, t] of Object.entries(legend)) if (!g.tiles.tiles[t]) errors.push(`tiles.legend['${c}']: unknown tile "${t}"`);
  const enemyFlags = new Set<string>();
  for (const m of Object.values(g.maps)) checkMap(g, m, errors, has, condition, enemyFlags);
  for (const id of Object.keys(g.events)) {
    checkCommands(g.events[id], `events.${id}`, errors, (name, cmd, path) => checkCommandRefs(g, name, cmd, path, errors, has, condition, dlg, strs));
  }
  if (!g.maps[g.manifest.startMap]) errors.push(`manifest.startMap: unknown map "${g.manifest.startMap}"`);
  else if (!g.maps[g.manifest.startMap].spawns[g.manifest.startSpawn]) errors.push(`manifest.startSpawn: "${g.manifest.startSpawn}" not found`);
  has(g.events, g.manifest.startEvent, 'manifest.startEvent', 'event');
  for (const q of Object.values(g.quests)) {
    for (const s of q.steps) if (!strs.has(s)) errors.push(`quests.${q.id}: step text "${s}" is not a string key`);
    if (!strs.has(q.reward)) errors.push(`quests.${q.id}: reward text "${q.reward}" is not a string key`);
  }
}

type Has = <T>(rec: Record<string, T>, id: string | undefined, where: string, what: string) => void;
type Cond = (src: string | undefined, where: string) => void;

function checkMap(g: GameData, m: MapDef, errors: string[], has: Has, condition: Cond, _enemyFlags: Set<string>): void {
  const where = `maps.${m.id}`;
  const legend = { ...g.tiles.legend, ...(m.legend ?? {}) };
  for (const [c, t] of Object.entries(m.legend ?? {})) if (!g.tiles.tiles[t]) errors.push(`${where}.legend['${c}']: unknown tile "${t}"`);
  for (const layer of ['ground', 'deco', 'over'] as const) {
    const rows = m.layers[layer];
    if (!rows) continue;
    if (rows.length !== m.h) errors.push(`${where}.layers.${layer}: has ${rows.length} rows, map height is ${m.h}`);
    rows.forEach((row, y) => {
      if (row.length !== m.w) errors.push(`${where}.layers.${layer}[${y}]: row length ${row.length}, map width is ${m.w}`);
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c === ' ' && layer !== 'ground') continue;
        if (!legend[c]) {
          errors.push(`${where}.layers.${layer}[${y}][${x}]: character '${c}' is not in the legend`);
          return;
        }
      }
    });
  }
  if (m.music) has(g.music, m.music, where, 'music track');
  if (m.onEnter) has(g.events, m.onEnter, where, 'event');
  if (!Object.keys(m.spawns).length) errors.push(`${where}: needs at least one spawn point`);
  for (const [sid, s] of Object.entries(m.spawns)) if (s.x < 0 || s.y < 0 || s.x >= m.w || s.y >= m.h) errors.push(`${where}.spawns.${sid}: outside the map`);
  const ids = new Set<string>();
  for (const e of m.entities) {
    const ew = `${where}.entities.${e.id}`;
    if (ids.has(e.id)) errors.push(`${ew}: duplicate entity id`);
    ids.add(e.id);
    if (e.x < 0 || e.y < 0 || e.x >= m.w || e.y >= m.h) errors.push(`${ew}: position ${e.x},${e.y} is outside the ${m.w}x${m.h} map`);
    if (e.look) has(g.looks, e.look, ew, 'look');
    if (e.event) has(g.events, e.event, ew, 'event');
    if (e.troop) has(g.troops, e.troop, ew, 'troop');
    if (e.item) has(g.items, e.item, ew, 'item');
    condition(e.if, ew);
    condition(e.solidIf, ew);
    if (e.kind === 'warp') {
      if (!e.to) errors.push(`${ew}: warp needs "to"`);
      else if (!g.maps[e.to.map]) errors.push(`${ew}: warp to unknown map "${e.to.map}"`);
      else if (!g.maps[e.to.map].spawns[e.to.spawn]) errors.push(`${ew}: map "${e.to.map}" has no spawn "${e.to.spawn}"`);
    }
    if (e.kind === 'enemy' && !e.troop) errors.push(`${ew}: enemy entity needs a troop`);
    if (e.kind === 'chest' && !e.item && e.gold === undefined) errors.push(`${ew}: chest needs item or gold`);
    if ((e.kind === 'npc' || e.kind === 'inspect' || e.kind === 'switch' || e.kind === 'vines') && !e.event && !e.script && !e.text) errors.push(`${ew}: needs an event, script or text`);
    if (e.kind === 'hazard' && !e.hazard) errors.push(`${ew}: hazard needs a "hazard" block`);
    if (e.hazard && !m.spawns[e.hazard.reset]) errors.push(`${ew}: hazard reset spawn "${e.hazard.reset}" not found`);
    if (e.script) checkCommands(e.script, `${ew}.script`, errors);
  }
  if (m.chase && !m.spawns[m.chase.fail]) has(g.events, m.chase.fail, `${where}.chase`, 'event');
}

function checkCommandRefs(g: GameData, name: string, cmd: Record<string, unknown>, path: string, errors: string[], has: Has, condition: Cond, dlg: Set<string>, strs: Set<string>): void {
  const s = (k: string) => cmd[k] as string;
  switch (name) {
    case 'talk':
      if (!dlg.has(s('talk'))) errors.push(`${path}: unknown dialogue "${s('talk')}"`);
      break;
    case 'choice':
      for (const k of cmd.choice as string[]) if (!strs.has(k) && !dlg.has(k)) errors.push(`${path}: unknown choice text "${k}"`);
      break;
    case 'if':
      condition(s('if'), path);
      break;
    case 'opt':
      condition(s('opt'), path);
      break;
    case 'give':
    case 'take':
      has(g.items, s(name), path, 'item');
      break;
    case 'battle':
      has(g.troops, s('battle'), path, 'troop');
      break;
    case 'music':
      if (s('music') !== 'stop') has(g.music, s('music'), path, 'music track');
      break;
    case 'sfx':
      has(g.sfx, s('sfx'), path, 'sfx');
      break;
    case 'warp':
      if (!g.maps[s('warp')]) errors.push(`${path}: unknown map "${s('warp')}"`);
      else if (!g.maps[s('warp')].spawns[s('spawn')]) errors.push(`${path}: map "${s('warp')}" has no spawn "${s('spawn')}"`);
      break;
    case 'actor':
      has(g.looks, s('look'), path, 'look');
      break;
    case 'join':
    case 'leave':
      has(g.characters, s(name), path, 'character');
      break;
    case 'shop':
      has(g.shops, s('shop'), path, 'shop');
      break;
    case 'paisho':
      if (!g.paisho.opponents.find((o) => o.id === s('paisho'))) errors.push(`${path}: unknown Pai Sho opponent "${s('paisho')}"`);
      break;
    case 'title':
      if (!strs.has(s('title'))) errors.push(`${path}: unknown string "${s('title')}"`);
      if (cmd.sub && !strs.has(s('sub'))) errors.push(`${path}: unknown string "${s('sub')}"`);
      break;
    case 'caption':
      if (!strs.has(s('caption'))) errors.push(`${path}: unknown string "${s('caption')}"`);
      break;
    case 'quest':
      has(g.quests, s('quest'), path, 'quest');
      if (g.quests[s('quest')] && ((cmd.step as number) < 1 || (cmd.step as number) > g.quests[s('quest')].steps.length + 1)) errors.push(`${path}: quest step out of range (1..${g.quests[s('quest')].steps.length + 1})`);
      break;
    case 'learn':
      has(g.characters, s('learn'), path, 'character');
      has(g.techniques, s('tech'), path, 'technique');
      break;
    case 'worldmap':
      if (!g.world.nodes.find((n) => n.id === s('worldmap'))) errors.push(`${path}: unknown world node "${s('worldmap')}"`);
      break;
    case 'call':
      has(g.events, s('call'), path, 'event');
      break;
    case 'pose':
      break;
    case 'restore':
      break;
    case 'level':
      has(g.characters, s('level'), path, 'character');
      break;
    case 'limit':
      has(g.characters, s('limit'), path, 'character');
      break;
  }
}
