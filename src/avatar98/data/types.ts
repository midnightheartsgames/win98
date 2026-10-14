export type Element = 'phys' | 'fire' | 'earth' | 'metal' | 'chi' | 'spirit';
export type StatKey = 'hp' | 'mp' | 'atk' | 'def' | 'mag' | 'res' | 'spd' | 'lck';
export type Stats = Record<StatKey, number>;
export type PartialStats = Partial<Stats>;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type TargetKind = 'enemy' | 'enemies' | 'ally' | 'allies' | 'self' | 'ally_dead' | 'all';

export interface Manifest {
  version: number;
  title: string;
  startMap: string;
  startSpawn: string;
  startEvent: string;
  data: Record<string, string>;
  lang: Record<string, string[]>;
  maps: string[];
  events: string[];
}

export interface StatusDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  turns: number;
  negative: boolean;
  tickDamagePct?: number;
  tickElement?: Element;
  skipTurn?: boolean;
  atbMul?: number;
  blockTech?: boolean;
  accMul?: number;
  statMul?: PartialStats;
  techPowerMul?: number;
  consumeOnTech?: boolean;
  blockLimit?: boolean;
  breakOnHit?: boolean;
}

export interface EffectDef {
  type: 'damage' | 'heal' | 'status' | 'cure' | 'revive' | 'mp' | 'steal' | 'opora' | 'limit' | 'escape' | 'shield' | 'scan' | 'atb';
  element?: Element;
  power?: number;
  stat?: 'atk' | 'mag';
  fixed?: number;
  pct?: number;
  id?: string;
  ids?: string[];
  chance?: number;
  turns?: number;
  hits?: number;
  amount?: number;
  pierce?: boolean;
  drain?: boolean;
  self?: boolean;
  to?: 'enemies' | 'allies' | 'self';
}

export interface TechniqueDef {
  id: string;
  name: string;
  desc: string;
  user: string;
  group?: string;
  learn?: { level?: number; flag?: string };
  cost?: { mp?: number; opora?: number };
  requires?: { opora?: number };
  target: TargetKind;
  effects: EffectDef[];
  fx: string;
  sfx: string;
  anim?: 'strike' | 'cast' | 'throw' | 'dash';
  battleOnly?: boolean;
  field?: boolean;
  limit?: boolean;
  after?: { status: string; turns: number; self: boolean }[];
}

export interface StanceDef {
  id: string;
  name: string;
  desc: string;
  color: string;
  statMul?: PartialStats;
}

export interface CharacterDef {
  id: string;
  name: string;
  look: string;
  combat: boolean;
  role: string;
  base: Stats;
  growth: Stats;
  weaponType?: string;
  startEquip?: Partial<Record<EquipSlot, string>>;
  stances?: string[];
  resource?: 'opora';
  resourceMax?: number;
  speedMul?: number;
  limitForms?: string[];
  passives?: PassiveDef[];
  signSlots?: number;
  bio: string;
}

export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export interface PassiveDef {
  id: string;
  value?: number;
  element?: Element;
  status?: string;
}

export interface SignLevel {
  exp: number;
  stats?: PartialStats;
  passives?: PassiveDef[];
  tech?: string;
}

export interface ItemDef {
  id: string;
  type: 'consumable' | 'weapon' | 'armor' | 'accessory' | 'sign' | 'key';
  name: string;
  desc: string;
  price: number;
  icon: string;
  use?: { target: TargetKind; battle: boolean; field: boolean; effects: EffectDef[]; fx?: string; sfx?: string };
  equip?: { who?: string[]; stats?: PartialStats; elem?: Partial<Record<Element, number>>; passives?: PassiveDef[]; statusImmune?: string[] };
  sign?: { levels: SignLevel[] };
  unique?: boolean;
}

export interface AiRule {
  use: string;
  weight: number;
  if?: string;
  target?: 'random' | 'weakest' | 'strongest' | 'self' | 'lowest_hp_ally' | 'caster' | 'no_status';
  once?: boolean;
  every?: number;
}

export interface EnemyPhase {
  when: string;
  name?: string;
  elem?: Partial<Record<Element, number>>;
  statMul?: PartialStats;
  ai?: AiRule[];
  look?: string;
  say?: string;
  flash?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  families: string[];
  level: number;
  stats: Stats;
  exp: number;
  gold: number;
  drops?: { item: string; chance: number }[];
  steal?: { item: string; chance: number }[];
  rare?: { item: string; chance: number };
  elem?: Partial<Record<Element, number>>;
  statusImmune?: string[];
  look: string;
  ai: AiRule[];
  phases?: EnemyPhase[];
  boss?: boolean;
  scan: string;
  fieldLook?: string;
}

export interface TroopDef {
  id: string;
  enemies: { enemy: string; x?: number; y?: number }[];
  music?: string;
  bg: string;
  escape: boolean;
  tutorial?: string;
  loseOk?: boolean;
  intro?: string;
  preemptive?: boolean;
}

export interface LookDef {
  kind: string;
  [k: string]: unknown;
}

export interface TileDef {
  gen: string;
  c?: string[];
  solid?: boolean;
  over?: boolean;
  anim?: number;
  water?: boolean;
  v?: number;
  light?: string;
}

