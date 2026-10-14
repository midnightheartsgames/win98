import type { AiRule, EffectDef, Element, EnemyDef, Stats, StatKey, StatusDef, TechniqueDef, TroopDef } from '../../data/types.ts';
import type { Game, LevelUp } from '../state.ts';
import { STAT_KEYS } from '../state.ts';
import { Rng } from '../../core/rng.ts';
import { evalExpr, type ExprValue } from '../../core/expr.ts';

export type Side = 'party' | 'enemy';

export interface Actor {
  uid: number;
  side: Side;
  id: string;
  name: string;
  look: string;
  level: number;
  base: Stats;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  atb: number;
  alive: boolean;
  statuses: Record<string, number>;
  stance: string | null;
  stanceChanged: boolean;
  opora: number;
  oporaMax: number;
  limit: number;
  defending: boolean;
  shield: number;
  elem: Partial<Record<Element, number>>;
  immune: Set<string>;
  phase: number;
  turns: number;
  stolen: boolean;
  scanned: boolean;
  boss: boolean;
  speedMul: number;
  enemy: EnemyDef | null;
  ai: AiRule[];
  usedOnce: Set<string>;
  slot: number;
  ready: boolean;
  variant: string;
}

export type CmdKind = 'attack' | 'tech' | 'item' | 'defend' | 'escape' | 'limit';

export interface Cmd {
  kind: CmdKind;
  actor: number;
  tech?: string;
  item?: string;
  targets: number[];
}

export type HitKind = 'damage' | 'heal' | 'miss' | 'status' | 'cure' | 'revive' | 'mp' | 'steal' | 'stealFail' | 'stealNone' | 'opora' | 'shield' | 'scan' | 'immune' | 'absorb' | 'atb' | 'resist' | 'limit' | 'ko';

export interface Hit {
  target: number;
  kind: HitKind;
  amount?: number;
  crit?: boolean;
  element?: Element;
  mult?: number;
  status?: string;
  item?: string;
}

export interface ActionResult {
  cmd: Cmd;
  actor: Actor;
  name: string;
  fx: string;
  sfx: string;
  anim: 'strike' | 'cast' | 'throw' | 'dash';
  element: Element | null;
  hits: Hit[];
  failed?: 'mp' | 'drain' | 'opora' | 'item' | 'escape';
  escaped?: boolean;
  limit?: boolean;
}

export type BattleEvent =
  | { type: 'ready'; actor: Actor }
  | { type: 'tick'; actor: Actor; hits: Hit[]; skipped: boolean }
  | { type: 'phase'; actor: Actor; say?: string; flash?: string; name?: string }
  | { type: 'end'; result: 'win' | 'lose' | 'escape' };

export interface Rewards {
  exp: number;
  gold: number;
  items: string[];
  signExp: number;
  levelUps: LevelUp[];
}

const ATB_BASE = 4200;

export class Battle {
  readonly game: Game;
  readonly troop: TroopDef;
  readonly rng: Rng;
  actors: Actor[] = [];
  queue: Cmd[] = [];
  events: BattleEvent[] = [];
  result: 'win' | 'lose' | 'escape' | null = null;
  speed = 1;
  turnCount = 0;
  escapeAttempts = 0;
  private uid = 1;
  private scannedBefore: Set<string>;

  constructor(game: Game, troopId: string, rng = new Rng((Date.now() & 0xffffffff) >>> 0), scanned: Set<string> = new Set()) {
    this.game = game;
    this.rng = rng;
    this.scannedBefore = scanned;
    const troop = game.data.troops[troopId];
    if (!troop) throw new Error(`unknown troop "${troopId}"`);
    this.troop = troop;
    game.s.party.forEach((id, i) => this.actors.push(this.partyActor(id, i)));
    troop.enemies.forEach((e, i) => this.actors.push(this.enemyActor(e.enemy, i)));
    for (const a of this.actors) {
      a.atb = a.side === 'party' ? this.rng.range(0.25, 0.6) : this.rng.range(0.05, 0.4);
      if (a.side === 'party' && this.passive(a, 'first_strike') > 0) a.atb = 1;
      if (troop.preemptive && a.side === 'party') a.atb = Math.max(a.atb, 0.85);
    }
  }

