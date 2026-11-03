(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN;

  const pathOf = id => H.CHARS[id].path;
  const heroesOf = path => Object.keys(HD.HEROES).filter(id => pathOf(id) === path);
  const draftPaths = () => HD.PATHS.filter(p => heroesOf(p).length >= 3);
  const draftRng = run => H.makeRandom((run.seed * 31 + run.draft.n++ * 977 + 5) >>> 0);
  const THREAT_IDS = () => Object.keys(HD.THREATS);
  const recOrder = (a, b) => b.wave - a.wave || b.stars - a.stars || a.time - b.time;

  function starsOf(s) {
    if (!s.win || s.base <= 0) return 0;
    const k = s.base / s.baseMax;
    return k >= 0.9 && !s.tfell ? 3 : k >= 0.5 ? 2 : 1;
  }

  function trialDone(T, s) {
    if (T.kind === 'hero') return s.win && s.hero === T.hero;
    if (T.kind === 'diff') return s.win && s.diff === T.diff;
    if (T.id === 'towers') return s.win && !s.tfell;
    if (T.id === 'nodeath') return s.win && !s.deaths;
    if (T.id === 'fastboss') return s.bossMin != null && s.bossMin < HD.META.fastBoss;
    if (T.id === 'raid') return s.raid >= HD.META.raidGold;
    if (T.id === 'hard3') return s.diff === 'hard' && s.stars === 3;
    if (T.id === 'crew2') return s.win && !!s.crew && s.crew.length === 2;
    if (T.id === 'crew4') return s.win && !!s.crew && s.crew.length === 4;
    if (T.id === 'crewstay') return s.win && !!s.crew && !!s.crewStay;
    return false;
  }

  function rollThreats(seed) {
    const rng = H.makeRandom((seed * 131 + 71) >>> 0), pool = THREAT_IDS(), a = pool.splice(rng.int(pool.length), 1)[0];
    return [a, pool[rng.int(pool.length)]];
  }

  function newRun(o) {
    const diff = HD.DIFFS[o.diff] ? o.diff : 'normal', crew = (o.heroes || []).filter(id => HD.HEROES[id]).slice(0, 4), hero = crew[0] || (HD.HEROES[o.hero] ? o.hero : null), seed = o.seed;
    const threats = o.threats && o.threats.length === 2 && o.threats.every(t => HD.THREATS[t]) && o.threats[0] !== o.threats[1] ? o.threats.slice() : rollThreats(seed);
    const player = id => ({ hero: id, lvl: 1, exp: 0, pts: 1, abil: { q: 0, e: 0, t: 0, r: 0 }, picks: {}, gold: TUN.startGold, items: [null, null, null, null, null, null], cone: null, deaths: 0, buyback: false });
    const run = {
      seed, diff, threats, wave: 1, phase: hero ? 'break' : 'draft', draft: null,
      players: (crew.length ? crew : [hero]).map(player),
      base: { hp: HD.DIFFS[diff].base }, towers: [null, null, null],
      stats: { kills: 0, dmg: 0, heal: 0, gold: 0, spent: 0, raid: 0, time: 0 }, log: []
    };
    if (!hero) {
      run.draft = { n: 0, paths: [], cards: [], pick: null };
      const rng = draftRng(run), pool = draftPaths();
      while (run.draft.paths.length < 3 && pool.length) run.draft.paths.push(pool.splice(rng.int(pool.length), 1)[0]);
      run.draft.cards = run.draft.paths.map(path => { const list = heroesOf(path), h = list[rng.int(list.length)]; return { path, hero: h, seen: [h], left: 2 }; });
    }
    return run;
  }

  function draftRefresh(run, i, taken) {
    const c = run && run.draft && run.draft.cards[i];
    if (!c || run.phase !== 'draft' || c.left <= 0) return false;
    const fresh = heroesOf(c.path).filter(id => !c.seen.includes(id) && !(taken && taken.includes(id)));
    if (!fresh.length) return false;
    const rng = draftRng(run);
    c.hero = fresh[rng.int(fresh.length)];
    c.seen.push(c.hero); c.left--;
    return true;
  }

  function draftSwap(run, c, taken) {
    const free = id => !taken.includes(id), own = heroesOf(c.path).filter(free), fresh = own.filter(id => !c.seen.includes(id));
    const pool = fresh.length ? fresh : own.length ? own : draftPaths().flatMap(heroesOf).filter(free);
    const rng = draftRng(run);
    c.hero = pool[rng.int(pool.length)];
    c.path = pathOf(c.hero);
    c.seen.push(c.hero);
  }

  function runSummary(run, p, st, win, date) {
    const sum = {
      win, wave: win ? HD.WAVES.length : run.wave, waves: HD.WAVES.length, hero: p.hero, lvl: p.lvl, diff: run.diff, threats: run.threats.slice(),
      base: run.base.hp, baseMax: HD.DIFFS[run.diff].base, towers: run.towers.filter(h => h == null || h > 0).length, tfell: st.tfell || 0,
      time: Math.round(st.time), kills: st.kills, dmg: Math.round(st.dmg), heal: Math.round(st.heal), bossMin: st.bossMin == null ? null : st.bossMin,
      gold: st.gold, spent: st.spent, raid: st.raid, deaths: p.deaths, date,
      build: { items: p.items.map(it => (it ? { id: it.id, set: it.set, slot: it.slot, up: it.up || 0, n: it.n || 0 } : null)), cone: p.cone ? { id: p.cone.id, sup: p.cone.sup } : null, tr: p.picks[10], ei: p.picks[20] }
    };
    sum.cleared = win ? HD.WAVES.length : Math.max(0, run.wave - 1);
    sum.stars = starsOf(sum);
    return sum;
  }

  Object.assign(H.Game.prototype, {
    hd() {
      const s = this.state;
      if (!s.hd) s.hd = { run: null, hist: [], opts: { aim: 'auto' }, last: null, hero: 'trail' };
      const D = s.hd;
      if (!D.recs) D.recs = [];
      if (!D.open) D.open = {};
      if (!D.asc) D.asc = { pts: 0, got: [] };
      if (!D.trials) D.trials = { done: [], got: [] };
      const key = Math.floor(this.now() / HD.META.weekMs);
      if (!D.week || D.week.key !== key) D.week = { key, pts: 0, got: [] };
      return D;
    },

    hdRun() {
      const run = this.hd().run;
      if (run && run.phase === 'wave') run.phase = 'break';
      return run;
    },

    hdCanDiff(diff) { return diff !== 'hard' || !!this.hd().open.hard; },

    hdRecords(diff, hero) {
      return this.hd().recs.concat(HD.SOLO).filter(r => !r.crew && r.diff === diff && (!hero || r.hero === hero)).sort(recOrder);
    },

    hdCrewRecords(diff, hero) {
      return this.hd().recs.filter(r => r.crew && r.diff === diff && (!hero || r.hero === hero)).sort(recOrder);
    },

    hdAscLvl() { return Math.min(HD.META.ascMax, Math.floor(this.hd().asc.pts / HD.META.ascPer)); },

    hdWeekLeft() { return HD.META.weekMs - (this.now() % HD.META.weekMs); },

    hdClaimAsc(lvl) {
      const D = this.hd(), R = HD.META.asc[lvl];
      if (!R || lvl > this.hdAscLvl() || D.asc.got.includes(lvl)) return null;
      D.asc.got.push(lvl);
      if (R.plate) { D.plate = R.plate; return ['плашка «' + R.plate + '»']; }
      return this.give(R);
    },

    hdClaimWeek(i) {
      const D = this.hd(), R = HD.META.week[i];
      if (!R || D.week.pts < R[0] || D.week.got.includes(i)) return null;
      D.week.got.push(i);
      return this.give(R[1]);
    },

    hdClaimTrial(id) {
      const D = this.hd(), T = HD.META.trial;
      if (!D.trials.done.includes(id) || D.trials.got.includes(id)) return null;
      D.trials.got.push(id);
      D.asc.pts += T.asc;
      return [T.asc + ' очков продвижения'].concat(this.give({ jade: T.jade }));
    },

    hdClaimable() {
      const D = this.hd(), lv = this.hdAscLvl();
      return {
        asc: Object.keys(HD.META.asc).map(Number).filter(l => l <= lv && !D.asc.got.includes(l)).length,
        week: HD.META.week.filter((w, i) => D.week.pts >= w[0] && !D.week.got.includes(i)).length,
        trials: D.trials.done.filter(id => !D.trials.got.includes(id)).length
      };
    },

    hdNew(o = {}) {
      const run = newRun(Object.assign({}, o, { seed: o.seed || this.rng.int(1e9) + 1 })), hero = run.players[0].hero;
      const D = this.hd();
      D.run = run; if (hero) D.hero = hero;
      return run;
    },

    hdRefresh(i) { return draftRefresh(this.hdRun(), i); },

    hdTake(i) {
      const run = this.hdRun(), c = run && run.draft && run.draft.cards[i];
      if (!c || run.phase !== 'draft') return false;
      run.players[0].hero = c.hero;
      run.draft.pick = i;
      run.phase = 'break';
      this.hd().hero = c.hero;
      return true;
    },

    hdArena(run) {
      const A = new HD.Arena({ run: run || this.hdRun() });
      return A;
    },

    hdSync(A) { const run = this.hd().run; if (run) A.toRun(run); return run; },

    hdBreak(A) {
      this.hdSync(A);
      this.events.push({ t: 'autosave' });
    },

    hdFinish(A, quit) {
      const D = this.hd(), run = D.run;
      if (!run) return D.last;
      if (!run.players[0].hero) { D.run = null; return null; }
      if (A) A.toRun(run);
      const sum = runSummary(run, run.players[0], run.stats, !quit && !!A && A.over === 'win', this.now());
      this.hdKeepResult(sum);
      D.run = null;
      return sum;
    },

    hdFinishNet(net, quit) {
      if (!net.A) return null;
      const run = net.A.toRun(net.run), p = run.players[net.seat];
      const sum = runSummary(run, p, Object.assign({}, run.stats, p.st), !quit && net.A.over === 'win', this.now());
      sum.crew = net.names.slice();
      sum.crewStay = !quit && !net.anyAway;
      sum.crewRows = run.players.map((q, i) => ({ seat: i, me: i === net.seat, name: net.names[i], hero: q.hero, lvl: q.lvl, dmg: Math.round(q.st.dmg), heal: Math.round(q.st.heal), kills: q.st.kills, gold: Math.round(q.st.gold), deaths: q.deaths }));
      this.hdKeepResult(sum);
      this.events.push({ t: 'autosave' });
      return sum;
    },

    hdKeepResult(sum) {
      const D = this.hd();
      sum.meta = this.hdMetaClose(sum);
      D.last = sum;
      D.hist.unshift({ hero: sum.hero, diff: sum.diff, wave: sum.wave, win: sum.win, base: sum.base, stars: sum.stars, date: sum.date, crew: sum.crew, sum: Object.assign({}, sum, { meta: null }) });
      if (D.hist.length > HD.META.hist) D.hist.length = HD.META.hist;
    },

    hdMetaClose(sum) {
      const D = this.hd(), M = HD.META, out = {};
      const rec = { name: this.state.name || 'Первопроходец', hero: sum.hero, diff: sum.diff, wave: sum.cleared, time: sum.time, stars: sum.stars, date: sum.date };
      if (sum.crew) rec.crew = sum.crew;
      D.recs.push(rec);
      const mine = D.recs.filter(r => r.diff === sum.diff).sort(recOrder);
      D.recs = D.recs.filter(r => r.diff !== sum.diff).concat(mine.slice(0, 40));
      out.place = this.hdRecords(sum.diff).indexOf(rec) + 1;
      out.rec = rec;
      const asc = Math.round(sum.win ? M.ascWin[sum.diff] : M.ascWin[sum.diff] * M.ascLoss * sum.cleared / sum.waves);
      const lv0 = this.hdAscLvl();
      D.asc.pts += asc;
      out.asc = asc; out.ascLvl = [lv0, this.hdAscLvl()];
      const wk = sum.win ? M.weekWin : sum.cleared * M.weekWave;
      out.week = Math.max(0, Math.min(M.weekMax - D.week.pts, wk));
      D.week.pts += out.week;
      if (sum.win && (sum.diff === 'normal' || sum.diff === 'hard')) D.open.hard = true;
      out.trials = [];
      for (const T of HD.TRIALS) if (!D.trials.done.includes(T.id) && trialDone(T, sum)) { D.trials.done.push(T.id); out.trials.push(T.id); }
      return out;
    }
  });

  Object.assign(HD, { draftPaths, heroesOf, rollThreats, starsOf, trialDone, recOrder, newRun, draftRefresh, draftSwap });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
