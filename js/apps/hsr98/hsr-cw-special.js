(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN, T = H.TUNING, SP = CW.SPECIAL, HK = CW.HACKS;
  const { alive } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;
  const DIR = Object.keys(CW.BONDS).filter(k => CW.BONDS[k].kind === 'school');
  const baseOf = k => k.replace(/[PM]$/, '');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  Object.assign(GP, {
    cwSpecial(run) {
      const bd = run.bond;
      if (!bd.sp) bd.sp = { p1: null, hacks: [], fights: 0, chip: 0, gm: null, numby: null, wild: [], wildAt: -1, peppy: [] };
      return bd.sp;
    },

    cwOwned(run, id) { return this.cwUnits(run).map(x => x.u).filter(u => u.id === id); },

    cwBest(run, id) { return this.cwOwned(run, id).reduce((a, u) => Math.max(a, u.star), 0); },

    cwHackOf(run, base) {
      const h = this.cwSpecial(run).hacks;
      return h.find(k => k === base + 'M') || h.find(k => k === base + 'P') || h.find(k => k === base) || null;
    },

    cwMentorOpen(run) { return (run.strats || []).some(s => CW.BONDS.mentor.strats.includes(s && s.id ? s.id : s)); },

    cwBondEx(run) {
      const sp = this.cwSpecial(run), ex = { wild: this.cwBest(run, 'yu') ? sp.wild.slice() : [], peppy: sp.peppy.slice(), mentor: this.cwMentorOpen(run), plus: {} };
      if (this.cwHackOf(run, 'cartridge')) ex.plus.hunters = HK.cartridge.plus;
      return ex;
    },

    cwP1Offer(run) {
      const sp = this.cwSpecial(run);
      if (sp.p1 !== 'pending' || run.choice) return;
      const pool = Object.keys(HK).filter(k => !sp.hacks.some(h => baseOf(h) === baseOf(k))), opts = [{ p1: 'promote' }];
      while (opts.length < 3 && pool.length) {
        const w = pool.map(k => [0.6, 0.3, 0.1][HK[k].ver]), sum = w.reduce((a, v) => a + v, 0);
        let r = CW.rnd(run) * sum, i = 0;
        while (i < pool.length - 1 && r >= w[i]) { r -= w[i]; i++; }
        const k = pool[i];
        opts.push({ hack: k });
        for (let j = pool.length - 1; j >= 0; j--) if (baseOf(pool[j]) === baseOf(k)) pool.splice(j, 1);
      }
      run.choice = { from: null, kind: 'p1', options: opts };
    },

    cwP1Check(run, merged) {
      const sp = this.cwSpecial(run);
      if (!sp.p1 && (merged || []).some(m => m.id === 'silverwolf' && m.star === 2)) sp.p1 = 'pending';
      this.cwP1Offer(run);
    },

    cwGiveWolf(run, star) {
      if (star >= 2) {
        if (run.pool.silverwolf < 3 || CW.benchFree(run) < 0) return null;
        run.pool.silverwolf -= 3;
        const u = { uid: ++run.uid, id: 'silverwolf', star };
        run.board.bench[CW.benchFree(run)] = u;
        return { u, merged: this.cwMerge(run) };
      }
      if (!(run.pool.silverwolf > 0) || !this.cwRoomFor(run, 'silverwolf')) return null;
      return this.cwGive(run, 'silverwolf');
    },

    cwTakeHack(run, id) {
      const sp = this.cwSpecial(run), H0 = HK[id], out = { hack: id, merged: [] };
      sp.hacks.push(id);
      if (H0.star) { const got = this.cwGiveWolf(run, H0.star); if (got) out.merged = got.merged; }
      if (H0.nodes) sp.chip = H0.nodes;
      if (H0.ore) { const o = this.cwOpenOres(run, ['ore3']), gold = o.reduce((a, x) => a + x.gold, 0); run.gold += gold; run.earned += gold; out.ores = o; }
      return out;
    },

    cwGm(run) {
      const sp = this.cwSpecial(run);
      if (!sp.gm && this.cwOwned(run, 'silverwolf').some(u => u.lv && u.star >= 3)) sp.gm = { hp: 1, coins: 0, teamAt: -1, ores: 0 };
      return sp.gm;
    },

    cwGmAct(what, v) {
      const run = this.cwRun(), gm = run && this.cwGm(run), P1 = SP.player1;
      if (!gm) return 'owner';
      if (!this.cwPrepOpen(run)) return 'phase';
      if (what === 'hp') { gm.hp = clamp(Math.round(v * 100) / 100, P1.hpMin, P1.hpMax); return null; }
      if (what === 'coins') {
        if (gm.coins >= P1.coinsMax) return 'cap';
        gm.coins += P1.coins; run.gold += P1.coins; run.earned += P1.coins;
        return null;
      }
      if (what === 'team') {
        if (gm.teamAt === run.step) return 'used';
        gm.teamAt = run.step; run.hp += P1.teamHp; run.hpMax = Math.max(run.hpMax, run.hp);
        return null;
      }
      if (what === 'ore') {
        const set = CW.GM_SETS[v];
        if (!set) return 'target';
        if (gm.ores >= P1.ores) return 'cap';
        gm.ores++;
        for (const id of set.heroes || []) {
          const at = CW.benchFree(run);
          if (at < 0) { run.gold += CW.UNITS[id].cost * 9; continue; }
          run.pool[id] = Math.max(0, run.pool[id] - 9);
          run.board.bench[at] = { uid: ++run.uid, id, star: 3 };
        }
        for (const [id, n] of set.items || []) for (let i = 0; i < n; i++) this.cwInvAdd(run, id);
        if (set.exp) this.cwAddExp(run, set.exp);
        return null;
      }
      return 'target';
    },

    cwNumbyCap(run) { const s = this.cwBest(run, 'topaz'); return s ? SP.numby.cap[Math.min(2, s - 1)] : 0; },

    cwInvest(amt) {
      const run = this.cwRun();
      if (!run) return 'phase';
      const sp = this.cwSpecial(run), cap = this.cwNumbyCap(run);
      if (!this.cwPrepOpen(run)) return 'phase';
      if (!cap) return 'owner';
      if (sp.numby) return 'busy';
      const n = Math.min(amt | 0, cap, run.gold);
      if (n <= 0) return 'gold';
      run.gold -= n;
      sp.numby = { amt: n, due: run.step + SP.numby.nodes };
      return null;
    },

    cwNumbyPay(run, refund) {
      const sp = this.cwSpecial(run), nb = sp.numby;
      if (!nb) return null;
      const s = this.cwBest(run, 'topaz'), gain = refund || !s ? 0 : Math.round(nb.amt * SP.numby.gain[Math.min(2, s - 1)]);
      run.gold += nb.amt + gain;
      run.earned += gain;
      sp.numby = null;
      run.numbyPaid = { amt: nb.amt, gain };
      return run.numbyPaid;
    },

    cwWildMax(run) { const s = this.cwBest(run, 'yu'); return s >= 3 ? 2 : s ? 1 : 0; },

    cwWildCost(run) { return this.cwSpecial(run).wildAt === run.step ? SP.wildcard.cost : 0; },

    cwSetWild(k) {
      const run = this.cwRun();
      if (!run || !this.cwPrepOpen(run)) return 'phase';
      const sp = this.cwSpecial(run), max = this.cwWildMax(run);
      if (!DIR.includes(k)) return 'target';
      if (!max) return 'owner';
      if (sp.wild.slice(-max).includes(k)) return 'same';
      const cost = this.cwWildCost(run);
      if (run.gold < cost) return 'gold';
      run.gold -= cost;
      sp.wildAt = run.step;
      sp.wild = sp.wild.filter(x => x !== k).concat(k).slice(-max);
      return null;
    },

    cwPeppySlots(run) { const s = this.cwBest(run, 'arlan'); return s ? SP.peppy.slots[Math.min(3, s - 1)] : 0; },

    cwPeppyGive(i) {
      const run = this.cwRun(), inv = run && this.cwInv(run), it = inv && inv[i];
      if (!it) return 'target';
      if (!this.cwPrepOpen(run)) return 'phase';
      const sp = this.cwSpecial(run), slots = this.cwPeppySlots(run), bond = CW.ITEMS[it.id].bond;
      if (!slots) return 'owner';
      if (!bond) return 'emblem';
      if (sp.peppy.length >= slots) return 'slots';
      if (sp.peppy.some(x => CW.ITEMS[x.id].bond === bond)) return 'unique';
      inv.splice(i, 1);
      sp.peppy.push(it);
      return null;
    },

    cwPeppyTake(j) {
      const run = this.cwRun();
      if (!run || !this.cwPrepOpen(run)) return 'phase';
      const sp = this.cwSpecial(run), it = j == null ? sp.peppy.filter(x => !x.perm).pop() : sp.peppy[j];
      if (!it) return 'target';
      if (it.perm) return 'perm';
      sp.peppy.splice(sp.peppy.indexOf(it), 1);
      this.cwInv(run).push(it);
      return null;
    },

    cwSpecialSold(run) {
      const sp = this.cwSpecial(run);
      if (!this.cwBest(run, 'arlan') && sp.peppy.some(it => !it.perm)) { for (const it of sp.peppy.filter(x => !x.perm)) this.cwInv(run).push(it); sp.peppy = sp.peppy.filter(x => x.perm); }
      if (!this.cwBest(run, 'topaz') && sp.numby) this.cwNumbyPay(run, true);
      const slots = this.cwPeppySlots(run);
      while (sp.peppy.length > slots && sp.peppy.some(x => !x.perm)) { const j = sp.peppy.map(x => !x.perm).lastIndexOf(true); this.cwInv(run).push(sp.peppy.splice(j, 1)[0]); }
    }
  });

  const give0 = GP.cwGive;
  GP.cwGive = function (run, id) {
    const r = give0.call(this, run, id);
    if (id === 'silverwolf' && run.bond && !this.cwCopyBusy) {
      const hk = this.cwHackOf(run, 'copier');
      if (hk && HK[hk].chance && CW.rnd(run) < HK[hk].chance) {
        this.cwCopyBusy = true;
        const more = this.cwGiveWolf(run, 1);
        this.cwCopyBusy = false;
        if (more) r.merged = (r.merged || []).concat(more.merged || []);
      }
    }
    if (run.bond) this.cwP1Check(run, r.merged);
    return r;
  };

  const choose0 = GP.cwChoose;
  GP.cwChoose = function (n) {
    const run = this.cwRun(), ch = run && run.choice;
    if (!ch || ch.kind !== 'p1') { const r = choose0.call(this, n); if (run) this.cwP1Offer(run); return r; }
    const o = ch.options[n];
    if (!o) return 'empty';
    run.choice = null;
    const sp = this.cwSpecial(run);
    if (o.p1 === 'promote') {
      sp.p1 = 'promote';
      const u = this.cwOwned(run, 'silverwolf').filter(x => !x.lv).sort((a, b) => b.star - a.star)[0];
      if (u) { u.lv = true; u.star = 1; }
      return { promoted: true, merged: [] };
    }
    sp.p1 = 'hack';
    return this.cwTakeHack(run, o.hack);
  };

  const sell0 = GP.cwSell;
  GP.cwSell = function (zone, i) {
    const v = sell0.call(this, zone, i), run = this.cwRun();
    if (v && run) this.cwSpecialSold(run);
    return v;
  };

  const begin0 = GP.cwBeginNode;
  GP.cwBeginNode = function (run) {
    const r = begin0.call(this, run);
    const sp = this.cwSpecial(run);
    run.numbyPaid = null;
    if (sp.numby && run.step >= sp.numby.due) this.cwNumbyPay(run, false);
    if (sp.gm) sp.gm.hp = 1;
    this.cwP1Offer(run);
    return r;
  };

  const mods0 = GP.cwFoeMods;
  GP.cwFoeMods = function (run, kind, branch) {
    const m = mods0.call(this, run, kind, branch), sp = run.bond ? this.cwSpecial(run) : null;
    if (!sp) return m;
    if (sp.chip > 0 && kind !== 'reward') { m.hp *= HK.chip.hp; m.atk *= HK.chip.atk; m.spd *= HK.chip.spd; m.chip = true; }
    if (sp.gm && sp.gm.hp !== 1) m.hp *= sp.gm.hp;
    return m;
  };

  const rewards0 = GP.cwBondRewards;
  GP.cwBondRewards = function (run, rec) {
    rewards0.call(this, run, rec);
    const sp = this.cwSpecial(run);
    if (rec.kind === 'reward') return;
    if (sp.chip > 0) sp.chip--;
    sp.fights++;
    if (rec.win && this.cwBest(run, 'arlan') >= 4) { rec.bondGold += SP.peppy.coin; rec.coins += SP.peppy.coin; rec.bondLines.push('Пеппи: +' + SP.peppy.coin + ' монета'); }
    const hk = this.cwHackOf(run, 'copier');
    if (hk && sp.fights % HK[hk].every === 0) {
      const got = this.cwGiveWolf(run, 1);
      if (got) { rec.bondHeroes.push(H.CHARS.silverwolf.name + ' (копия)'); rec.bondLines.push(HK[hk].name); }
    }
  };

  const compile0 = GP.cwCompile;
  GP.cwCompile = function (run, kind) {
    const cw = compile0.call(this, run, kind), sp = this.cwSpecial(run), units = Object.values(cw.units);
    cw.hacks = sp.hacks.slice();
    const fw = this.cwHackOf(run, 'firewall'), pg = this.cwHackOf(run, 'piggy');
    cw.firewall = fw ? { vuln: HK[fw].vuln, weak: HK[fw].weak } : null;
    cw.piggy = pg && kind !== 'boss' && kind !== 'reward' ? { chance: HK[pg].chance, coins: HK[pg].coins } : null;
    if (cw.tiers.mentor != null) {
      const mem = units.filter(u => u.bonds.includes('mentor')), pow0 = new Map(mem.map(u => [u, u.pow]));
      for (const u of mem) u.pow += mem.filter(m => m !== u).reduce((a, m) => a + pow0.get(m), 0);
    }
    const wolves = units.filter(u => u.id === 'silverwolf'), cp = this.cwHackOf(run, 'copier'), gl = this.cwHackOf(run, 'glasses');
    const cm = this.cwHackOf(run, 'cartridge'), SH = CW.BONDS.hunters.star;
    cw.starHunters = cw.tiers.hunters != null ? units.filter(u => u.bonds.includes('hunters') && SH[u.id] && !u.wrong).sort((a, b) => b.it.items.length - a.it.items.length || b.star - a.star || b.cost - a.cost).slice(0, cw.tiers.hunters >= 2 ? 2 : 1).map(u => u.uid) : [];
    cw.starCut = cm === 'cartridgeM' ? 1 : 0;
    for (const u of units) {
      let amp = 0, spd = 0;
      if (u.id === 'silverwolf') {
        if (cp) amp += HK[cp].dmg[Math.min(2, u.star - 1)];
        if (gl && wolves.length >= 2) { amp += HK[gl].pair; spd += HK[gl].pair; }
        if (sp.hacks.includes('gloves') && u.lv && u.star >= 3) {
          const a = HK.gloves.all;
          amp += a; spd += a; u.powPlus += a;
          u.it.lucky = (u.it.lucky || 0) + a; u.it.luckyDmg = (u.it.luckyDmg || 0) + a; u.it.dr = (u.it.dr || 0) + a;
        }
      }
      if (cm && HK[cm].hunterAmp && u.bonds.includes('hunters')) amp += HK[cm].hunterAmp;
      u.hackAmp = amp;
      if (spd) {
        const p = cw.party.find(x => x.cw === u.uid);
        if (p) p.stats.spd = Math.round(p.stats.spd * (1 + spd) * 10) / 10;
        const o = cw.off.find(x => x.uid === u.uid);
        if (o) o.stats.spd = Math.round(o.stats.spd * (1 + spd) * 10) / 10;
      }
    }
    return cw;
  };

  Object.assign(BP, {
    cwSpecialFoes(list) {
      const cw = this.cw;
      for (const e of list) {
        if (cw.firewall) {
          e.buffs.push({ s: 'vuln', v: cw.firewall.vuln, turns: 999, perm: true, name: 'Хрупкость', debuff: true });
          if (cw.firewall.weak) e.buffs.push({ s: 'dmgDealtDown', v: cw.firewall.weak, turns: 999, perm: true, name: 'Хрупкость: урон', debuff: true });
        }
        if (cw.piggy && !(e.data.boss || e.data.elite) && this.rng() < cw.piggy.chance) { e.flags.cwPiggy = cw.piggy.coins; this.push({ t: 'status', u: e, text: 'Свинка-копилка', col: '#ffb0c8' }); }
      }
    },

    cwStarHunters() { return this.cwInfo.units.filter(u => (this.cw.starHunters || []).includes(u.cwU.uid)); },

    cwStarCount() {
      const SH = CW.BONDS.hunters.star;
      for (const h of this.cwStarHunters()) {
        if (!alive(h) || this.over) continue;
        h.flags.cwStar = (h.flags.cwStar || 0) + 1;
        if (h.flags.cwStar < SH[h.cwU.id][0] - (this.cw.starCut || 0)) continue;
        h.flags.cwStar = 0;
        this.cwStarStrike(h);
      }
    },

    cwStarStrike(h) {
      const s = Math.min(2, h.cwU.star - 1), t = this.cwStrong();
      if (!t) return;
      const prev = this.acting;
      this.acting = h;
      if (h.cwU.id === 'blade') {
        if (!h.flags.cwHell) { h.flags.cwHell = true; h.buffs.push({ s: 'dmgP', v: 0.4, turns: 999, perm: true, name: 'Адский пейзаж' }); this.push({ t: 'status', u: h, text: 'Адский пейзаж', col: '#ff6a6a' }); }
        this.push({ t: 'act', u: h, name: 'Звёздный охотник: Лес мечей', kind: 'follow' });
        const hp = h.base.hp || h.maxHp, list = [t].concat(this.adjacent(this.living, t).filter(n => n !== t));
        for (const e of list) this.hit(h, e, 0, { fixed: hp * [1.3, 1.6, 2.2][s] * (e === t ? 1 : 0.5), e: 'wind', tough: e === t ? 20 : 10, kind: 'basic', label: 'Лес мечей' });
      } else if (h.cwU.id === 'kafka') {
        this.push({ t: 'act', u: h, name: 'Звёздный охотник: Ласковый лунный свет', kind: 'follow' });
        this.hit(h, t, 1.6, { e: 'elec', tough: 20, kind: 'skill', label: 'Ласковый лунный свет' });
        this.cwKafka(h, t, s);
      } else {
        this.push({ t: 'act', u: h, name: 'Звёздный охотник: Разрешить изменения?', kind: 'follow' });
        this.cwHack(h, s, [3, 3.75, 5.4][s] * 0.5);
      }
      this.acting = prev;
      this.cleanup();
    },

    cwSpecialStart() {
      const I = this.cwInfo, C = SP.keeper.cocolia, SH = CW.BONDS.hunters.star;
      this.cwSpecialFoes(this.enemies);
      for (const h of this.cwStarHunters()) h.flags.cwStar = SH[h.cwU.id][1];
      for (const u of I.units) if (!u.summon && u.cwU.id === 'bronya' && !u.cwU.wrong) u.flags.cwCocolia = C.start[Math.min(2, u.cwU.star - 1)];
    },

    cwCocolia(br) {
      const C = SP.keeper.cocolia, s = Math.min(2, br.cwU.star - 1);
      br.flags.cwCocolia = 0;
      if (!this.living.length) return;
      const prev = this.acting;
      this.acting = br;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      this.push({ t: 'act', u: br, name: 'Коколия', kind: 'follow', cocolia: true });
      for (const e of this.living.slice()) this.hit(br, e, C.atk * C.mul[s], { e: 'imag', hpM: C.hp * C.mul[s], alwaysCrit: true, tough: 20, kind: 'follow', label: 'Коколия' });
      this.acting = prev;
      this.cleanup();
    },

    cwSpecialAfter(u, kind) {
      const I = this.cwInfo, C = SP.keeper.cocolia;
      if (!u || this.over) return;
      if (!u.summon) for (const br of I.units) {
        if (br.summon || br.cwU.id !== 'bronya' || br.cwU.wrong || !alive(br) || br.flags.cwCocolia == null) continue;
        br.flags.cwCocolia++;
        if (br.flags.cwCocolia >= C.need[Math.min(2, br.cwU.star - 1)]) this.cwCocolia(br);
      }
      const M = CW.BONDS.mentor;
      if (this.cw.tiers.mentor >= 1 && u.cwU && u.cwU.bonds.includes('mentor') && (kind === 'skill' || kind === 'ult')) {
        for (const m of I.units) {
          if (m === u || !alive(m) || !m.cwU.bonds.includes('mentor')) continue;
          this.advance(m, M.adv);
          m.flags.cwLegacy = Math.min(M.legacyMax, (m.flags.cwLegacy || 0) + M.legacy[u.cwU.star >= 3 ? 1 : 0]);
          m.buffs = m.buffs.filter(x => x.name !== 'Наследие');
          m.buffs.push({ s: 'dmgP', v: M.legacyDmg * m.flags.cwLegacy, turns: 999, perm: true, name: 'Наследие' });
        }
      }
    }
  });

  const kitsStart0 = BP.cwKitsStart;
  BP.cwKitsStart = function () { kitsStart0.call(this); this.cwSpecialStart(); };

  const kitsAfter0 = BP.cwKitsAfter;
  BP.cwKitsAfter = function (u, kind) { kitsAfter0.call(this, u, kind); this.cwSpecialAfter(u, kind); };

  const kitsWave0 = BP.cwKitsWave;
  BP.cwKitsWave = function (list) { kitsWave0.call(this, list); this.cwSpecialFoes(list); };

  const kitsKill0 = BP.cwKitsKill;
  BP.cwKitsKill = function (t, src) {
    kitsKill0.call(this, t, src);
    if (t && t.flags && t.flags.cwPiggy) { this.cwInfo.kitCoins = (this.cwInfo.kitCoins || 0) + t.flags.cwPiggy; this.push({ t: 'status', u: t, text: 'Копилка: +' + t.flags.cwPiggy + ' мон.', col: '#ffd471' }); t.flags.cwPiggy = 0; }
  };

  const kitsHit0 = BP.cwKitsHit;
  BP.cwKitsHit = function (src, tgt, o, dmg, before) {
    kitsHit0.call(this, src, tgt, o, dmg, before);
    const w = src && (src.cwU ? src : src.owner && src.owner.cwU ? src.owner : null), I = this.cwInfo;
    if (!w || o.isDot || this.over || !(this.cw.starHunters || []).length || !w.cwU.bonds.includes('hunters') || I.huntAct === this.actSerial) return;
    I.huntAct = this.actSerial;
    this.cwStarCount();
  };

  const kitsAmp0 = BP.cwKitsAmp;
  BP.cwKitsAmp = function (w, tgt, o) {
    const r = kitsAmp0.call(this, w, tgt, o), x = (w.cwU && w.cwU.hackAmp) || 0;
    return x ? (1 + r) * (1 + x) - 1 : r;
  };

  CW.DIR_BONDS = DIR;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
