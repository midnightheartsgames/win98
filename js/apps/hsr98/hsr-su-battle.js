(function (H) {
  'use strict';
  const SU = H.SU, T = H.TUNING;
  const { sv, atkOf, defOf, alive } = H.battleStat;
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
    out.forms = new Set(run.forms || []);
    out.res = { on: !!P && own >= 3, energy: 0, max: SU.TUN.resMax * (['fh_aim', 'fe_dance', 'fg_phenol'].some(k => out.forms.has(k)) ? 2 : 1), dmg: 1 };
    out.vat = 0;
    out.tree = { res: run.resStart || 0, en: run.enStart || 0, full: !!run.fullEn };
    out.syn = 0;
    out.horizon = 0;
    out.turns = 0;
    out.acts = 0;
    out.berserk = { at: run.berserk || 0, cyc: 1, stacks: 0, warned: false };
    out.bug = !!run.bug;
    out.complete = !!run.complete;
    return out;
  }

  Object.assign(H.Battle.prototype, {
    suStart() {
      const S = this.su;
      for (const a of this.allies) for (const { f, lvl, name } of S.stats) if (val(f.v, lvl)) a.buffs.push({ s: f.s, v: val(f.v, lvl), turns: 999, name, cond: f.cond, perm: true });
      if (['fp_iso', 'fr_love', 'fn_outsider', 'fe_win'].some(k => S.forms.has(k))) S.res.energy = Math.round(S.res.max * 0.4);
      if (S.res.on && S.tree.res) S.res.energy = Math.min(S.res.max, S.res.energy + S.tree.res);
      for (const a of this.allies) {
        if (!(a.maxEnergy > 0)) continue;
        if (S.tree.full) a.energy = a.maxEnergy;
        else if (S.tree.en) a.energy = Math.max(a.energy, Math.round(a.maxEnergy * S.tree.en));
      }
      this.bless('start', {});
    },

    suForm(k) { return !!(this.su && this.su.forms.has(k)); },

    suResGain(v) {
      const R = this.su.res;
      if (R.on && R.energy < R.max) R.energy = Math.min(R.max, R.energy + v);
    },

    suOneShot(u, name) { (u.flags.oneShot = u.flags.oneShot || []).push(name); },

    suActSweep(u) {
      if (u.flags.oneShotArmed) { const gone = u.flags.oneShotArmed; u.buffs = u.buffs.filter(b => !gone.includes(b.name)); delete u.flags.oneShotArmed; }
      if (u.flags.oneShot) { u.flags.oneShotArmed = u.flags.oneShot; delete u.flags.oneShot; }
      u.flags.qGain = 0;
    },

    suSp(u, delta) {
      const S = this.su;
      let d = delta;
      if (d < 0 && u.flags.scythe) d -= 1;
      if (S.forms.has('fg_phenol')) this.suResGain(Math.abs(d) * S.res.max * 0.01);
      this.bless('sp', { u, delta: d });
    },

    sporeCap() { return SU.TUN.sporeMax + (this.su.on.sp || []).filter(r => r.f.do === 'sporeRand').reduce((m, r) => Math.max(m, val(r.f.cap, r.lvl)), 0); },

    addSpores(e, n) {
      if (!alive(e) || n <= 0) return;
      e.flags.spores = Math.min(this.sporeCap(), (e.flags.spores || 0) + n);
      this.push({ t: 'status', u: e, text: 'Споры: ' + e.flags.spores, col: '#d8c050', debuff: true });
    },

    suSporeBurst(u, hits) {
      const K = SU.TUN, meta = u.buffs.some(b => b.name === 'Метаморфоза');
      if (this.suForm('fg_pincers') && !meta) return;
      for (const t of hits) {
        if (!alive(t) || (t.flags.spores || 0) < K.sporeBurst) continue;
        const n = t.flags.spores;
        t.flags.spores = 0;
        this.hit(u, t, 0, { fixed: atkOf(u) * K.sporeM * n * (1 + sv(u, 'sporeP')), e: 'wind', label: 'Взрыв спор' });
        if (this.suForm('fg_pincers') && alive(t) && (t.flags.pincer || 0) < 3) { t.flags.pincer = (t.flags.pincer || 0) + 1; this.hit(u, t, 0.8, { e: u.elem, kind: 'basic', label: 'Кристаллические клешни' }); }
        const next = this.adjacent(this.living, t).filter(alive);
        if (next.length) this.addSpores(this.rng.pick(next), 1);
      }
    },

    suSynapse(u, hits, kind) {
      const S = this.su, K = SU.TUN;
      if (!(S.syn > 0)) return;
      const big = () => this.living.reduce((a, b) => (!a || b.maxHp > a.maxHp ? b : a), null);
      for (const t of hits) {
        if (!(S.syn > 0) || !alive(t) || !t.flags.synapse) continue;
        S.syn--;
        this.hit(u, t, 0, { fixed: atkOf(u) * K.synapseM, e: 'imag', kind: 'ult', label: 'Синаптический резонанс' });
        const b = big();
        if (b && b !== t) this.hit(u, b, 0, { fixed: atkOf(u) * (K.synapseM + (kind === 'ult' && S.forms.has('fu_melt') ? 0.5 : 0)), e: 'imag', kind: 'ult', label: 'Синаптический резонанс' });
      }
    },

    suVat(u, ab, target) {
      const S = this.su;
      if (u.flags.inVat || S.vat < 1 - 1e-9) return;
      S.vat -= 1;
      u.flags.inVat = true;
      this.push({ t: 'text', text: 'Мозг в кувшине: абсолютная техника срабатывает ещё раз' });
      const crit = (S.on.vat || []).filter(r => r.f.do === 'vatCrit').reduce((m, r) => m + val(r.f.v, r.lvl), 0);
      if (crit) u.buffs.push({ s: 'critD', v: crit, turns: 999, name: 'Приложение: Вестибулярный аппарат', perm: true });
      const t = target && alive(target) ? target : (ab.target === 'ally' || ab.target === 'allies' ? u : this.autoTarget(u));
      if (t && !this.over) this.useAbility(u, ab, t, 'ult');
      u.buffs = u.buffs.filter(b => b.name !== 'Приложение: Вестибулярный аппарат');
      this.bless('vat', { u });
      u.flags.inVat = false;
    },

    suShieldGained(u) {
      const S = this.su;
      if (S.forms.has('fp_iso')) this.suResGain(S.res.max * 0.03);
      const giver = this.acting;
      if (giver && giver.side === 'ally' && giver !== u) this.bless('shieldGive', { src: giver, u });
    },

    suFoeTurn(u) {
      if (u.flags.river > 0) u.flags.river--;
      u.flags.fdN = 0;
      if (!u.broken) u.flags.saltN = 0;
      if (u.flags.iceWeakT > 0 && --u.flags.iceWeakT <= 0) { u.weak = u.weak.filter(e => e !== 'ice'); u.flags.iceWeakT = 0; }
      if (u.flags.susp > 0) this.suSusp(u, -2);
      if (u.flags.entropic > 0) {
        u.flags.entropic--;
        const miss = this.livingAllies.reduce((sum, a) => sum + (a.maxHp - a.hp), 0);
        if (miss > 0) this.hit(this.strongestAlly(), u, 0, { fixed: miss * 1.25, e: 'fire', isDot: true, label: 'Энтропийное возмездие' });
        if (!u.flags.entropic) u.buffs = u.buffs.filter(b => b.name !== 'Энтропийное возмездие');
      }
    },

    suSusp(e, n, top) {
      if (!alive(e)) return;
      e.flags.susp = Math.max(0, Math.min(99, (e.flags.susp || 0) + n));
      if (top) e.flags.suspTop = true;
      e.buffs = e.buffs.filter(b => b.name !== 'Подозрение');
      if (e.flags.susp > 0) e.buffs.push({ s: 'dotVuln', v: e.flags.susp >= 99 && e.flags.suspTop ? 1.2 : e.flags.susp * 0.01, turns: 999, name: 'Подозрение', debuff: true, perm: true });
    },

    suStackBuff(u, f, v, name) {
      if (!alive(u)) return;
      const cur = u.buffs.find(b => b.name === name && b.s === f.s), cap = v * val(f.max, 1);
      const nv = Math.min(cap, (cur ? cur.v : 0) + v);
      if (cur) { cur.v = nv; if (f.turns) cur.turns = f.turns; }
      else u.buffs.push({ s: f.s, v: nv, turns: f.turns || 999, name, perm: !f.turns });
    },

    suFoe(e) {
      for (const { f, lvl, name } of this.su.foe) e.buffs.push({ s: f.s, v: val(f.v, lvl), turns: 999, name, cond: f.cond, perm: true });
      if (this.su.bug && (e.data.elite || e.idx === 0)) {
        e.name += ' (неисправный)';
        e.bug = true;
        e.maxHp = e.hp = e.base.hp = Math.round(e.maxHp * SU.TUN.bugHp);
        e.base.atk *= SU.TUN.bugAtk;
      }
      if (this.su.complete && e.data.boss) e.name += ' (исправный)';
      if (this.su.berserk.stacks) this.suBerserkOn(e);
      if (this.su.forms.has('fu_meme')) this.suResGain(this.allies.reduce((sum, a) => sum + (a.maxEnergy || 0), 0) * 0.05);
    },

    suTick() {
      const S = this.su, R = S.res;
      if (R.on && R.energy < R.max) R.energy = Math.min(R.max, R.energy + SU.TUN.resPerAction);
      this.suBerserkTick();
      if (S.anatta && !this.over && ++S.acts % 4 === 0 && this.livingAllies.length) this.suResEffect(this.strongestAlly(), R.dmg, { anatta: true });
    },

    suSkill(u, sk) {
      const K = SU.TUN;
      if (sk.t === 'sunset') {
        u.flags.sunset = 0;
        this.push({ t: 'status', u, text: 'Заход солнца, после полудня', col: '#ffb070' });
        return true;
      }
      if (sk.t === 'obituary') {
        u.flags.obit = (u.flags.obit || 0) + 1;
        u.buffs = u.buffs.filter(b => b.name !== 'Мучительная траурная речь' && b.name !== 'Колющая траурная речь');
        u.buffs.push({ s: 'dmgP', v: K.obitDmg, turns: 1, name: 'Мучительная траурная речь' });
        u.buffs.push({ s: 'dmgP', v: K.obitStack * u.flags.obit, turns: 999, name: 'Колющая траурная речь', perm: true });
        this.push({ t: 'status', u, text: 'Траурная речь: урон +' + Math.round(K.obitDmg * 100) + '%', col: '#d8b0ff' });
        return true;
      }
      if (sk.t === 'nightfall') {
        const next = this.livingAllies.filter(a => !a.dream).sort((a, b) => a.av - b.av).slice(0, 2);
        u.flags.night = next;
        u.charging = sk.next;
        if (!u.buffs.some(b => b.name === 'Наступление ночи')) u.buffs.push({ s: 'toughIn', v: -1, turns: 999, name: 'Наступление ночи', perm: true });
        for (const a of this.livingAllies) a.energy = a.maxEnergy;
        this.push({ t: 'text', text: 'Наступление ночи: цели ' + next.map(a => a.name).join(' и ') + '. Уязвимость защищена.', warn: true });
        return true;
      }
      if (sk.t === 'dissolve') {
        const live = a => alive(a) && !a.dream;
        let list = (u.flags.night || []).filter(live);
        if (!list.length) { const pool = this.livingAllies.filter(live); list = []; while (pool.length && list.length < 2) list.push(pool.splice(this.rng.int(pool.length), 1)[0]); }
        u.flags.night = null;
        u.buffs = u.buffs.filter(b => b.name !== 'Наступление ночи');
        for (const a of list) this.suDreamOn(u, a);
        return true;
      }
      return false;
    },

    suDreamOn(boss, a) {
      if (!alive(a) || a.dream || !alive(boss)) return;
      const s = this.spawnFoe('sepulcher', Math.max(1, boss.lvl - 2), boss), bars = SU.TUN.sepulcherBar * (1 + (boss.flags.obit || 0));
      s.maxHp = s.hp = s.base.hp = Math.round(s.maxHp * bars);
      s.flags.holds = a;
      a.dream = { by: s };
      this.push({ t: 'status', u: a, text: 'Болезненный сон', debuff: true });
    },

    suDreamTurn(u) {
      if (alive(u.dream.by)) { this.push({ t: 'status', u, text: 'Болезненный сон', debuff: true }); return true; }
      this.suWake(u);
      return false;
    },

    suWake(a) {
      delete a.dream;
      if (alive(a)) this.push({ t: 'status', u: a, text: 'Пробуждение', col: '#9ae0a0' });
    },

    suDreamCheck() {
      const boss = this.enemies.find(e => e.id === 'unto_death');
      if (boss && !alive(boss)) for (const e of this.living) if (e.id === 'sepulcher') { e.gone = true; this.push({ t: 'flee', u: e, text: '' }); }
      for (const a of this.allies) if (a.dream && !alive(a.dream.by)) this.suWake(a);
    },

    suSunset(a, kind) {
      if (!['basic', 'enhanced', 'skill', 'ult'].includes(kind) || a.dream) return;
      for (const u of this.living) {
        if (u.flags.sunset == null) continue;
        u.flags.sunset++;
        const steps = ['после полудня', 'на закате дня', 'сумерки', 'наступление ночи'];
        this.push({ t: 'status', u, text: 'Заход солнца, ' + steps[Math.min(3, u.flags.sunset)], col: '#ffb070' });
        if (u.flags.sunset < SU.TUN.sunsetMax) continue;
        u.flags.sunset = null;
        this.push({ t: 'act', u, name: 'Исчезнувший в сумерках', kind: 'enemy' });
        this.suDreamOn(u, a);
      }
    },

    suBreak(u) {
      if (u.flags.sunset != null) { u.flags.sunset = null; this.push({ t: 'status', u, text: 'Заход солнца снят', col: '#9ae0a0' }); }
      u.buffs = u.buffs.filter(b => b.name !== 'Мучительная траурная речь');
    },

    suCycle() { const t = this.clock || 0; return t <= 150 ? 1 : 1 + Math.ceil((t - 150) / 100); },

    suBerserkTick() {
      const K = this.su.berserk, B = SU.TUN.berserk;
      if (!K.at || this.over) return;
      const cyc = this.suCycle();
      if (cyc === K.cyc) return;
      K.cyc = cyc;
      if (!K.warned && cyc >= K.at - B.warn && cyc < K.at) {
        K.warned = true;
        this.push({ t: 'text', text: 'Цикл ' + cyc + ': с цикла ' + K.at + ' враги впадут в Берсерк.', warn: true });
      }
      if (cyc < K.at) return;
      K.stacks = cyc - K.at + 1;
      for (const e of this.living) this.suBerserkOn(e);
      this.push({ t: 'text', text: 'Берсерк: урон врагов +' + Math.round(K.stacks * B.dmg * 100) + '%', warn: true });
    },

    suBerserkOn(e) {
      const v = this.su.berserk.stacks * SU.TUN.berserk.dmg, b = e.buffs.find(x => x.name === 'Берсерк');
      if (b) b.v = v;
      else e.buffs.push({ s: 'dmgP', v, turns: 999, name: 'Берсерк', perm: true });
    },

    resReady() { return !!(this.su && this.su.res.on && this.su.res.energy >= this.su.res.max && !this.over); },

    bless(on, ctx) {
      if (!this.su || this.suBusy) return;
      const S = this.su;
      this.suBusy = true;
      try {
        if (on === 'freeze' && S.forms.has('fr_love')) this.suResGain(S.res.max * 0.05);
        if (on === 'dot' && S.forms.has('fn_outsider')) this.suResGain(S.res.max * 0.02);
        if (on === 'follow' && S.forms.has('fe_win')) this.suResGain(S.res.max * 0.05);
        if (on === 'turn' && S.forms.has('fh_aim') && ctx.u && ctx.u.side === 'ally') this.suResGain(S.res.max * 0.03);
        if (on === 'break' && ctx.tgt && ctx.tgt.flags.confusion > 0) {
          const t = ctx.tgt;
          t.flags.confusion--;
          for (const d of t.dots.slice()) if (alive(t)) this.hit(d.src || ctx.src, t, 0, { fixed: d.dmg * (d.stacks || 1) * 0.3, e: DOT_ELEM[d.type], isDot: true, label: 'Смятение' });
        }
        if (on === 'act' && ctx.u && ctx.u.side === 'ally') {
          const hits = (ctx.hits || []).filter(alive);
          this.suSporeBurst(ctx.u, hits);
          this.suSynapse(ctx.u, hits, ctx.kind);
        }
        if (on === 'hurt' && S.forms.has('fd_horizon') && S.path === 'destruction' && ctx.u && alive(ctx.u) && ctx.u.hp < ctx.u.maxHp * 0.35 && S.horizon < 2 && S.res.on) {
          S.horizon++;
          this.push({ t: 'text', text: 'Горизонт событий: Резонанс срабатывает сам' });
          this.suResEffect(this.strongestAlly(), S.res.dmg);
        }
        if (on === 'kill' && ctx.tgt && ctx.tgt.flags.synapse && S.forms.has('fu_chain') && ctx.src && ctx.src.side === 'ally') {
          const big = this.living.reduce((a, b) => (!a || b.maxHp > a.maxHp ? b : a), null);
          for (let i = 0; i < 2 && big && alive(big); i++) this.hit(ctx.src, big, 0, { fixed: atkOf(ctx.src) * SU.TUN.synapseM, e: 'imag', kind: 'ult', label: 'Цепное заражение' });
        }
        if (on === 'kill' && ctx.src && ctx.src.side === 'ally' && S.forms.has('fg_proboscis') && ctx.src.buffs.some(b => b.name === 'Метаморфоза')) this.suResGain(S.res.max * 0.2);
        if (on === 'kill' && S.forms.has('fh_bow') && ctx.tgt && ctx.tgt.flags.bowMark) this.suResGain(S.res.max * 0.5);
        const list = S.on[on] || [];
        for (const r of list) if (!r.f.kinds || (ctx.kind && r.f.kinds.includes(ctx.kind))) this.blessFx(r, ctx);
        if (on === 'act' && ctx.u && ctx.u.side === 'ally') this.suActSweep(ctx.u);
      } finally { this.suBusy = false; }
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
      if (S && S.forms.has('fa_nirvana') && S.path === 'abundance' && !S.nirvana && S.res.on) {
        S.nirvana = true;
        u.hp = 1;
        S.res.energy = 0;
        this.push({ t: 'text', text: 'Конечная нирвана: Резонанс спасает союзника' });
        this.suResEffect(this.strongestAlly(), S.res.dmg);
        return true;
      }
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
          const amount = u.shield * v(f.m) + team * v(f.team) + defOf(u) * sv(u, 'quakeDef');
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
        case 'buff': for (const a of this.suWho(f, ctx)) this.addBuff(a, { s: f.s, v: v(f.v), turns: v(f.turns), name: f.name }); break;
        case 'hyper': for (const a of [ctx.src, ctx.u]) this.suStackBuff(a, { s: 'dmgP', max: f.max, turns: 1 }, v(f.v), name); break;
        case 'shieldTrim': {
          const u = ctx.u, keep = u ? u.maxHp * v(f.keep) : 0;
          if (u && u.shield > keep) { u.shield = Math.round(u.shield - (u.shield - keep) * v(f.lose)); this.push({ t: 'shield', u, v: u.shield }); }
          break;
        }
        case 'frozenHit': for (const t of (ctx.hits || []).filter(x => alive(x) && x.frozen)) this.hit(ctx.u, t, 0, { fixed: atkOf(ctx.u) * v(f.m), e: 'ice', label: name }); break;
        case 'iceWeak': {
          const pool = this.living.filter(e => !v(f.fresh) || !e.weak.includes('ice'));
          const t = pool.length ? this.rng.pick(pool) : null;
          if (t && this.rng.chance(this.effectChance(ctx.u, t, f.chance))) {
            if (!t.weak.includes('ice')) { t.weak = t.weak.concat('ice'); t.flags.iceWeakT = f.turns; }
            this.push({ t: 'status', u: t, text: 'Уязвимость к льду', col: '#9ad8ff', debuff: true });
          }
          break;
        }
        case 'dissocHit':
          for (const t of (ctx.hits || []).filter(alive)) {
            if (t.flags.cynic || t.flags.dissoc || !this.rng.chance(this.effectChance(ctx.u, t, v(f.chance)))) continue;
            t.flags.cynic = true;
            t.flags.dissoc = { src: ctx.u, bonus: 0 };
            this.push({ t: 'status', u: t, text: 'Распад', col: '#c8f0ff', debuff: true });
          }
          break;
        case 'dissocBreak': {
          const t = ctx.tgt, ch = v(f.chance);
          if (alive(t) && !t.flags.dissoc && (ch > 2 || this.rng.chance(this.effectChance(ctx.src, t, ch)))) { t.flags.dissoc = { src: ctx.src, bonus: 0 }; this.push({ t: 'status', u: t, text: 'Распад', col: '#c8f0ff', debuff: true }); }
          break;
        }
        case 'dotWeaken': if (alive(ctx.tgt)) this.suStackBuff(ctx.tgt, { s: 'dmgP', max: f.max, turns: 1 }, -v(f.v), name); break;
        case 'suspAll': for (const e of this.living) this.suSusp(e, v(f.n)); break;
        case 'susp': if (alive(ctx.tgt)) this.suSusp(ctx.tgt, f.n, !!v(f.cap)); break;
        case 'healEcho': if (alive(ctx.u) && ctx.amt > 0) this.heal(ctx.u, ctx.u, ctx.amt * v(f.m)); break;
        case 'glass': {
          const u = ctx.u;
          if (alive(u) && u.hp >= u.maxHp && !u.buffs.some(b => b.name === name)) u.buffs.push({ s: 'dr', v: v(f.dr), turns: 999, name, perm: true }, { s: 'res', v: v(f.res), turns: 999, name, perm: true });
          break;
        }
        case 'glassOff': if (ctx.u) ctx.u.buffs = ctx.u.buffs.filter(b => b.name !== name); break;
        case 'dewTurn': { const u = ctx.u; if (alive(u)) u.flags.dew = Math.min(u.maxHp * 2, (u.flags.dew || 0) + (v(f.max) ? u.maxHp : u.hp) * v(f.m)); break; }
        case 'advanceNext': if (alive(ctx.u)) ctx.u.flags.advanceAfter = Math.max(ctx.u.flags.advanceAfter || 0, v(f.v)); break;
        case 'stackBuff': this.suStackBuff(ctx.u, Object.assign({}, f, { max: v(f.max) }), v(f.v), f.name || name); break;
        case 'dropBuff': if (ctx.u) ctx.u.buffs = ctx.u.buffs.filter(b => b.name !== f.name); break;
        case 'borisin': {
          const u = ctx.u, S = this.su;
          if (!alive(u)) break;
          S.turns++;
          if ((S.turns + v(f.start)) % f.every === 0 && !u.flags.borisin) { u.flags.borisin = true; u.flags.advanceAfter = Math.max(u.flags.advanceAfter || 0, 1); this.push({ t: 'status', u, text: name }); }
          break;
        }
        case 'skybreak': {
          const u = ctx.src;
          if (!alive(u)) break;
          this.advance(u, 1);
          this.suStackBuff(u, { s: 'dmgP', max: f.max }, v(f.v), name);
          if (!v(f.max) || v(f.max) < 2) this.suOneShot(u, name);
          break;
        }
        case 'gritVuln': {
          const u = ctx.u;
          if (!u || !(u.flags.grit > 0)) break;
          for (const t of (ctx.hits || []).filter(alive)) {
            this.addBuff(t, { s: 'vuln', v: v(f.v), turns: 1, name, debuff: true }, true);
            if (u.flags.grit > 10) this.addBuff(t, { s: 'breakVuln', v: v(f.brk), turns: 1, name: name + ': пробитие', debuff: true }, true);
          }
          break;
        }
        case 'quasar': {
          const u = ctx.u, amt = ctx.lost || ctx.amt || 0;
          if (!alive(u) || amt <= 0) break;
          const frac = amt / u.maxHp, step = v(f.step);
          u.flags.qAcc = (u.flags.qAcc || 0) + frac;
          u.flags.qTot = (u.flags.qTot || 0) + frac;
          while (u.flags.qAcc >= step && (u.flags.qGain || 0) < v(f.cap)) { u.flags.qAcc -= step; u.flags.qGain = (u.flags.qGain || 0) + 1; this.addGrit(u, 1); }
          const full = Math.min(3, Math.floor(u.flags.qTot));
          if (full > (u.flags.qFull || 0)) { u.flags.qFull = full; u.buffs = u.buffs.filter(b => b.name !== name); u.buffs.push({ s: 'breakE', v: v(f.brk) * full, turns: 999, name, perm: true }); }
          break;
        }
        case 'followDelay':
          for (const t of (ctx.hits || []).filter(alive)) if ((t.flags.fdN || 0) < v(f.max)) { t.flags.fdN = (t.flags.fdN || 0) + 1; this.delay(t, f.v); }
          break;
        case 'spEnergy': if (ctx.delta < 0) this.gainEnergy(ctx.u, v(f.v) * -ctx.delta); break;
        case 'spRefund': if (ctx.delta < 0 && this.sp < T.spMax && this.rng() < v(f.chance)) { this.sp++; this.push({ t: 'status', u: ctx.u, text: name + ': +1 очко навыка' }); } break;
        case 'spGuard': if (ctx.delta < 0) for (let i = 0; i < -ctx.delta; i++) this.suStackBuff(ctx.u, { s: 'dr', max: v(f.max), turns: 1 }, f.v, name); break;
        case 'sporeAll':
          if (ctx.delta < 0) {
            for (const e of this.living) this.addSpores(e, -ctx.delta);
            if (v(f.spd) && this.sp === 0) this.addBuff(ctx.u, { s: 'spdP', v: v(f.spd), turns: 2, name });
          }
          break;
        case 'sporeRand':
          if (ctx.delta > 0) for (let i = 0; i < ctx.delta; i++) { const pool = this.living.slice(); for (let k = 0; k < f.n && pool.length; k++) this.addSpores(pool.splice(this.rng.int(pool.length), 1)[0], 1); }
          break;
        case 'sporeSpread': {
          const t = ctx.tgt, n = t && t.flags.spores;
          if (!n) break;
          t.flags.spores = 0;
          for (const e of (v(f.all) ? this.living : this.adjacent(this.living, t)).filter(e => alive(e) && e !== t)) this.addSpores(e, n);
          break;
        }
        case 'basicSplash': {
          const t = this.suMain(ctx);
          if (!t || !ctx.u) break;
          const adj = this.adjacent(this.living, t).filter(e => alive(e) && e !== t), list = v(f.all) ? adj : adj.length ? [this.rng.pick(adj)] : [];
          for (const e of list) this.hit(ctx.u, e, 0, { fixed: atkOf(ctx.u) * v(f.m), e: ctx.u.elem, label: name });
          break;
        }
        case 'catalyst': if (!(ctx.hits || []).length) for (const a of this.livingAllies) this.suStackBuff(a, { s: 'dmgP', max: f.max, turns: 1 }, v(f.v), name); break;
        case 'scytheArm': if (ctx.u) ctx.u.flags.scythe = true; break;
        case 'scythe':
          if (ctx.delta < 0 && ctx.u && ctx.u.flags.scythe) {
            ctx.u.flags.scythe = false;
            this.addBuff(ctx.u, { s: 'critD', v: v(f.v) * Math.min(2, -ctx.delta), turns: 999, name });
            this.suOneShot(ctx.u, name);
          }
          break;
        case 'nextAtk': if (alive(ctx.u)) { this.addBuff(ctx.u, { s: f.s, v: v(f.v), turns: 999, name }); this.suOneShot(ctx.u, name); } break;
        case 'energyStart': for (const a of this.livingAllies) a.energy = Math.max(a.energy, a.maxEnergy * v(f.v)); break;
        case 'delayBroken':
          for (const t of (ctx.hits || []).filter(x => alive(x) && x.broken)) if ((t.flags.saltN || 0) < f.max) { t.flags.saltN = (t.flags.saltN || 0) + 1; this.delay(t, v(f.v)); }
          break;
        case 'vatAdd': {
          const S = this.su, was = S.vat;
          S.vat = Math.min(1, S.vat + v(f.v));
          if (was < 1 && S.vat >= 1) this.push({ t: 'text', text: 'Мозг в кувшине заряжен' });
          break;
        }
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
          for (let i = 0; i < n && alive(t); i++) this.hit(u, t, v(f.m) * (1 + sv(u, 'aftertasteP')), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 5, label: 'Послевкусие' });
          break;
        }
        case 'vine': if (ctx.u) ctx.u.flags.vine = Math.min(f.max, (ctx.u.flags.vine || 0) + 1); break;
        case 'vineRelease': {
          const u = ctx.u, t = this.suMain(ctx);
          if (!alive(u) || !t || !(u.flags.vine > 0)) break;
          const n = u.flags.vine;
          u.flags.vine = 0;
          for (let i = 0; i < n && alive(t); i++) this.hit(u, t, v(f.m) * (1 + sv(u, 'aftertasteP')), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 3, label: 'Послевкусие' });
          break;
        }
      }
    },

    strongestAlly() { return this.livingAllies.reduce((a, b) => (atkOf(b) > atkOf(a) ? b : a)); },

    resonate() {
      if (!this.canAct() || !this.resReady()) return false;
      const S = this.su, R = S.res, src = this.strongestAlly();
      const m = R.dmg * (R.max > SU.TUN.resMax && S.path !== 'elation' && S.path !== 'propagation' ? R.max / SU.TUN.resMax : 1);
      const over = Math.max(0, R.energy - SU.TUN.resMax);
      R.energy = 0;
      this.suResEffect(src, m, { over });
      this.cleanup();
      this.followUps();
      if (!this.over && this.current && !alive(this.current)) { this.current = null; this.phase = 'run'; this.step(); }
      return true;
    },

    suResEffect(src, m, o = {}) {
      const S = this.su, P = SU.PATHS[S.path], F = k => S.forms.has(k);
      if (!src) return;
      const was = this.acting;
      this.acting = src;
      this.hitThisAction = new Set();
      this.push({ t: 'act', u: src, name: 'Резонанс Пути: ' + P.name, kind: 'res' });
      const foes = () => this.living.slice();
      switch (S.path) {
        case 'preservation': {
          for (const a of this.livingAllies) this.giveShield(a, a.maxHp * 0.15, 2);
          const total = this.livingAllies.reduce((sum, a) => sum + a.shield, 0), shielded = this.livingAllies.filter(a => a.shield > 0).length;
          const k = F('fp_zero') ? 1.5 + 0.15 * shielded : 1;
          for (const e of foes()) this.hit(src, e, 0, { fixed: total * m * k, e: 'phys', tough: 15, label: 'Резонанс', kind: 'res' });
          if (F('fp_eutectic')) for (const a of this.livingAllies) { this.giveShield(a, a.maxHp * 0.01, 2); a.flags.amber = true; }
          break;
        }
        case 'remembrance':
          for (const e of foes()) { this.hit(src, e, 1.5 * m, { e: 'ice', tough: 15, kind: 'res' }); this.tryFreeze(src, e, 1); }
          for (const e of foes()) {
            if (F('fr_recall')) this.addBuff(e, { s: 'res', v: -1, turns: 1, name: 'Полное воспоминание', debuff: true }, true);
            if (F('fr_rich') && this.rng.chance(this.effectChance(src, e, 1.5))) { e.flags.river = 1; this.push({ t: 'status', u: e, text: 'Река вечности', debuff: true }); }
          }
          break;
        case 'nihility': {
          const turns = F('fn_root') ? 3 : 2, k = F('fn_root') ? 1.3 : 1;
          for (const e of foes()) {
            for (const type of ['burn', 'shock', 'bleed', 'shear']) if (alive(e) && this.rng.chance(this.effectChance(src, e, 1))) this.addDot(src, e, type, atkOf(src) * 0.45 * m * k, turns);
            if (F('fn_sun') && alive(e)) { e.flags.confusion = Math.min(5, (e.flags.confusion || 0) + 2); this.push({ t: 'status', u: e, text: 'Смятение', debuff: true }); }
          }
          break;
        }
        case 'abundance': {
          const k = o.anatta ? 0.7 : 1;
          for (const a of this.livingAllies) {
            this.heal(src, a, a.maxHp * 0.3 * m * k);
            if (F('fa_anicca')) { a.buffs = a.buffs.filter(b => !b.debuff); a.dots = []; a.flags.subdue = 1; }
            else { const i = a.buffs.findIndex(b => b.debuff); if (i >= 0) a.buffs.splice(i, 1); else if (a.dots.length) a.dots.shift(); }
          }
          if (F('fa_anatta')) S.anatta = true;
          break;
        }
        case 'hunt':
          for (const e of foes()) {
            const low = F('fh_bow') && e.hp < e.maxHp * 0.5;
            if (low) e.flags.bowMark = true;
            this.hit(src, e, 2.2 * m * (low ? 1.5 : 1), { e: 'wind', tough: 15, kind: 'res' });
            if (alive(e)) e.flags.bowMark = false;
          }
          if (F('fh_star') && alive(src)) { this.advance(src, 1); this.addBuff(src, { s: 'critD', v: sv(src, 'critR') * 0.5, turns: 999, name: 'Небесная стрела охоты' }); this.suOneShot(src, 'Небесная стрела охоты'); }
          break;
        case 'destruction': {
          let k = 1;
          if (F('fd_cata')) {
            k = 1.2;
            for (const a of this.livingAllies) { const lost = Math.min(a.hp - 1, Math.round(a.maxHp * 0.4)); if (lost <= 0) continue; a.hp -= lost; this.push({ t: 'dmg', u: a, src: a, v: lost, e: 'fire', hp: a.hp, shield: a.shield, label: 'Катаклизмическая переменная' }); this.giveShield(a, lost, 2); }
          }
          const missing = this.livingAllies.reduce((sum, a) => sum + (a.maxHp - a.hp), 0);
          for (const e of foes()) {
            this.hit(src, e, 0, { fixed: (missing + atkOf(src) * 0.8) * m * k, e: 'fire', tough: 15, label: 'Резонанс', kind: 'res' });
            if (F('fd_helium') && alive(e) && this.rng.chance(this.effectChance(src, e, 1.5))) { e.flags.entropic = 2; this.addBuff(e, { s: 'defP', v: -0.2, turns: 2, name: 'Энтропийное возмездие', debuff: true }); }
          }
          break;
        }
        case 'elation': {
          const avg = this.livingAllies.reduce((sum, a) => sum + atkOf(a), 0) / Math.max(1, this.livingAllies.length), hits = [];
          const n = 6 + (F('fe_dance') ? Math.floor((o.over || 0) / (SU.TUN.resMax * 0.2)) : 0);
          for (let i = 0; i < n && this.living.length; i++) {
            const t = this.rng.pick(this.living);
            this.hit(src, t, 0.6 * m * avg / atkOf(src), { e: this.rng.pick(ELEMS), kind: 'follow', tough: 5, label: 'Резонанс' });
            if (F('fe_carnival') && alive(t) && this.rng.chance(this.effectChance(src, t, 1.5))) this.addBuff(t, { s: 'followVuln', v: 0.08, turns: 1, name: 'Погоня за ощущениями', debuff: true }, true);
            hits.push(t);
          }
          this.bless('follow', { u: src, hits });
          break;
        }
        case 'propagation': {
          const t = src;
          for (const a of this.livingAllies) a.buffs = a.buffs.filter(b => b.name !== 'Метаморфоза');
          this.advance(t, 1);
          const before = this.sp;
          this.sp = Math.min(T.spMax, this.sp + 2);
          if (this.sp > before) this.suSp(t, this.sp - before);
          t.buffs.push({ s: 'resPen', v: 0.2, turns: F('fg_proboscis') ? 2 : 1, name: 'Метаморфоза' });
          if (F('fg_pincers')) t.buffs.push({ s: 'dmgP', v: 0.4, turns: F('fg_proboscis') ? 2 : 1, name: 'Метаморфоза' });
          this.push({ t: 'status', u: t, text: 'Метаморфоза', col: '#d8c050' });
          break;
        }
        case 'erudition':
          for (const e of foes()) { this.hit(src, e, 1.5 * m, { e: 'imag', tough: 15, kind: 'res' }); if (alive(e)) e.flags.synapse = true; }
          S.syn = SU.TUN.synapseN;
          this.push({ t: 'text', text: 'Синаптический резонанс: ' + S.syn + ' срабатываний' });
          break;
      }
      this.acting = was;
    }
  });

  SU.compile = compile;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