  private partyActor(id: string, slot: number): Actor {
    const g = this.game;
    const def = g.char(id);
    const cs = g.cs(id);
    const st = g.stats(id);
    const elem: Partial<Record<Element, number>> = {};
    const immune = new Set<string>();
    for (const it of g.equippedItems(id)) {
      for (const [k, v] of Object.entries(it.equip?.elem ?? {})) elem[k as Element] = (elem[k as Element] ?? 1) * (v as number);
      for (const s of it.equip?.statusImmune ?? []) immune.add(s);
    }
    for (const p of g.passives(id)) if (p.id === 'immune' && p.status) immune.add(p.status);
    for (const p of g.passives(id)) if (p.id === 'resist' && p.element) elem[p.element] = (elem[p.element] ?? 1) * (p.value ?? 1);
    return {
      uid: this.uid++,
      side: 'party',
      id,
      name: id === 'isa' ? g.s.name : def.name,
      look: def.look,
      level: cs.level,
      base: st,
      hp: Math.max(cs.hp, 1),
      mp: cs.mp,
      maxHp: st.hp,
      maxMp: st.mp,
      atb: 0,
      alive: true,
      statuses: {},
      stance: def.stances?.[0] ?? null,
      stanceChanged: false,
      opora: def.resource === 'opora' ? 1 : 0,
      oporaMax: def.resource === 'opora' ? def.resourceMax ?? 5 : 0,
      limit: cs.limit,
      defending: false,
      shield: 0,
      elem,
      immune,
      phase: 0,
      turns: 0,
      stolen: false,
      scanned: true,
      boss: false,
      speedMul: def.speedMul ?? 1,
      enemy: null,
      ai: [],
      usedOnce: new Set(),
      slot,
      ready: false,
      variant: ''
    };
  }

  private enemyActor(id: string, slot: number): Actor {
    const e = this.game.data.enemies[id];
    const elem: Partial<Record<Element, number>> = {};
    for (const f of e.families) for (const [k, v] of Object.entries(this.game.data.elements.families[f] ?? {})) elem[k as Element] = (elem[k as Element] ?? 1) * v;
    for (const [k, v] of Object.entries(e.elem ?? {})) elem[k as Element] = v as number;
    return {
      uid: this.uid++,
      side: 'enemy',
      id,
      name: e.name,
      look: e.look,
      level: e.level,
      base: { ...e.stats },
      hp: e.stats.hp,
      mp: e.stats.mp,
      maxHp: e.stats.hp,
      maxMp: e.stats.mp,
      atb: 0,
      alive: true,
      statuses: {},
      stance: null,
      stanceChanged: false,
      opora: 0,
      oporaMax: 0,
      limit: 0,
      defending: false,
      shield: 0,
      elem,
      immune: new Set(e.statusImmune ?? []),
      phase: 0,
      turns: 0,
      stolen: false,
      scanned: this.scannedBefore.has(id),
      boss: !!e.boss,
      speedMul: 1,
      enemy: e,
      ai: e.ai,
      usedOnce: new Set(),
      slot,
      ready: false,
      variant: ''
    };
  }

  get party(): Actor[] {
    return this.actors.filter((a) => a.side === 'party');
  }

  get enemies(): Actor[] {
    return this.actors.filter((a) => a.side === 'enemy');
  }

  alive(side: Side): Actor[] {
    return this.actors.filter((a) => a.side === side && a.alive);
  }

  byUid(uid: number): Actor {
    const a = this.actors.find((x) => x.uid === uid);
    if (!a) throw new Error(`no actor ${uid}`);
    return a;
  }

  status(id: string): StatusDef {
    return this.game.data.statuses[id];
  }

  passive(a: Actor, pid: string, element?: string): number {
    if (a.side !== 'party') return 0;
    return this.game.passiveSum(a.id, pid, element);
  }

  stat(a: Actor, k: StatKey): number {
    let v = a.base[k];
    for (const s of Object.keys(a.statuses)) {
      const m = this.status(s)?.statMul?.[k];
      if (m) v *= m;
    }
    if (a.stance) {
      const m = this.game.data.stances[a.stance]?.statMul?.[k];
      if (m) v *= m;
    }
    if (a.enemy && a.phase > 0) {
      for (let i = 0; i < a.phase; i++) {
        const m = a.enemy.phases?.[i]?.statMul?.[k];
        if (m) v *= m;
      }
    }
    return Math.max(0, v);
  }

  has(a: Actor, s: string): boolean {
    return (a.statuses[s] ?? 0) > 0;
  }

  atbRate(a: Actor): number {
    let r = ((this.stat(a, 'spd') * 0.9 + 25) / ATB_BASE) * a.speedMul;
    for (const s of Object.keys(a.statuses)) r *= this.status(s)?.atbMul ?? 1;
    return r * this.speed;
  }

