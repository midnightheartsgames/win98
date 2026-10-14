import type { CharacterDef, Dir, EquipSlot, GameData, ItemDef, PassiveDef, Stats, StatKey, TechniqueDef } from '../data/types.ts';
import { MAX_LEVEL, MAX_PARTY_ACTIVE, SAVE_VERSION } from '../config.ts';
import { evalExpr, type ExprValue } from '../core/expr.ts';

export const STAT_KEYS: StatKey[] = ['hp', 'mp', 'atk', 'def', 'mag', 'res', 'spd', 'lck'];
export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'armor', 'accessory'];

export interface CharState {
  id: string;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  equip: Partial<Record<EquipSlot, string>>;
  signs: (string | null)[];
  limit: number;
  forms: string[];
}

export interface SaveData {
  v: number;
  chapter: string;
  name: string;
  party: string[];
  roster: Record<string, CharState>;
  items: Record<string, number>;
  signExp: Record<string, number>;
  gold: number;
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  trust: Record<string, number>;
  quests: Record<string, number>;
  paisho: { tiles: Record<string, number>; deck: string[]; beaten: string[] };
  radio: string[];
  map: { id: string; x: number; y: number; dir: Dir };
  node: string;
  playtime: number;
  stats: { battles: number; wins: number; escapes: number; steps: number; secrets: string[]; chests: number; defeats: number; paishoGames: number };
  opened: string[];
  visited: string[];
  pipo: boolean;
  clean: boolean;
  savedAt: number;
}

export interface LevelUp {
  id: string;
  from: number;
  to: number;
  learned: string[];
}

export class Game {
  readonly data: GameData;
  s: SaveData;

  constructor(data: GameData, save?: SaveData) {
    this.data = data;
    this.s = save ? migrate(save) : this.fresh();
  }

  fresh(): SaveData {
    const m = this.data.manifest;
    const spawn = this.data.maps[m.startMap].spawns[m.startSpawn];
    const s: SaveData = {
      v: SAVE_VERSION,
      chapter: this.data.chapters[0]?.id ?? 'ch1',
      name: 'Иса',
      party: [],
      roster: {},
      items: {},
      signExp: {},
      gold: 0,
      flags: {},
      vars: {},
      trust: { tao: 0, miri: 0, pipo: 0 },
      quests: {},
      paisho: { tiles: {}, deck: [], beaten: [] },
      radio: [],
      map: { id: m.startMap, x: spawn.x, y: spawn.y, dir: spawn.dir ?? 'down' },
      node: '',
      playtime: 0,
      stats: { battles: 0, wins: 0, escapes: 0, steps: 0, secrets: [], chests: 0, defeats: 0, paishoGames: 0 },
      opened: [],
      visited: [],
      pipo: false,
      clean: false,
      savedAt: 0
    };
    this.s = s;
    for (const t of this.data.paisho.starter) s.paisho.tiles[t] = (s.paisho.tiles[t] ?? 0) + 1;
    s.paisho.deck = [...this.data.paisho.starter];
    this.join('isa', 1);
    return s;
  }

  char(id: string): CharacterDef {
    const c = this.data.characters[id];
    if (!c) throw new Error(`unknown character "${id}"`);
    return c;
  }

  cs(id: string): CharState {
    const c = this.s.roster[id];
    if (!c) throw new Error(`character "${id}" is not in the roster`);
    return c;
  }

  join(id: string, level?: number): void {
    const def = this.char(id);
    if (!this.s.roster[id]) {
      const lvl = level ?? Math.max(1, Math.round(this.averageLevel()));
      const st: CharState = { id, level: lvl, exp: this.expFor(lvl), hp: 1, mp: 0, equip: {}, signs: [], limit: 0, forms: [...(def.limitForms ?? []).slice(0, 1)] };
      for (const slot of EQUIP_SLOTS) {
        const it = def.startEquip?.[slot];
        if (it) st.equip[slot] = it;
      }
      st.signs = Array.from({ length: this.signSlots(def, lvl) }, () => null);
      this.s.roster[id] = st;
      const stats = this.stats(id);
      st.hp = stats.hp;
      st.mp = stats.mp;
    }
    if (def.combat && !this.s.party.includes(id) && this.s.party.length < MAX_PARTY_ACTIVE) this.s.party.push(id);
  }

