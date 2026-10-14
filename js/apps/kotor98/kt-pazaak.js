(function (K) {
  'use strict';

  K.PAZAAK_OPP = {
    lena: { n: 'Лена', npc: 'lena_pazaak', wager: 50, deck: ['card_p2', 'card_p3', 'card_m2', 'card_m3', 'card_p4', 'card_m4', 'card_p1', 'card_m1', 'card_f1', 'card_p5'], skill: 0.7, after: 'lena_after' },
    gambler: { n: 'Гамблер', npc: 'gambler', wager: 100, deck: ['card_f2', 'card_f3', 'card_m2', 'card_m3', 'card_p4', 'card_m4', 'card_p3', 'card_m1', 'card_f1', 'card_p2'], skill: 0.9, after: 'gambler_after' },
    vulkar: { n: 'Вулкар-картёжник', npc: null, wager: 30, deck: ['card_p1', 'card_p2', 'card_p3', 'card_m1', 'card_m2', 'card_m3', 'card_p4', 'card_m4', 'card_p5', 'card_m5'], skill: 0.5 }
  };

  function cardOf(id) {
    const it = K.ITEMS[id];
    return { id, v: it.card.v, kind: it.card.kind };
  }

  class Pazaak {
    constructor(o) {
      this.rng = o.rng || new K.RNG(1);
      this.opp = o.opp;
      this.oppId = o.oppId;
      this.wager = o.wager || 0;
      this.sets = { player: 0, opp: 0 };
      this.hands = { player: this.drawHand(o.playerSide), opp: this.drawHand(o.opp.deck) };
      this.winner = null;
      this.setNo = 0;
      this.first = 'player';
      this.msg = '';
      this.log = [];
      this.startSet();
    }

    drawHand(side) {
      const s = side.slice();
      this.rng.shuffle(s);
      return s.slice(0, 4).map(cardOf);
    }

    freshSide() { return { cards: [], total: 0, stood: false, bust: false, played: false }; }

    startSet() {
      this.setNo++;
      this.deck = [];
      for (let v = 1; v <= 10; v++) for (let i = 0; i < 4; i++) this.deck.push(v);
      this.rng.shuffle(this.deck);
      this.side = { player: this.freshSide(), opp: this.freshSide() };
      this.phase = 'turn';
      this.turn = this.first;
      this.beginTurn();
    }

    other(w) { return w === 'player' ? 'opp' : 'player'; }

    beginTurn() {
      const s = this.side[this.turn];
      if (s.stood) { this.turn = this.other(this.turn); if (this.side[this.turn].stood) { this.resolveSet(); return; } }
      const cur = this.side[this.turn];
      cur.played = false;
      const v = this.deck.pop();
      cur.cards.push({ v, main: true });
      cur.total += v;
      if (cur.cards.length >= 9 && cur.total <= 20) { this.msg = (this.turn === 'player' ? 'Вы' : this.opp.n) + ': девять карт!'; this.endSet(this.turn); return; }
    }

    canPlay(i) { return this.phase === 'turn' && this.turn === 'player' && !this.side.player.played && !!this.hands.player[i]; }

    playCard(who, i, sign) {
      const s = this.side[who];
      const c = this.hands[who][i];
      if (!c || s.played || this.phase !== 'turn' || this.turn !== who) return false;
      let v = c.v;
      if (c.kind === '±') v = sign < 0 ? -c.v : c.v;
      s.cards.push({ v, side: true, kind: c.kind });
      s.total += v;
      s.played = true;
      this.hands[who].splice(i, 1);
      this.log.push((who === 'player' ? 'Вы' : this.opp.n) + ' играет ' + (v > 0 ? '+' : '') + v);
      if (s.cards.length >= 9 && s.total <= 20) { this.endSet(who); }
      return true;
    }

    endTurn(who) {
      if (this.phase !== 'turn' || this.turn !== who) return;
      const s = this.side[who];
      if (s.total > 20) { s.bust = true; this.msg = (who === 'player' ? 'Вы' : this.opp.n) + ': перебор!'; this.endSet(this.other(who)); return; }
      this.passTurn();
    }

    stand(who) {
      if (this.phase !== 'turn' || this.turn !== who) return;
      const s = this.side[who];
      if (s.total > 20) { s.bust = true; this.msg = (who === 'player' ? 'Вы' : this.opp.n) + ': перебор!'; this.endSet(this.other(who)); return; }
      s.stood = true;
      this.log.push((who === 'player' ? 'Вы' : this.opp.n) + ' остаётся на ' + s.total);
      if (this.side[this.other(who)].stood) { this.resolveSet(); return; }
      this.passTurn();
    }

    passTurn() {
      const o = this.other(this.turn);
      if (this.side[o].stood) {
        if (this.side[this.turn].stood) { this.resolveSet(); return; }
        this.beginTurnFor(this.turn);
        return;
      }
      this.turn = o;
      this.beginTurnFor(o);
    }

    beginTurnFor(who) {
      this.turn = who;
      const cur = this.side[who];
      cur.played = false;
      const v = this.deck.pop();
      cur.cards.push({ v, main: true });
      cur.total += v;
      if (cur.cards.length >= 9 && cur.total <= 20) { this.msg = (who === 'player' ? 'Вы' : this.opp.n) + ': девять карт!'; this.endSet(who); }
    }

    resolveSet() {
      const p = this.side.player.total, o = this.side.opp.total;
      if (p === o) { this.msg = 'Ничья в сете (' + p + ')'; this.endSet(null); return; }
      this.msg = p > o ? 'Вы выиграли сет: ' + p + ' против ' + o : this.opp.n + ' выигрывает сет: ' + o + ' против ' + p;
      this.endSet(p > o ? 'player' : 'opp');
    }

    endSet(w) {
      this.phase = 'setEnd';
      this.setWinner = w;
      if (w) this.sets[w]++;
      if (this.sets.player >= 3) { this.winner = 'player'; this.phase = 'end'; this.msg = 'Вы выиграли партию! +' + this.wager + ' кр.'; }
      else if (this.sets.opp >= 3) { this.winner = 'opp'; this.phase = 'end'; this.msg = this.opp.n + ' выигрывает партию. −' + this.wager + ' кр.'; }
      this.first = w ? this.other(w) : this.first;
    }

    nextSet() { if (this.phase === 'setEnd') this.startSet(); }

    aiTurn() {
      if (this.phase !== 'turn' || this.turn !== 'opp') return;
      const s = this.side.opp, ps = this.side.player;
      const hand = this.hands.opp;
      const skill = this.opp.skill || 0.7;
      const target = ps.stood ? ps.total : 0;
      let bestI = -1, bestSign = 1, bestTot = s.total;
      for (let i = 0; i < hand.length; i++) {
        const c = hand[i];
        const signs = c.kind === '±' ? [1, -1] : [1];
        for (const sg of signs) {
          const v = c.kind === '±' ? c.v * sg : c.v;
          const t = s.total + v;
          if (t > 20) continue;
          const good = (s.total > 20 && t <= 20) || (t >= 19 && t > bestTot) || (ps.stood && t > target && t >= bestTot && s.total <= target);
          if (good && (bestI < 0 || t > bestTot)) { bestI = i; bestSign = sg; bestTot = t; }
        }
      }
      if (bestI >= 0 && (s.total > 20 || this.rng.next() < skill || bestTot === 20)) this.playCard('opp', bestI, bestSign);
      if (this.phase !== 'turn') return;
      const t = s.total;
      if (t > 20) { this.endTurn('opp'); return; }
      if (ps.stood) {
        if (ps.total > 20) { this.stand('opp'); return; }
        if (t > ps.total || (t === ps.total && t >= 18)) { this.stand('opp'); return; }
        this.endTurn('opp');
        return;
      }
      if (t >= 18 || (t === 17 && this.rng.next() < 0.5)) { this.stand('opp'); return; }
      this.endTurn('opp');
    }
  }

  K.Pazaak = Pazaak;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