  update(frames: number, paused: boolean): void {
    if (this.result || paused) return;
    for (let f = 0; f < frames; f++) {
      for (const a of this.actors) {
        if (!a.alive || a.ready) continue;
        a.atb = Math.min(1, a.atb + this.atbRate(a));
        if (a.atb >= 1) this.turnStart(a);
        if (this.result) return;
      }
    }
  }

  private turnStart(a: Actor): void {
    a.turns++;
    this.turnCount++;
    a.defending = false;
    a.stanceChanged = false;
    const hits: Hit[] = [];
    let skipped = false;
    for (const sid of Object.keys(a.statuses)) {
      const def = this.status(sid);
      if (!def) continue;
      if (def.tickDamagePct && a.alive) {
        const dmg = Math.max(1, Math.floor(a.maxHp * def.tickDamagePct / 100 * (def.tickElement ? Math.max(0, this.elemMult(a, def.tickElement)) : 1)));
        if (def.tickDamagePct < 0) {
          const heal = Math.floor(a.maxHp * -def.tickDamagePct / 100);
          a.hp = Math.min(a.maxHp, a.hp + heal);
          hits.push({ target: a.uid, kind: 'heal', amount: heal });
        } else {
          this.applyDamage(a, dmg, hits, def.tickElement ?? 'phys', false, 1);
        }
      }
      if (def.skipTurn && a.alive) skipped = true;
    }
    const regen = this.passive(a, 'regen');
    if (regen && a.alive) {
      const heal = Math.max(1, Math.floor(a.maxHp * regen / 100));
      a.hp = Math.min(a.maxHp, a.hp + heal);
      hits.push({ target: a.uid, kind: 'heal', amount: heal });
    }
    const mpr = this.passive(a, 'mp_regen');
    if (mpr && a.alive) a.mp = Math.min(a.maxMp, a.mp + mpr);
    for (const sid of Object.keys(a.statuses)) {
      a.statuses[sid]--;
      if (a.statuses[sid] <= 0) delete a.statuses[sid];
    }
    if (hits.length || skipped) this.events.push({ type: 'tick', actor: a, hits, skipped });
    this.checkEnd();
    if (!a.alive || this.result) {
      a.atb = 0;
      return;
    }
    if (skipped) {
      a.atb = 0;
      return;
    }
    a.ready = true;
    if (a.side === 'enemy') this.queue.push(this.decide(a));
    else this.events.push({ type: 'ready', actor: a });
  }

  elemMult(a: Actor, el: Element): number {
    let m = a.elem[el] ?? 1;
    if (a.enemy && a.phase > 0) {
      for (let i = 0; i < a.phase; i++) {
        const pm = a.enemy.phases?.[i]?.elem?.[el];
        if (pm !== undefined) m = pm;
      }
    }
    return m;
  }

  canUseTech(a: Actor, t: TechniqueDef): 'ok' | 'mp' | 'drain' | 'opora' {
    if (this.has(a, 'drain')) return 'drain';
    if ((t.cost?.mp ?? 0) > a.mp) return 'mp';
    if ((t.requires?.opora ?? 0) > a.opora) return 'opora';
    if ((t.cost?.opora ?? 0) > a.opora) return 'opora';
    return 'ok';
  }

  limitReady(a: Actor): boolean {
    return a.side === 'party' && a.limit >= 100 && !!this.game.limitTech(a.id) && !this.has(a, 'exhaust');
  }

  changeStance(a: Actor, stance: string): boolean {
    const def = this.game.char(a.id);
    if (a.stanceChanged || !def.stances?.includes(stance) || a.stance === stance) return false;
    a.stance = stance;
    a.stanceChanged = true;
    return true;
  }

  submit(cmd: Cmd): void {
    const a = this.byUid(cmd.actor);
    a.ready = false;
    this.queue.push(cmd);
  }

  pendingParty(): Actor[] {
    return this.actors.filter((a) => a.side === 'party' && a.ready && a.alive && !this.queue.some((c) => c.actor === a.uid));
  }

  nextAction(): ActionResult | null {
    if (this.result) return null;
    while (this.queue.length) {
      const cmd = this.queue.shift() as Cmd;
      const a = this.byUid(cmd.actor);
      if (!a.alive) continue;
      a.ready = false;
      const res = this.execute(a, cmd);
      a.atb = 0;
      this.afterAction();
      return res;
    }
    return null;
  }