  leave(id: string): void {
    this.s.party = this.s.party.filter((p) => p !== id);
  }

  averageLevel(): number {
    const ids = this.s.party.length ? this.s.party : Object.keys(this.s.roster);
    if (!ids.length) return 1;
    return ids.reduce((a, id) => a + this.s.roster[id].level, 0) / ids.length;
  }

  signSlots(def: CharacterDef, level: number): number {
    return Math.min(4, (def.signSlots ?? 2) + Math.floor(level / 10));
  }

  expFor(level: number): number {
    const p = this.data.progression;
    if (level <= 1) return 0;
    return Math.floor(p.expBase * Math.pow(level - 1, p.expPow) + p.expLinear * (level - 1));
  }

  baseStats(id: string, level: number): Stats {
    const d = this.char(id);
    const out = {} as Stats;
    for (const k of STAT_KEYS) out[k] = Math.floor(d.base[k] + d.growth[k] * (level - 1) + d.growth[k] * 0.015 * (level - 1) * (level - 1));
    return out;
  }

  item(id: string): ItemDef {
    const it = this.data.items[id];
    if (!it) throw new Error(`unknown item "${id}"`);
    return it;
  }

  signLevel(signId: string): number {
    const it = this.item(signId);
    const exp = this.s.signExp[signId] ?? 0;
    let lvl = 0;
    (it.sign?.levels ?? []).forEach((l, i) => {
      if (exp >= l.exp) lvl = i;
    });
    return lvl;
  }

  equippedItems(id: string): ItemDef[] {
    const c = this.cs(id);
    const out: ItemDef[] = [];
    for (const slot of EQUIP_SLOTS) if (c.equip[slot]) out.push(this.item(c.equip[slot] as string));
    return out;
  }

  equippedSigns(id: string): string[] {
    return this.cs(id).signs.filter((s): s is string => !!s);
  }

  passives(id: string): PassiveDef[] {
    const out: PassiveDef[] = [...(this.char(id).passives ?? [])];
    for (const it of this.equippedItems(id)) out.push(...(it.equip?.passives ?? []));
    for (const s of this.equippedSigns(id)) {
      const lv = this.item(s).sign?.levels[this.signLevel(s)];
      if (lv?.passives) out.push(...lv.passives);
    }
    if (id !== 'pipo' && this.s.roster.pipo && this.s.pipo) out.push(...this.pipoPassives());
    return out;
  }

  pipoPassives(): PassiveDef[] {
    const t = this.s.trust.pipo ?? 0;
    const out: PassiveDef[] = [...(this.data.characters.pipo?.passives ?? [])];
    if (t >= 2) out.push({ id: 'evade', value: 3 });
    if (t >= 4) out.push({ id: 'limit_up', value: 10 });
    return out;
  }

  passiveSum(id: string, pid: string, element?: string): number {
    let v = 0;
    for (const p of this.passives(id)) if (p.id === pid && (element === undefined || p.element === element)) v += p.value ?? 0;
    return v;
  }

  stats(id: string): Stats {
    const c = this.cs(id);
    const st = this.baseStats(id, c.level);
    for (const it of this.equippedItems(id)) for (const k of STAT_KEYS) st[k] += it.equip?.stats?.[k] ?? 0;
    for (const s of this.equippedSigns(id)) {
      const lv = this.item(s).sign?.levels[this.signLevel(s)];
      for (const k of STAT_KEYS) st[k] += lv?.stats?.[k] ?? 0;
    }
    const pct: Partial<Record<StatKey, string>> = { hp: 'hp_pct', mp: 'mp_pct', atk: 'atk_pct', def: 'def_pct', mag: 'mag_pct', spd: 'spd_pct' };
    for (const k of Object.keys(pct) as StatKey[]) {
      const p = this.passiveSum(id, pct[k] as string);
      if (p) st[k] = Math.floor(st[k] * (1 + p / 100));
    }
    for (const k of STAT_KEYS) st[k] = Math.max(k === 'hp' ? 1 : 0, st[k]);
    return st;
  }

