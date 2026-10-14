export type Shape =
  | 'string'
  | 'number'
  | 'boolean'
  | 'any'
  | 'string?'
  | 'number?'
  | 'boolean?'
  | 'any?'
  | { enum: readonly string[]; optional?: boolean }
  | { array: Shape; optional?: boolean; min?: number }
  | { record: Shape; optional?: boolean }
  | { object: Record<string, Shape>; optional?: boolean; strict?: boolean }
  | { tuple: Shape[]; optional?: boolean };

export class ValidationErrors extends Error {
  list: string[];
  constructor(list: string[]) {
    super(`Avatar 98 data validation failed (${list.length} problem${list.length === 1 ? '' : 's'}):\n  - ${list.slice(0, 40).join('\n  - ')}${list.length > 40 ? `\n  ... and ${list.length - 40} more` : ''}`);
    this.list = list;
  }
}

const describe = (v: unknown): string => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function isOptional(s: Shape): boolean {
  if (typeof s === 'string') return s.endsWith('?');
  return !!s.optional;
}

export function check(value: unknown, shape: Shape, path: string, errors: string[]): void {
  if (value === undefined) {
    if (!isOptional(shape)) errors.push(`${path}: missing required value`);
    return;
  }
  if (typeof shape === 'string') {
    const base = shape.replace('?', '');
    if (base === 'any') return;
    if (typeof value !== base) errors.push(`${path}: expected ${base}, got ${describe(value)}`);
    else if (base === 'number' && !Number.isFinite(value as number)) errors.push(`${path}: number is not finite`);
    return;
  }
  if ('enum' in shape) {
    if (typeof value !== 'string' || !shape.enum.includes(value)) errors.push(`${path}: expected one of [${shape.enum.join(', ')}], got ${JSON.stringify(value)}`);
    return;
  }
  if ('array' in shape) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array, got ${describe(value)}`);
      return;
    }
    if (shape.min !== undefined && value.length < shape.min) errors.push(`${path}: expected at least ${shape.min} entries, got ${value.length}`);
    value.forEach((v, i) => check(v, shape.array, `${path}[${i}]`, errors));
    return;
  }
  if ('tuple' in shape) {
    if (!Array.isArray(value) || value.length !== shape.tuple.length) {
      errors.push(`${path}: expected tuple of ${shape.tuple.length}`);
      return;
    }
    shape.tuple.forEach((s, i) => check(value[i], s, `${path}[${i}]`, errors));
    return;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${path}: expected object, got ${describe(value)}`);
    return;
  }
  const obj = value as Record<string, unknown>;
  if ('record' in shape) {
    for (const k of Object.keys(obj)) check(obj[k], shape.record, `${path}.${k}`, errors);
    return;
  }
  for (const k of Object.keys(shape.object)) check(obj[k], shape.object[k], `${path}.${k}`, errors);
  if (shape.strict) for (const k of Object.keys(obj)) if (!(k in shape.object)) errors.push(`${path}: unknown field "${k}"`);
}

const opt = <T extends Shape>(s: T): T => ({ ...(s as object), optional: true }) as T;

const ELEMENT = { enum: ['phys', 'fire', 'earth', 'metal', 'chi', 'spirit'] } as const;
const ELEM_MAP: Shape = { record: 'number', optional: true };
const STATS: Shape = { object: { hp: 'number', mp: 'number', atk: 'number', def: 'number', mag: 'number', res: 'number', spd: 'number', lck: 'number' }, strict: true };
const PSTATS: Shape = { object: { hp: 'number?', mp: 'number?', atk: 'number?', def: 'number?', mag: 'number?', res: 'number?', spd: 'number?', lck: 'number?' }, strict: true, optional: true };
const TARGET = { enum: ['enemy', 'enemies', 'ally', 'allies', 'self', 'ally_dead', 'all'] } as const;
const PASSIVE: Shape = { object: { id: 'string', value: 'number?', element: opt(ELEMENT), status: 'string?' }, strict: true };