export interface TilesData {
  legend: Record<string, string>;
  tiles: Record<string, TileDef>;
}

export interface EntityDef {
  id: string;
  kind: 'npc' | 'chest' | 'warp' | 'trigger' | 'enemy' | 'inspect' | 'switch' | 'shrine' | 'vines' | 'hazard' | 'prop' | 'hidden' | 'door';
  x: number;
  y: number;
  w?: number;
  h?: number;
  look?: string;
  dir?: Dir;
  if?: string;
  solid?: boolean;
  solidIf?: string;
  event?: string;
  script?: Command[];
  touch?: boolean;
  move?: { type: 'wander' | 'patrol' | 'still' | 'turn'; path?: [number, number][]; speed?: number; radius?: number; wait?: number };
  troop?: string;
  chase?: number;
  once?: string;
  to?: { map: string; spawn: string; dir?: Dir };
  item?: string;
  count?: number;
  gold?: number;
  hazard?: { type: 'steam' | 'spark' | 'searchlight' | 'crumble'; period: number; on: number; phase: number; reset: string };
  z?: number;
  frame?: string;
  text?: string;
  secret?: string;
}

export interface MapDef {
  id: string;
  name: string;
  w: number;
  h: number;
  music: string;
  region: string;
  bg: string;
  battleBg?: string;
  dark?: number;
  night?: boolean;
  legend?: Record<string, string>;
  layers: { ground: string[]; deco?: string[]; over?: string[] };
  spawns: Record<string, { x: number; y: number; dir?: Dir }>;
  entities: EntityDef[];
  onEnter?: string;
  radio?: boolean;
  chase?: { timer: number; fail: string };
  source?: string;
}

export type Command = Record<string, unknown>;

export interface ShopDef {
  id: string;
  name: string;
  keeper: string;
  stock: { item: string; if?: string }[];
}

export interface QuestDef {
  id: string;
  name: string;
  giver: string;
  region: string;
  steps: string[];
  reward: string;
}

export interface WorldNode {
  id: string;
  name: string;
  x: number;
  y: number;
  map: string;
  spawn: string;
  if?: string;
  desc: string;
}

export interface WorldData {
  nodes: WorldNode[];
  edges: { a: string; b: string; if?: string; event?: string }[];
}

export interface MusicTrack {
  id: string;
  name: string;
  bpm: number;
  steps: number;
  swing?: number;
  channels: MusicChannel[];
  echo?: number;
}

export interface MusicChannel {
  inst: string;
  vol: number;
  notes?: string;
  chords?: string;
  pattern?: string;
  drums?: string;
  octave?: number;
  pan?: number;
}

export interface SfxDef {
  id: string;
  wave: 'square' | 'triangle' | 'sawtooth' | 'sine' | 'noise';
  f0: number;
  f1: number;
  dur: number;
  vol: number;
  duty?: number;
  vib?: number;
  steps?: number[];
  attack?: number;
  noiseMix?: number;
  delay?: number;
  layer?: string;
}

export interface PaiShoTile {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'earth' | 'air' | 'lotus';
  value: number;
  rarity: number;
}

export interface PaiShoData {
  tiles: PaiShoTile[];
  starter: string[];
  opponents: { id: string; name: string; look: string; deck: string[]; reward: string; skill: number; flag: string }[];
  rules: { handSize: number; rounds: number; winsNeeded: number; advantage: number; beats: Record<string, string> };
}

export interface RadioStation {
  id: string;
  freq: number;
  name: string;
  lines: string;
  region: string;
  if?: string;
  flag: string;
}

export interface AvatarFormDef {
  id: string;
  name: string;
  desc: string;
  tech: string;
  unlocked: string;
}

export interface ChapterDef {
  id: string;
  name: string;
  flag?: string;
  next?: string;
}

export interface GameData {
  manifest: Manifest;
  statuses: Record<string, StatusDef>;
  techniques: Record<string, TechniqueDef>;
  stances: Record<string, StanceDef>;
  characters: Record<string, CharacterDef>;
  items: Record<string, ItemDef>;
  enemies: Record<string, EnemyDef>;
  troops: Record<string, TroopDef>;
  looks: Record<string, LookDef>;
  tiles: TilesData;
  maps: Record<string, MapDef>;
  events: Record<string, Command[]>;
  shops: Record<string, ShopDef>;
  quests: Record<string, QuestDef>;
  world: WorldData;
  music: Record<string, MusicTrack>;
  sfx: Record<string, SfxDef>;
  paisho: PaiShoData;
  radio: RadioStation[];
  avatarForms: AvatarFormDef[];
  chapters: ChapterDef[];
  elements: { families: Record<string, Partial<Record<Element, number>>>; names: Record<string, string> };
  speakers: Record<string, { name: string; look?: string }>;
  lang: Record<string, { strings: Record<string, string>; dialogue: Record<string, string[] | string> }[]>;
  font: FontData;
  progression: { expBase: number; expPow: number; expLinear: number; reserveExpShare: number; signExpPerBattle: number };
}

export interface FontData {
  height: number;
  base: number;
  glyphs: Record<string, string[]>;
}
