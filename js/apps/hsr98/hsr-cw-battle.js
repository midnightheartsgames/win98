(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN, B = CW.BONDS, T = H.TUNING, AV = T.avBase, FX = CW.PHASE_FX;
  const formulaHp = (id, mul) => T.enemyHp * H.ENEMIES[id].hp * H.grow(TUN.lvl) * (mul || 1);
  const { spdOf, atkOf, alive } = H.battleStat;
  const P = H.Battle.prototype;

  const ownerOf = u => (u && u.cwU ? u : u && u.owner && u.owner.cwU ? u.owner : null);
  const member = (u, k) => !!(u && u.cwU && u.cwU.bonds.includes(k));

  function bondUnit(id, name, elem, spd) {
    const u = {
      side: 'ally', summon: true, cwBond: id, idx: 0, id: 'cw_' + id, charId: 'cw_' + id, key: 'cw_' + id, owner: null, name, lvl: TUN.lvl, elem, path: 'harmony',
      base: { hp: 1, atk: 1, def: 1, spd: spd || 100, critR: 0, critD: 0, breakE: 0, ehr: 0, res: 0, healP: 0, err: 0, dmgP: 0, ultP: 0 },
      maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, frozenDmg: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: {}, appear: true
    };
    u.av = AV / spdOf(u);
    return u;
  }

  function offUnit(o, cwU, i) {
    const kit = H.CHARS[o.kit];
    const base = Object.assign({ critR: 0.05, critD: 0.5, breakE: 0, ehr: 0, res: 0, healP: 0, err: 0, dmgP: 0, ultP: 0 }, o.stats);
    base.spd = base.spd * TUN.off.spd * (cwU && !cwU.wrong && CW.kitOffSpd ? CW.kitOffSpd(cwU.id, 'off', cwU.star - 1) : 1);
    const u = {
      side: 'ally', summon: true, cwOff: true, idx: i, id: 'cw_off', charId: 'cw_off', kitId: o.kit, key: 'cwoff' + o.uid, owner: null, name: kit.name, lvl: TUN.lvl, elem: kit.elem, path: kit.path,
      base, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, frozenDmg: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: {}, appear: true, cwU
    };
    u.av = AV / spdOf(u);
    return u;
  }

  Object.assign(P, {
    cwMemo(on, ctx) {
      if (on === 'start') this.cwStart();
      else if (on === 'tick') this.cwTick(ctx.d);
      else if (on === 'after') { this.cwMember(ctx.u); this.cwItemsAfter(ctx.u, ctx.kind === 'ult'); this.cwKitsAfter(ctx.u, ctx.kind); this.cwQueue(); this.cwCheck(); }
      else if (on === 'turn') { this.cwBondsTurn(ctx.u); this.cwItemsTurn(ctx.u); this.cwKitsTurn(ctx.u); }
      else if (on === 'kill' && ctx.u && ctx.u.side === 'enemy') {
        (this.cwKills || (this.cwKills = [])).push(ctx.u.id);
        this.cwEchoKill(ctx.u, ctx.src);
        this.cwItemsKill(ctx.u, ctx.src);
        this.cwKitsKill(ctx.u, ctx.src);
        this.cwHeatMove(ctx.u);
        if (this.cwT('dot') >= 1 && !(ctx.u.data.boss || ctx.u.data.elite)) this.cwInfo.overQ++;
      }
    },

    cwTier(k) { return this.cw.tiers[k] == null ? -1 : this.cw.tiers[k]; },

    cwStart() {
      const cw = this.cw;
      const I = this.cwInfo = { t: 0, left: cw.countdown, near: 0, dmg: {}, eng: B.belobog.start, engDmg: 0, trail: 0, units: [], hpK: 1, bigOres: 0, bigKill: false, aura: null };
      const ref = this.enemies.find((e, j) => j !== cw.big);
      if (ref) I.hpK = ref.maxHp / formulaHp(ref.id, cw.foeHp);
      this.cwFoes(this.enemies, 0);
      for (const e of this.enemies) e.av = AV / spdOf(e);
      for (const a of this.allies) { a.cwU = cw.units[this.opts.party[a.idx].cw] || null; if (a.cwU) I.units.push(a); }
      cw.off.forEach((o, i) => { const u = offUnit(o, cw.units[o.uid], i); this.summons.push(u); I.units.push(u); });
      I.off = this.summons.filter(s => s.cwOff);
      this.cwBondsStart();
      this.cwItemsStart();
      this.cwKitsStart();
      const xz = this.cwTier('xianzhou');
      if (xz >= 0) {
        const lord = bondUnit('lord', 'Повелитель молний', 'elec', B.xianzhou.lordSpd);
        lord.flags.hits = B.xianzhou.hits[xz];
        if (xz >= 2) lord.av = 0;
        this.summons.push(lord);
        I.lord = lord;
      }
      const ex = this.cwTier('express');
      if (ex >= 1) { const e = bondUnit('express', 'Звёздный экспресс', 'imag', B.express.spd); this.summons.push(e); I.express = e; }
      if (this.cwTier('belobog') >= 0) I.engine = bondUnit('engine', 'Двигатель созидания', 'fire', 100);
      if (ex >= 0) { this.cwExpress(I.express || bondUnit('express', 'Звёздный экспресс', 'imag', B.express.spd)); this.cleanup(); }
    },

    cwTick(d) {
      const I = this.cwInfo, cw = this.cw;
      if (!I || this.over) return;
      this.cwCheck();
      if (this.over) return;
      this.cwItemsTick(d);
      this.cwKitsTick(d);
      I.t += d;
      if (I.left != null) {
        I.left -= d;
        if (cw.kind === 'boss' && !I.finale && I.left < TUN.finaleAt && I.left > 0) { I.finale = true; this.push({ t: 'cwPhase', k: 'finale' }); }
        if (I.left <= 0) {
          I.left = 0;
          this.push({ t: 'text', text: 'Отсчёт закончился. Узел не пройден.', warn: true });
          this.finish(false);
        }
      } else if (cw.limit && I.t >= cw.limit) this.finish(false);
    },

    cwNear(tgt) {
      const I = this.cwInfo;
      if (!I || !tgt.cwU) return false;
      if (this.cwKitsNear(tgt) || this.cwKitsNearAny(tgt)) return true;
      I.near++;
      this.cwMisfortune(tgt);
      tgt.hp = tgt.maxHp;
      tgt.dots = [];
      const cost = I.left != null ? Math.round(this.cw.near * this.cwKitsNearMul(tgt)) : 0;
      if (cost) I.left = Math.max(0, I.left - cost);
      this.push({ t: 'revive', u: tgt, hp: tgt.hp, text: cost ? 'О гибели! Отсчёт −' + cost : 'О гибели!' });
      this.push({ t: 'cwNear', u: tgt, cost });
      this.cwKitsNearAfter(tgt);
      return true;
    },

    cwPow(w) {
      const I = this.cwInfo, u = w.cwU;
      let plus = 0;
      const xz = this.cwTier('xianzhou'), ex = this.cwTier('express');
      if (xz >= 0 && member(w, 'xianzhou')) plus += B.xianzhou.pow[xz];
      if (ex >= 0 && I.trail) plus += I.trail * B.express.trail[ex] * (ex >= 1 && member(w, 'express') ? 2 : 1);
      return u.pow / 100 * (1 + plus + this.cwBondPow(w) + this.cwItemsPow(w) + this.cwKitsPow(w));
    },

    cwQueue() {
      const I = this.cwInfo;
      if (!I || this.over) return;
      const om = I.oneMoreQ || [], ul = I.ultQ || [];
      I.oneMoreQ = []; I.ultQ = [];
      for (const u of om) this.cwOneMore(u);
      for (const u of ul) this.cwEnergyUlt(u);
    },

    cwMul(src, tgt, o) {
      if (!this.cwInfo || !tgt || tgt.side !== 'enemy') return 1;
      const w = ownerOf(src);
      if (!w) return 1;
      let amp = 1;
      const bb = this.cwTier('belobog'), hl = this.cwTier('heal');
      if (bb >= 0 && member(w, 'belobog')) amp += B.belobog.amp[bb];
      if (hl >= 0) amp += B.heal.dmg[hl];
      return this.cwPow(w) * amp * this.cwBondAmp(src, w, tgt, o || {}) * (this.cwInfo.finale ? TUN.finaleMul : 1);
    },

    cwHealMul(src) {
      const w = ownerOf(src);
      if (!w) return 1;
      const hl = this.cwTier('heal');
      return w.cwU.healPow / 100 * (1 + (hl >= 0 && member(w, 'heal') ? B.heal.healPow[hl] : 0));
    },

    cwFoes(list, w) {
      const cw = this.cw, I = this.cwInfo, fx = cw.phaseFx[w];
      list.forEach((u, j) => {
        if (u.cwDone) return;
        u.cwDone = true;
        const star = (cw.stars[w] && cw.stars[w][j]) || 1, big = w === 0 && j === cw.big;
        const k = TUN.starHp[star - 1] * (big ? TUN.bigTrotter : 1);
        u.maxHp = Math.round(u.maxHp * k); u.hp = u.maxHp;
        u.base.atk *= TUN.starAtk[star - 1];
        u.base.spd *= cw.spdMul || 1;
        u.cwStar = star;
        if (big) { u.cwBig = true; u.name = 'Большая свинка-копилка'; I.bigStep = 0; }
      });
      const boss = list.find(u => u.data.boss);
      if (fx === 'aura' && boss) {
        const others = list.filter(u => u !== boss).length;
        boss.shield = Math.round(boss.maxHp * FX.aura.shield * others);
        boss.shieldT = 999;
        I.aura = boss;
        for (const u of list) u.buffs.push({ s: 'toughIn', v: -1, turns: 999, perm: true, name: FX.aura.name });
        this.push({ t: 'cwPhase', k: 'aura' });
      }
      if (fx === 'wrath' && boss) { boss.buffs.push({ s: 'dmgP', v: FX.wrath.dmg, turns: 999, perm: true, name: FX.wrath.name }); this.push({ t: 'cwPhase', k: 'wrath' }); }
    },

    cwReinforce(list) {
      for (const u of list) {
        if (u.cwDone) continue;
        u.cwDone = true;
        u.maxHp = Math.max(1, Math.round(u.maxHp * this.cw.foeHp)); u.hp = u.maxHp;
        u.base.spd *= this.cw.spdMul || 1;
        u.cwStar = 1;
      }
    },

    cwCheck() {
      const I = this.cwInfo;
      if (!I || !I.auraBreak || this.over) return;
      const src = I.auraBreak, boss = I.aura;
      I.auraBreak = null;
      I.aura = null;
      for (const u of this.enemies) u.buffs = u.buffs.filter(b => b.name !== FX.aura.name);
      this.push({ t: 'cwPhase', k: 'auraBreak' });
      this.acting = src;
      for (const u of this.living.slice()) {
        this.hit(src, u, 0, { raw: u.maxHp * (u === boss ? FX.aura.cutBoss : FX.aura.cut), e: src.elem, kind: 'follow', label: 'Аура разбита' });
        if (alive(u) && !u.broken) { u.tough = 0; this.doBreak(src, u, src.elem); }
      }
      this.acting = null;
      this.cleanup();
    },

    cwLog(e) {
      const I = this.cwInfo;
      const wo = ownerOf(e.src);
      if (wo && e.u && e.u.side === 'enemy') this.cwBondsLog(e, wo);
      if (!I || !e.u || e.u.side !== 'enemy') return;
      if (I.aura && e.u === I.aura && e.shield <= 0 && e.src && e.src.side === 'ally') I.auraBreak = e.src;
      if (e.u.cwBig) {
        const lost = Math.floor((1 - Math.max(0, e.hp) / e.u.maxHp) * 10);
        while (I.bigStep < Math.min(9, lost)) { I.bigStep++; I.bigOres++; this.push({ t: 'cwOre', u: e.u }); }
        if (e.hp <= 0) I.bigKill = true;
      }
      const w = ownerOf(e.src);
      if (!w) return;
      I.dmg[w.cwU.uid] = (I.dmg[w.cwU.uid] || 0) + e.v;
      if (member(w, 'belobog')) I.engDmg += e.v;
    },

    cwMember(u) {
      const I = this.cwInfo;
      if (!I || !u || !u.cwU || this.over) return;
      this.cwBondsAfter(u);
      if (this.over) return;
      const bb = this.cwTier('belobog'), xz = this.cwTier('xianzhou');
      if (bb >= 0 && member(u, 'belobog') && I.engine) {
        I.eng++;
        this.push({ t: 'cwEngine', n: I.eng, full: B.belobog.full });
        if (I.eng >= B.belobog.full) this.cwEngine();
      }
      if (xz >= 0 && member(u, 'xianzhou') && I.lord && alive(I.lord)) {
        I.lord.flags.hits += B.xianzhou.per[xz];
        this.advance(I.lord, B.xianzhou.push[xz]);
        this.push({ t: 'cwLord', hits: I.lord.flags.hits });
      }
    },

    cwStrike(src, mult, o) {
      const base = this.cw.base * mult;
      for (const t of this.living.slice()) this.hit(src, t, 0, Object.assign({ raw: base, e: src.elem, kind: 'follow', label: src.name }, o));
    },

    cwBondAct(src, name) {
      this.acting = src;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      this.push({ t: 'act', u: src, name, kind: 'summon' });
    },

    cwExpress(src) {
      const I = this.cwInfo, ex = this.cwTier('express');
      if (!this.living.length) return;
      this.cwBondAct(src, 'Звёздный экспресс');
      this.push({ t: 'cwBond', k: 'express' });
      this.cwStrike(src, B.express.hit[ex], { tough: 30 });
      if (I.trail < B.express.stacks[ex]) I.trail++;
      if (ex >= 2) for (const e of this.living) this.addBuff(e, { s: 'defDown', v: 0.1 * I.trail, turns: 2, name: 'Светлая колея', debuff: true }, true);
      this.push({ t: 'cwTrail', n: I.trail });
      this.acting = null;
    },

    cwEngine() {
      const I = this.cwInfo, bb = this.cwTier('belobog'), src = I.engine;
      if (!this.living.length) return;
      const extra = I.engDmg * B.belobog.share[bb];
      I.eng = 0;
      I.engDmg = 0;
      this.cwBondAct(src, 'Двигатель созидания');
      this.push({ t: 'cwBond', k: 'belobog' });
      const base = this.cw.base * B.belobog.hit[bb] + extra / Math.max(1, this.living.length);
      for (const t of this.living.slice()) this.hit(src, t, 0, { raw: base * (1 + B.belobog.amp[bb]), e: 'fire', kind: 'follow', tough: 10, label: src.name });
      this.acting = null;
      this.push({ t: 'cwEngine', n: 0, full: B.belobog.full });
      const best = I.units.filter(u => member(u, 'belobog') && alive(u)).sort((a, b) => (I.dmg[b.cwU.uid] || 0) - (I.dmg[a.cwU.uid] || 0))[0];
      if (best) { this.advance(best, 1); this.push({ t: 'status', u: best, text: 'Двигатель: ход сразу' }); }
    },

    cwLordTurn(h) {
      const xz = this.cwTier('xianzhou'), X = B.xianzhou;
      for (let k = 0; k < X.times[xz] && this.living.length && !this.over; k++) {
        this.cwBondAct(h, 'Повелитель молний × ' + h.flags.hits);
        this.cwStrike(h, X.aoe[xz], { tough: 5 });
        for (let i = 0; i < h.flags.hits && this.living.length; i++) this.hit(h, this.rng.pick(this.living), 0, { raw: this.cw.base * X.bounce[xz], e: 'elec', kind: 'follow', tough: 3, label: h.name });
        this.acting = null;
        this.cleanup();
      }
      h.flags.hits = X.hits[xz];
      this.push({ t: 'cwLord', hits: h.flags.hits });
    },

    cwOffTurn(h) {
      const role = h.cwU.role, O = TUN.off;
      this.cwItemsTurn(h);
      if (this.cwKitsOff(h)) { this.acting = null; this.cwMember(h); this.cwItemsAfter(h, false); return; }
      this.acting = h;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      if (role === 'a') {
        const list = this.living.slice().sort((a, b) => b.hp - a.hp || (b.weak.includes(h.elem) ? 1 : 0) - (a.weak.includes(h.elem) ? 1 : 0));
        if (list[0]) { this.push({ t: 'act', u: h, name: h.name + ': удар вне поля', kind: 'summon' }); this.hit(h, list[0], O.hit, { kind: 'follow', tough: O.tough, label: h.name }); }
      } else if (role === 'p') {
        const a = this.livingAllies.slice().sort((x, y) => atkOf(y) - atkOf(x))[0];
        if (a) { this.push({ t: 'act', u: h, name: h.name + ': поддержка', kind: 'summon' }); this.addBuff(a, { s: 'dmgP', v: O.buff, turns: 1, name: h.name + ': поддержка' }); }
      } else if (role === 'l') {
        const a = this.livingAllies.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
        if (a) { this.push({ t: 'act', u: h, name: h.name + ': лечение', kind: 'summon' }); this.heal(h, a, a.maxHp * O.heal + h.base.hp * O.healHp); }
      } else {
        const a = this.livingAllies.slice().sort((x, y) => (x.hp + x.shield) / x.maxHp - (y.hp + y.shield) / y.maxHp)[0];
        if (a) { this.push({ t: 'act', u: h, name: h.name + ': щит', kind: 'summon' }); this.giveShield(a, h.base.def * O.shield + h.base.hp * O.shieldHp, 2); }
      }
      this.acting = null;
      this.cwMember(h);
      this.cwItemsAfter(h, false);
    }
  });

  const memo0 = P.memo;
  P.memo = function (on, ctx) {
    if (memo0) memo0.call(this, on, ctx);
    if (this.cw) this.cwMemo(on, ctx);
  };

  const dmgCalc0 = P.dmgCalc;
  P.dmgCalc = function (src, tgt, mult, o, crit) {
    let v = dmgCalc0.call(this, src, tgt, mult, o, crit);
    if (!this.cwInfo) return v;
    v *= this.cwMul(src, tgt, o);
    const w = ownerOf(src);
    if (crit && this.cwInHit && w && tgt && tgt.side === 'enemy') {
      const L = this.cwLucky(w);
      if (L.ch > 0 && this.rng() < L.ch) { v *= 1 + L.dmg; this.cwLuckyNext = true; }
    }
    return Math.max(1, Math.round(v));
  };

  const heal0 = P.heal;
  P.heal = function (src, u, v) {
    return heal0.call(this, src, u, this.cwInfo && src ? v * this.cwHealMul(src) : v);
  };

  const push0 = P.push;
  P.push = function (e) {
    const I = this.cwInfo;
    if (I && e.t === 'dmg') { if (this.cwLuckyNext) { e.lucky = true; this.cwLuckyNext = false; } if (e.src) this.cwLog(e); }
    if (I && e.t === 'oneMore' && e.u && e.u.cwU) (I.oneMoreQ || (I.oneMoreQ = [])).push(e.u);
    if (I && e.t === 'act' && e.kind === 'ult' && e.u && e.u.cwU) (I.ultQ || (I.ultQ = [])).push(e.u);
    return push0.call(this, e);
  };

  const summonTurn0 = P.summonTurn;
  P.summonTurn = function (h) {
    if (h.cwOff) { this.cwOffTurn(h); h.av = AV / spdOf(h); this.cwCheck(); return; }
    if (h.cwBond === 'lord') { this.cwLordTurn(h); h.av = AV / spdOf(h); this.cwCheck(); return; }
    if (h.cwBond === 'express') { this.cwExpress(h); h.av = AV / spdOf(h); this.cwCheck(); return; }
    const own = { arena: 'cwArenaTurn', aha: 'cwAhaTurn', echo: 'cwEchoTurn', gynoid: 'cwGynoidTurn' }[h.cwBond];
    if (own) { this.acting = h; this.hitThisAction = new Set(); this.actSerial = (this.actSerial || 0) + 1; this[own](h); this.acting = null; h.av = AV / spdOf(h); this.cleanup(); this.cwCheck(); return; }
    return summonTurn0.call(this, h);
  };

  const traceFoe0 = P.traceFoe;
  P.traceFoe = function (list) {
    if (traceFoe0) traceFoe0.call(this, list);
    if (!this.cwInfo) return;
    if (list === this.enemies) this.cwFoes(list, this.wave); else this.cwReinforce(list);
    this.cwFoesBonds(list);
    this.cwKitsWave(list);
    if (this.cwT('aoe') >= 0 && list === this.enemies) this.cwMarks();
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