export const EFFECT: Shape = {
  object: {
    type: { enum: ['damage', 'heal', 'status', 'cure', 'revive', 'mp', 'steal', 'opora', 'limit', 'escape', 'shield', 'scan', 'atb'] },
    element: opt(ELEMENT),
    power: 'number?',
    stat: { enum: ['atk', 'mag'], optional: true },
    fixed: 'number?',
    pct: 'number?',
    id: 'string?',
    ids: { array: 'string', optional: true },
    chance: 'number?',
    turns: 'number?',
    hits: 'number?',
    amount: 'number?',
    pierce: 'boolean?',
    drain: 'boolean?',
    self: 'boolean?',
    to: { enum: ['enemies', 'allies', 'self'], optional: true }
  },
  strict: true
};

export const SCHEMAS: Record<string, Shape> = {
  statuses: {
    record: {
      object: {
        id: 'string', name: 'string', icon: 'string', color: 'string', turns: 'number', negative: 'boolean', tickDamagePct: 'number?', tickElement: opt(ELEMENT), skipTurn: 'boolean?', atbMul: 'number?', blockTech: 'boolean?', accMul: 'number?', statMul: PSTATS, techPowerMul: 'number?', consumeOnTech: 'boolean?', blockLimit: 'boolean?', breakOnHit: 'boolean?'
      },
      strict: true
    }
  },
  techniques: {
    record: {
      object: {
        id: 'string', name: 'string', desc: 'string', user: 'string', group: 'string?',
        learn: { object: { level: 'number?', flag: 'string?' }, strict: true, optional: true },
        cost: { object: { mp: 'number?', opora: 'number?' }, strict: true, optional: true },
        requires: { object: { opora: 'number?' }, strict: true, optional: true },
        target: TARGET, effects: { array: EFFECT, min: 1 }, fx: 'string', sfx: 'string', anim: { enum: ['strike', 'cast', 'throw', 'dash'], optional: true }, battleOnly: 'boolean?', field: 'boolean?', limit: 'boolean?',
        after: { array: { object: { status: 'string', turns: 'number', self: 'boolean' }, strict: true }, optional: true }
      },
      strict: true
    }
  },
  stances: { record: { object: { id: 'string', name: 'string', desc: 'string', color: 'string', statMul: PSTATS }, strict: true } },
  characters: {
    record: {
      object: {
        id: 'string', name: 'string', look: 'string', combat: 'boolean', role: 'string', base: STATS, growth: STATS, weaponType: 'string?',
        startEquip: { record: 'string', optional: true }, stances: { array: 'string', optional: true }, resource: { enum: ['opora'], optional: true }, resourceMax: 'number?', speedMul: 'number?', limitForms: { array: 'string', optional: true }, passives: { array: PASSIVE, optional: true }, signSlots: 'number?', bio: 'string'
      },
      strict: true
    }
  },
  items: {
    record: {
      object: {
        id: 'string', type: { enum: ['consumable', 'weapon', 'armor', 'accessory', 'sign', 'key'] }, name: 'string', desc: 'string', price: 'number', icon: 'string', unique: 'boolean?',
        use: { object: { target: TARGET, battle: 'boolean', field: 'boolean', effects: { array: EFFECT, min: 1 }, fx: 'string?', sfx: 'string?' }, strict: true, optional: true },
        equip: { object: { who: { array: 'string', optional: true }, stats: PSTATS, elem: ELEM_MAP, passives: { array: PASSIVE, optional: true }, statusImmune: { array: 'string', optional: true } }, strict: true, optional: true },
        sign: { object: { levels: { array: { object: { exp: 'number', stats: PSTATS, passives: { array: PASSIVE, optional: true }, tech: 'string?' }, strict: true }, min: 1 } }, strict: true, optional: true }
      },
      strict: true
    }
  },
  enemies: {
    record: {
      object: {
        id: 'string', name: 'string', families: { array: 'string' }, level: 'number', stats: STATS, exp: 'number', gold: 'number',
        drops: { array: { object: { item: 'string', chance: 'number' }, strict: true }, optional: true },
        steal: { array: { object: { item: 'string', chance: 'number' }, strict: true }, optional: true },
        rare: { object: { item: 'string', chance: 'number' }, strict: true, optional: true },
        elem: ELEM_MAP, statusImmune: { array: 'string', optional: true }, look: 'string', fieldLook: 'string?', boss: 'boolean?', scan: 'string',
        ai: { array: { object: { use: 'string', weight: 'number', if: 'string?', target: { enum: ['random', 'weakest', 'strongest', 'self', 'lowest_hp_ally', 'caster', 'no_status'], optional: true }, once: 'boolean?', every: 'number?' }, strict: true }, min: 1 },
        phases: { array: { object: { when: 'string', name: 'string?', elem: ELEM_MAP, statMul: PSTATS, ai: { array: 'any', optional: true }, look: 'string?', say: 'string?', flash: 'string?' }, strict: true }, optional: true }
      },
      strict: true
    }
  },
  troops: {
    record: {
      object: { id: 'string', enemies: { array: { object: { enemy: 'string', x: 'number?', y: 'number?' }, strict: true }, min: 1 }, music: 'string?', bg: 'string', escape: 'boolean', tutorial: 'string?', loseOk: 'boolean?', intro: 'string?', preemptive: 'boolean?' },
      strict: true
    }
  },
  looks: { record: { object: { kind: 'string' } } },
  tiles: {
    object: {
      legend: { record: 'string' },
      tiles: { record: { object: { gen: 'string', c: { array: 'string', optional: true }, solid: 'boolean?', over: 'boolean?', anim: 'number?', water: 'boolean?', v: 'number?', light: 'string?' }, strict: true } }
    },
    strict: true
  },
  shops: { record: { object: { id: 'string', name: 'string', keeper: 'string', stock: { array: { object: { item: 'string', if: 'string?' }, strict: true } } }, strict: true } },
  quests: { record: { object: { id: 'string', name: 'string', giver: 'string', region: 'string', steps: { array: 'string', min: 1 }, reward: 'string' }, strict: true } },
  world: {
    object: {
      nodes: { array: { object: { id: 'string', name: 'string', x: 'number', y: 'number', map: 'string', spawn: 'string', if: 'string?', desc: 'string' }, strict: true } },
      edges: { array: { object: { a: 'string', b: 'string', if: 'string?', event: 'string?' }, strict: true } }
    },
    strict: true
  },
  music: {
    record: {
      object: {
        id: 'string', name: 'string', bpm: 'number', steps: 'number', swing: 'number?', echo: 'number?',
        channels: { array: { object: { inst: 'string', vol: 'number', notes: 'string?', chords: 'string?', pattern: 'string?', drums: 'string?', octave: 'number?', pan: 'number?' }, strict: true }, min: 1 }
      },
      strict: true
    }
  },
  sfx: {
    record: {
      object: { id: 'string', wave: { enum: ['square', 'triangle', 'sawtooth', 'sine', 'noise'] }, f0: 'number', f1: 'number', dur: 'number', vol: 'number', duty: 'number?', vib: 'number?', steps: { array: 'number', optional: true }, attack: 'number?', noiseMix: 'number?', delay: 'number?', layer: 'string?' },
      strict: true
    }
  },
  paisho: {
    object: {
      tiles: { array: { object: { id: 'string', name: 'string', element: { enum: ['fire', 'water', 'earth', 'air', 'lotus'] }, value: 'number', rarity: 'number' }, strict: true }, min: 1 },
      starter: { array: 'string', min: 1 },
      opponents: { array: { object: { id: 'string', name: 'string', look: 'string', deck: { array: 'string' }, reward: 'string', skill: 'number', flag: 'string' }, strict: true } },
      rules: { object: { handSize: 'number', rounds: 'number', winsNeeded: 'number', advantage: 'number', beats: { record: 'string' } }, strict: true }
    },
    strict: true
  },
  radio: { array: { object: { id: 'string', freq: 'number', name: 'string', lines: 'string', region: 'string', if: 'string?', flag: 'string' }, strict: true } },
  avatarForms: { array: { object: { id: 'string', name: 'string', desc: 'string', tech: 'string', unlocked: 'string' }, strict: true } },
  chapters: { array: { object: { id: 'string', name: 'string', flag: 'string?', next: 'string?' }, strict: true } },
  elements: { object: { families: { record: { record: 'number' } }, names: { record: 'string' } }, strict: true },
  speakers: { record: { object: { name: 'string', look: 'string?' }, strict: true } },
  font: { object: { height: 'number', base: 'number', glyphs: { record: { array: 'string' } } }, strict: true },
  progression: { object: { expBase: 'number', expPow: 'number', expLinear: 'number', reserveExpShare: 'number', signExpPerBattle: 'number' }, strict: true }
};

