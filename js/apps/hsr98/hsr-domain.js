(function (H) {
  'use strict';

  const FUELV_MAX = 1000;

  H.ITEMS.fuelv = { name: 'Топливный купон', kind: 'key', rar: 4, price: 0, text: 'Вместе с энергией освоения позволяет быстро получить материалы чашелистов и Застойных теней. 1 купон на каждые 10 энергии. Держать можно не больше ' + FUELV_MAX + '.', note: 'Тратится в окне испытания.' };

  const RUNS = { golden: 24, crimson: 24, shadow: 8, cavern: 6, echo: 1 };
  const QUICK = { golden: true, crimson: true, shadow: true };
  const QUICK_MAX = 10, COUPON_POWER = 10, WAVE_FOES = 3;

  const domain = id => H.CALYX.find(c => c.id === id) || null;
  const kindOf = c => H.guideCalyxKind(c);
  const isWaves = c => kindOf(c) === 'golden' || kindOf(c) === 'crimson';
  const coupons = c => Math.ceil(c.cost / COUPON_POWER);

  const P = H.Game.prototype;

  Object.assign(P, {
    domainKind(id) { const c = domain(id); return c ? kindOf(c) : null; },

    domainRunCap(id) { const c = domain(id); return c ? RUNS[kindOf(c)] || 1 : 0; },

    domainCoupons(id) { const c = domain(id); return c && QUICK[kindOf(c)] ? coupons(c) : 0; },

    powerAuto() { return this.guideState().autoPower !== false; },

    setPowerAuto(on) { this.guideState().autoPower = !!on; },

    domainPref(id) {
      const runs = this.guideState().runs || {};
      return runs[id] || { n: 1, tier: 0 };
    },

    setDomainPref(id, n, tier) {
      const g = this.guideState();
      (g.runs || (g.runs = {}))[id] = { n: Math.max(1, Math.floor(n) || 1), tier: Math.max(0, tier | 0) };
    },

    domainReady(id, tier) {
      const c = domain(id), t = H.CALYX_TIERS[tier];
      if (!c || !this.calyxOpen(c)) return 'closed';
      if (!t || (t.need && !this.cond(t.need))) return 'tier';
      return null;
    },

    domainRunMax(id, tier) {
      const c = domain(id);
      if (!c || this.domainReady(id, tier)) return 0;
      const cap = RUNS[kindOf(c)] || 1;
      if (cap === 1) return 1;
      const p = this.powerInfo(), have = p.cur + (this.powerAuto() ? p.res : 0);
      return Math.min(cap, Math.floor(have / c.cost));
    },

    powerAutoTake(need) {
      const s = this.powerSync(), short = need - s.power;
      if (short <= 0) return 0;
      if (!this.powerAuto() || s.powerRes < short || s.power + short > H.TUNING.powerTop) return null;
      return this.powerFromReserve(short);
    },

    powerShort(need) { return Math.max(0, need - this.powerSync().power); },

    invSnap() {
      const s = this.state;
      return { items: Object.assign({}, s.inv.items), credits: s.credits, jade: s.jade, relics: new Set(s.inv.relics.map(r => r.uid)) };
    },

    invDelta(a) {
      const s = this.state, items = {};
      for (const [id, n] of Object.entries(s.inv.items)) { const d = n - (a.items[id] || 0); if (d > 0) items[id] = d; }
      return { items, credits: Math.max(0, s.credits - a.credits), jade: Math.max(0, s.jade - a.jade), relics: s.inv.relics.filter(r => !a.relics.has(r.uid)).map(r => r.uid) };
    },

    domainExp(id, tier) {
      const c = domain(id), lvl = H.CALYX_TIERS[tier].lvl, exp = (e, lv) => H.ENEMIES[e] ? H.enemyExp(lv, H.ENEMIES[e].exp) : 0;
      if (c.boss) return exp(c.boss, lvl + 2) + (c.adds || []).reduce((a, e) => a + exp(e, lvl), 0);
      const pool = c.pool || [];
      return pool.length ? Math.round(pool.reduce((a, e) => a + exp(e, lvl), 0) / pool.length * WAVE_FOES) : 0;
    },

    calyxWaves(c, tier, n) {
      const lvl = H.CALYX_TIERS[tier].lvl, out = [];
      for (let w = 0; w < n; w++) { const list = []; for (let i = 0; i < WAVE_FOES; i++) list.push(this.rng.pick(c.pool) + ':' + lvl); out.push(list); }
      return out;
    },

    targetRowNeeds(id) {
      const key = this.guideTarget();
      return key ? this.targetNeeds(key).filter(x => x.row && x.row.id === id) : [];
    },

    quickWhy(id, tier) {
      const c = domain(id);
      if (!c || !QUICK[kindOf(c)]) return 'kind';
      const r = this.domainReady(id, tier);
      if (r) return r;
      if (this.state.su || this.battle || this.script || (this.fhRun && this.fhRun())) return 'place';
      return null;
    },

    quickMax(id, tier) {
      const c = domain(id);
      if (this.quickWhy(id, tier)) return 0;
      return Math.max(0, Math.min(QUICK_MAX, Math.floor(this.powerSync().power / c.cost), Math.floor((this.state.inv.items.fuelv || 0) / coupons(c))));
    },

    quickFarm(id, tier, n, o = {}) {
      const c = domain(id), why = this.quickWhy(id, tier);
      n = Math.floor(n);
      if (why) return { ok: false, why };
      if (!(n > 0) || n > QUICK_MAX) return { ok: false, why: 'count' };
      if (this.powerSync().power < c.cost * n) return { ok: false, why: 'power', short: c.cost * n - this.state.power };
      if ((this.state.inv.items.fuelv || 0) < coupons(c) * n) return { ok: false, why: 'fuelv' };
      const before = this.invSnap(), watch = o.target === false ? [] : this.targetRowNeeds(id), exp = this.domainExp(id, tier);
      let runs = 0, stopped = null;
      while (runs < n) {
        this.take({ items: { fuelv: coupons(c) } });
        this.calyxReward({ id, tier, cost: c.cost });
        this.addTrailExp(exp);
        runs++;
        if (watch.length && !this.targetRowNeeds(id).length) { if (runs < n) stopped = 'target'; break; }
      }
      return { ok: true, runs, n, left: n - runs, stopped, delta: this.invDelta(before), spent: { power: c.cost * runs, fuelv: coupons(c) * runs }, exp: exp * runs };
    }
  });

  const baseStartCalyx = P.startCalyx;
  P.startCalyx = function (id, tier, n = 1, run = null) {
    const c = domain(id);
    if (!c || this.domainReady(id, tier)) return false;
    n = Math.max(1, Math.min(RUNS[kindOf(c)] || 1, Math.floor(n) || 1));
    const total = c.cost * (run ? 1 : n);
    if (this.powerSync().power < total && this.powerAutoTake(total) === null && !(c.reward === 'echo' && !this.echoLeft())) return false;
    this.calyxLast = { id, tier, n: run ? run.n : n };
    if (isWaves(c) && n > 1) {
      const lvl = H.CALYX_TIERS[tier].lvl;
      this.startBattle({ waves: this.calyxWaves(c, tier, n), lvl, boss: false, noFlee: false, bg: 'sim', music: c.music || 'battle', calyx: { id, tier, cost: c.cost, n }, noContact: true });
      this.calyxRun = null;
      return true;
    }
    if (c.reward === 'echo' && !this.echoLeft() && this.state.power < c.cost) {
      const keep = this.state.power;
      this.state.power = c.cost;
      const ok = baseStartCalyx.call(this, id, tier);
      this.state.power = keep;
      if (!ok) return false;
    } else if (!baseStartCalyx.call(this, id, tier)) return false;
    if (!isWaves(c) && (run || n > 1)) {
      this.calyxRun = run || { id, tier, n, k: 1, wins: 0, before: this.invSnap() };
      this.battleCtx.calyx.run = this.calyxRun;
    } else this.calyxRun = null;
    return true;
  };

  const baseEnd = P.endBattle;
  P.endBattle = function () {
    const b = this.battle, ctx = this.battleCtx, cx = ctx && ctx.calyx;
    if (!b || !b.over || !cx) return baseEnd.call(this);
    const before = this.invSnap(), n = cx.n || 1, out = baseEnd.call(this);
    if (!out) return out;
    if (n > 1) {
      const done = out.win ? n : b.wave;
      if (out.win) for (let i = 1; i < n; i++) out.items.push(...this.calyxReward(cx));
      else if (done > 0) {
        for (let i = 0; i < done; i++) this.calyxReward(cx);
        if (ctx.lost) { ctx.o.waves = ctx.o.waves.slice(done); cx.n = n - done; }
      }
      out.waves = { done, n };
    }
    out.calyx = { id: cx.id, tier: cx.tier, delta: this.invDelta(before) };
    const run = cx.run;
    if (run) {
      if (out.win) run.wins++;
      out.series = { k: run.k, n: run.n, wins: run.wins, more: !!out.win && run.k < run.n, lost: !out.win };
      if (!out.win && !ctx.lost) run.done = true;
      if (!out.series.more && out.win) { run.done = true; out.series.total = this.invDelta(run.before); }
    }
    return out;
  };

  Object.assign(P, {
    calyxNext() {
      const run = this.calyxRun;
      if (!run || run.done || run.k >= run.n || this.battle) return { ok: false, why: 'done' };
      const c = domain(run.id);
      if (this.powerSync().power < c.cost && this.powerAutoTake(c.cost) === null) return { ok: false, why: 'power', short: this.powerShort(c.cost) };
      run.k++;
      if (!this.startCalyx(run.id, run.tier, 1, run)) { run.k--; return { ok: false, why: 'closed' }; }
      return { ok: true, k: run.k, n: run.n };
    },

    calyxStop() {
      const run = this.calyxRun;
      if (!run) return null;
      run.done = true;
      this.calyxRun = null;
      return { k: run.k, n: run.n, wins: run.wins, total: this.invDelta(run.before) };
    },

    calyxRepeat() {
      const last = this.calyxLast;
      if (!last || this.battle) return false;
      const n = Math.min(last.n, this.domainRunMax(last.id, last.tier));
      return n > 0 && this.startCalyx(last.id, last.tier, n);
    }
  });

  const baseRetry = P.retryBattle;
  P.retryBattle = function () {
    const ctx = this.battleCtx, cx = ctx && ctx.lost && ctx.calyx;
    if (cx) {
      const need = cx.cost * (cx.n || 1);
      if (this.powerSync().power < need && this.powerAutoTake(need) === null) { this.giveUpBattle(); return false; }
    }
    return baseRetry.call(this);
  };

  const baseGiveUp = P.giveUpBattle;
  P.giveUpBattle = function () {
    const ctx = this.battleCtx;
    if (ctx && ctx.calyx && ctx.calyx.run) { ctx.calyx.run.done = true; this.calyxRun = null; }
    return baseGiveUp.call(this);
  };

  const baseGive = P.give;
  P.give = function (g) {
    const n = g && g.items && g.items.fuelv;
    if (!n) return baseGive.call(this, g);
    const room = Math.max(0, FUELV_MAX - (this.state.inv.items.fuelv || 0)), put = Math.min(n, room), items = Object.assign({}, g.items);
    if (put > 0) items.fuelv = put; else delete items.fuelv;
    const out = baseGive.call(this, Object.assign({}, g, { items }));
    if (put < n) out.push('Топливный купон: предел ' + FUELV_MAX + ', лишнее не поместилось');
    return out;
  };

  const MAIL = {
    id: 'fuelv_gift', from: 'Пом-Пом', title: 'Топливные купоны', need: 'express_intro',
    give: { items: { fuelv: 100 } },
    text: [
      'Пассажиры Экспресса!',
      'Пом-Пом нашёл в кладовой целую пачку талонов на топливо. С ними Симулятор не гоняет вас по одному бою: покажите купон вместе с энергией освоения, и материалы чашелиста или Застойной тени сразу окажутся в рюкзаке.',
      'Один купон на каждые 10 энергии, Тени берут три. Пещеры коррозии и Эхо войны купонов не принимают: там надо драться самим.',
      'Не потеряйте! Больше тысячи Пом-Пом всё равно не выдаст.'
    ]
  };
  if (H.MAIL && !H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);

  Object.assign(H, { FUELV_MAX, DOMAIN_QUICK_MAX: QUICK_MAX });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
