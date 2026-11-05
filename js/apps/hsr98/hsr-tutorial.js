(function (H) {
  'use strict';
  const P = H.Game.prototype, BP = H.Battle.prototype;

  const stripTags = s => String(s || '').replace(/<\/?orange>/g, '');

  Object.assign(P, {
    tutorialState() {
      const s = this.state;
      if (!s.tutorial || typeof s.tutorial !== 'object' || s.tutorial.v !== 1) {
        s.tutorial = {
          v: 1,
          read: (s.tutorial && s.tutorial.read) || {},
          trials: (s.tutorial && s.tutorial.trials) || {},
          claimed: (s.tutorial && s.tutorial.claimed) || {}
        };
      }
      return s.tutorial;
    },

    tutorialCats() {
      return H.TUTORIAL_CATS;
    },

    tutorialEntries(cat = 'all', query = '') {
      const q = String(query || '').trim().toLowerCase();
      return H.TUTORIAL_ENTRIES.filter(e => {
        if (cat && cat !== 'all' && e.cat !== cat) return false;
        if (!q) return true;
        if (e.title.toLowerCase().includes(q)) return true;
        return e.pages.some(p => p.title.toLowerCase().includes(q) || stripTags(p.text).toLowerCase().includes(q));
      });
    },

    tutorialEntryOf(id) {
      return H.TUTORIAL_ENTRIES.find(e => e.id === id) || null;
    },

    isTutorialRead(id) {
      return !!this.tutorialState().read[id];
    },

    markTutorialRead(id) {
      if (!this.tutorialEntryOf(id)) return false;
      this.tutorialState().read[id] = true;
      return true;
    },

    markAllTutorialsRead() {
      const r = this.tutorialState().read;
      for (const e of H.TUTORIAL_ENTRIES) r[e.id] = true;
    },

    trainingGroups() {
      return H.TRAINING_GROUPS;
    },

    trainingTrials(group) {
      return H.TRAINING_TRIALS.filter(t => !group || group === 'all' || t.group === group);
    },

    trainingTrialOf(id) {
      return H.TRAINING_TRIALS.find(t => t.id === id) || null;
    },

    isTrialDone(id) {
      return !!this.tutorialState().trials[id];
    },

    isTrialClaimed(id) {
      return !!this.tutorialState().claimed[id];
    },

    tutorialProgress(group) {
      const list = this.trainingTrials(group);
      return { done: list.filter(t => this.isTrialDone(t.id)).length, total: list.length };
    },

    tutorialAlert() {
      return !!this.state.flags.express_intro && H.TRAINING_TRIALS.some(t => !this.isTrialClaimed(t.id));
    },

    tutorialStepOf(b) {
      const tut = b && b.opts && b.opts.tutorial;
      if (!tut) return null;
      const tr = this.trainingTrialOf(tut.id);
      if (!tr) return null;
      const st = tr.steps[tut.step];
      if (st) return { idx: tut.step, total: tr.steps.length, step: st, done: false };
      return {
        idx: tr.steps.length,
        total: tr.steps.length,
        step: { cmd: null, text: 'Отлично! Доведите тренировочный бой до победы.' },
        done: true
      };
    },

    startTutorialTrial(id) {
      const tr = this.trainingTrialOf(id);
      if (!tr) return null;
      const su = tr.setup;
      const party = su.party.map(h => {
        const lvl = h.lvl || su.lvl || 20;
        const st = Object.assign({}, this.baseStats(h.id, lvl, 0));
        if (h.spd != null) st.spd = h.spd;
        if (h.breakE != null) st.breakE = h.breakE;
        if (h.atk != null) st.atk = h.atk;
        const hp = h.hpPct ? Math.max(1, Math.round(st.hp * h.hpPct)) : st.hp;
        const maxEn = H.CHARS[h.id].energy || 100;
        const energy = h.energy != null ? Math.min(maxEn, h.energy) : Math.round(maxEn * 0.5);
        return {
          key: 'trial:' + h.id,
          charId: h.id,
          lvl,
          stats: st,
          hp,
          energy,
          trial: true,
          tr: this.traceTrialSpec ? this.traceTrialSpec(h.id, lvl) : null,
          eid: 0,
          startDebuff: h.startDebuff || null
        };
      });
      const waves = [su.enemies.map(e => e.id + ':' + (e.lvl || su.lvl || 20))];
      const opts = {
        party,
        seed: su.seed || 101,
        waves,
        lvl: su.lvl || 20,
        boss: false,
        noFlee: false,
        ambush: null,
        leader: 0,
        sp: su.sp != null ? su.sp : 3,
        techs: [],
        nextAtk: 0,
        nextCrit: 0,
        rumorKind: false,
        noContact: !su.contact,
        su: null,
        foeHp: 1,
        foeAtk: 1,
        fh: null,
        endAt: 0,
        hpStart: 0,
        tutorial: {
          id: tr.id,
          step: 0,
          enemies: su.enemies,
          party: su.party
        }
      };
      this.tutorialLastId = tr.id;
      this.battle = new H.Battle(opts);
      this.tutorialAttach(this.battle, tr);
      this.battleCtx = { o: { tutorial: tr.id }, enc: null, encId: null, ent: null, bg: 'sim', music: 'battle', fromScript: false, calyx: null, opts };
      this.emit({ t: 'battle', bg: 'sim', music: 'battle', boss: false });
      return this.battle;
    },

    tutorialAttach(b, tr) {
      const push0 = b.push.bind(b);
      b.push = e => {
        const tut = b.opts.tutorial, st = tr.steps[tut.step];
        if (st) {
          if (e.t === 'act' && e.u && e.u.side === 'ally') {
            if (st.cmd === 'basic' && e.kind === 'basic' && (!st.u || e.u.charId === st.u)) tut.step++;
            else if (st.cmd === 'skill' && e.kind === 'skill' && (!st.u || e.u.charId === st.u)) tut.step++;
            else if (st.cmd === 'contact' && e.kind === 'contact') tut.step++;
            else if (String(st.cmd || '').startsWith('ult:') && e.kind === 'ult') tut.step++;
          } else if (e.t === 'fusion' && st.cmd === 'fusion') {
            tut.step++;
          }
        }
        return push0(e);
      };
    },

    tutorialEnd(b) {
      const tut = b && b.opts && b.opts.tutorial;
      const tr = tut ? this.trainingTrialOf(tut.id) : null;
      const st = this.tutorialState();
      const win = !!(b && b.result && b.result.win && !b.result.fled);
      let firstWin = false, got = [];
      if (win && tr) {
        st.trials[tr.id] = true;
        if (!st.claimed[tr.id]) {
          st.claimed[tr.id] = true;
          firstWin = true;
          got = this.give(tr.reward);
        }
      }
      const out = {
        win,
        fled: !!(b && b.result && b.result.fled),
        lines: [],
        levelUps: [],
        items: got,
        tutorial: tr ? { id: tr.id, title: tr.title, badge: tr.badge, firstWin, reward: tr.reward, got } : null
      };
      this.battle = null;
      this.battleCtx = null;
      return out;
    },

    tutorialRetry() {
      const id = (this.battle && this.battle.opts && this.battle.opts.tutorial && this.battle.opts.tutorial.id) || this.tutorialLastId;
      return id ? this.startTutorialTrial(id) : null;
    },

    tutorialDrop() {
      this.battle = null;
      this.battleCtx = null;
    }
  });

  const alerts0 = P.alerts;
  P.alerts = function () {
    const out = alerts0.call(this);
    out.tutorial = this.tutorialAlert();
    return out;
  };

  const endBattle0 = P.endBattle;
  P.endBattle = function () {
    const b = this.battle, ctx = this.battleCtx;
    if (b && b.over && ctx && ctx.o && ctx.o.tutorial) return this.tutorialEnd(b);
    return endBattle0.call(this);
  };

  const traceFoe0 = BP.traceFoe;
  BP.traceFoe = function (list) {
    if (traceFoe0) traceFoe0.call(this, list);
    const T = this.opts && this.opts.tutorial;
    if (!T || list !== this.enemies) return;
    list.forEach((u, i) => {
      const o = T.enemies[i];
      if (!o) return;
      if (o.hp != null) { const v = Math.max(1, Math.round(u.maxHp * o.hp)); u.maxHp = v; u.hp = v; u.base.hp = v; }
      if (o.spd != null) u.base.spd = o.spd;
      if (o.tough != null) { u.tough = o.tough; u.maxTough = o.tough; }
      if (o.weak) { u.data = Object.assign({}, u.data, { weak: o.weak }); u.weak = o.weak; }
      if (o.startBuff) u.buffs.push(Object.assign({}, o.startBuff));
      if (o.startCharge != null) { u.charging = o.startCharge; u.lockTarget = this.allies[0]; }
      if (o.startJoy != null && u.mood) u.mood.happy = o.startJoy;
    });
  };

  const memo0 = BP.memo;
  BP.memo = function (on, ctx) {
    if (memo0) memo0.call(this, on, ctx);
    const T = this.opts && this.opts.tutorial;
    if (!T || on !== 'start') return;
    this.allies.forEach((a, i) => {
      const p = T.party && T.party[i];
      if (p && p.startDebuff) a.buffs.push(Object.assign({ debuff: true }, p.startDebuff));
    });
  };

  const contact0 = BP.contact;
  BP.contact = function (ci, target) {
    if (!(this.opts && this.opts.tutorial)) return contact0.call(this, ci, target);
    const chance0 = this.rng.chance;
    this.rng.chance = () => false;
    try {
      return contact0.call(this, ci, target);
    } finally {
      this.rng.chance = chance0;
    }
  };

  const autoStep0 = BP.autoStep;
  BP.autoStep = function () {
    const T = this.opts && this.opts.tutorial;
    if (!T || !this.canAct()) return autoStep0.call(this);
    const tr = H.TRAINING_TRIALS.find(x => x.id === T.id);
    const st = tr && tr.steps[T.step];
    if (st) {
      if (String(st.cmd || '').startsWith('ult:')) {
        const idx = +st.cmd.split(':')[1] || 0;
        const a = this.allies[idx];
        if (a && this.ultReady(a)) return this.ult(a, this.autoTarget(a));
      }
      if (st.cmd === 'fusion') {
        const fu = this.availableFusions().find(x => x.ready);
        if (fu) return this.fusion(fu.id, this.autoTarget(this.current || this.allies[0]));
      }
      const u = this.current;
      if (u && (!st.u || u.charId === st.u)) {
        if (st.cmd === 'basic') return this.act('basic', this.autoTarget(u));
        if (st.cmd === 'skill' && this.sp >= this.skillCost(u)) {
          const ab = u.kit.skill;
          const tgt = ab.target === 'ally' ? (st.targetAlly != null ? this.allies[st.targetAlly] : this.allies.find(x => x !== u && !x.dead) || u) : ab.target === 'allies' || ab.target === 'self' ? u : this.autoTarget(u);
          return this.act('skill', tgt);
        }
        if (st.cmd === 'contact') return this.contact(0, this.living[0]);
      }
    }
    return autoStep0.call(this);
  };

  H.TUTORIAL = { stripTags };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
