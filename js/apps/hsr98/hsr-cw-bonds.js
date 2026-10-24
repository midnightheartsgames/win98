(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN, B = CW.BONDS, T = H.TUNING, AV = T.avBase;
  const { spdOf, atkOf, alive } = H.battleStat;
  const P = H.Battle.prototype;
  const SP0 = T.spMax;
  const ELEMS = ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'];

  const ownerOf = u => (u && u.cwU ? u : u && u.owner && u.owner.cwU ? u.owner : null);
  const member = (u, k) => !!(u && u.cwU && u.cwU.bonds.includes(k));
  const big = u => !!(u && u.data && (u.data.boss || u.data.elite));

  function bondUnit(id, name, elem, spd) {
    const u = {
      side: 'ally', summon: true, cwBond: id, idx: 0, id: 'cw_' + id, charId: 'cw_' + id, key: 'cw_' + id, owner: null, name, lvl: TUN.lvl, elem, path: 'harmony',
      base: { hp: 1, atk: 1, def: 1, spd: spd || 100, critR: 0, critD: 0, breakE: 0, ehr: 0, res: 0, healP: 0, err: 0, dmgP: 0, ultP: 0 },
      maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, frozenDmg: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: {}, appear: true
    };
    u.av = AV / spdOf(u);
    return u;
  }

  CW.bondUnit = bondUnit;

  Object.assign(P, {
    cwT(k) { return this.cw.tiers[k] == null ? -1 : this.cw.tiers[k]; },

    cwMembers(k) { return this.cwInfo.units.filter(u => member(u, k) && alive(u)); },

    cwBondsStart() {
      const I = this.cwInfo, cw = this.cw;
      Object.assign(I, { cats: 0, misfortune: 0, days: 0, boom: false, aoa: 0, chaosTurn: 0, applause: 0, encores: 0, encorePow: 0, wave: 0, combo: 0, followDmg: 0, ultE: 0, markHits: 0, arena: 0, burnLost: 0, joy: 0, sp: this.sp, chainUsed: false, breaks: 0, chainElite: false, offDmg: 0, allDmg: 0, echoGot: [], spCoins: 0, overQ: 0 });
      if (this.cwT('scholars') >= 0) I.cats = cw.cats || 0;
      const sp = this.cwT('sp');
      T.spMax = SP0 + (sp >= 0 ? B.sp.cap[sp] : 0);
      if (cw.gifts && cw.gifts.dr) for (const a of this.allies) a.buffs.push({ s: 'dr', v: cw.gifts.dr, turns: 999, perm: true, name: 'Путешественник Сампо' });
      if (this.cwT('scholars') >= 0 && I.cats) for (const a of this.allies) a.buffs.push({ s: 'dr', v: B.scholars.dr + B.scholars.drPer * I.cats, turns: 999, perm: true, name: 'Кошки-пирожные' });
      if (this.cwT('hpburn') >= 0) { I.arenaU = bondUnit('arena', 'Арена кровавого пламени', 'fire', B.hpburn.spd); this.summons.push(I.arenaU); I.burnMax = this.cwMembers('hpburn').reduce((a, u) => a + (u.summon ? u.base.hp : u.maxHp), 0) || 1; }
      if (this.cwT('elation') >= 0 && !this.allies.some(a => a.path === 'elation')) { I.ahaU = bondUnit('aha', 'Аха', 'imag', B.elation.spd); this.summons.push(I.ahaU); }
      const fr = this.cwT('fractsidus');
      if (fr >= 0) for (const e of cw.echoes || []) { const h = bondUnit('echo', 'Эхо: ' + H.ENEMIES[e.id].name.split(',')[0], e.elem || 'phys', B.fractsidus.spd); h.flags.echo = e; this.summons.push(h); }
      if (this.cwT('aoe') >= 0) this.cwMarks();
      this.cwFoesBonds(this.enemies);
    },

    cwFoesBonds(list) {
      const br = this.cwT('break'), q = this.cwT('quantum'), inb = this.cwT('inaba'), aoe = this.cwT('aoe');
      for (const u of list) {
        if (u.cwBonded) continue;
        u.cwBonded = true;
        if (br >= 0) { u.maxTough = Math.max(1, Math.round(u.maxTough * (1 - B.break.tough[br]))); u.tough = Math.min(u.tough, u.maxTough); }
        if (q >= 0) u.buffs.push({ s: 'vuln', v: B.quantum.vuln[q], turns: 999, perm: true, name: 'Квантовый резонанс', debuff: true });
        if (inb >= 2 && this.cwInfo.units.some(a => a.cwU && a.cwU.id === 'rise')) for (const e of u.weak || []) u.buffs.push({ s: e + 'Vuln', v: B.inaba.reveal, turns: 999, perm: true, name: 'Раскрытая слабость', debuff: true });
        if (aoe >= 2 && u.data.boss) u.buffs.push({ s: 'vuln', v: B.aoe.boss[aoe], turns: 999, perm: true, name: 'Групповая атака', debuff: true });
      }
    },

    cwMarks() {
      const free = this.living.filter(e => !e.cwMark);
      const need = 2 - this.living.filter(e => e.cwMark).length;
      for (let i = 0; i < need && free.length; i++) {
        const e = free.splice(this.rng.int ? this.rng.int(free.length) : Math.floor(this.rng() * free.length), 1)[0];
        e.cwMark = true;
        this.push({ t: 'status', u: e, text: 'Заёмная сила', debuff: true });
      }
    },

    cwBondPow(w) {
      const I = this.cwInfo, u = w.cwU;
      let plus = u.powPlus || 0;
      if (member(w, 'scholars')) plus += B.scholars.catPow * I.cats;
      if (member(w, 'conton')) plus += I.encorePow;
      return plus;
    },

    cwBondAmp(src, w, tgt, o) {
      const I = this.cwInfo;
      let amp = 0, mul = 1;
      const t = k => this.cwT(k);
      if (t('hunters') >= 0 && member(w, 'hunters')) amp += B.hunters.amp[t('hunters')];
      if (t('hpburn') >= 0 && member(w, 'hpburn')) amp += B.hpburn.amp[t('hpburn')] + B.hpburn.per * Math.floor(I.burnLost / I.burnMax * 10);
      if (t('shield') >= 0) amp += B.shield.dmg[t('shield')];
      if (w.cwU.cell) amp += B.energy.cell * (member(w, 'energy') ? 2 : 1);
      const its = (w.cwU.it && w.cwU.it.items) || [], kind = its.some(x => x.id === 'em_follow') ? 'follow' : its.some(x => x.id === 'em_energy') ? 'ult' : o.kind;
      if (t('follow') >= 0 && member(w, 'follow')) { amp += I.combo; if (kind === 'follow') amp += B.follow.dmg[t('follow')]; }
      if (t('energy') >= 0 && member(w, 'energy') && kind === 'ult') amp += B.energy.ult[t('energy')];
      if (t('sp') >= 0 && ['basic', 'skill', 'enhanced'].includes(o.kind)) amp += B.sp.dmg[t('sp')];
      if (t('dot') >= 0 && member(w, 'dot') && o.isDot) amp += B.dot.dmg[t('dot')];
      if (I.dayT > 0) amp += I.dayDmg;
      if (t('elation') >= 0 && member(w, 'elation') && I.joyT > 0) amp += B.elation.joy;
      if (tgt.cwHeat && tgt.cwHeat.n) mul *= 1 + tgt.cwHeat.extra * tgt.cwHeat.n;
      amp += this.cwItemsAmp(w, tgt, o);
      return (1 + amp) * mul * (1 + this.cwKitsAmp(w, tgt, o));
    },

    cwLucky(w) {
      const I = this.cwInfo, cw = this.cw;
      let ch = 0, dmg = TUN.luckyDmg;
      const t = k => this.cwT(k);
      if (t('kazuma') >= 0 && member(w, 'kazuma')) ch += B.kazuma.lucky[t('kazuma')];
      if (t('aoe') >= 0 && member(w, 'aoe')) { ch += B.aoe.lucky[t('aoe')]; dmg += B.aoe.lucky[t('aoe')]; }
      if (t('elation') >= 0 && member(w, 'elation')) ch += B.elation.lucky[t('elation')];
      if (cw.gifts && cw.gifts.lucky) ch += cw.gifts.lucky * (member(w, 'travelers') ? 2 : 1);
      if (t('quantum') >= 0 && cw.fuxuan) dmg += B.quantum.fuxuan * (t('quantum') + 1);
      if (I.dayT > 0) ch += I.dayLucky;
      if (I.prizeT > 0 && member(w, 'elation')) { ch += B.elation.prizeLucky; dmg += B.elation.prizeDmg; }
      const il = this.cwItemsLucky(w);
      ch += il.ch; dmg += il.dmg;
      const kl = this.cwKitsLucky(w);
      ch += kl.ch; dmg += kl.dmg;
      if (ch > 1) { dmg += (ch - 1) * TUN.luckyOver; ch = 1; }
      return { ch, dmg };
    },

    cwBondsLog(e, w) {
      const I = this.cwInfo;
      I.allDmg += e.v;
      if (w.summon && w.cwOff) I.offDmg += e.v;
      if (member(w, 'conton')) I.jury = (I.jury || 0) + e.v;
    },

    cwHurt(e) {
      const I = this.cwInfo;
      if (this.cwT('hpburn') < 0 || !member(e.u, 'hpburn')) return;
      const lost = Math.max(0, e.lost || 0);
      I.burnLost += lost;
      I.arena = Math.min(I.burnMax * B.hpburn.cap[this.cwT('hpburn')], I.arena + lost);
    },

    cwBondsTurn(u) {
      const I = this.cwInfo;
      I.sp = this.sp;
      if (u.side === 'ally' && !u.summon && this.cwT('scholars') >= 0 && I.cats) this.heal(null, u, u.maxHp * (B.scholars.heal + B.scholars.healPer * I.cats));
      if (I.dayT > 0) I.dayT--;
      if (I.joyT > 0) I.joyT--;
      if (I.prizeT > 0) I.prizeT--;
    },

    cwBondsAfter(u) {
      const I = this.cwInfo;
      if (!I || this.over || !u) return;
      if (u.side === 'ally') this.cwCombo(u);
      if (member(u, 'conton') && this.cwT('conton') >= 0) this.cwApplause(u);
      if (this.cwT('follow') >= 0 && member(u, 'follow') && !this.cwFollowBusy && this.living.length) {
        this.cwFollowBusy = true;
        const t = this.rng.pick(this.living), e = ELEMS[Math.floor(this.rng() * ELEMS.length)];
        this.hit(u, t, B.follow.extra, { kind: 'follow', e, tough: 5, label: 'Бонус-атака' });
        this.cwFollowBusy = false;
      }
      if (this.cwT('sp') >= 0 && member(u, 'sp') && this.sp < I.sp) this.cwLottery(u, I.sp - this.sp);
      I.sp = this.sp;
    },

    cwCombo(u) {
      const I = this.cwInfo, f = this.cwT('follow');
      if (f < 0) return;
      I.chain = (I.chain || 0) + 1;
      I.combo = Math.min(B.follow.cap[f], I.combo + B.follow.step[f]);
      if (f >= 1 && I.chain >= 5 && I.followDmg > 0) {
        const raw = I.followDmg * B.follow.burst[f] / Math.max(1, this.living.length);
        I.chain = 0;
        I.followDmg = 0;
        const src = bondUnit('follow', 'Общий удар', 'phys', 100);
        this.push({ t: 'act', u: src, name: 'Общий удар', kind: 'summon' });
        for (const t of this.living.slice()) this.hit(src, t, 0, { raw, kind: 'follow', label: 'Общий удар' });
      }
    },

    cwApplause(u) {
      const I = this.cwInfo, c = this.cwT('conton');
      if (I.encores >= B.conton.encore[c]) return;
      I.applause++;
      this.push({ t: 'cwBar', k: 'applause' });
      if (I.applause < B.conton.full) return;
      I.applause = 0;
      I.encores++;
      I.encorePow += B.conton.encorePow;
      this.push({ t: 'cwBond', k: 'conton' });
      for (const m of this.cwMembers('conton')) this.advance(m, 1);
    },

    cwLottery(u, spent) {
      const I = this.cwInfo, s = this.cwT('sp');
      for (let i = 0; i < spent; i++) {
        const r = this.rng();
        if (s >= 2 && r < 0.03) { I.spCoins++; this.push({ t: 'status', u, text: 'Особый приз: +1 монета', col: '#ffd471' }); }
        else if (s >= 1 && r < 0.08) { this.sp = Math.min(T.spMax, this.sp + 4); this.advance(u, 1); this.push({ t: 'status', u, text: 'Большой приз: ход и +4 очка', col: '#ffd471' }); }
        else if (s >= 1 && r < 0.3) this.addBuff(u, { s: 'dmgP', v: 0.06, turns: 1, name: 'Средний приз' });
        else if (r < 0.6) { this.sp = Math.min(T.spMax, this.sp + 1); this.push({ t: 'status', u, text: 'Малый приз: +1 очко', col: '#9ab0ff' }); }
        else this.addBuff(u, { s: 'dmgP', v: 0.02, turns: 1, name: 'Спасибо за участие' }, true);
      }
    },

    cwMisfortune(u) {
      const I = this.cwInfo, k = this.cwT('kazuma');
      if (!I || k < 0 || !member(u, 'kazuma') || this.over) return;
      I.misfortune++;
      this.push({ t: 'cwBar', k: 'misfortune' });
      if (I.misfortune < B.kazuma.cap[k]) return;
      I.misfortune = 0;
      I.days++;
      I.dayT = 2 * (this.livingAllies.length || 1);
      I.dayLucky = B.kazuma.dayLucky[k];
      I.dayDmg = B.kazuma.dayDmg[k];
      this.push({ t: 'cwBond', k: 'kazuma' });
      if (k >= 1) for (const e of this.living) { const i = e.buffs.findIndex(b => !b.debuff); if (i >= 0) { e.buffs.splice(i, 1); this.push({ t: 'status', u: e, text: 'Казума: кража', debuff: true }); } }
      if (k >= 2 && !I.boom && this.living.length) {
        I.boom = true;
        const src = bondUnit('boom', 'Взрыв!', 'fire', 100);
        this.push({ t: 'act', u: src, name: 'Взрыв!', kind: 'summon' });
        for (const t of this.living.slice()) this.hit(src, t, 0, { raw: this.cw.base * B.kazuma.boom, e: 'fire', tough: 30, anyTough: true, kind: 'follow', label: 'Взрыв!' });
        this.cleanup();
      }
    },

    cwOneMore(u) {
      const I = this.cwInfo, k = this.cwT('inaba');
      if (k < 0 || !member(u, 'inaba')) return;
      I.aoa = Math.min(B.inaba.full, I.aoa + 1);
      this.push({ t: 'cwBar', k: 'aoa' });
      if (I.aoa >= B.inaba.full || (this.living.length && this.living.every(e => e.broken))) this.cwAllOut();
    },

    cwAllOut() {
      const I = this.cwInfo, k = this.cwT('inaba');
      if (!this.living.length) return;
      I.aoa = 0;
      const src = bondUnit('aoa', 'Общая атака', 'phys', 100);
      this.push({ t: 'act', u: src, name: 'Общая атака', kind: 'summon' });
      this.push({ t: 'cwBond', k: 'inaba' });
      for (const t of this.living.slice()) this.hit(src, t, 0, { raw: this.cw.base * B.inaba.aoa[k], e: 'phys', tough: k >= 1 ? 30 : 0, anyTough: k >= 1, kind: 'follow', label: 'Общая атака' });
    },

    cwChaos(src, t) {
      const I = this.cwInfo, k = this.cwT('section6');
      if (k < 0 || !alive(t)) return;
      this.hit(src, t, 0, { raw: this.cw.base * B.section6.burst[k], e: 'ice', kind: 'follow', label: 'Хаос: Секция 6' });
      if (k >= 1) {
        const mi = this.allies.find(a => a.charId === 'miyabi' && alive(a));
        if (mi && this.gainFrost) this.gainFrost(mi, 1);
        I.chaosTurn++;
        if (I.chaosTurn === 3 && this.living.length) {
          const s = bondUnit('snow', 'Последний снег', 'ice', 100);
          this.push({ t: 'act', u: s, name: 'Последний снег', kind: 'summon' });
          for (const e of this.living.slice()) this.hit(s, e, 0, { raw: this.cw.base * B.section6.snow, e: 'ice', kind: 'follow', label: 'Последний снег' });
        }
      }
    },

    cwBroke(src, tgt) {
      const I = this.cwInfo;
      if (!I || this.over) return;
      if (src && src.side === 'ally') I.breaks++;
      const br = this.cwT('break');
      if (br >= 1) {
        I.wave += tgt.data.boss ? B.break.charge[2] : tgt.data.elite ? B.break.charge[1] : B.break.charge[0];
        this.push({ t: 'cwBar', k: 'wave' });
        if (I.wave >= B.break.full) this.cwShockwave(src);
      }
      const h = this.cwT('hares');
      if (h >= 0 && member(src, 'hares') && !I.chainUsed) {
        const by = this.livingAllies.find(a => a !== src && !a.summon);
        if (by && alive(tgt)) {
          I.chainUsed = true;
          this.push({ t: 'act', u: by, name: 'Атака цепью', kind: 'follow' });
          const before = alive(tgt);
          this.hit(by, tgt, B.hares.chain, { kind: 'follow', tough: 10, label: 'Атака цепью' });
          if (before && !alive(tgt) && big(tgt)) I.chainElite = true;
        }
      }
    },

    cwShockwave(src) {
      const I = this.cwInfo, br = this.cwT('break');
      I.wave = 0;
      const s = bondUnit('wave', 'Ударная волна', 'phys', 100);
      this.push({ t: 'act', u: s, name: 'Ударная волна', kind: 'summon' });
      this.push({ t: 'cwBond', k: 'break' });
      this.cwWaveBusy = true;
      for (const t of this.living.slice()) {
        if (!t.broken) { t.tough = 0; this.doBreak(src && src.side === 'ally' ? src : s, t, 'phys'); }
        this.addBuff(t, { s: 'vuln', v: 0.5, turns: 2, name: 'Ударная волна', debuff: true }, true);
        if (alive(t)) this.hit(s, t, 0, { raw: this.cw.base * B.break.wave[br], kind: 'follow', label: 'Ударная волна' });
      }
      this.cwWaveBusy = false;
      if (br >= 2) for (const a of this.livingAllies) this.gainEnergy(a, a.maxEnergy * 0.3);
    },

    cwSuper(src, tgt, o) {
      const k = this.cwT('break');
      if (k < 0 || !member(ownerOf(src), 'break') || !o.tough || o.isDot || !alive(tgt)) return;
      this.hit(src, tgt, 0, { raw: this.breakDmg(src.summon ? ownerOf(src) : src, tgt, 1) * (o.tough / 10) * B.break.sup[k] * 0.1, e: o.e || src.elem, isDot: true, cwSuper: true, echo: true, label: 'Сверхпробитие' });
    },

    cwTransfer(src, tgt, dmg, o) {
      const k = this.cwT('aoe'), I = this.cwInfo;
      if (k < 0 || !tgt.cwMark || o.cwTransfer || o.echo || o.isDot || !src || src.side !== 'ally') return;
      const others = this.living.filter(e => e !== tgt);
      if (others.length && dmg > 0) for (const e of others) this.hit(src, e, 0, { raw: dmg * B.aoe.share[k] / others.length, cwTransfer: true, echo: true, kind: 'follow', label: 'Заёмная сила' });
      if (k >= 1 && !o.cwBeam) {
        I.markHits++;
        if (I.markHits >= B.aoe.hits) {
          I.markHits = 0;
          const s = bondUnit('beam', 'Луч заёмной силы', 'quant', 100);
          this.push({ t: 'act', u: s, name: 'Луч заёмной силы', kind: 'summon' });
          for (let i = 0; i < B.aoe.beams[k] && this.living.length; i++) this.hit(s, this.rng.pick(this.living), 0, { raw: this.cw.base * B.aoe.beam[k], e: 'quant', cwBeam: true, cwTransfer: true, echo: true, kind: 'follow', label: 'Луч' });
        }
      }
    },

    cwHeat(src) {
      const k = this.cwT('debuff'), I = this.cwInfo;
      if (k < 0 || !member(ownerOf(src), 'debuff') || !this.living.length) return;
      if (I.heatAct === this.actSerial && I.heatN >= 2) return;
      if (I.heatAct !== this.actSerial) { I.heatAct = this.actSerial; I.heatN = 0; }
      I.heatN++;
      const t = this.rng.pick(this.living);
      const h = t.cwHeat || (t.cwHeat = { n: 0, extra: B.debuff.extra[k] });
      if (h.n >= B.debuff.max[k]) return;
      h.n++;
      t.buffs = t.buffs.filter(b => b.name !== 'Остаточный жар');
      t.buffs.push({ s: 'dmgDealtDown', v: B.debuff.cut[k] * h.n, turns: 999, perm: true, name: 'Остаточный жар', debuff: true });
      this.push({ t: 'status', u: t, text: 'Остаточный жар ×' + h.n, debuff: true });
    },

    cwHeatMove(dead) {
      if (!dead.cwHeat || !dead.cwHeat.n) return;
      const t = this.living.find(e => e !== dead);
      if (!t) return;
      const n = dead.cwHeat.n;
      t.cwHeat = { n: Math.max(n, (t.cwHeat && t.cwHeat.n) || 0), extra: dead.cwHeat.extra };
      t.buffs = t.buffs.filter(b => b.name !== 'Остаточный жар');
      t.buffs.push({ s: 'dmgDealtDown', v: B.debuff.cut[this.cwT('debuff')] * t.cwHeat.n, turns: 999, perm: true, name: 'Остаточный жар', debuff: true });
    },

    cwOverexcite() {
      const d = this.cwT('dot');
      if (d < 0 || !this.living.length) return;
      const src = this.cwMembers('dot')[0] || bondUnit('dot', 'Сверхвозбуждение', 'phys', 100);
      const n = B.dot.times[d] + this.cwInfo.overQ;
      this.cwInfo.overQ = 0;
      for (let i = 0; i < n && this.living.length && !this.over; i++) {
        const t = this.rng.pick(this.living);
        for (const e of ['phys', 'fire', 'elec', 'wind']) if (alive(t)) this.hit(src, t, 0, { raw: this.cw.base * B.dot.hit[d] / 4, e, isDot: true, label: 'Сверхвозбуждение' });
        if (alive(t) && t.dots.length) this.detonate(src, t, B.dot.pop);
      }
    },

    cwEnergyUlt(u) {
      const k = this.cwT('energy'), I = this.cwInfo;
      if (k < 0 || !member(u, 'energy')) return;
      for (const a of I.units) if (a.cwU.cell && !a.summon && alive(a)) this.gainEnergy(a, a.maxEnergy * B.energy.cellEnergy);
      if (k < 1) return;
      I.ultE += u.maxEnergy || 0;
      this.push({ t: 'cwBar', k: 'energy' });
      while (I.ultE >= B.energy.pool && this.living.length) {
        I.ultE -= B.energy.pool;
        const s = bondUnit('cell', 'Клетки энергии', 'phys', 100);
        this.push({ t: 'act', u: s, name: 'Разряд энергии', kind: 'summon' });
        for (const t of this.living.slice()) this.hit(s, t, 0, { raw: this.cw.base * B.energy.hit[k], e: 'phys', kind: 'follow', label: 'Разряд энергии' });
      }
    },

    cwArenaTurn(h) {
      const I = this.cwInfo, k = this.cwT('hpburn');
      if (!this.living.length) return;
      const raw = I.arena * B.hpburn.spend[k] + this.cw.base * B.hpburn.hit[k];
      this.push({ t: 'act', u: h, name: 'Арена кровавого пламени', kind: 'summon' });
      for (const t of this.living.slice()) this.hit(h, t, 0, { raw, e: 'fire', tough: 10, kind: 'follow', label: 'Арена' });
      I.arena *= B.hpburn.keep[k];
    },

    cwAhaTurn(h, quiet) {
      const I = this.cwInfo;
      const prize = this.rng() < B.elation.prize;
      I.joyT = 2 * Math.max(1, this.livingAllies.length);
      if (prize) I.prizeT = I.joyT;
      const humor = 10 + Math.floor(this.rng() * 41) + (prize ? 100 : 0);
      if (!quiet) this.push({ t: 'act', u: h, name: prize ? 'Лотерея Ахи: главный приз!' : 'Лотерея Ахи', kind: 'summon' });
      this.push({ t: 'status', u: h, text: 'Юмор +' + humor, col: '#ff9ae0' });
      if (this.gainPunch && this.el) this.gainPunch(humor, null, true);
    },

    cwEchoTurn(h) {
      const k = this.cwT('fractsidus'), e = h.flags.echo;
      if (!this.living.length) return;
      this.push({ t: 'act', u: h, name: h.name, kind: 'summon' });
      const targets = e.boss && k >= 1 ? this.living.slice() : [this.rng.pick(this.living)];
      for (const t of targets) this.hit(h, t, 0, { raw: this.cw.base * B.fractsidus.hit[k], e: h.elem, tough: 10, kind: 'follow', label: 'Эхо' });
    },

    cwEchoKill(u, src) {
      const I = this.cwInfo, k = this.cwT('fractsidus');
      if (k < 0 || !member(ownerOf(src), 'fractsidus') || I.echoGot.length >= B.fractsidus.take[k]) return;
      if (!big(u) && this.rng() >= B.fractsidus.chance) return;
      I.echoGot.push({ id: u.id, elem: (u.weak && u.weak[0]) || 'phys', boss: !!u.data.boss });
      this.push({ t: 'status', u, text: 'Эхо собрано', col: '#c890ff' });
    },

    cwEnemyTurn() {
      const I = this.cwInfo;
      if (!I) return;
      I.chainUsed = false;
      I.chaosTurn = 0;
      I.chain = 0;
      I.combo = 0;
      this.cwOverexcite();
    }
  });

  const hit0 = P.hit;
  P.hit = function (src, tgt, mult, o = {}) {
    if (!this.cwInfo) return hit0.call(this, src, tgt, mult, o);
    const was = tgt && tgt.broken, hpBefore = tgt ? tgt.hp : 0;
    this.cwInHit = (this.cwInHit || 0) + 1;
    let dmg;
    try { dmg = hit0.call(this, src, tgt, mult, o); } finally { this.cwInHit--; }
    const w = ownerOf(src);
    if (w && o.kind === 'follow' && member(w, 'follow') && tgt && tgt.side === 'enemy') this.cwInfo.followDmg += dmg;
    if (this.over || !tgt || tgt.side !== 'enemy' || !src || src.side !== 'ally') {
      if (tgt && tgt.side === 'ally' && hpBefore > tgt.hp) this.cwHurt({ u: tgt, lost: hpBefore - tgt.hp });
      if (tgt && tgt.side === 'ally' && src && src.side === 'enemy' && !o.isDot && !this.over) { this.cwItemsHurt(tgt, src, hpBefore - tgt.hp); this.cwKitsAllyHurt(tgt, src); }
      return dmg;
    }
    if (was && !o.cwSuper) this.cwSuper(src, tgt, o);
    if (dmg > 0) this.cwTransfer(src, tgt, dmg, o);
    this.cwKitsHit(src, tgt, o, dmg, hpBefore);
    return dmg;
  };

  const doBreak0 = P.doBreak;
  P.doBreak = function (src, tgt, e) {
    const r = doBreak0.call(this, src, tgt, e);
    if (this.cwInfo && !this.cwWaveBusy) { this.cwBroke(src, tgt); this.cwKitsBroke(src, tgt); }
    return r;
  };

  const addBuff0 = P.addBuff;
  P.addBuff = function (u, b, quiet) {
    const r = addBuff0.call(this, u, b, quiet);
    if (this.cwInfo && b && b.debuff && u && u.side === 'enemy' && b.name !== 'Остаточный жар') { this.cwHeat(this.acting || this.current); this.cwKitsDebuff(this.acting || this.current, u); }
    return r;
  };

  const addDot0 = P.addDot;
  P.addDot = function (src, tgt, type, dmg, turns, stackMax) {
    const r = addDot0.call(this, src, tgt, type, dmg, turns, stackMax);
    if (this.cwInfo && tgt && tgt.side === 'enemy') this.cwHeat(src);
    return r;
  };

  const giveShield0 = P.giveShield;
  P.giveShield = function (u, v, turns) {
    const I = this.cwInfo;
    if (!I || !u || u.side !== 'ally') return giveShield0.call(this, u, v, turns);
    if (this.cwT('hpburn') >= 0 && member(u, 'hpburn')) { this.heal(null, u, u.maxHp * 0.02); return; }
    const w = ownerOf(this.acting || this.current);
    if (w) this.cwItemsSupport(w, u);
    let k = w ? w.cwU.shieldPow / 100 : 1;
    if (w && this.cwT('shield') >= 0 && member(w, 'shield')) k *= 1 + B.shield.pow[this.cwT('shield')];
    if (this.cwT('shield') >= 0) {
      const add = Math.round(v * k), cap = u.base.hp || u.maxHp;
      if (u.shield > 0) { u.shield = Math.min(cap, u.shield + add); u.shieldT = Math.max(u.shieldT, turns); this.push({ t: 'shield', u, v: u.shield }); return; }
      return giveShield0.call(this, u, Math.min(cap, add), turns);
    }
    return giveShield0.call(this, u, v * k, turns);
  };

  const enemyTurn0 = P.enemyTurn;
  P.enemyTurn = function (u) {
    if (this.cwInfo) { this.cwEnemyTurn(u); this.cwKitsEnemyTurn(u); this.cleanup(); }
    if (this.over || !alive(u)) return;
    return enemyTurn0.call(this, u);
  };

  const elFailed0 = P.elFailed;
  P.elFailed = function (u, why) {
    if (this.cwInfo) this.cwMisfortune(u);
    return elFailed0 ? elFailed0.call(this, u, why) : false;
  };

  const chaosOn0 = P.chaosOn;
  P.chaosOn = function () { return chaosOn0.call(this) || (!!this.cwInfo && this.cwT('section6') >= 0); };

  const chaosBurst0 = P.chaosBurst;
  P.chaosBurst = function (src, t, old) {
    const r = chaosBurst0.call(this, src, t, old);
    if (this.cwInfo && !this.over) this.cwChaos(src, t);
    return r;
  };

  const ahaTurn0 = P.ahaTurn;
  if (ahaTurn0) P.ahaTurn = function (h) {
    if (this.cwInfo && this.cwT('elation') >= 0 && !this.over) this.cwAhaTurn(h, true);
    return ahaTurn0.call(this, h);
  };

  const finish0 = P.finish;
  P.finish = function (win) {
    if (this.cwInfo) T.spMax = SP0;
    return finish0.call(this, win);
  };

  CW.SP0 = SP0;
  CW.bondUnit = bondUnit;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