  private retarget(a: Actor, targets: number[], kind: string): Actor[] {
    const foes = a.side === 'party' ? 'enemy' : 'party';
    const friends = a.side;
    switch (kind) {
      case 'enemies':
        return this.alive(foes);
      case 'allies':
        return this.alive(friends);
      case 'all':
        return this.actors.filter((x) => x.alive);
      case 'self':
        return [a];
      case 'ally_dead':
        return targets.map((t) => this.byUid(t)).filter((x) => x.side === friends);
      case 'ally': {
        const t = targets.map((u) => this.byUid(u)).filter((x) => x.alive && x.side === friends);
        return t.length ? t : [a];
      }
      default: {
        const t = targets.map((u) => this.byUid(u)).filter((x) => x.alive);
        if (t.length) return t;
        const pool = this.alive(foes);
        return pool.length ? [this.rng.pick(pool)] : [];
      }
    }
  }

  private execute(a: Actor, cmd: Cmd): ActionResult {
    const g = this.game;
    const base: ActionResult = { cmd, actor: a, name: '', fx: 'hit', sfx: 'hit', anim: 'strike', element: null, hits: [] };
    if (cmd.kind === 'defend') {
      a.defending = true;
      if (a.oporaMax) a.opora = Math.min(a.oporaMax, a.opora + 1);
      return { ...base, name: 'defend', fx: 'guard', sfx: 'guard', anim: 'cast' };
    }
    if (cmd.kind === 'escape') {
      this.escapeAttempts++;
      const ps = this.alive('party').reduce((s, x) => s + this.stat(x, 'spd'), 0) / Math.max(1, this.alive('party').length);
      const es = this.alive('enemy').reduce((s, x) => s + this.stat(x, 'spd'), 0) / Math.max(1, this.alive('enemy').length);
      const chance = this.troop.escape ? Math.min(0.95, 0.45 + (ps - es) / 60 + this.escapeAttempts * 0.15) : 0;
      if (this.rng.chance(chance)) {
        this.result = 'escape';
        this.events.push({ type: 'end', result: 'escape' });
        return { ...base, name: 'escape', fx: 'none', sfx: 'run', anim: 'dash', escaped: true };
      }
      return { ...base, name: 'escape', fx: 'none', sfx: 'error', anim: 'dash', failed: 'escape' };
    }
    if (cmd.kind === 'attack') {
      const targets = this.retarget(a, cmd.targets, 'enemy');
      const res: ActionResult = { ...base, name: 'attack', fx: a.side === 'party' ? `attack_${a.id}` : 'claw', sfx: 'hit' };
      for (const t of targets) this.applyEffect(a, t, { type: 'damage', element: 'phys', power: 1, stat: 'atk' }, res, null);
      return res;
    }
    if (cmd.kind === 'item') {
      const it = g.data.items[cmd.item ?? ''];
      if (!it || !it.use || g.count(it.id) < 1) return { ...base, name: it?.name ?? '?', failed: 'item' };
      g.take(it.id, 1);
      const targets = this.retarget(a, cmd.targets, it.use.target);
      const res: ActionResult = { ...base, name: it.name, fx: it.use.fx ?? 'item', sfx: it.use.sfx ?? 'heal', anim: 'throw' };
      for (const t of targets) for (const e of it.use.effects) this.applyEffect(a, t, e, res, null);
      return res;
    }
    const tech = cmd.kind === 'limit' ? g.limitTech(a.id) : g.data.techniques[cmd.tech ?? ''];
    if (!tech) return { ...base, name: '?', failed: 'mp' };
    if (cmd.kind === 'limit') {
      if (!this.limitReady(a)) return { ...base, name: tech.name, failed: 'drain' };
      a.limit = 0;
    } else {
      const ok = this.canUseTech(a, tech);
      if (ok !== 'ok') return { ...base, name: tech.name, failed: ok };
      a.mp -= tech.cost?.mp ?? 0;
      a.opora -= tech.cost?.opora ?? 0;
    }
    const firstDamage = tech.effects.find((e) => e.type === 'damage');
    const res: ActionResult = { ...base, name: tech.name, fx: tech.fx, sfx: tech.sfx, anim: tech.anim ?? 'cast', element: firstDamage?.element ?? null, limit: cmd.kind === 'limit' };
    const targets = this.retarget(a, cmd.targets, tech.target);
    const chargeMul = this.has(a, 'charge') ? this.status('charge').techPowerMul ?? 1.5 : 1;
    for (const t of targets) {
      for (const e of tech.effects) {
        if (e.self || e.to) continue;
        this.applyEffect(a, t, e, res, tech, chargeMul);
      }
    }
    for (const e of tech.effects) {
      if (e.self) this.applyEffect(a, a, e, res, tech, 1);
      else if (e.to) for (const t of this.retarget(a, [], e.to)) this.applyEffect(a, t, e, res, tech, chargeMul);
    }
    if (chargeMul !== 1 && this.status('charge').consumeOnTech) delete a.statuses.charge;
    for (const af of tech.after ?? []) {
      if (af.self) {
        a.statuses[af.status] = af.turns;
        res.hits.push({ target: a.uid, kind: 'status', status: af.status });
      }
    }
    return res;
  }