const DIR = { enum: ['up', 'down', 'left', 'right'], optional: true } as const;

export const ENTITY: Shape = {
  object: {
    id: 'string',
    kind: { enum: ['npc', 'chest', 'warp', 'trigger', 'enemy', 'inspect', 'switch', 'shrine', 'vines', 'hazard', 'prop', 'hidden', 'door'] },
    x: 'number', y: 'number', w: 'number?', h: 'number?', look: 'string?', dir: DIR, if: 'string?', solid: 'boolean?', solidIf: 'string?', event: 'string?', script: { array: 'any', optional: true }, touch: 'boolean?',
    move: { object: { type: { enum: ['wander', 'patrol', 'still', 'turn'] }, path: { array: { tuple: ['number', 'number'] }, optional: true }, speed: 'number?', radius: 'number?', wait: 'number?' }, strict: true, optional: true },
    troop: 'string?', chase: 'number?', once: 'string?',
    to: { object: { map: 'string', spawn: 'string', dir: DIR }, strict: true, optional: true },
    item: 'string?', count: 'number?', gold: 'number?',
    hazard: { object: { type: { enum: ['steam', 'spark', 'searchlight', 'crumble'] }, period: 'number', on: 'number', phase: 'number', reset: 'string' }, strict: true, optional: true },
    z: 'number?', frame: 'string?', text: 'string?', secret: 'string?'
  },
  strict: true
};

