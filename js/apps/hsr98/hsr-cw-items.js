(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN, IT = CW.ITEMS, T = H.TUNING, AV = T.avBase;
  const { alive, defOf, spdOf } = H.battleStat;
  const rnd = CW.rnd;
  const rint = (run, n) => Math.floor(rnd(run) * n);
  const pick = (run, list) => list[rint(run, list.length)];
  const val = (it, k) => { const v = IT[it.id].stats[k]; return Array.isArray(v) ? v[it.sp ? 1 : 0] : v || 0; };
  const par = (it, k) => { const v = IT[it.id][k]; return Array.isArray(v) ? v[it.sp ? 1 : 0] : v; };
  const ITEM_GIFT = { armsBox: ['boxBasic'], privDie: ['anyDie', true], basic: ['@basic'], emblem: ['@emblem'] };
  const CRAFTED = Object.keys(IT).filter(k => IT[k].kind === 'emblem' && IT[k].from && IT[k].dia !== 'any');
  const KEPT = 13;

  function combine(a, b) {
    const A = IT[a.id], B = IT[b.id];
    if (A.kind === 'basic' && B.kind === 'basic') return { id: CW.RECIPE[a.id + '+' + b.id] };
    const dia = A.kind === 'diamond' ? a : B.kind === 'diamond' ? b : null, other = dia === a ? b : a;
    if (dia && IT[other.id].kind === 'diamond') return { id: 'gem' };
    if (dia && IT[other.id].kind === 'basic') { const em = CRAFTED.find(k => IT[k].from === other.id && IT[k].dia === dia.id); return em ? { id: em } : null; }
    if (dia && other.id === 'trash') return { id: 'em_elation' };
    return null;
  }

  Object.assign(H.Game.prototype, {
    cwInv(run) {
      if (!run.inv) { run.inv = []; run.iuid = 0; for (const id of run.items || []) this.cwGift(run, id); run.items = []; }
      return run.inv;
    },

    cwItem(run, id, sp) { return { uid: ++run.iuid, id, sp: !!sp }; },

    cwInvAdd(run, id, sp) { this.cwInv(run).push(this.cwItem(run, id, sp)); return id; },

    cwGift(run, id) {
      const g = ITEM_GIFT[id];
      if (!g) return this.cwInvAdd(run, id);
      if (g[0] === '@basic') return this.cwInvAdd(run, pick(run, CW.BASICS));
      if (g[0] === '@emblem') return this.cwInvAdd(run, pick(run, Object.keys(IT).filter(k => IT[k].kind === 'emblem')));
      return this.cwInvAdd(run, g[0], g[1]);
    },

    cwRandItem(run, kind) {
      if (kind === 'basic') return { id: pick(run, CW.BASICS), sp: false };
      if (kind === 'adv') return { id: pick(run, CW.ADV), sp: false };
      if (kind === 'special') return { id: pick(run, CW.ADV), sp: true };
      if (kind === 'emblem') return { id: pick(run, Object.keys(IT).filter(k => IT[k].kind === 'emblem')), sp: false };
      return { id: pick(run, ['red', 'blue']), sp: false };
    },

    cwItemName(it) { return IT[it.id].name + (it.sp ? ' (особая)' : ''); },

    cwGems(run) { return this.cwInv(run).filter(i => i.id === 'gem').length + this.cwUnits(run).reduce((a, x) => a + (x.u.items || []).filter(i => i.id === 'gem').length, 0); },

    cwInvCombine(i, j) {
      const run = this.cwRun(), inv = run && this.cwInv(run);
      if (!run || run.phase !== 'prep' || i === j || !inv[i] || !inv[j]) return 'phase';
      const a = inv[i], b = inv[j];
      if (a.id === 'trash' && b.id === 'trash') {
        const k = inv.findIndex((x, n) => n !== i && n !== j && x.id === 'trash');
        if (k < 0) return 'trash';
        for (const n of [i, j, k].sort((x, y) => y - x)) inv.splice(n, 1);
        this.cwInvAdd(run, 'goldTrash');
        run.gold += 15; run.earned += 15;
        return null;
      }
      if (IT[a.id].kind === 'use') return this.cwUseOnItem(i, j);
      const r = combine(a, b);
      if (!r || !r.id) return 'nocombine';
      const it = this.cwItem(run, r.id, false);
      inv[j] = it;
      inv.splice(i, 1);
      return null;
    },

    cwEquip(i, zone, slot) {
      const run = this.cwRun(), inv = run && this.cwInv(run), u = run && run.board[zone] && run.board[zone][slot];
      if (!run || run.phase !== 'prep') return 'phase';
      const it = inv[i];
      if (!it || !u) return 'empty';
      const D = IT[it.id];
      if (D.kind === 'use') return this.cwUseOnUnit(i, zone, slot);
      const items = u.items || (u.items = []);
      if (D.kind === 'basic' || D.kind === 'diamond' || it.id === 'trash') {
        const k = items.findIndex(x => combine(it, x));
        if (k >= 0) { items[k] = this.cwItem(run, combine(it, items[k]).id, false); inv.splice(i, 1); return null; }
        if (D.kind === 'diamond') return 'nocombine';
      }
      if (items.length >= 3) return 'slots';
      if (D.unique && items.some(x => x.id === it.id)) return 'unique';
      if (D.kind === 'emblem' && CW.UNITS[u.id].bonds.includes(D.bond)) return 'member';
      if (D.kind === 'emblem' && items.some(x => x.id === it.id)) return 'member';
      items.push(it);
      inv.splice(i, 1);
      return null;
    },

    cwStrip(run, u, reroll) {
      const items = u.items || [];
      u.items = [];
      for (const it of items) {
        if (!reroll) { this.cwInv(run).push(it); continue; }
        const kind = IT[it.id].kind, n = kind === 'adv' ? this.cwRandItem(run, it.sp ? 'special' : 'adv') : kind === 'basic' || kind === 'emblem' ? this.cwRandItem(run, kind) : it;
        u.items.push(this.cwItem(run, n.id, n.sp));
      }
    },

    cwUseOnUnit(i, zone, slot) {
      const run = this.cwRun(), inv = this.cwInv(run), it = inv[i], u = run.board[zone][slot], D = IT[it.id], d = CW.UNITS[u.id];
      if (it.id === 'key' || it.id === 'keyP') { if (!(u.items || []).length) return 'noitems'; this.cwStrip(run, u, false); if (it.id === 'key') inv.splice(inv.indexOf(it), 1); return null; }
      if (it.id === 'furnace') { if (!(u.items || []).length) return 'noitems'; this.cwStrip(run, u, true); inv.splice(inv.indexOf(it), 1); return null; }
      if (it.id === 'projector' || it.id === 'pprojector') {
        if (it.id === 'projector' && d.cost > 3) return 'cost';
        if (run.pool[u.id] <= 0) return 'pool';
        if (!this.cwRoomFor(run, u.id)) return 'bench';
        inv.splice(inv.indexOf(it), 1);
        const got = this.cwGive(run, u.id);
        return { merged: got.merged };
      }
      if (it.id === 'charm') {
        const R = CW.REC[u.id], list = [...new Set(R.on.concat(R.off))];
        while (list.length < 4) list.push(pick(run, CW.ADV));
        run.choice = { from: it.uid, kind: 'item', options: list.slice(0, 4).map(id => ({ id, sp: false })) };
        return 'choice';
      }
      if (D.on === 'item' || D.on === 'self') return 'target';
      return 'target';
    },

    cwUseOnItem(i, j) {
      const run = this.cwRun(), inv = this.cwInv(run), it = inv[i], tg = inv[j], kind = IT[tg.id].kind;
      if (it.id === 'privCard') {
        if (kind === 'adv' && !tg.sp) tg.sp = true;
        else if (tg.id === 'trash') tg.id = 'goldTrash';
        else return 'target';
        inv.splice(i, 1);
        return null;
      }
      if (it.id === 'furnace') {
        if (!['basic', 'adv', 'emblem'].includes(kind)) return 'target';
        const n = this.cwRandItem(run, kind === 'adv' ? (tg.sp ? 'special' : 'adv') : kind);
        inv[j] = this.cwItem(run, n.id, n.sp);
        inv.splice(i, 1);
        return null;
      }
      return 'target';
    },

    cwOpenBox(i) {
      const run = this.cwRun(), inv = run && this.cwInv(run), it = inv && inv[i];
      if (!it || run.phase !== 'prep' || IT[it.id].on !== 'self') return 'target';
      const opts = [], seen = new Set();
      const add = o => { const k = (o.id || o.hero) + (o.sp ? '!' : ''); if (!seen.has(k)) { seen.add(k); opts.push(o); } };
      for (let n = 0; opts.length < 3 && n < 40; n++) {
        if (it.id === 'boxBasic') add(this.cwRandItem(run, 'basic'));
        else if (it.id === 'boxAdv') add(this.cwRandItem(run, 'adv'));
        else if (it.id === 'boxSpecial') add(this.cwRandItem(run, 'special'));
        else if (it.id === 'codex') add(this.cwRandItem(run, 'emblem'));
        else { const id = this.cwDraw(run, IT[it.id].cost); if (id) add({ hero: id }); else break; }
      }
      run.choice = { from: it.uid, kind: IT[it.id].cost ? 'hero' : 'item', options: opts };
      return 'choice';
    },

    cwChoose(n) {
      const run = this.cwRun(), ch = run && run.choice;
      if (!ch || !ch.options[n]) return 'empty';
      const inv = this.cwInv(run), k = inv.findIndex(x => x.uid === ch.from), o = ch.options[n];
      if (o.hero && !this.cwRoomFor(run, o.hero)) return 'bench';
      if (k >= 0) inv.splice(k, 1);
      run.choice = null;
      if (o.hero) return { merged: this.cwGive(run, o.hero).merged };
      this.cwInvAdd(run, o.id, o.sp);
      return null;
    },

    cwCancelChoice() { const run = this.cwRun(); if (run) run.choice = null; },

    cwItemStats(u, place, squad) {
      const s = {}, items = u.items || [];
      for (const it of items) for (const k of Object.keys(IT[it.id].stats)) s[k] = (s[k] || 0) + val(it, k);
      for (const k of Object.keys(squad || {})) s[k] = (s[k] || 0) + squad[k];
      const has = id => items.find(x => x.id === id);
      const exo = has('exo');
      if (exo && place === 'off') { s.offPow = (s.offPow || 0) + par(exo, 'q'); s.spd = (s.spd || 0) + par(exo, 'q'); }
      if (exo && place === 'on') s.dr = (s.dr || 0) + par(exo, 'p');
      const cs = has('chainsaw'), as = has('antiSat');
      if (cs && place === 'on') s.luckyDmg = (s.luckyDmg || 0) + par(cs, 'p');
      if (as && place === 'off') s.luckyDmg = (s.luckyDmg || 0) + par(as, 'p');
      const ce = has('codexEvo');
      if (ce) { s.spd = (s.spd || 0) + par(ce, 'p') * u.star; s.dmg = (s.dmg || 0) + par(ce, 'p') * u.star; }
      const hb = items.find(x => x.id === 'em_hpburn');
      if (hb) s.pow = (s.pow || 0) + 0.4;
      return s;
    },

    cwSquadItems(run) {
      const s = {};
      for (const u of this.cwDeployed(run)) for (const it of u.items || []) {
        if (it.id === 'weaponMaster') s.pow = (s.pow || 0) + par(it, 'p');
        if (it.id === 'banner') s.lucky = (s.lucky || 0) + par(it, 'p');
        if (it.id === 'lifeRing') s.hp = (s.hp || 0) + par(it, 'p');
        if (it.id === 'sturdy') s.dr = (s.dr || 0) + par(it, 'p');
      }
      return s;
    },

    cwApplyItems(run, u, place, s, cs, squad) {
      const st = s.stats, items = u.items || [];
      const before = st.hp;
      st.hp = Math.round(st.hp * (1 + (cs.hp || 0)));
      st.spd = Math.round(st.spd * (1 + (cs.spd || 0)) * 10) / 10;
      st.breakE = (st.breakE || 0) + (cs.brk || 0);
      st.dmgP = (st.dmgP || 0) + (cs.dmg || 0);
      const prop = items.find(x => x.id === 'propeller');
      let pow = (cs.pow || 0) + (place === 'on' ? cs.onPow || 0 : cs.offPow || 0);
      if (prop) pow += Math.floor(st.spd / 10) * (place === 'on' ? par(prop, 'p') : par(prop, 'q'));
      const ff = items.find(x => x.id === 'furyFist');
      const fury = ff ? Math.min(par(ff, 'q'), Math.max(0, Math.floor((st.hp / Math.max(1, before) - 1) * 10)) * par(ff, 'p')) : 0;
      return { pow, lucky: (cs.lucky || 0) + fury, luckyDmg: cs.luckyDmg || 0, dr: cs.dr || 0, en: cs.en || 0, brkEff: cs.brkEff || 0, heal: cs.heal || 0, shield: cs.shield || 0, items: items.map(x => ({ id: x.id, sp: x.sp })) };
    },

    cwRec(id) { const R = CW.REC[id]; return R ? [...new Set(R.on.concat(R.off))] : []; },

    cwRecFor(run) {
      const out = new Map();
      for (const u of this.cwDeployed(run)) for (const id of this.cwRec(u.id)) { if (!out.has(id)) out.set(id, []); out.get(id).push(u.id); }
      return out;
    },

    cwNodeItems(run) {
      if (!run.inv) this.cwInv(run);
      for (const x of this.cwUnits(run)) for (const it of (x.u.items || []).filter(i => i.id === 'anyDie')) {
        for (let n = 0; n < par(it, 'p') && x.u.items.length < 3; n++) x.u.items.push(this.cwItem(run, pick(run, CW.BASICS), false));
      }
      if (run.step % 3 === 0 && run.step > 0) {
        const worn = this.cwUnits(run).reduce((a, x) => a + (x.u.items || []).filter(i => i.id === 'gem').length, 0);
        if (worn) { run.gold += worn; run.earned += worn; run.gemGold = worn; }
      }
    }
  });

  const BP = H.Battle.prototype;
  const has = (u, id) => u && u.cwU && u.cwU.it && u.cwU.it.items.find(x => x.id === id);
  const p = (it, k) => par(it, k);

  Object.assign(BP, {
    cwItemsStart() {
      const I = this.cwInfo;
      I.ultN = 0;
      for (const u of I.units) {
        const it = u.cwU.it;
        if (!it) continue;
        if (it.dr) u.buffs.push({ s: 'dr', v: it.dr, turns: 999, perm: true, name: 'Снаряжение: защита' });
        if (it.brkEff) u.buffs.push({ s: 'breakEff', v: it.brkEff, turns: 999, perm: true, name: 'Снаряжение: пробитие' });
        if (it.en && !u.summon) u.energy = Math.min(u.maxEnergy, u.energy + it.en);
        if (it.items.some(x => x.id === 'em_sp')) u.buffs.push({ s: 'defIgnore', v: 0.2, turns: 999, perm: true, name: 'Эмблема: Очки навыков' });
        const cat = has(u, 'catapult');
        if (cat && u.summon) this.advance(u, p(cat, 'p'));
        const exo = has(u, 'exo');
        if (exo && !u.summon) u.buffs.push({ s: 'aggro', v: 1, turns: 999, perm: true, name: 'Адаптивный экзоскелет' });
        const tooth = has(u, 'tooth');
        if (tooth) for (const a of this.livingAllies) this.giveShield(a, defOf(u) * p(tooth, 'p'), 2);
        if (u.cwU.it.items.some(x => x.id === 'em_shield')) for (const a of this.livingAllies) this.giveShield(a, defOf(u), 2);
        const gr = has(u, 'grenade');
        if (gr) for (const e of this.enemies) e.buffs.push({ s: 'dmgDealtDown', v: p(gr, 'p'), turns: 999, perm: true, name: 'Ручная граната', debuff: true });
        if (has(u, 'perpetual') && !u.summon) u.energy = u.maxEnergy;
      }
    },

    cwItemsTurn(u) {
      if (!u || !u.cwU || !u.cwU.it) return;
      const ag = has(u, 'agBoots');
      if (ag) { u.flags.cwAg = (u.flags.cwAg || 0) + 1; u.buffs = u.buffs.filter(b => b.name !== 'Антигравитация'); u.buffs.push({ s: 'spdP', v: p(ag, 'p') * u.flags.cwAg, turns: 999, perm: true, name: 'Антигравитация' }); }
      const lb = has(u, 'lightBoots');
      if (lb && !u.summon) this.gainEnergy(u, u.maxEnergy * p(lb, 'p'));
      const km = has(u, 'kinetic');
      if (km && !u.summon) { u.flags.cwKin = 1; this.sp = Math.min(T.spMax, this.sp + 1); }
      const bk = has(u, 'bunker');
      if (bk) for (const a of this.livingAllies) this.giveShield(a, (u.summon ? u.base.hp : u.maxHp) * p(bk, 'p'), 2);
      u.flags.cwMatter = false;
    },

    cwItemsAfter(u, ult) {
      const I = this.cwInfo;
      if (!u || !u.cwU || !u.cwU.it || this.over) return;
      const targets = [...(this.hitThisAction || [])].filter(t => t.side === 'enemy' && alive(t));
      const attacked = targets.length > 0 || (this.hitThisAction && [...this.hitThisAction].some(t => t.side === 'enemy'));
      const fs = has(u, 'firestorm');
      if (fs && attacked) u.flags.cwFire = Math.min(99, (u.flags.cwFire || 0) + 1);
      for (const id of ['starChase', 'warhead']) { const x = has(u, id); if (x && attacked) for (const t of targets) this.addBuff(t, { s: 'vuln', v: p(x, 'p'), turns: 2, name: 'Хрупкость', debuff: true }, true); }
      const mt = has(u, 'matter');
      if (mt && attacked && !u.flags.cwMatter && this.living.length) { u.flags.cwMatter = true; const t = this.rng.pick(this.living); this.hit(u, t, 0, { raw: t.maxHp * p(mt, 'p'), kind: 'follow', label: 'Расщепление материи' }); }
      if (u.cwU.it.items.some(x => x.id === 'em_follow')) this.advance(u, 0.1);
      if (u.cwU.it.items.some(x => x.id === 'em_heal')) for (const a of this.livingAllies) this.heal(u, a, (u.summon ? u.base.hp : u.maxHp) * 0.1);
      if (u.cwU.it.items.some(x => x.id === 'em_dot') && attacked) for (const t of targets.slice(0, 1)) this.addDot(u, t, 'burn', (u.base.atk || 100) * 0.3, 2);
      if (u.cwU.it.items.some(x => x.id === 'em_hpburn') && attacked && !u.summon) u.hp = Math.max(1, Math.round(u.hp * 0.8));
      if (ult) {
        const mw = has(u, 'meteor');
        if (mw) { this.sp = Math.min(T.spMax, this.sp + p(mw, 'q')); for (const a of this.livingAllies) this.addBuff(a, { s: 'spdP', v: p(mw, 'p'), turns: 2, name: 'Метеоритные крылья' }, true); }
        const je = has(u, 'jokeEngine');
        if (je) u.flags.cwJoke = Math.min(5, (u.flags.cwJoke || 0) + 1);
        const pc = has(u, 'pureCal');
        if (pc) this.gainEnergy(u, p(pc, 'q'));
        if (u.cwU.it.items.some(x => x.id === 'em_energy')) this.gainEnergy(u, 10);
        I.ultN++;
        for (const w of I.units) { const pe = has(w, 'perpetual'); if (pe && !w.summon && w !== u && I.ultN % p(pe, 'p') === 0) w.energy = w.maxEnergy; }
      }
      for (const w of I.units) { const pc = has(w, 'pureCal'); if (pc && !w.summon && alive(w)) this.heal(null, w, w.maxHp * p(pc, 'p')); }
      if (this.sp < (I.spItem == null ? this.sp : I.spItem)) {
        const km = has(u, 'kinetic');
        if (km && !u.summon && (u.flags.cwKin || 0) < p(km, 'p')) { u.flags.cwKin = (u.flags.cwKin || 0) + 1; this.sp = Math.min(T.spMax, this.sp + 1); }
      }
      I.spItem = this.sp;
    },

    cwItemsKill(u, src) {
      const w = src && (src.cwU ? src : src.owner && src.owner.cwU ? src.owner : null);
      if (w && has(w, 'bloodlust')) w.flags.cwBlood = (w.flags.cwBlood || 0) + 1;
    },

    cwItemsPow(w) {
      let v = 0;
      const fs = has(w, 'firestorm');
      if (fs) v += p(fs, 'p') * (w.flags.cwFire || 0);
      if (w.cwU.it && w.cwU.it.items.some(x => x.id === 'em_aoe')) v += 0.08 * this.living.length;
      if (w.flags.cwInj) v += w.flags.cwInj;
      return v;
    },

    cwItemsAmp(w, tgt, o) {
      let amp = 0;
      const bs = has(w, 'bloomStep');
      if (bs && !w.summon && w.hp > w.maxHp * p(bs, 'q')) amp += p(bs, 'p');
      const bl = has(w, 'bloodlust');
      if (bl) amp += p(bl, 'p') * (w.flags.cwBlood || 0);
      const ds = has(w, 'disarm');
      if (ds && tgt.data && (tgt.data.boss || tgt.data.elite)) amp += p(ds, 'p');
      if (w.cwU.it && w.cwU.it.items.some(x => x.id === 'em_debuff')) amp += 0.05 * Math.min(5, this.debuffCount ? this.debuffCount(tgt) : 0);
      return amp;
    },

    cwItemsLucky(w) {
      const it = w.cwU.it;
      if (!it) return { ch: 0, dmg: 0 };
      const je = has(w, 'jokeEngine');
      return { ch: it.lucky + (je ? p(je, 'p') * (w.flags.cwJoke || 0) : 0), dmg: it.luckyDmg };
    },

    cwItemsHurt(tgt, src, lost) {
      const I = this.cwInfo;
      if (!I || !tgt.cwU) return;
      const tooth = has(tgt, 'tooth');
      if (tooth && src && src.side === 'enemy' && alive(src) && !this.cwToothBusy) {
        this.cwToothBusy = true;
        this.hit(tgt, src, 0, { raw: Math.min(Math.max(0, src.hp - 1), defOf(tgt) * p(tooth, 'q')), e: 'phys', label: 'Зуб за зуб' });
        this.cwToothBusy = false;
      }
      if (tgt.hp < tgt.maxHp * 0.5 && alive(tgt)) for (const w of I.units) {
        const ph = has(w, 'photon');
        if (!ph || (w.flags.cwPhoton || 0) >= p(ph, 'q') || tgt.flags.cwPhotonT === this.round) continue;
        w.flags.cwPhoton = (w.flags.cwPhoton || 0) + 1;
        tgt.flags.cwPhotonT = this.round;
        this.giveShield(tgt, defOf(w) * p(ph, 'p'), 2);
        break;
      }
    },

    cwItemsSupport(src, u) {
      if (!src || !u || u.side !== 'ally' || src === u) return;
      const inj = has(src, 'injector');
      if (inj && u.cwU && !u.flags.cwInjT) { u.flags.cwInjT = 1; u.buffs.push({ s: 'dr', v: p(inj, 'q'), turns: 2, name: 'Инъектор уверенности' }); u.flags.cwInj = p(inj, 'p'); }
      const pc = has(src, 'painChip');
      if (pc) this.addBuff(u, { s: 'dr', v: p(pc, 'p'), turns: 2, name: 'Чип анальгезии' }, true);
    },

    cwItemsTick(d) {
      const I = this.cwInfo;
      for (const u of I.units) {
        const sl = has(u, 'sail');
        if (!sl || u.summon || !alive(u)) continue;
        u.flags.cwSail = (u.flags.cwSail || 0) + d;
        while (u.flags.cwSail >= 10) { u.flags.cwSail -= 10; this.gainEnergy(u, p(sl, 'p')); }
      }
    }
  });

  const heal0 = BP.heal;
  BP.heal = function (src, u, v) {
    const r = heal0.call(this, src, u, v);
    if (this.cwInfo && src) this.cwItemsSupport(src.cwU ? src : src.owner, u);
    return r;
  };

  CW.combineItems = combine;
  CW.itemVal = val;
  CW.itemPar = par;
  CW.TEAM_CAP = KEPT;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