  private critChance(a: Actor): number {
    return 0.04 + this.stat(a, 'lck') / 400 + this.passive(a, 'crit') / 100;
  }

  private applyDamage(t: Actor, dmg: number, hits: Hit[], element: Element, crit: boolean, mult: number): number {
    let d = dmg;
    if (t.shield > 0) {
      const ab = Math.min(t.shield, d);
      t.shield -= ab;
      d -= ab;
      if (t.shield <= 0) delete t.statuses.shield;
    }
    t.hp = Math.max(0, t.hp - d);
    hits.push({ target: t.uid, kind: 'damage', amount: dmg, crit, element, mult });
    if (d > 0) {
      for (const s of Object.keys(t.statuses)) if (this.status(s)?.breakOnHit) delete t.statuses[s];
      if (t.side === 'party') {
        if (t.oporaMax) t.opora = Math.min(t.oporaMax, t.opora + 1);
        if (this.game.limitTech(t.id) && !this.has(t, 'exhaust')) {
          const gain = (d / t.maxHp) * 110 * (1 + this.passive(t, 'limit_up') / 100);
          t.limit = Math.min(100, t.limit + gain);
        }
      }
    }
    if (t.hp <= 0 && t.alive) this.ko(t, hits);
    return d;
  }

  private ko(t: Actor, hits: Hit[]): void {
    t.alive = false;
    t.statuses = {};
    t.ready = false;
    t.atb = 0;
    t.shield = 0;
    hits.push({ target: t.uid, kind: 'ko' });
    this.queue = this.queue.filter((c) => c.actor !== t.uid);
    if (t.side === 'party') {
      for (const p of this.alive('party')) if (this.game.limitTech(p.id) && !this.has(p, 'exhaust')) p.limit = Math.min(100, p.limit + 15);
    }
  }

