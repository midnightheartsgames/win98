(function (H) {
  'use strict';
  const CW = H.CW;
  const GP = H.Game.prototype;
  const WEEK_MS = 2 * 3600000;

  const ASC_REW = {};
  const put = (lvls, g) => { for (const l of lvls) ASC_REW[l] = g; };
  put([1, 11, 21, 31, 41, 18], { credits: 15000 });
  put([2, 12, 22, 42, 29], { items: { tears: 24 } });
  put([3, 13, 23, 33, 43, 19], { items: { remains: 60 } });
  put([4, 14, 24, 34, 44, 9, 38], { items: { exp3: 6 } });
  put([5, 15, 35, 45, 20, 30], { jade: 120 });
  put([6, 16, 26, 36, 46, 49], { items: { exp1: 12 } });
  put([7, 17, 27, 37, 47, 39], { items: { exp2: 8 } });
  put([8, 28, 48], { items: { fuelv: 24 } });
  put([10, 32], { items: { tracks: 1 } });
  put([25, 50], { items: { resin: 1 } });
  put([40], { plate: 'Последний победитель' });

  const META = {
    ascPer: 800, ascMax: 50, ascWin: [600, 800, 1000, 1300, 1600, 2000, 2300, 2500, 2700], ascLoss: 0.5, ascQuick: 0.75, dbl: 3000,
    weekMax: 18000, weekQuick: 0.67, weekMs: WEEK_MS,
    week: [[1800, { items: { fuelv: 2 } }], [3600, { jade: 60 }], [5400, { items: { exp3: 6 } }], [7200, { items: { pass: 1 } }], [9000, { items: { tears: 30 } }], [10800, { credits: 30000 }], [12600, { jade: 60 }], [14400, { items: { remains: 60 } }], [16200, { items: { resin: 1 } }], [18000, { items: { tracks: 1 } }]],
    rank: [{ pts: 500, items: { exp2: 6 } }, { pts: 500, items: { exp2: 6 } }, { pts: 1000, jade: 100 }, { pts: 1000, jade: 100 }, { pts: 1000, jade: 100 }, { pts: 1000, jade: 100 }, { pts: 1000, jade: 100 }, { pts: 500, jade: 50 }, { pts: 500, jade: 50 }],
    notesWin: 40, notesWinA5: 60, notesLoss: 10, notesQuick: 2 / 3,
    asc: ASC_REW
  };

  const idxOf = (t, s) => CW.rankIndex(t, s);
  const lastIdx = () => idxOf(CW.RANKS.length - 1, CW.RANKS[CW.RANKS.length - 1].subs);
  function rankAt(i) {
    let t = 0;
    while (t < CW.RANKS.length - 1 && i >= CW.RANKS[t].subs) { i -= CW.RANKS[t].subs; t++; }
    return { tier: t, sub: Math.min(CW.RANKS[t].subs, i + 1) };
  }
  const gate = r => r.tier >= 5 && r.tier < CW.RANKS.length - 1 && r.sub === CW.RANKS[r.tier].subs;

  Object.assign(GP, {
    cwMeta() {
      const C = this.cw();
      if (!C.rank) C.rank = { best: 0 };
      if (!C.asc) C.asc = { pts: 0, got: [] };
      if (!C.rankGot) C.rankGot = [];
      if (C.notes == null) C.notes = 0;
      const key = Math.floor(this.now() / WEEK_MS);
      if (!C.week || C.week.key !== key) C.week = { key, pts: 0, got: [], dbl: META.dbl };
      return C;
    },

    cwRankBest() { return rankAt(this.cwMeta().rank.best); },

    cwGate() { return gate(this.cwRankBest()); },

    cwAscLvl() { return Math.min(META.ascMax, Math.floor(this.cwMeta().asc.pts / META.ascPer)); },

    cwWeekLeft() { return WEEK_MS - (this.now() % WEEK_MS); },

    cwRunPreview(mode, tier) {
      const C = this.cwMeta(), base = META.ascWin[tier] * (mode === 'quick' ? META.ascQuick : 1);
      const bonus = Math.min(base, C.week.dbl);
      return { asc: Math.round(base), bonus: Math.round(bonus), dblPct: base ? Math.round(100 * bonus / base) : 0, week: Math.round(mode === 'quick' ? META.weekMax * META.weekQuick : META.weekMax), weekNow: C.week.pts };
    },

    cwMetaClose(run, cleared, sum) {
      const C = this.cwMeta(), quick = run.mode === 'quick', frac = Math.max(0, Math.min(1, sum.node / Math.max(1, sum.nodes)));
      const out = { rankFrom: C.rank.best, rankTo: C.rank.best, promo: !!run.promo };
      let asc = META.ascWin[run.tier] * (cleared ? 1 : META.ascLoss * frac) * (quick ? META.ascQuick : 1);
      asc = Math.round(asc);
      const bonus = Math.min(asc, C.week.dbl);
      C.week.dbl -= bonus;
      out.asc = asc; out.ascBonus = bonus;
      const lv0 = this.cwAscLvl();
      C.asc.pts += asc + bonus;
      out.ascLvl = [lv0, this.cwAscLvl()];
      const wk = cleared && !quick ? META.weekMax : Math.round(META.weekMax * frac * (quick ? META.weekQuick : 1));
      const room = Math.max(0, META.weekMax - C.week.pts);
      out.week = Math.min(room, wk);
      C.week.pts += out.week;
      out.notes = Math.round((cleared ? (run.tier >= 5 ? META.notesWinA5 : META.notesWin) : META.notesLoss) * (quick ? META.notesQuick : 1));
      C.notes += out.notes;
      if (cleared && !quick && run.atBest) {
        if (run.promo) C.rank.best = idxOf(run.promo.tier + 1, 1);
        else {
          const cur = rankAt(C.rank.best), gain = sum.rankGain || 0;
          let to = Math.min(lastIdx(), C.rank.best + gain);
          if (cur.tier >= 5 && cur.tier < CW.RANKS.length - 1) to = Math.min(to, idxOf(cur.tier, CW.RANKS[cur.tier].subs));
          C.rank.best = Math.max(C.rank.best, to);
        }
      }
      out.rankTo = C.rank.best;
      sum.rankGain = out.rankTo - out.rankFrom;
      sum.meta = out;
      return out;
    },

    cwClaimAsc(lvl) {
      const C = this.cwMeta(), R = ASC_REW[lvl];
      if (!R || lvl > this.cwAscLvl() || C.asc.got.includes(lvl)) return null;
      C.asc.got.push(lvl);
      if (R.plate) { C.plate = R.plate; return ['плашка «' + R.plate + '»']; }
      return this.give(R);
    },

    cwClaimWeek(i) {
      const C = this.cwMeta(), R = META.week[i];
      if (!R || C.week.pts < R[0] || C.week.got.includes(i)) return null;
      C.week.got.push(i);
      return this.give(R[1]);
    },

    cwClaimRank(t) {
      const C = this.cwMeta(), R = META.rank[t];
      if (!R || this.cwRankBest().tier < t || C.rankGot.includes(t)) return null;
      C.rankGot.push(t);
      C.asc.pts += R.pts;
      return [R.pts + ' очков продвижения'].concat(this.give(R));
    },

    cwClaimable() {
      const C = this.cwMeta(), lv = this.cwAscLvl();
      return {
        asc: Object.keys(ASC_REW).map(Number).filter(l => l <= lv && !C.asc.got.includes(l)).length,
        week: META.week.filter((w, i) => C.week.pts >= w[0] && !C.week.got.includes(i)).length,
        rank: META.rank.filter((r, t) => this.cwRankBest().tier >= t && !C.rankGot.includes(t)).length,
        links: this.cwClaimMore ? this.cwClaimMore().links : 0, bank: this.cwClaimMore ? this.cwClaimMore().bank : 0,
        profit: this.cwGoals ? this.cwGoals().profit.filter(id => !this.cwGoals().pgot.includes(id)).length : 0,
        guide: this.cwGoals ? this.cwGoals().done.filter(k => !this.cwGoals().got.includes(k)).length : 0
      };
    }
  });

  const new0 = GP.cwNew;
  GP.cwNew = function (o = {}) {
    const C = this.cwMeta(), best = this.cwRankBest(), mode = o.mode || 'standard';
    const tier = o.tier | 0, sub = o.sub || 1, at = idxOf(tier, sub) === C.rank.best;
    const promo = at && mode === 'standard' && gate(best);
    const run = new0.call(this, promo ? Object.assign({}, o, { tier: tier + 1, sub: 6 }) : o);
    run.atBest = at;
    if (promo) { run.promo = { tier }; C.pick = { mode, tier, sub }; }
    return run;
  };

  const close0 = GP.cwClose;
  GP.cwClose = function (run, cleared) {
    const sum = close0.call(this, run, cleared);
    this.cwMetaClose(run, cleared, sum);
    const h = this.cw().hist[0];
    if (h) Object.assign(h, { rankGain: sum.rankGain, meta: sum.meta });
    return sum;
  };

  CW.META = META;
  CW.rankAt = rankAt;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