export const MAP: Shape = {
  object: {
    id: 'string', name: 'string', w: 'number', h: 'number', music: 'string', region: 'string', bg: 'string', battleBg: 'string?', dark: 'number?', night: 'boolean?',
    legend: { record: 'string', optional: true },
    layers: { object: { ground: { array: 'string' }, deco: { array: 'string', optional: true }, over: { array: 'string', optional: true } }, strict: true },
    spawns: { record: { object: { x: 'number', y: 'number', dir: DIR }, strict: true } },
    entities: { array: ENTITY },
    onEnter: 'string?', radio: 'boolean?',
    chase: { object: { timer: 'number', fail: 'string' }, strict: true, optional: true },
    source: 'string?'
  },
  strict: true
};

export interface CommandSpec {
  args: Record<string, Shape>;
}

const CMDS = (): Record<string, Record<string, Shape>> => ({
  talk: { talk: 'string' },
  choice: { choice: { array: 'string', min: 2 }, branches: { array: { array: 'any' } } },
  flag: { flag: 'string' },
  unflag: { unflag: 'string' },
  set: { set: { record: 'number' } },
  add: { add: { record: 'number' } },
  if: { if: 'string', then: { array: 'any' }, else: { array: 'any', optional: true } },
  give: { give: 'string', count: 'number?', silent: 'boolean?' },
  take: { take: 'string', count: 'number?', silent: 'boolean?' },
  gold: { gold: 'number', silent: 'boolean?' },
  battle: { battle: 'string', lose: { array: 'any', optional: true }, win: { array: 'any', optional: true } },
  fade: { fade: { enum: ['in', 'out'] }, frames: 'number?', color: 'string?' },
  shake: { shake: 'number', power: 'number?' },
  music: { music: 'string', fade: 'number?' },
  sfx: { sfx: 'string' },
  move: { move: 'string', path: 'string', speed: 'number?', wait: 'boolean?', face: 'string?' },
  face: { face: 'string', dir: { enum: ['up', 'down', 'left', 'right', 'player', 'away'] } },
  wait: { wait: 'number' },
  warp: { warp: 'string', spawn: 'string', dir: DIR, fade: 'boolean?' },
  show: { show: 'string' },
  hide: { hide: 'string' },
  actor: { actor: 'string', look: 'string', x: 'number', y: 'number', dir: DIR },
  remove: { remove: 'string' },
  camera: { camera: 'any', frames: 'number?' },
  emote: { emote: 'string', icon: { enum: ['!', '?', '...', 'heart', 'anger', 'note', 'sweat', 'idea'] } },
  trust: { trust: { record: 'number' } },
  join: { join: 'string' },
  leave: { leave: 'string' },
  heal: { heal: 'string' },
  shop: { shop: 'string' },
  inn: { inn: 'number' },
  save: { save: 'boolean' },
  paisho: { paisho: 'string', win: { array: 'any', optional: true }, lose: { array: 'any', optional: true } },
  title: { title: 'string', sub: 'string?', frames: 'number?' },
  caption: { caption: 'string', frames: 'number?' },
  flash: { flash: 'string', frames: 'number?' },
  tint: { tint: 'string', alpha: 'number?' },
  letterbox: { letterbox: 'boolean' },
  quest: { quest: 'string', step: 'number' },
  learn: { learn: 'string', tech: 'string' },
  fx: { fx: 'string', at: 'string', dx: 'number?', dy: 'number?' },
  worldmap: { worldmap: 'string' },
  radio: { radio: 'boolean' },
  ending: { ending: 'string' },
  call: { call: 'string' },
  name: { name: 'boolean' },
  secret: { secret: 'string' },
  pose: { pose: 'string', as: 'string' },
  chase: { chase: { enum: ['start', 'stop'] } },
  pipo: { pipo: { enum: ['follow', 'hide', 'show'] } },
  gameover: { gameover: 'boolean' },
  restore: { restore: 'string' },
  avatar: { avatar: { enum: ['on', 'off'] }, at: 'string?' },
  vision: { vision: { enum: ['on', 'off'] } },
  spawnpoint: { spawnpoint: 'string' },
  opt: { opt: 'string', then: { array: 'any' } },
  stat: { stat: 'string' },
  limit: { limit: 'string', amount: 'number' },
  level: { level: 'string', to: 'number' },
  cleansave: { cleansave: 'boolean' }
});