  applyEffect(a: Actor, t: Actor, e: EffectDef, res: ActionResult, tech: TechniqueDef | null, chargeMul = 1): void {
    const hits = res.hits;
    switch (e.type) {
      case 'damage': {
        if (!t.alive) return;
        const stat = e.stat ?? (tech ? 'mag' : 'atk');
        const el = e.element ?? 'phys';
        const n = e.hits ?? 1;
        for (let i = 0; i < n && t.alive; i++) {
          if (stat === 'atk') {
            const acc = 0.96 * (this.has(a, 'blind') ? this.status('blind').accMul ?? 0.5 : 1) - (this.stat(t, 'spd') - this.stat(a, 'spd')) / 500 - this.passive(t, 'evade') / 100;
            if (!this.rng.chance(Math.max(0.3, Math.min(0.99, acc)))) {
              hits.push({ target: t.uid, kind: 'miss' });
              continue;
            }
          }
          const av = this.stat(a, stat);
          let dv = this.stat(t, stat === 'atk' ? 'def' : 'res');
          if (e.pierce) dv *= 0.3;
          if (t.defending) dv *= 1.5;
          const power = (e.power ?? 1) * chargeMul;
          let dmg = e.fixed !== undefined ? e.fixed : av * 2 * power * (60 / (60 + dv)) * (1 + a.level / 22);
          dmg *= this.rng.range(0.9, 1.1);
          let mult = this.elemMult(t, el);
          const up = this.passive(a, 'elem_up', el);
          if (up) mult *= 1 + up / 100;
          if (a.stance === 'flame' && el === 'fire') mult *= 1.1;
          let crit = false;
          if (stat === 'atk' && this.rng.chance(this.critChance(a))) {
            crit = true;
            dmg *= 1.75;
            if (a.side === 'party' && this.game.limitTech(a.id) && !this.has(a, 'exhaust')) a.limit = Math.min(100, a.limit + 8);
          }
          if (t.defending) dmg *= 0.6;
          if (mult === 0) {
            hits.push({ target: t.uid, kind: 'immune', element: el });
            continue;
          }
          if (mult < 0) {
            const heal = Math.floor(Math.abs(dmg * mult));
            t.hp = Math.min(t.maxHp, t.hp + heal);
            hits.push({ target: t.uid, kind: 'absorb', amount: heal, element: el });
            continue;
          }
          const final = Math.max(1, Math.floor(dmg * mult));
          const dealt = this.applyDamage(t, final, hits, el, crit, mult);
          if (e.drain && dealt > 0) {
            const heal = Math.floor(dealt * 0.5);
            a.hp = Math.min(a.maxHp, a.hp + heal);
            hits.push({ target: a.uid, kind: 'heal', amount: heal });
          }
          if (t.side === 'party' && t.alive && this.passive(t, 'counter') && stat === 'atk' && a.alive && this.rng.chance(this.passive(t, 'counter') / 100)) {
            const cd = Math.max(1, Math.floor(this.stat(t, 'atk') * 1.5 * (60 / (60 + this.stat(a, 'def'))) * (1 + t.level / 22)));
            this.applyDamage(a, cd, hits, 'phys', false, 1);
          }
        }
        return;
      }
      case 'heal': {
        if (!t.alive) return;
        const amt = Math.floor((e.fixed ?? 0) + (e.pct ? (t.maxHp * e.pct) / 100 : 0) + (e.power ? this.stat(a, 'mag') * 2 * e.power + 10 : 0));
        if (t.enemy && t.enemy.families.includes('undead')) {
          this.applyDamage(t, amt, hits, 'spirit', false, 1);
          return;
        }
        t.hp = Math.min(t.maxHp, t.hp + amt);
        hits.push({ target: t.uid, kind: 'heal', amount: amt });
        return;
      }
      case 'mp': {
        if (!t.alive) return;
        const amt = Math.floor((e.fixed ?? 0) + (e.pct ? (t.maxMp * e.pct) / 100 : 0));
        t.mp = Math.min(t.maxMp, t.mp + amt);
        hits.push({ target: t.uid, kind: 'mp', amount: amt });
        return;
      }
      case 'revive': {
        if (t.alive) {
          if (e.pct) {
            const amt = Math.floor((t.maxHp * e.pct) / 100);
            t.hp = Math.min(t.maxHp, t.hp + amt);
            hits.push({ target: t.uid, kind: 'heal', amount: amt });
          }
          return;
        }
        t.alive = true;
        t.hp = Math.max(1, Math.floor((t.maxHp * (e.pct ?? 25)) / 100));
        t.atb = 0;
        hits.push({ target: t.uid, kind: 'revive', amount: t.hp });
        return;
      }
      case 'status': {
        if (!t.alive || !e.id) return;
        const def = this.status(e.id);
        if (t.immune.has(e.id)) {
          hits.push({ target: t.uid, kind: 'resist', status: e.id });
          return;
        }
        let chance = e.chance ?? 1;
        if (def.negative && t.side !== a.side) {
          chance *= 1 - this.stat(t, 'res') / 500;
          if (t.boss && (e.id === 'stun' || e.id === 'drain')) chance *= 0.45;
          if (a.stance === 'coal') chance *= 1.3;
          if (e.id === 'drain' && t.enemy?.families.includes('spirittech')) chance = Math.max(chance, 0.9);
        }
        if (!this.rng.chance(chance)) {
          hits.push({ target: t.uid, kind: 'resist', status: e.id });
          return;
        }
        t.statuses[e.id] = Math.max(t.statuses[e.id] ?? 0, e.turns ?? def.turns);
        hits.push({ target: t.uid, kind: 'status', status: e.id });
        return;
      }
      case 'cure': {
        if (!t.alive) return;
        const ids = e.ids ?? Object.keys(t.statuses).filter((s) => this.status(s)?.negative);
        for (const s of ids) if (t.statuses[s]) delete t.statuses[s];
        hits.push({ target: t.uid, kind: 'cure' });
        return;
      }
      case 'shield': {
        if (!t.alive) return;
        const amt = Math.floor((e.fixed ?? 0) + (e.power ? this.stat(a, 'mag') * 2 * e.power + 20 : 0));
        t.shield = Math.max(t.shield, amt);
        t.statuses.shield = e.turns ?? this.status('shield').turns;
        hits.push({ target: t.uid, kind: 'shield', amount: amt });
        return;
      }
      case 'steal': {
        if (!t.alive || !t.enemy) return;
        if (t.stolen || !t.enemy.steal?.length) {
          hits.push({ target: t.uid, kind: 'stealNone' });
          return;
        }
        const bonus = 1 + (this.stat(a, 'lck') - this.stat(t, 'lck')) / 60 + this.passive(a, 'steal_up') / 100;
        for (const s of t.enemy.steal) {
          if (this.rng.chance(Math.min(0.95, s.chance * bonus * (e.power ?? 1)))) {
            t.stolen = true;
            this.game.give(s.item, 1);
            hits.push({ target: t.uid, kind: 'steal', item: s.item });
            return;
          }
        }
        hits.push({ target: t.uid, kind: 'stealFail' });
        return;
      }
      case 'opora': {
        if (a.oporaMax) a.opora = Math.max(0, Math.min(a.oporaMax, a.opora + (e.amount ?? 1)));
        hits.push({ target: a.uid, kind: 'opora', amount: e.amount ?? 1 });
        return;
      }
      case 'limit': {
        if (t.side === 'party' && this.game.limitTech(t.id)) t.limit = Math.min(100, t.limit + (e.amount ?? 10));
        hits.push({ target: t.uid, kind: 'limit', amount: e.amount ?? 10 });
        return;
      }
      case 'atb': {
        if (!t.alive) return;
        t.atb = Math.max(0, Math.min(0.99, t.atb + (e.amount ?? -0.3)));
        hits.push({ target: t.uid, kind: 'atb', amount: e.amount ?? -0.3 });
        return;
      }
      case 'scan': {
        t.scanned = true;
        if (t.enemy) this.scannedBefore.add(t.enemy.id);
        hits.push({ target: t.uid, kind: 'scan' });
        return;
      }
      case 'escape': {
        if (this.troop.escape) {
          this.result = 'escape';
          this.events.push({ type: 'end', result: 'escape' });
          res.escaped = true;
        } else hits.push({ target: a.uid, kind: 'resist' });
        return;
      }
    }
  }