  techniques(id: string): TechniqueDef[] {
    const c = this.cs(id);
    const out: TechniqueDef[] = [];
    for (const t of Object.values(this.data.techniques)) {
      if (t.user !== id || t.limit) continue;
      if (t.learn?.level !== undefined && c.level < t.learn.level) continue;
      if (t.learn?.flag && !this.s.flags[t.learn.flag]) continue;
      out.push(t);
    }
    for (const s of this.equippedSigns(id)) {
      const levels = this.item(s).sign?.levels ?? [];
      const lv = this.signLevel(s);
      for (let i = 0; i <= lv; i++) {
        const tid = levels[i]?.tech;
        if (tid && !out.find((t) => t.id === tid)) out.push(this.data.techniques[tid]);
      }
    }
    return out;
  }

  limitTech(id: string): TechniqueDef | null {
    const c = this.cs(id);
    const form = c.forms[0];
    if (!form) return null;
    const f = this.data.avatarForms.find((a) => a.id === form);
    return f ? this.data.techniques[f.tech] : null;
  }

  addExp(id: string, amount: number): LevelUp | null {
    const c = this.cs(id);
    if (c.level >= MAX_LEVEL) return null;
    const before = c.level;
    const known = new Set(this.techniques(id).map((t) => t.id));
    const oldStats = this.stats(id);
    c.exp += Math.max(0, Math.floor(amount));
    while (c.level < MAX_LEVEL && c.exp >= this.expFor(c.level + 1)) c.level++;
    if (c.level === before) return null;
    const def = this.char(id);
    const slots = this.signSlots(def, c.level);
    while (c.signs.length < slots) c.signs.push(null);
    const ns = this.stats(id);
    c.hp = Math.min(ns.hp, c.hp + (ns.hp - oldStats.hp));
    c.mp = Math.min(ns.mp, c.mp + (ns.mp - oldStats.mp));
    const learned = this.techniques(id).filter((t) => !known.has(t.id)).map((t) => t.id);
    return { id, from: before, to: c.level, learned };
  }

  setLevel(id: string, level: number): void {
    const c = this.cs(id);
    c.level = Math.max(1, Math.min(MAX_LEVEL, level));
    c.exp = this.expFor(c.level);
    const def = this.char(id);
    while (c.signs.length < this.signSlots(def, c.level)) c.signs.push(null);
    const st = this.stats(id);
    c.hp = st.hp;
    c.mp = st.mp;
  }

  healAll(): void {
    for (const id of Object.keys(this.s.roster)) {
      const st = this.stats(id);
      this.s.roster[id].hp = st.hp;
      this.s.roster[id].mp = st.mp;
    }
  }

  count(itemId: string): number {
    return this.s.items[itemId] ?? 0;
  }

  equippedCount(itemId: string): number {
    let n = 0;
    for (const c of Object.values(this.s.roster)) {
      for (const slot of EQUIP_SLOTS) if (c.equip[slot] === itemId) n++;
      for (const s of c.signs) if (s === itemId) n++;
    }
    return n;
  }

  give(itemId: string, n = 1): void {
    const it = this.item(itemId);
    const cur = this.s.items[itemId] ?? 0;
    const cap = it.type === 'key' || it.unique || it.type === 'sign' ? 1 : 99;
    this.s.items[itemId] = Math.min(cap, cur + n);
    if (it.type === 'sign' && this.s.signExp[itemId] === undefined) this.s.signExp[itemId] = 0;
  }

  take(itemId: string, n = 1): boolean {
    const cur = this.s.items[itemId] ?? 0;
    if (cur < n) return false;
    const left = cur - n;
    if (left <= 0) delete this.s.items[itemId];
    else this.s.items[itemId] = left;
    return true;
  }

  canEquip(charId: string, itemId: string): boolean {
    const it = this.item(itemId);
    if (!['weapon', 'armor', 'accessory'].includes(it.type)) return false;
    return !it.equip?.who || it.equip.who.includes(charId);
  }

  equip(charId: string, slot: EquipSlot, itemId: string | null): boolean {
    const c = this.cs(charId);
    if (itemId) {
      const it = this.item(itemId);
      if (it.type !== slot || !this.canEquip(charId, itemId)) return false;
      if (this.count(itemId) < 1) return false;
      this.take(itemId, 1);
    }
    const prev = c.equip[slot];
    if (prev) this.give(prev, 1);
    if (itemId) c.equip[slot] = itemId;
    else delete c.equip[slot];
    this.clampHpMp(charId);
    return true;
  }

