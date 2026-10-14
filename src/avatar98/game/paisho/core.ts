import type { PaiShoData, PaiShoTile } from '../../data/types.ts';
import { Rng } from '../../core/rng.ts';

export interface RoundResult {
  player: PaiShoTile;
  opp: PaiShoTile;
  pScore: number;
  oScore: number;
  winner: 'player' | 'opp' | 'draw';
}

export class PaiShoMatch {
  readonly data: PaiShoData;
  readonly rng: Rng;
  readonly skill: number;
  pHand: PaiShoTile[];
  oHand: PaiShoTile[];
  pWins = 0;
  oWins = 0;
  round = 0;
  history: RoundResult[] = [];
  oLead: PaiShoTile | null = null;

  constructor(data: PaiShoData, playerTiles: string[], oppDeck: string[], skill: number, rng = new Rng(Date.now() >>> 0)) {
    this.data = data;
    this.rng = rng;
    this.skill = skill;
    const byId = new Map(data.tiles.map((t) => [t.id, t]));
    const draw = (ids: string[]) => {
      const pool = ids.map((i) => byId.get(i)).filter((t): t is PaiShoTile => !!t);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, data.rules.handSize);
    };
    this.pHand = draw(playerTiles);
    this.oHand = draw(oppDeck);
  }

  get playerLeads(): boolean {
    return this.round % 2 === 0;
  }

  get over(): boolean {
    const need = this.data.rules.winsNeeded;
    return this.pWins >= need || this.oWins >= need || this.round >= this.data.rules.rounds || !this.pHand.length || !this.oHand.length;
  }

  get winner(): 'player' | 'opp' | 'draw' {
    if (this.pWins > this.oWins) return 'player';
    if (this.oWins > this.pWins) return 'opp';
    return 'draw';
  }

  score(a: PaiShoTile, b: PaiShoTile): number {
    let s = a.value;
    if (this.data.rules.beats[a.element] === b.element) s += this.data.rules.advantage;
    return s;
  }

  compare(p: PaiShoTile, o: PaiShoTile): RoundResult {
    const ps = this.score(p, o);
    const os = this.score(o, p);
    let winner: RoundResult['winner'] = ps > os ? 'player' : os > ps ? 'opp' : 'draw';
    if (winner === 'draw') {
      if (p.element === 'lotus' && o.element !== 'lotus') winner = 'player';
      else if (o.element === 'lotus' && p.element !== 'lotus') winner = 'opp';
    }
    return { player: p, opp: o, pScore: ps, oScore: os, winner };
  }

  aiLead(): PaiShoTile {
    const h = this.oHand;
    let pick: PaiShoTile;
    if (this.skill <= 0) pick = this.rng.pick(h);
    else if (this.skill === 1) pick = h.reduce((m, t) => (t.value > m.value ? t : m), h[0]);
    else {
      const sorted = [...h].sort((a, b) => a.value - b.value);
      pick = sorted[Math.floor(sorted.length / 2)];
    }
    this.oLead = pick;
    return pick;
  }

  aiRespond(p: PaiShoTile): PaiShoTile {
    const h = this.oHand;
    if (this.skill <= 0) return this.rng.pick(h);
    const winners = h.filter((t) => this.compare(p, t).winner === 'opp');
    if (winners.length) {
      if (this.skill >= 2) return winners.reduce((m, t) => (t.value < m.value ? t : m), winners[0]);
      return winners.reduce((m, t) => (t.value > m.value ? t : m), winners[0]);
    }
    return h.reduce((m, t) => (t.value < m.value ? t : m), h[0]);
  }

  play(pIndex: number, oTile?: PaiShoTile): RoundResult {
    const p = this.pHand[pIndex];
    const o = oTile ?? (this.playerLeads ? this.aiRespond(p) : (this.oLead ?? this.aiLead()));
    this.pHand.splice(pIndex, 1);
    this.oHand.splice(this.oHand.indexOf(o), 1);
    const r = this.compare(p, o);
    if (r.winner === 'player') this.pWins++;
    if (r.winner === 'opp') this.oWins++;
    this.history.push(r);
    this.round++;
    this.oLead = null;
    return r;
  }
}

export function playerDeck(owned: Record<string, number>, data: PaiShoData, max = 12): string[] {
  const out: string[] = [];
  for (const [id, n] of Object.entries(owned)) for (let i = 0; i < n; i++) out.push(id);
  const val = new Map(data.tiles.map((t) => [t.id, t.value + t.rarity * 0.1]));
  out.sort((a, b) => (val.get(b) ?? 0) - (val.get(a) ?? 0));
  return out.slice(0, max);
}