  private afterAction(): void {
    for (const e of this.alive('enemy')) {
      const phases = e.enemy?.phases ?? [];
      while (e.phase < phases.length && this.aiTest(e, phases[e.phase].when)) {
        const ph = phases[e.phase];
        e.phase++;
        if (ph.ai) e.ai = ph.ai;
        if (ph.look) e.variant = ph.look;
        if (ph.name) e.name = ph.name;
        this.events.push({ type: 'phase', actor: e, say: ph.say, flash: ph.flash, name: ph.name });
      }
    }
    this.checkEnd();
  }

  checkEnd(): void {
    if (this.result) return;
    if (!this.alive('enemy').length) {
      this.result = 'win';
      this.events.push({ type: 'end', result: 'win' });
    } else if (!this.alive('party').length) {
      this.result = 'lose';
      this.events.push({ type: 'end', result: 'lose' });
    }
  }

  aiResolver(a: Actor): (n: string) => ExprValue | undefined {
    return (n: string) => {
      if (n === 'hpPct') return (a.hp / a.maxHp) * 100;
      if (n === 'mpPct') return a.maxMp ? (a.mp / a.maxMp) * 100 : 0;
      if (n === 'turn') return a.turns;
      if (n === 'phase') return a.phase;
      if (n === 'allies') return this.alive(a.side).length;
      if (n === 'foes') return this.alive(a.side === 'party' ? 'enemy' : 'party').length;
      if (n === 'partyLow') return this.alive('party').some((p) => p.hp / p.maxHp < 0.35);
      if (n === 'allyLow') return this.alive(a.side).some((p) => p.hp / p.maxHp < 0.4 && p !== a);
      if (n === 'rand') return this.rng.int(0, 99);
      if (n === 'shield') return a.shield > 0;
      if (n.startsWith('status.')) return this.has(a, n.slice(7));
      if (n.startsWith('partyStatus.')) return this.alive('party').filter((p) => this.has(p, n.slice(12))).length;
      return undefined;
    };
  }

  aiTest(a: Actor, cond: string | undefined): boolean {
    return evalExpr(cond, this.aiResolver(a));
  }