  equipSign(charId: string, slotIndex: number, signId: string | null): boolean {
    const c = this.cs(charId);
    if (slotIndex < 0 || slotIndex >= c.signs.length) return false;
    if (signId) {
      if (this.item(signId).type !== 'sign' || this.count(signId) < 1) return false;
      for (const other of Object.values(this.s.roster)) other.signs = other.signs.map((s) => (s === signId ? null : s));
      this.take(signId, 1);
    }
    const prev = c.signs[slotIndex];
    if (prev) this.give(prev, 1);
    c.signs[slotIndex] = signId;
    this.clampHpMp(charId);
    return true;
  }

  ownsSign(signId: string): boolean {
    return this.count(signId) > 0 || this.equippedCount(signId) > 0;
  }

  clampHpMp(id: string): void {
    const st = this.stats(id);
    const c = this.cs(id);
    c.hp = Math.min(c.hp, st.hp);
    c.mp = Math.min(c.mp, st.mp);
  }

  addGold(n: number): void {
    this.s.gold = Math.max(0, Math.min(9999999, this.s.gold + Math.floor(n)));
  }

  flag(name: string): boolean {
    return !!this.s.flags[name];
  }

  setFlag(name: string, v = true): void {
    if (v) this.s.flags[name] = true;
    else delete this.s.flags[name];
  }

  addTrust(who: string, n: number): void {
    this.s.trust[who] = Math.max(-5, Math.min(10, (this.s.trust[who] ?? 0) + n));
  }

  setQuest(id: string, step: number): void {
    this.s.quests[id] = Math.max(this.s.quests[id] ?? 0, step);
  }

  questDone(id: string): boolean {
    return (this.s.quests[id] ?? 0) > this.data.quests[id].steps.length;
  }

  secret(id: string): boolean {
    if (this.s.stats.secrets.includes(id)) return false;
    this.s.stats.secrets.push(id);
    this.setFlag(`secret_${id}`);
    return true;
  }

  resolve = (name: string): ExprValue | undefined => {
    const dot = name.indexOf('.');
    if (dot < 0) {
      if (name === 'gold') return this.s.gold;
      if (name === 'pipo') return this.s.pipo;
      if (name === 'secrets') return this.s.stats.secrets.length;
      if (name === 'rand') return Math.floor(Math.random() * 100);
      if (name === 'partysize') return this.s.party.length;
      return !!this.s.flags[name];
    }
    const ns = name.slice(0, dot);
    const key = name.slice(dot + 1);
    switch (ns) {
      case 'var':
        return this.s.vars[key] ?? 0;
      case 'item':
        return this.count(key) + this.equippedCount(key);
      case 'trust':
        return this.s.trust[key] ?? 0;
      case 'quest':
        return this.s.quests[key] ?? 0;
      case 'party':
        return this.s.party.includes(key);
      case 'roster':
        return !!this.s.roster[key];
      case 'lvl':
        return this.s.roster[key]?.level ?? 0;
      case 'radio':
        return this.s.radio.includes(key);
      case 'paisho':
        return key === 'wins' ? this.s.paisho.beaten.length : this.s.paisho.beaten.includes(key);
      case 'opened':
        return this.s.opened.includes(key);
      case 'visited':
        return this.s.visited.includes(key);
      case 'stat':
        return (this.s.stats as unknown as Record<string, number>)[key] ?? 0;
    }
    return undefined;
  };

  test(cond: string | undefined | null): boolean {
    return evalExpr(cond, this.resolve);
  }

  toSave(): SaveData {
    this.s.savedAt = Date.now();
    return JSON.parse(JSON.stringify(this.s)) as SaveData;
  }
}

export function migrate(s: SaveData): SaveData {
  const out = { ...s };
  if (!out.stats.paishoGames) out.stats.paishoGames = 0;
  if (!out.visited) out.visited = [];
  if (!out.radio) out.radio = [];
  if (!out.trust) out.trust = { tao: 0, miri: 0, pipo: 0 };
  out.v = SAVE_VERSION;
  return out;
}
