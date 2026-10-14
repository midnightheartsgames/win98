(function (H) {
  'use strict';
  const SU = H.SU, T = H.TUNING;
  const { sv, atkOf, alive } = H.battleStat;
  const ELEMS = ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'];
  const DOT_ELEM = { burn: 'fire', shock: 'elec', bleed: 'phys', shear: 'wind', entangle: 'quant', erode: 'elec' };
  const val = (x, lvl) => (Array.isArray(x) ? x[lvl > 1 ? 1 : 0] : x);

  function compile(run) {
    const out = { path: run.path, on: {}, stats: [], foe: [], survive: null, survived: false, res: null, names: {} };
    const add = (fx, lvl, name) => {
      for (const f of fx) {
        const r = { f, lvl, name };
        if (f.on === 'stat') out.stats.push(r);
        else if (f.on === 'foe') out.foe.push(r);
        else if (f.on === 'lethal') out.survive = r;
        else if (f.on !== 'spec') (out.on[f.on] = out.on[f.on] || []).push(r);
      }
    };
    const P = SU.PATHS[run.path];
    if (P) add(P.buff, 1, 'Путь: ' + P.name);
    for (const b of run.bless || []) { const d = SU.BLESSINGS.find(x => x.id === b.id); if (d) add(d.fx, b.lvl || 1, d.name); }
    for (const c of run.curios || []) { const d = SU.CURIOS.find(x => x.id === c.id); if (d && d.fx && !c.broken) add(d.fx, 1, d.name); }
    const own = (run.bless || []).filter(b => { const d = SU.BLESSINGS.find(x => x.id === b.id); return d && d.path === run.path; }).length;
    out.res = { on: !!P && own >= 3, energy: 0, max: SU.TUN.resMax, dmg: 1 };
    return out;
  }

  Object.assign(H.Battle.prototype, {
    suStart() {
      const S = this.su;
      for (const a of this.allies) for (const { f, lvl, name } of S.stats) a.buffs.push({ s: f.s, v: val(f.v, lvl), turns: 999, name, cond: f.cond, perm: true });
      this.bless('start', {});
    },

    suFoe(e) {
      for (const { f, lvl, name } of this.su.foe) e.buffs.push({ s: f.s, v: val(f.v, lvl), turns: 999, name, cond: f.cond, perm: true });
    },

    suTick() {
      const R = this.su.res;
      if (R.on && R.energy < R.max) R.energy = Math.min(R.max, R.energy + SU.TUN.resPerAction);
    },

    resReady() { return !!(this.su && this.su.res.on && this.su.res.energy >= this.su.res.max && !this.over); },

    bless(on, ctx) {
      const list = this.su && this.su.on[on];
      if (!list || !list.length || this.suBusy) return;
      this.suBusy = true;
      try { for (const r of list) this.blessFx(r, ctx); } finally { this.suBusy = false; }
    },

    suOnce(u, key) {
      const k = 'once_' + key;
      if (u.flags[k] === this.round) return false;
      u.flags[k] = this.round;
      return true;
    },

    suEcho() { return (this.su.on.foeTurn || []).reduce((sum, r) => sum + val(r.f.m, r.lvl), 0); },

    suWho(f, ctx) {
      if (f.who === 'allies') return this.livingAllies;
      if (f.who === 'src') return ctx.src && ctx.src.side === 'ally' ? [ctx.src] : [];
      return ctx.u && ctx.u.side === 'ally' ? [ctx.u] : [];
    },

    suMain(ctx) { return (ctx.hits || []).find(alive) || null; },

    addGrit(u, n) {
      if (!alive(u)) return;
      u.flags.grit = Math.min(35, (u.flags.grit || 0) + n);
      u.buffs = u.buffs.filter(b => b.name !== 'Боевой дух');
      u.buffs.push({ s: 'atkP', v: 0.03 * u.flags.grit, turns: 999, name: 'Боевой дух', perm: true }, { s: 'defP', v: 0.03 * u.flags.grit, turns: 999, name: 'Боевой дух', perm: true });
    },

    addCritBoost(u, n, max) {
      if (!alive(u)) return;
      u.flags.cb = Math.min(max || 8, (u.flags.cb || 0) + n);
      u.buffs = u.buffs.filter(b => b.name !== 'Крит. усиление');
      if (u.flags.cb > 0) u.buffs.push({ s: 'critR', v: 0.06 * u.flags.cb, turns: 999, name: 'Крит. усиление', perm: true }, { s: 'critD', v: 0.12 * u.flags.cb, turns: 999, name: 'Крит. усиление', perm: true });
    },

    clearCritBoost() {
      for (const a of this.allies) if (a.flags.cb) { a.flags.cb = 0; a.buffs = a.buffs.filter(b => b.name !== 'Крит. усиление'); }
    },

    rawDmg(src, tgt, amount, label, e, noKill) {
      if (!alive(tgt)) return 0;
      let d = Math.max(1, Math.round(amount));
      if (noKill) d = Math.min(d, tgt.hp - 1);
      if (d <= 0) return 0;
      tgt.hp = Math.max(0, tgt.hp - d);
      this.push({ t: 'dmg', u: tgt, src, v: d, crit: false, e: e || 'phys', hp: tgt.hp, shield: tgt.shield, label, dot: false });
      if (tgt.hp <= 0) this.onZero(tgt, src);
      return d;
    },

    suLow(u) {
      if (!this.su || u.side !== 'ally' || u.flags.lowSeen || !alive(u) || u.hp >= u.maxHp * 0.5) return;
      u.flags.lowSeen = true;
      this.bless('low', { u });
    },

    suSurvive(u) {
      const S = this.su;
      if (!S || !S.survive || S.survived) return false;
      S.survived = true;
      u.hp = Math.max(1, Math.round(u.maxHp * val(S.survive.f.hp, S.survive.lvl)));
      this.push({ t: 'revive', u, hp: u.hp, text: 'Отражение!' });
      return true;
    },

    suThaw(u) {
      const d = u.flags.dissoc;
      if (!d) return;
      delete u.flags.dissoc;
      const big = u.data && (u.data.boss ? 0.04 : u.data.elite ? 0.1 : 0.2);
      this.hit(d.src || u, u, 0, { fixed: u.maxHp * big * (1 + d.bonus), e: 'ice', isDot: true, label: 'Распад' });
    },

    blessFx(r, ctx) {
      const { f, lvl, name } = r, v = x => val(x, lvl);
      switch (f.do) {
        case 'shield': for (const a of this.suWho(f, ctx)) this.giveShield(a, a.maxHp * v(f.m), v(f.turns)); break;
        case 'heal': for (const a of this.suWho(f, ctx)) this.heal(a, a, a.maxHp * v(f.m)); break;
        case 'energy': {
          const who = ctx.src || ctx.u;
          if (f.once && (!who || !this.suOnce(who, name))) break;
          for (const a of this.suWho(f, ctx)) this.gainEnergy(a, v(f.v));
          break;
        }
        case 'energyP': if (ctx.u) this.gainEnergy(ctx.u, ctx.u.maxEnergy * v(f.v)); break;
        case 'freezeAll': for (const e of this.living) this.tryFreeze(this.livingAllies[0] || null, e, v(f.chance)); break;
        case 'grit': for (const a of this.suWho(f, ctx)) this.addGrit(a, v(f.n)); break;
        case 'critBoost': if (ctx.u) this.addCritBoost(ctx.u, v(f.n), v(f.max)); break;
        case 'quake': {
          const u = ctx.u;
          if (!u || u.shield <= 0) break;
          const team = this.livingAllies.filter(a => a !== u).reduce((s, a) => s + a.shield, 0);
          const amount = u.shield * v(f.m) + team * v(f.team);
          for (const t of (ctx.hits || []).filter(alive)) this.hit(u, t, 0, { fixed: amount, e: 'phys', label: 'Дрожь' });
          break;
        }
        case 'quakeBack': if (ctx.shieldBefore > 0 && alive(ctx.src)) { const d = this.dmgCalc(ctx.u, ctx.src, 0, { fixed: ctx.shieldBefore * v(f.m), e: 'phys' }, false); this.rawDmg(ctx.u, ctx.src, d, 'Дрожь', 'phys', true); } break;
        case 'lowHeal': if (alive(ctx.u) && ctx.u.hp < ctx.u.maxHp * f.below) this.heal(ctx.u, ctx.u, ctx.u.maxHp * v(f.m)); break;
        case 'hpDmg': { const t = this.suMain(ctx); if (t && ctx.u) this.hit(ctx.u, t, 0, { fixed: ctx.u.hp * v(f.m), e: ctx.u.elem, label: 'Изобилие' }); break; }
        case 'dewCharge': if (ctx.u) ctx.u.flags.dew = Math.min(ctx.u.maxHp * 2, (ctx.u.flags.dew || 0) + ctx.amt * v(f.m)); break;
        case 'dew': {
          const u = ctx.u, t = this.suMain(ctx);
          if (!u || !t || !(u.flags.dew > 0)) break;
          const amount = u.flags.dew * (1 + v(f.bonus));
          u.flags.dew = 0;
          this.hit(u, t, 0, { fixed: amount, e: u.elem, label: 'Капля росы' });
          break;
        }
        case 'hitFreeze':
          for (const t of (ctx.hits || []).filter(alive)) {
            t.flags.suHits = (t.flags.suHits || 0) + 1;
            if (t.flags.suHits >= v(f.n)) { t.flags.suHits = 0; this.tryFreeze(ctx.u, t, v(f.chance)); }
          }
          break;
        case 'dissocFrozen':
          for (const t of (ctx.hits || []).filter(alive)) {
            if (!t.frozen || t.flags.dissoc || !this.rng.chance(this.effectChance(ctx.u, t, f.chance))) continue;
            t.flags.dissoc = { src: ctx.u, bonus: v(f.bonus) };
            this.push({ t: 'status', u: t, text: 'Распад', col: '#c8f0ff', debuff: true });
          }
          break;
        case 'dotPop':
          for (const t of (ctx.hits || []).filter(alive)) {
            if (!t.dots.length) continue;
            const d = this.rng.pick(t.dots);
            this.hit(d.src || ctx.u, t, 0, { fixed: d.dmg * (d.stacks || 1) * v(f.m), e: DOT_ELEM[d.type], isDot: true, dot: true, label: H.DOT_NAME[d.type] });
          }
          break;
        case 'spread':
          for (const t of this.adjacent(this.living, ctx.tgt)) this.hit(ctx.src, t, 0, { fixed: ctx.dmg * v(f.m), e: ctx.e, isDot: true, label: 'Пробитие' });
          break;
        case 'delay': if (alive(ctx.tgt)) this.delay(ctx.tgt, v(f.v)); break;
        case 'advance': {
          const u = ctx.src;
          if (!alive(u)) break;
          u.flags.advanceAfter = Math.max(u.flags.advanceAfter || 0, f.v);
          u.flags.cbPending = (u.flags.cbPending || 0) + v(f.cb);
          this.push({ t: 'status', u, text: 'Нетленная победа' });
          break;
        }
        case 'healAllBuff':
          for (const a of this.livingAllies) { this.heal(ctx.src, a, a.maxHp * v(f.m)); this.addBuff(a, { s: f.s, v: v(f.v), turns: f.turns, name: f.name }, true); }
          break;
        case 'buff': for (const a of this.suWho(f, ctx)) this.addBuff(a, { s: f.s, v: v(f.v), turns: f.turns, name: f.name }); break;
        case 'buffPair':
          for (const a of [ctx.src, ctx.u]) if (alive(a)) this.addBuff(a, { s: f.s, v: v(f.v), turns: f.turns, name: f.name });
          break;
        case 'splash':
          for (const a of this.livingAllies) if (a !== ctx.u) this.heal(ctx.src, a, ctx.amt * v(f.m));
          break;
        case 'hpToShield':
          for (const a of this.livingAllies) {
            const lost = Math.min(a.hp - 1, Math.round(a.maxHp * f.cost));
            if (lost <= 0) continue;
            a.hp -= lost;
            this.push({ t: 'dmg', u: a, src: a, v: lost, e: 'phys', hp: a.hp, shield: a.shield, label: 'Резервирование' });
            this.giveShield(a, lost * v(f.m), f.turns);
            this.suLow(a);
          }
          break;
        case 'foeHpCut':
          for (const e of this.living) {
            const cut = Math.round(e.maxHp * (e.data.boss ? f.boss : f.m));
            e.hp = Math.max(1, e.hp - cut);
            this.push({ t: 'dmg', u: e, src: null, v: cut, e: 'imag', hp: e.hp, shield: e.shield, label: name });
          }
          break;
        case 'resFull': { const R = this.su.res; if (R.on) R.energy = R.max; R.dmg += f.dmg; break; }
        case 'spCost': this.sp = Math.max(0, this.sp - f.n); this.push({ t: 'text', text: name + ': отряд теряет ' + f.n + ' очка навыка.' }); break;
        case 'foeDebuff':
          for (const t of (ctx.hits || []).filter(alive)) {
            const cur = t.buffs.find(b => b.name === f.name), add = v(f.v);
            this.addBuff(t, { s: f.s, v: Math.min(add * f.stack, (cur ? cur.v : 0) + add), turns: f.turns, name: f.name, debuff: true }, !!cur);
          }
          break;
        case 'aftertaste': {
          const u = ctx.u, t = this.suMain(ctx);
          if (!alive(u) || !t) break;
          const n = f.broken && t.broken ? 2 : 1;
          for (let i = 0; i < n && alive(t); i++) this.hit(u, t, v(f.m), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 5, label: 'Послевкусие' });
          break;
        }
        case 'vine': if (ctx.u) ctx.u.flags.vine = Math.min(f.max, (ctx.u.flags.vine || 0) + 1); break;
        case 'vineRelease': {
          const u = ctx.u, t = this.suMain(ctx);
          if (!alive(u) || !t || !(u.flags.vine > 0)) break;
          const n = u.flags.vine;
          u.flags.vine = 0;
          for (let i = 0; i < n && alive(t); i++) this.hit(u, t, v(f.m), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 3, label: 'Послевкусие' });
          break;
        }
      }
    },

    strongestAlly() { return this.livingAllies.reduce((a, b) => (atkOf(b) > atkOf(a) ? b : a)); },

    resonate() {
      if (!this.canAct() || !this.resReady()) return false;
      const S = this.su, R = S.res, P = SU.PATHS[S.path], src = this.strongestAlly(), m = R.dmg;
      R.energy = 0;
      this.acting = src;
      this.hitThisAction = new Set();
      this.push({ t: 'act', u: src, name: 'Резонанс Пути: ' + P.name, kind: 'res' });
      const foes = () => this.living.slice();
      switch (S.path) {
        case 'preservation': {
          for (const a of this.livingAllies) this.giveShield(a, a.maxHp * 0.15, 2);
          const total = this.livingAllies.reduce((s, a) => s + a.shield, 0);
          for (const e of foes()) this.hit(src, e, 0, { fixed: total * m, e: 'phys', tough: 15, label: 'Резонанс', kind: 'res' });
          break;
        }
        case 'remembrance': for (const e of foes()) { this.hit(src, e, 1.5 * m, { e: 'ice', tough: 15, kind: 'res' }); this.tryFreeze(src, e, 1); } break;
        case 'nihility':
          for (const e of foes()) for (const type of ['burn', 'shock', 'bleed', 'shear']) if (alive(e) && this.rng.chance(this.effectChance(src, e, 1))) this.addDot(src, e, type, atkOf(src) * 0.45 * m, 2);
          break;
        case 'abundance':
          for (const a of this.livingAllies) {
            this.heal(src, a, a.maxHp * 0.3 * m);
            const i = a.buffs.findIndex(b => b.debuff);
            if (i >= 0) a.buffs.splice(i, 1); else if (a.dots.length) a.dots.shift();
          }
          break;
        case 'hunt': for (const e of foes()) this.hit(src, e, 2.2 * m, { e: 'wind', tough: 15, kind: 'res' }); break;
        case 'destruction': {
          const missing = this.livingAllies.reduce((s, a) => s + (a.maxHp - a.hp), 0);
          for (const e of foes()) this.hit(src, e, 0, { fixed: (missing + atkOf(src) * 0.8) * m, e: 'fire', tough: 15, label: 'Резонанс', kind: 'res' });
          break;
        }
        case 'elation': {
          const avg = this.livingAllies.reduce((s, a) => s + atkOf(a), 0) / Math.max(1, this.livingAllies.length), hits = [];
          for (let i = 0; i < 6 && this.living.length; i++) {
            const t = this.rng.pick(this.living);
            this.hit(src, t, 0.6 * m * avg / atkOf(src), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 5, label: 'Резонанс' });
            hits.push(t);
          }
          this.bless('follow', { u: src, hits });
          break;
        }
      }
      this.acting = null;
      this.cleanup();
      this.followUps();
      if (!this.over && this.current && !alive(this.current)) { this.current = null; this.phase = 'run'; this.step(); }
      return true;
    }
  });

  SU.compile = compile;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