  decide(a: Actor): Cmd {
    const rules = a.ai.filter((r) => {
      if (r.once && a.usedOnce.has(r.use)) return false;
      if (r.every && a.turns % r.every !== 0) return false;
      if (!this.aiTest(a, r.if)) return false;
      if (r.use === 'attack' || r.use === 'defend' || r.use === 'wait') return true;
      const t = this.game.data.techniques[r.use];
      return !!t && this.canUseTech(a, t) === 'ok';
    });
    const total = rules.reduce((s, r) => s + r.weight, 0);
    let pick: AiRule | undefined;
    if (total > 0) {
      let roll = this.rng.next() * total;
      for (const r of rules) {
        roll -= r.weight;
        if (roll <= 0) {
          pick = r;
          break;
        }
      }
      pick = pick ?? rules[rules.length - 1];
    }
    if (!pick) return { kind: 'attack', actor: a.uid, targets: this.pickTargets(a, 'enemy', 'random') };
    if (pick.once) a.usedOnce.add(pick.use);
    if (pick.use === 'attack') return { kind: 'attack', actor: a.uid, targets: this.pickTargets(a, 'enemy', pick.target ?? 'random') };
    if (pick.use === 'defend' || pick.use === 'wait') return { kind: 'defend', actor: a.uid, targets: [] };
    const tech = this.game.data.techniques[pick.use];
    return { kind: 'tech', actor: a.uid, tech: tech.id, targets: this.pickTargets(a, tech.target, pick.target ?? 'random') };
  }

  pickTargets(a: Actor, kind: string, how: string): number[] {
    const foes = this.alive(a.side === 'party' ? 'enemy' : 'party');
    const friends = this.alive(a.side);
    if (kind === 'self') return [a.uid];
    if (kind === 'enemies' || kind === 'allies' || kind === 'all') return [];
    const pool = kind === 'ally' ? friends : foes;
    if (!pool.length) return [];
    let t: Actor;
    switch (how) {
      case 'weakest':
        t = pool.reduce((m, x) => (x.hp < m.hp ? x : m), pool[0]);
        break;
      case 'strongest':
        t = pool.reduce((m, x) => (this.stat(x, 'atk') + this.stat(x, 'mag') > this.stat(m, 'atk') + this.stat(m, 'mag') ? x : m), pool[0]);
        break;
      case 'lowest_hp_ally':
        t = pool.reduce((m, x) => (x.hp / x.maxHp < m.hp / m.maxHp ? x : m), pool[0]);
        break;
      case 'self':
        t = a;
        break;
      case 'no_status': {
        const free = pool.filter((x) => !Object.keys(x.statuses).some((s) => this.status(s)?.negative));
        t = free.length ? this.rng.pick(free) : this.rng.pick(pool);
        break;
      }
      default:
        t = this.rng.pick(pool);
    }
    return [t.uid];
  }

  rewards(): Rewards {
    const g = this.game;
    let exp = 0;
    let gold = 0;
    const items: string[] = [];
    let signExp = g.data.progression.signExpPerBattle;
    const dropBonus = Math.max(0, ...this.party.map((p) => this.passive(p, 'drop_up')));
    for (const e of this.enemies) {
      const d = e.enemy as EnemyDef;
      exp += d.exp;
      gold += d.gold;
      signExp += Math.ceil(d.level / 3);
      for (const dr of d.drops ?? []) if (this.rng.chance(dr.chance * (1 + dropBonus / 100))) items.push(dr.item);
      if (d.rare && this.rng.chance(d.rare.chance * (1 + dropBonus / 100))) items.push(d.rare.item);
    }
    const expUp = Math.max(0, ...this.party.map((p) => this.passive(p, 'exp_up')));
    const goldUp = Math.max(0, ...this.party.map((p) => this.passive(p, 'gold_up')));
    return { exp: Math.floor(exp * (1 + expUp / 100)), gold: Math.floor(gold * (1 + goldUp / 100)), items, signExp, levelUps: [] };
  }

  applyRewards(r: Rewards): Rewards {
    const g = this.game;
    g.addGold(r.gold);
    for (const it of r.items) g.give(it, 1);
    const ups: LevelUp[] = [];
    for (const p of this.party) {
      if (!p.alive) continue;
      const up = g.addExp(p.id, r.exp);
      if (up) ups.push(up);
    }
    for (const id of Object.keys(g.s.roster)) {
      if (g.s.party.includes(id) || !g.char(id).combat) continue;
      const up = g.addExp(id, r.exp * g.data.progression.reserveExpShare);
      if (up) ups.push(up);
    }
    for (const id of g.s.party) for (const s of g.equippedSigns(id)) g.s.signExp[s] = (g.s.signExp[s] ?? 0) + r.signExp;
    r.levelUps = ups;
    return r;
  }

  syncBack(): void {
    const g = this.game;
    for (const p of this.party) {
      const cs = g.cs(p.id);
      cs.hp = p.alive ? Math.min(p.hp, p.maxHp) : 1;
      cs.mp = Math.min(p.mp, p.maxMp);
      cs.limit = p.limit;
    }
    for (const id of g.s.party) g.clampHpMp(id);
  }

  scannedIds(): Set<string> {
    return this.scannedBefore;
  }
}

export { STAT_KEYS };