export const COMMANDS = CMDS();

export function commandName(cmd: Record<string, unknown>): string | null {
  for (const k of Object.keys(cmd)) if (k in COMMANDS) return k;
  return null;
}

export function checkCommands(cmds: unknown, path: string, errors: string[], visit?: (name: string, cmd: Record<string, unknown>, path: string) => void): void {
  if (!Array.isArray(cmds)) {
    errors.push(`${path}: expected a list of commands`);
    return;
  }
  cmds.forEach((raw, i) => {
    const p = `${path}[${i}]`;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      errors.push(`${p}: command must be an object`);
      return;
    }
    const cmd = raw as Record<string, unknown>;
    const name = commandName(cmd);
    if (!name) {
      errors.push(`${p}: unknown command ${JSON.stringify(Object.keys(cmd))}`);
      return;
    }
    const spec = COMMANDS[name];
    check(cmd, { object: spec, strict: true }, `${p}<${name}>`, errors);
    if (visit) visit(name, cmd, p);
    if (name === 'if') {
      checkCommands(cmd.then, `${p}.then`, errors, visit);
      if (cmd.else !== undefined) checkCommands(cmd.else, `${p}.else`, errors, visit);
    }
    if (name === 'choice' && Array.isArray(cmd.branches)) {
      if (Array.isArray(cmd.choice) && cmd.branches.length !== cmd.choice.length) errors.push(`${p}: choice has ${cmd.choice.length} options but ${cmd.branches.length} branches`);
      cmd.branches.forEach((b, j) => checkCommands(b, `${p}.branches[${j}]`, errors, visit));
    }
    for (const k of ['win', 'lose', 'then'] as const) if (name !== 'if' && Array.isArray(cmd[k])) checkCommands(cmd[k], `${p}.${k}`, errors, visit);
  });
}
