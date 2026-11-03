(function (H) {
  'use strict';
  const PF = H.PF, TUN = PF.TUN, P = H.Game.prototype;
  const sum = list => list.reduce((x, y) => x + y, 0);
  const tierGift = t => ({ jade: t.jade, credits: t.credits, items: t.feather ? { feather: t.feather } : {} });
  const fictionGift = () => { const { credits, ...items } = PF.FICTION; return { credits, items }; };
  const mergeGifts = list => {
    const out = { jade: 0, credits: 0, items: {} };
    for (const g of list) {
      out.jade += g.jade || 0;
      out.credits += g.credits;
      for (const [id, n] of Object.entries(g.items)) out.items[id] = (out.items[id] || 0) + n;
    }
    return out;
  };

  Object.assign(P, {
    pf() {
      const s = this.state;
      if (s.pf && s.pf.period != null) return s.pf;
      const old = s.pf || {}, F = Object.assign({ plan: {}, st: {}, run: null, seen: {}, tut: false, free: {}, got: [], fiction: [], hist: [], top3: 0, tale: 0 }, old);
      if (!old.st) F.run = null;
      delete F.proto;
      F.period = this.pfPeriod();
      s.pf = F;
      return F;
    },

    pfPeriod() { return Math.floor(H.FH.dayNum(this.now()) / TUN.days); },

    pfSeason() { return PF.SEASONS[this.pf().period % PF.SEASONS.length]; },

    pfUnlocked() { return !!this.state.flags.pf_open; },

    pfBlocked() {
      const s = this.state;
      return s.guest && s.party.length === 1 ? 'Пока отряд разделён, истории Юцы подождут.' : null;
    },

    pfSync() {
      const F = this.pf(), now = this.pfPeriod();
      if (now <= F.period) return false;
      const paid = this.pfClaimAll(), season = this.pfSeason(), stages = season.stages, dropped = !!F.run;
      const top = stages.reduce((best, s) => (this.pfStars(s.n) === TUN.stars.length ? s.n : best), 0);
      F.hist = F.hist.concat({ period: F.period, season: season.id, stars: this.pfStarTotal(), best: stages.map(s => (F.st[s.n] ? F.st[s.n].best : 0)) }).slice(-TUN.histMax);
      F.top3 = Math.min(top, TUN.quickMax);
      F.period = now;
      Object.assign(F, { st: {}, got: [], fiction: [], free: {}, seen: {}, run: null });
      for (let n = 1; n <= F.top3; n++) {
        const nodes = this.pfStage(n).nodes;
        F.st[n] = { best: 0, nodes: nodes.map(() => 0), stars: TUN.stars.map(() => true), clear: true, quick: true, team: nodes.map(() => []), caco: [] };
        F.free[n] = true;
      }
      this.toast('Чистый вымысел обновлён');
      if (dropped) this.toast('Сезон сменился, незавершённая история закрыта.');
      if (paid.length) this.toast('Незабранные награды прошлого сезона: ' + paid.join(', '));
      return true;
    },

    pfRefresh() { return this.pfUnlocked() && !this.battle && this.pfSync(); },

    pfTiers() {
      const F = this.pf(), have = this.pfStarTotal();
      return PF.STAR_TIERS.map(t => Object.assign({}, t, { ready: have >= t.need, got: F.got.includes(t.need) }));
    },

    pfFictions() {
      const F = this.pf();
      return this.pfSeason().stages.map(s => ({ n: s.n, ready: !!(F.st[s.n] && F.st[s.n].clear), got: F.fiction.includes(s.n) }));
    },

    pfClaimTier(need) {
      const t = this.pfTiers().find(x => x.need === need);
      if (!t || !t.ready || t.got) return null;
      this.pf().got.push(need);
      return this.give(tierGift(t));
    },

    pfClaimFiction(n) {
      const f = this.pfFictions().find(x => x.n === n);
      if (!f || !f.ready || f.got) return null;
      this.pf().fiction.push(n);
      return this.give(fictionGift());
    },

    pfClaimAll() {
      const F = this.pf(), tiers = this.pfTiers().filter(t => t.ready && !t.got), stages = this.pfFictions().filter(f => f.ready && !f.got);
      if (!tiers.length && !stages.length) return [];
      for (const t of tiers) F.got.push(t.need);
      for (const f of stages) F.fiction.push(f.n);
      return this.give(mergeGifts(tiers.map(tierGift).concat(stages.map(() => fictionGift()))));
    },

    pfDue() { return this.pfTiers().filter(t => t.ready && !t.got).length + this.pfFictions().filter(f => f.ready && !f.got).length; },

    pfAlert() { return this.pfUnlocked() && (!this.pf().seen[this.pfSeason().id] || this.pfDue() > 0); },

    guidePf() {
      const total = PF.STAR_TIERS.length;
      if (!this.pfUnlocked()) return { kind: 'pf', id: 'pf', open: false, why: 'Чистый вымысел откроется после прохождения миссии «Мастерское приукрашивание Юцы»', stars: 0, total };
      this.pfRefresh();
      const season = this.pfSeason(), why = this.pfBlocked();
      return { kind: 'pf', id: 'pf', open: !why, why, name: season.name, whim: season.whim.name, shield: season.id, stars: this.pfStarTotal(), total, days: this.pfDaysLeft(), stages: this.pfMapInfo(), tiers: this.pfTiers(), fictions: this.pfFictions(), due: this.pfDue() };
    },

    pfStage(n) { return this.pfSeason().stages[n - 1] || null; },

    pfOpen(n) {
      const before = this.pf().st[n - 1];
      return !!this.pfStage(n) && (n === 1 || !!(before && before.clear));
    },

    pfTopStage() {
      let n = 1;
      while (this.pfOpen(n + 1)) n++;
      return n;
    },

    pfStars(n) {
      const st = this.pf().st;
      for (let k = n + 1; this.pfStage(k); k++) if (st[k] && st[k].stars.every(Boolean)) return TUN.stars.length;
      return st[n] ? st[n].stars.filter(Boolean).length : 0;
    },

    pfDaysLeft() { return Math.max(1, (this.pf().period + 1) * TUN.days - H.FH.dayNum(this.now())); },

    pfFirstStage() {
      const st = this.pf().st, list = this.pfSeason().stages, open = list.find(s => this.pfOpen(s.n) && !(st[s.n] && st[s.n].clear));
      return (open || list[list.length - 1]).n;
    },

    pfMapInfo() {
      const F = this.pf();
      return this.pfSeason().stages.map(s => ({ n: s.n, open: this.pfOpen(s.n), clear: !!(F.st[s.n] && F.st[s.n].clear), quick: !!(F.st[s.n] && F.st[s.n].quick), best: F.st[s.n] ? F.st[s.n].best : 0, stars: this.pfStars(s.n), free: !!F.free[s.n] }));
    },

    pfStarTotal() { return sum(this.pfSeason().stages.map(s => this.pfStars(s.n))); },

    pfHeroes() {
      const r = this.state.roster;
      return Object.keys(r).filter(k => !r[k].guest).sort((a, b) => r[b].lvl - r[a].lvl || a.localeCompare(b));
    },

    pfTeams(n) {
      const F = this.pf(), st = this.pfStage(n), heroes = this.pfHeroes();
      if (!F.plan[n]) {
        const first = this.state.party.filter(k => heroes.includes(k)).slice(0, 4);
        for (const k of heroes) if (first.length < 4 && !first.includes(k)) first.push(k);
        const second = heroes.filter(k => !first.includes(k)).slice(0, 4);
        F.plan[n] = { team: st.nodes.map((_, i) => (i === 0 ? first : second)), caco: st.nodes.map(() => 0) };
      }
      if (!F.plan[n].caco) F.plan[n].caco = st.nodes.map(() => 0);
      F.plan[n].team = F.plan[n].team.map(t => t.filter(k => heroes.includes(k)));
      return F.plan[n].team;
    },

    pfToggle(n, node, key) {
      const teams = this.pfTeams(n), team = teams[node], i = team.indexOf(key);
      if (i >= 0) { team.splice(i, 1); return { moved: null }; }
      if (team.length >= 4) return false;
      let moved = null;
      teams.forEach((t, j) => { if (j !== node) { const at = t.indexOf(key); if (at >= 0) { t.splice(at, 1); moved = j; } } });
      team.push(key);
      return { moved };
    },

    pfSwapRows(n) {
      this.pfTeams(n);
      const p = this.pf().plan[n];
      p.team.reverse();
      p.caco.reverse();
    },

    pfClearRows(n) {
      this.pfTeams(n);
      const p = this.pf().plan[n];
      p.team = p.team.map(() => []);
    },

    pfLoadSquad(n, node, i) {
      const teams = this.pfTeams(n), heroes = this.pfHeroes(), list = this.squadOf(i).filter(k => heroes.includes(k)).slice(0, 4);
      if (!list.length) return false;
      teams.forEach((t, j) => { if (j !== node) teams[j] = t.filter(k => !list.includes(k)); });
      teams[node] = list.slice();
      return true;
    },

    pfLoadRecord(n) {
      const F = this.pf(), rec = F.st[n];
      if (!rec || !rec.team.some(t => t.length)) return false;
      this.pfTeams(n);
      const heroes = this.pfHeroes(), ids = this.pfSeason().caco.map(c => c.id);
      F.plan[n].team = rec.team.map(t => t.filter(k => heroes.includes(k)));
      F.plan[n].caco = rec.caco.map(id => Math.max(0, ids.indexOf(id)));
      return true;
    },

    pfCaco(n, node) {
      this.pfTeams(n);
      return this.pfSeason().caco[this.pf().plan[n].caco[node]];
    },

    pfSetCaco(n, node, index) {
      this.pfTeams(n);
      this.pf().plan[n].caco[node] = index;
    },

    pfOpts(n, nodeIndex, keys, seed, cacoId) {
      const st = this.pfStage(n), node = st.nodes[nodeIndex], season = this.pfSeason();
      return {
        party: this.fhSpecs(keys), seed, techs: keys.map(k => ({ charId: this.kitOf(k), fx: H.CHARS[this.kitOf(k)].tech.fx })),
        waves: node.waves.map(() => []), lvl: st.lvl, foeHp: st.hp, foeAtk: st.atk, noFlee: true, noContact: true, boss: false,
        pf: { season: season.id, n, node: nodeIndex, lvl: st.lvl, cycles: st.cycles, waves: node.waves, rec: PF.recOf(node), whim: season.whim.id, caco: cacoId !== undefined ? cacoId : this.pfCaco(n, nodeIndex).id }
      };
    },

    pfBegin(n) {
      const F = this.pf();
      if (!this.pfOpen(n)) return null;
      const teams = this.pfTeams(n), nodes = this.pfStage(n).nodes;
      if (teams.some(t => !t.length)) return null;
      F.run = { period: F.period, season: this.pfSeason().id, n, node: 0, scores: nodes.map(() => 0), team: teams.map(t => t.slice()), caco: nodes.map((_, i) => this.pfCaco(n, i).id), seed: 0 };
      return F.run;
    },

    pfFight(seed) {
      const run = this.pf().run;
      if (!run) return null;
      const heroes = this.pfHeroes(), keys = run.team[run.node].filter(k => heroes.includes(k));
      if (!keys.length) return null;
      run.scores[run.node] = 0;
      run.seed = seed || Math.floor(Math.random() * 1e9) + 1;
      const opts = this.pfOpts(run.n, run.node, keys, run.seed, run.caco[run.node]), music = this.battleTheme();
      this.battle = new H.Battle(opts);
      this.battleCtx = { o: { pf: true }, enc: null, encId: null, ent: null, bg: 'pf', music, fromScript: false, calyx: null, opts };
      this.emit({ t: 'battle', bg: 'pf', music, boss: false });
      return this.battle;
    },

    pfReport(b) {
      const O = b.opts.pf, F = b.pf;
      return {
        season: O.season, n: O.n, node: O.node, seed: b.opts.seed, caco: O.caco, score: Math.round(F.score), end: F.end, cycles: Math.min(F.cyc, O.cycles), maxCycles: O.cycles, wave: b.wave,
        byWave: F.byWave.map(Math.round), values: TUN.waveValue.slice(), kills: sum(F.kills), total: sum(O.waves.map(PF.poolSize)), down: b.allies.filter(a => a.dead).length
      };
    },

    pfEnd(b) {
      const report = this.pfReport(b), F = this.pf(), run = F.run;
      if (run) run.scores[report.node] = report.score;
      report.sum = this.pfRunTotal();
      report.expired = !!run && this.pfPeriod() > F.period;
      if (report.expired) { this.pfFinish(); this.pfSync(); }
      const out = { win: b.result.win, fled: false, lines: [], levelUps: [], items: [], pf: report };
      this.battle = null;
      this.battleCtx = null;
      return out;
    },

    pfRunTotal() {
      const run = this.pf().run;
      return run ? sum(run.scores) : 0;
    },

    pfFinish() {
      const F = this.pf(), run = F.run, n = run.n, total = sum(run.scores), prev = F.st[n] || null, oldBest = prev ? prev.best : 0, beat = total > oldBest;
      const oldStars = prev ? prev.stars : TUN.stars.map(() => false), wasOpen = this.pfOpen(n + 1);
      if (beat) F.st[n] = { best: total, nodes: run.scores.slice(), stars: TUN.stars.map((v, i) => total >= v || oldStars[i]), clear: total >= TUN.clear || !!(prev && prev.clear), quick: false, team: run.team, caco: run.caco };
      F.run = null;
      const rec = F.st[n] || null, stars = rec ? rec.stars.slice() : oldStars;
      return { n, scores: run.scores.slice(), total, oldBest, best: Math.max(total, oldBest), beat, stars, fresh: stars.map((on, i) => on && !oldStars[i]), clear: !!(rec && rec.clear), opened: !wasOpen && this.pfOpen(n + 1) };
    },

    pfLeave() { this.pf().run = null; },

    pfDrop() {
      this.battle = null;
      this.battleCtx = null;
    }
  });

  const endBattle0 = P.endBattle;
  P.endBattle = function () {
    const b = this.battle, ctx = this.battleCtx;
    if (b && b.over && ctx && ctx.o && ctx.o.pf) return this.pfEnd(b);
    const out = endBattle0.call(this);
    this.pfRefresh();
    return out;
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
