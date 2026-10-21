(function (H) {
  'use strict';
  const FX = H.TRACE_FX || (H.TRACE_FX = {});
  const atkOf = u => H.battleStat.atkOf(u);

  function trailStack(b, u) {
    if ((u.flags.stacks || 0) >= 2) return;
    u.flags.stacks = (u.flags.stacks || 0) + 1;
    const v = Math.round(0.2 * b.traceTalent(u) * 1000) / 1000;
    u.buffs.push({ s: 'atkP', v, turns: 999, name: 'Воля разрушения ' + u.flags.stacks });
    if (b.hasBonus(u, 'a4')) u.buffs.push({ s: 'defP', v: 0.1, turns: 999, name: 'Упорство ' + u.flags.stacks });
    b.push({ t: 'status', u, text: 'Атака +' + Math.round(v * 100) + '%' });
  }

  FX.trail = {
    start(b, u) { if (b.hasBonus(u, 'a2')) b.gainEnergy(u, 15); },
    break(b, u, tgt, src) { if (u === src) trailStack(b, u); },
    kill(b, u) {
      if (b.acting !== u) return;
      if (b.actKind === 'ult' && b.eidOn(u, 1) && u.flags.e1 !== b.actSerial) { u.flags.e1 = b.actSerial; b.gainEnergy(u, 10); }
      if (b.eidOn(u, 6)) trailStack(b, u);
    },
    hit(b, u, tgt) {
      if (!b.eidOn(u, 2) || tgt.side !== 'enemy' || !tgt.weak.includes('phys') || u.flags.e2 === b.actSerial) return;
      u.flags.e2 = b.actSerial;
      b.heal(u, u, atkOf(u) * 0.05);
    },
    crit(b, u, tgt) { return b.eidOn(u, 4) && tgt.broken ? 0.25 : 0; },
    dmg(b, u, tgt, o) { return o.main && (o.kind === 'skill' || o.kind === 'ult') && b.hasBonus(u, 'a6') ? 0.25 : 0; }
  };

  const defOf = u => H.battleStat.defOf(u);
  const lowestHp = list => list.reduce((a, c) => (c.hp / c.maxHp < a.hp / a.maxHp ? c : a));

  FX.march = {
    start(b, u) {
      if (!b.eidOn(u, 2) || !b.livingAllies.length) return;
      b.giveShield(lowestHp(b.livingAllies), defOf(u) * 0.24 + 13 * H.grow(u.lvl), 3);
    },
    act(b, u, kind, R) {
      if (kind !== 'skill' || !R || !R.ally) return;
      R.ally.flags.marchShield = true;
      if (!b.hasBonus(u, 'a2')) return;
      const i = R.ally.buffs.findIndex(x => x.debuff);
      if (i >= 0) { R.ally.buffs.splice(i, 1); b.push({ t: 'status', u: R.ally, text: 'Очищение' }); }
    },
    shieldTurns(b, u, kind) { return kind === 'skill' && b.hasBonus(u, 'a4') ? 1 : 0; },
    freezeChance(b, u, kind) { return kind === 'ult' && b.hasBonus(u, 'a6') ? 0.15 : 0; },
    froze(b, u, t, kind) { if (kind === 'ult' && b.eidOn(u, 1)) b.gainEnergy(u, 6); },
    allyTurn(b, u, who) {
      if (!b.eidOn(u, 6) || !who.flags.marchShield || !(who.shield > 0) || who.hp >= who.maxHp) return;
      b.heal(u, who, who.maxHp * 0.04 + 4 * H.grow(u.lvl));
    }
  };

  const slowed = t => t.buffs.some(x => x.s === 'spdP' && x.v < 0);

  FX.danheng = {
    aggro(b, u) { return b.hasBonus(u, 'a2') && u.hp <= u.maxHp * 0.5 ? 0.5 : 1; },
    after(b, u, kind, attacked) {
      if (!attacked || !b.hasBonus(u, 'a4') || b.rng() >= 0.5) return;
      b.addBuff(u, { s: 'spdP', v: 0.2, turns: 2, name: 'Тень отчаяния' }, true);
    },
    dmg(b, u, tgt, o) { return o.kind === 'basic' && b.hasBonus(u, 'a6') && slowed(tgt) ? 0.4 : 0; },
    crit(b, u, tgt) { return b.eidOn(u, 1) && tgt.hp >= tgt.maxHp * 0.5 ? 0.12 : 0; },
    kill(b, u) {
      if (b.acting !== u || b.actKind !== 'ult' || !b.eidOn(u, 4) || u.flags.e4 === b.actSerial) return;
      u.flags.e4 = b.actSerial;
      u.av = 0;
      b.push({ t: 'status', u, text: 'Ход сразу' });
    },
    act(b, u, kind, R) {
      if (kind !== 'skill' || !b.eidOn(u, 6) || !R || !R.main) return;
      const slow = R.main.buffs.find(x => x.name === 'Замедление' && x.s === 'spdP' && !x.e6);
      if (slow) { slow.v -= 0.08; slow.e6 = true; }
    }
  };

  const burning = t => t.dots.some(d => d.type === 'burn');

  FX.himeko = {
    hit(b, u, tgt) {
      if (tgt.side !== 'enemy' || !b.hasBonus(u, 'a2') || !(tgt.hp > 0)) return;
      const key = b.actSerial + ':' + tgt.idx + ':' + b.wave;
      if (u.flags.a2 === key) return;
      u.flags.a2 = key;
      if (b.rng.chance(b.effectChance(u, tgt, 0.5))) b.addDot(u, tgt, 'burn', atkOf(u) * 0.3, 2);
    },
    dmg(b, u, tgt) {
      let v = 0;
      if (b.hasBonus(u, 'a4') && burning(tgt)) v += 0.2;
      if (b.eidOn(u, 2) && tgt.hp <= tgt.maxHp * 0.5) v += 0.15;
      return v;
    },
    crit(b, u) { return b.hasBonus(u, 'a6') && u.hp >= u.maxHp * 0.8 ? 0.15 : 0; },
    rush(b, u) { if (b.eidOn(u, 1)) b.addBuff(u, { s: 'spdP', v: 0.2, turns: 2, name: 'Детство' }, true); },
    break(b, u, tgt, src) {
      if (u !== src || b.acting !== u || b.actKind !== 'skill' || !b.eidOn(u, 4)) return;
      u.flags.charges = Math.min(3, (u.flags.charges || 0) + 1);
    },
    act(b, u, kind) {
      if (kind !== 'ult' || !b.eidOn(u, 6)) return;
      const ab = b.abilityFor(u, 'ult').ab, dm = ab.fx.find(f => f.k === 'dmg');
      for (let i = 0; i < 2 && b.living.length; i++) b.hit(u, b.rng.pick(b.living), (dm ? dm.m : 2.3) * 0.4, { e: 'fire', tough: 5, kind: 'ult', label: 'Освоение!' });
    }
  };

  const WELT_SLOW = [0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.7125, 0.725, 0.7375, 0.75, 0.76, 0.77];
  const WELT_DELAY = [0.32, 0.328, 0.336, 0.344, 0.352, 0.36, 0.37, 0.38, 0.39, 0.4, 0.408, 0.416];
  const abLv = (b, u, ab) => (H.TUNING.trLevels ? b.traceLv(u, ab) : 10);
  const pickLv = (list, lv) => list[Math.max(1, Math.min(list.length, lv)) - 1];
  const dmgM = (b, u, kind) => { const f = b.abilityFor(u, kind).ab.fx.find(x => x.k === 'dmg'); return f ? f.m : 0; };

  FX.welt = {
    debuffChance(b, u, kind, f) {
      if (kind !== 'skill' || f.s !== 'spdP') return 0;
      return pickLv(WELT_SLOW, abLv(b, u, 'skill')) - f.chance + (b.eidOn(u, 4) ? 0.35 : 0);
    },
    imprisonDelay(b, u) { return pickLv(WELT_DELAY, abLv(b, u, 'ult')); },
    talentHit(b, u) { if (b.eidOn(u, 2)) b.gainEnergy(u, 3); },
    dmg(b, u, tgt) { return b.hasBonus(u, 'a6') && tgt.broken ? 0.2 : 0; },
    act(b, u, kind, R) {
      if (kind === 'ult') {
        if (b.hasBonus(u, 'a2')) for (const t of b.living) {
          if (b.rng.chance(b.effectChance(u, t, 1))) b.addBuff(t, { s: 'vuln', v: 0.12, turns: 2, name: 'Возмездие', debuff: true });
          else b.resisted(u);
        }
        if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 10);
        if (b.eidOn(u, 1)) u.flags.e1 = 2;
        return;
      }
      if (kind !== 'basic' && kind !== 'skill') return;
      if (kind === 'skill' && b.eidOn(u, 6) && b.living.length) {
        const t = b.rng.pick(b.living), ch = this.debuffChance(b, u, 'skill', { s: 'spdP', chance: 0 });
        b.hit(u, t, dmgM(b, u, 'skill'), { e: 'imag', tough: 10, kind: 'skill', label: 'Светлые перспективы' });
        if (t.hp > 0) { if (b.rng.chance(b.effectChance(u, t, ch))) b.addBuff(t, { s: 'spdP', v: -0.1, turns: 2, name: 'Замедление', debuff: true }); else b.resisted(u); }
      }
      if (!(u.flags.e1 > 0) || !b.living.length) return;
      u.flags.e1--;
      const t = R && R.main && R.main.hp > 0 ? R.main : b.rng.pick(b.living);
      b.hit(u, t, dmgM(b, u, kind) * (kind === 'basic' ? 0.5 : 0.8), { e: 'imag', kind, label: 'Наследие чести' });
    }
  };

  FX.herta = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    dmg(b, u, tgt, o) {
      if (o.kind === 'skill' && b.hasBonus(u, 'a2') && tgt.hp >= tgt.maxHp * 0.5) return 0.25;
      if (o.kind === 'ult' && b.hasBonus(u, 'a6') && tgt.frozen) return 0.2;
      if (o.kind === 'follow' && b.eidOn(u, 4)) return 0.1;
      return 0;
    },
    rush(b, u) {
      if (!b.eidOn(u, 2) || (u.flags.e2 || 0) >= 5) return;
      u.flags.e2 = (u.flags.e2 || 0) + 1;
      b.addBuff(u, { s: 'critR', v: 0.03 * u.flags.e2, turns: 999, name: 'Всегда в погоне за победой' }, true);
    },
    act(b, u, kind, R) {
      if (kind === 'ult' && b.eidOn(u, 6)) b.addBuff(u, { s: 'atkP', v: 0.25, turns: 1, name: 'Никогда не предавай меня' });
      if (kind !== 'basic' || !b.eidOn(u, 1) || !R || !R.main || !(R.main.hp > 0) || R.main.hp > R.main.maxHp * 0.5) return;
      b.hit(u, R.main, 0.4, { e: 'ice', kind: 'basic', label: 'Пинаю лежачего' });
    }
  };

  const setBuff = (u, name, s, v) => {
    u.buffs = u.buffs.filter(x => x.name !== name);
    if (v) u.buffs.push({ s, v, turns: 999, name });
  };

  FX.asta = {
    start(b, u) { b.astaAura(u); },
    aura(b, u) {
      if (!(u.hp > 0)) return;
      const charge = u.flags.charge || 0;
      if (b.hasBonus(u, 'a4')) for (const a of b.livingAllies) setBuff(a, 'Воспламенение', 'fireP', 0.18);
      if (b.hasBonus(u, 'a6')) setBuff(u, 'Созвездие', 'defP', Math.round(0.06 * charge * 1000) / 1000);
      if (b.eidOn(u, 4)) setBuff(u, 'Когда появляется аврора', 'err', charge >= 2 ? 0.15 : 0);
    },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== 'Заряд Асты' && x.name !== 'Воспламенение'); },
    chargeDrop(b, u) {
      if (u.flags.e2keep) { u.flags.e2keep = false; return 0; }
      return b.eidOn(u, 6) ? 2 : 3;
    },
    act(b, u, kind, R) {
      if (kind === 'ult' && b.eidOn(u, 2)) u.flags.e2keep = true;
      if (kind === 'skill' && b.eidOn(u, 1) && b.living.length) b.hit(u, b.rng.pick(b.living), dmgM(b, u, 'skill'), { e: 'fire', tough: 5, kind: 'skill', label: 'Безмолвная песнь звезды' });
      if (kind !== 'basic' || !b.hasBonus(u, 'a2') || !R || !R.main || !(R.main.hp > 0)) return;
      if (b.rng.chance(b.effectChance(u, R.main, 0.8))) b.addDot(u, R.main, 'burn', atkOf(u) * dmgM(b, u, 'basic') * 0.5, 3);
      else b.resisted(u);
    }
  };

  const halfHp = u => u.hp <= u.maxHp * 0.5;

  FX.arlan = {
    start(b, u) { if (b.hasBonus(u, 'a6') && halfHp(u)) u.flags.a6guard = true; },
    guard(b, u) {
      if (!u.flags.a6guard) return false;
      u.flags.a6guard = false;
      b.push({ t: 'status', u, text: 'Отторжение' });
      return true;
    },
    dotRes(b, u) { return b.hasBonus(u, 'a4') ? 0.5 : 0; },
    kill(b, u) {
      if (!b.hasBonus(u, 'a2') || !(u.hp > 0) || u.hp > u.maxHp * 0.3) return;
      b.heal(u, u, u.maxHp * 0.2);
    },
    allyTurn(b, u, who) { if (who === u) u.flags.turnsTaken = (u.flags.turnsTaken || 0) + 1; },
    survive(b, u) {
      if (!b.eidOn(u, 4) || u.flags.e4used || (u.flags.turnsTaken || 0) > 2) return false;
      u.flags.e4used = true;
      u.hp = Math.round(u.maxHp * 0.25);
      b.push({ t: 'revive', u, hp: u.hp, text: 'Бешенство загнанного' });
      return true;
    },
    dmg(b, u, tgt, o) {
      if (!halfHp(u)) return 0;
      if (o.kind === 'skill' && b.eidOn(u, 1)) return 0.1;
      if (o.kind === 'ult' && b.eidOn(u, 6)) return 0.2;
      return 0;
    },
    adjM(b, u, f) { return b.eidOn(u, 6) && halfHp(u) ? f.m : 0; },
    act(b, u, kind) {
      if ((kind !== 'skill' && kind !== 'ult') || !b.eidOn(u, 2)) return;
      const i = u.buffs.findIndex(x => x.debuff);
      if (i >= 0) { u.buffs.splice(i, 1); b.push({ t: 'status', u, text: 'Очищение' }); }
      else if (u.dots.length) { u.dots.shift(); b.push({ t: 'status', u, text: 'Очищение' }); }
    }
  };

  FX.trail_p = {
    start(b, u) { if (b.eidOn(u, 4)) u.flags.magma = Math.min(8, (u.flags.magma || 0) + 4); },
    shieldBonus(b, u) { return b.eidOn(u, 2) ? defOf(u) * 0.02 + 7 * H.grow(u.lvl) : 0; },
    allyTurn(b, u, who) {
      if (who !== u || !b.hasBonus(u, 'a6') || !(u.shield > 0)) return;
      u.buffs = u.buffs.filter(x => x.name !== 'Действия важнее мысли');
      u.buffs.push({ s: 'atkP', v: 0.15, turns: 1, name: 'Действия важнее мысли' });
      b.gainEnergy(u, 5);
    },
    act(b, u, kind, R) {
      if (kind === 'skill' && b.hasBonus(u, 'a2')) for (const a of b.livingAllies) b.addBuff(a, { s: 'dr', v: 0.15, turns: 1, name: 'Сильные защищают слабых' }, true);
      if (kind === 'enhanced' && b.hasBonus(u, 'a4')) b.heal(u, u, u.maxHp * 0.05);
      if ((kind === 'enhanced' || kind === 'ult') && b.eidOn(u, 6)) {
        u.flags.e6 = Math.min(3, (u.flags.e6 || 0) + 1);
        setBuff(u, 'Бастионы, закаляющие город', 'defP', Math.round(0.1 * u.flags.e6 * 1000) / 1000);
      }
      if ((kind === 'basic' || kind === 'enhanced') && b.eidOn(u, 1) && R && R.main && R.main.hp > 0) {
        b.hit(u, R.main, 0, { e: 'fire', plusDef: kind === 'basic' ? 0.25 : 0.5, kind: 'basic', label: 'Резонанс, сокрушающий землю' });
      }
    }
  };

  const BRONYA_AURA = 'Военная мощь';

  FX.bronya = {
    start(b, u) {
      if (b.hasBonus(u, 'a4')) for (const a of b.livingAllies) b.addBuff(a, { s: 'defP', v: 0.2, turns: 2, name: 'Поле боя' }, true);
      FX.bronya.aura(b, u);
    },
    aura(b, u) { if (b.hasBonus(u, 'a6') && u.hp > 0) for (const a of b.livingAllies) setBuff(a, BRONYA_AURA, 'dmgP', 0.1); },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== BRONYA_AURA); },
    allyTurn(b, u, who) {
      if (who === u) {
        u.flags.e4ready = true;
        if (u.flags.e1cd > 0) u.flags.e1cd--;
        FX.bronya.aura(b, u);
      }
      if (who.flags.bronyaOrder === u) {
        who.flags.bronyaOrder = null;
        b.addBuff(who, { s: 'spdP', v: 0.3, turns: 1, name: 'Быстрый марш' });
      }
    },
    act(b, u, kind, R) {
      if (kind === 'basic') b.advance(u, 0.3 * b.traceTalent(u));
      if (kind !== 'skill' || !R || !R.ally) return;
      if (b.eidOn(u, 2) && R.ally !== u) R.ally.flags.bronyaOrder = u;
      if (b.eidOn(u, 6)) { const o = R.ally.buffs.find(x => x.name === 'Приказ'); if (o) o.turns++; }
      if (b.eidOn(u, 1) && !(u.flags.e1cd > 0) && b.rng() < 0.5) {
        u.flags.e1cd = 2;
        b.sp = Math.min(H.TUNING.spMax, b.sp + 1);
        b.push({ t: 'status', u, text: '+1 очко навыка' });
      }
    },
    allyAfter(b, u, who, kind, hits) {
      if ((kind !== 'basic' && kind !== 'enhanced') || !b.eidOn(u, 4) || u.flags.e4ready === false) return;
      const t = hits.find(e => e.hp > 0 && e.weak.includes('wind'));
      if (!t) return;
      u.flags.e4ready = false;
      const was = b.acting;
      b.acting = u;
      b.push({ t: 'act', u, name: 'Застань врага врасплох', kind: 'follow' });
      b.hit(u, t, dmgM(b, u, 'basic') * 0.8, { e: 'wind', tough: 5, kind: 'follow' });
      b.acting = was;
      b.cleanup();
    }
  };

  const BUTTERFLY = 'Вихрь бабочек';

  FX.seele = {
    aggro(b, u) { return b.hasBonus(u, 'a2') && halfHp(u) ? 0.5 : 1; },
    crit(b, u, tgt) { return b.eidOn(u, 1) && tgt.hp <= tgt.maxHp * 0.8 ? 0.15 : 0; },
    allyTurn(b, u, who) { if (who === u) u.flags.e2had = u.buffs.some(x => x.name === 'Ускорение' && x.turns > 0); },
    kill(b, u) { if (b.eidOn(u, 4)) b.gainEnergy(u, 15); },
    down(b, u) { for (const e of b.enemies) e.buffs = e.buffs.filter(x => !(x.s === 'mark' && x.src === u)); },
    act(b, u, kind, R) {
      if (kind === 'basic' && b.hasBonus(u, 'a6')) b.advance(u, 0.2);
      if (kind === 'skill' && b.eidOn(u, 2) && u.flags.e2had) {
        u.flags.e2had = false;
        b.addBuff(u, { s: 'spdP', v: 0.25, turns: 2, name: 'Ускорение 2' }, true);
      }
      if (kind === 'ult' && b.eidOn(u, 6) && R && R.main && R.main.hp > 0) b.addBuff(R.main, { s: 'mark', v: 0, turns: 1, name: BUTTERFLY, debuff: true, src: u });
    },
    markHit(b, u, tgt) { b.hit(u, tgt, dmgM(b, u, 'ult') * 0.15, { e: 'quant', mark: true, kind: 'follow', label: BUTTERFLY }); }
  };

  const GEPARD_AURA = 'Вера двигает горы';
  const gepardSpirit = (b, u) => { if (b.hasBonus(u, 'a6')) setBuff(u, 'Боевой дух', 'atkP', Math.round(0.35 * defOf(u) / u.base.atk * 1000) / 1000); };

  FX.gepard = {
    start(b, u) {
      gepardSpirit(b, u);
      if (b.eidOn(u, 4)) for (const a of b.livingAllies) setBuff(a, GEPARD_AURA, 'res', 0.2);
    },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== GEPARD_AURA); },
    aggro(b, u) { return b.hasBonus(u, 'a2') ? 2 : 1; },
    allyTurn(b, u, who) { if (who === u) gepardSpirit(b, u); },
    freezeChance(b, u, kind) { return kind === 'skill' && b.eidOn(u, 1) ? 0.35 : 0; },
    froze(b, u, t, kind) { if (kind === 'skill') t.flags.gepardFreeze = true; },
    thaw(b, u, t) {
      if (!t.flags.gepardFreeze) return;
      t.flags.gepardFreeze = false;
      if (b.eidOn(u, 2)) b.addBuff(t, { s: 'spdP', v: -0.2, turns: 1, name: 'Затяжной холод', debuff: true });
    },
    revived(b, u) {
      if (b.hasBonus(u, 'a4')) u.energy = u.maxEnergy;
      if (!b.eidOn(u, 6)) return;
      u.hp += Math.round(u.maxHp * 0.5);
      u.av = 0;
    }
  };

  FX.clara = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    dmg(b, u, tgt, o) { return o.kind === 'follow' && o.label === 'Сварог' && b.hasBonus(u, 'a6') ? 0.3 : 0; },
    keepMarks(b, u) { return b.eidOn(u, 1); },
    counterOthers(b, u) { return b.eidOn(u, 6); },
    attacked(b, u) {
      if (b.hasBonus(u, 'a2') && b.rng() < 0.35) {
        const i = u.buffs.findIndex(x => x.debuff);
        if (i >= 0) { u.buffs.splice(i, 1); b.push({ t: 'status', u, text: 'Очищение' }); }
      }
      if (b.eidOn(u, 4)) setBuff(u, 'Тепло семьи', 'dr', 0.3);
    },
    allyTurn(b, u, who) { if (who === u) u.buffs = u.buffs.filter(x => x.name !== 'Тепло семьи'); },
    act(b, u, kind) {
      if (kind !== 'ult') return;
      if (b.eidOn(u, 2)) b.addBuff(u, { s: 'atkP', v: 0.3, turns: 2, name: 'Крепкие объятия' });
      if (b.eidOn(u, 6)) u.flags.promise = (u.flags.promise || 0) + 1;
    }
  };

  const YQ_CRIT = [0.15, 0.155, 0.16, 0.165, 0.17, 0.175, 0.1812, 0.1875, 0.1938, 0.2, 0.205, 0.21];
  const YQ_CHANCE = [0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.5625, 0.575, 0.5875, 0.6, 0.61, 0.62];

  FX.yanqing = {
    start(b, u) { if (b.eidOn(u, 4)) u.buffs.push({ s: 'resPen', v: 0.12, turns: 999, cond: 'hp80', name: 'Пронзающий иней' }); },
    syncTalent(b, u) {
      const lv = abLv(b, u, 'talent');
      return { cr: pickLv(YQ_CRIT, lv), cd: Math.round(0.3 * b.traceTalent(u) * 1000) / 1000, ch: pickLv(YQ_CHANCE, lv) };
    },
    synced(b, u) {
      if (b.hasBonus(u, 'a4')) b.addBuff(u, { s: 'res', v: 0.2, turns: 999, name: 'Единение: стойкость' }, true);
      if (b.eidOn(u, 2)) b.addBuff(u, { s: 'err', v: 0.1, turns: 999, name: 'Единение: ясность' }, true);
    },
    hit(b, u, tgt, o, dmg, crit) {
      if (crit && b.hasBonus(u, 'a6')) b.addBuff(u, { s: 'spdP', v: 0.1, turns: 2, name: 'Степная сталь' }, true);
    },
    kill(b, u) { if (b.eidOn(u, 6)) for (const x of u.buffs) if (x.name.startsWith('Блаженный дождь')) x.turns++; },
    act(b, u, kind, R) {
      if (!['basic', 'skill', 'ult'].includes(kind) || !R || !R.main || !(R.main.hp > 0)) return;
      const t = R.main;
      if (b.hasBonus(u, 'a2') && t.weak.includes('ice')) b.hit(u, t, 0.3, { e: 'ice', kind: 'follow', label: 'Ледяная благодать' });
      if (b.eidOn(u, 1) && t.frozen && t.hp > 0) b.hit(u, t, 0.6, { e: 'ice', kind: 'follow', label: 'Чистое лезвие' });
    }
  };

  const MEND = 'Суть врачевания';

  FX.bailu = {
    start(b, u) { if (b.hasBonus(u, 'a6')) for (const a of b.allies) a.buffs.push({ s: 'dr', v: 0.1, turns: 999, cond: 'invig', name: 'Водное благословение' }); },
    invigUses(b, u) { return b.hasBonus(u, 'a4') ? 1 : 0; },
    elixirUses(b, u) { return b.eidOn(u, 6) ? 1 : 0; },
    healed(b, u, tgt, amt, got) {
      if (b.hasBonus(u, 'a2') && amt > got && tgt.hp >= tgt.maxHp) {
        const old = tgt.buffs.find(x => x.name === MEND);
        if (old) old.turns = Math.max(old.turns, 2);
        else {
          const add = Math.round(tgt.maxHp * 0.1);
          tgt.maxHp += add;
          tgt.hp += add;
          b.addBuff(tgt, { s: 'mend', v: 0, turns: 2, name: MEND, hpAdd: add }, true);
        }
      }
      if (b.eidOn(u, 4) && b.acting === u && b.actKind === 'skill') {
        const st = tgt.buffs.find(x => x.name === 'Изгнание зла');
        if (st) { st.v = Math.min(0.3, Math.round((st.v + 0.1) * 1000) / 1000); st.turns = 2; }
        else b.addBuff(tgt, { s: 'dmgP', v: 0.1, turns: 2, name: 'Изгнание зла' }, true);
      }
    },
    expire(b, u, who, buff) { if (buff.s === 'invig' && b.eidOn(u, 1) && who.hp >= who.maxHp) b.gainEnergy(who, 8); },
    act(b, u, kind) { if (kind === 'ult' && b.eidOn(u, 2)) b.addBuff(u, { s: 'healP', v: 0.15, turns: 2, name: 'Горшочек спящего дракона' }); }
  };

  FX.natasha = {
    start(b, u) { if (b.hasBonus(u, 'a4')) u.buffs.push({ s: 'healP', v: 0.1, turns: 999, name: 'Лечение' }); },
    attacked(b, u) {
      if (b.eidOn(u, 4)) b.gainEnergy(u, 5);
      if (!b.eidOn(u, 1) || u.flags.e1used || u.hp > u.maxHp * 0.3) return;
      u.flags.e1used = true;
      b.heal(u, u, u.maxHp * 0.15 + 28 * H.grow(u.lvl));
    },
    act(b, u, kind, R) {
      if (kind === 'skill' && b.hasBonus(u, 'a6') && R && R.ally) {
        const hot = R.ally.buffs.find(x => x.s === 'hotMark' && x.src === u && x.name === 'Регенерация');
        if (hot) hot.turns++;
      }
      if (kind === 'ult' && b.eidOn(u, 2)) {
        const amt = Math.round(u.maxHp * 0.06 + 11 * H.grow(u.lvl));
        for (const a of b.livingAllies) if (a.hp <= a.maxHp * 0.3) b.addBuff(a, { s: 'hotMark', v: 0, turns: 1, name: 'Клиническое исследование', hot: amt, src: u });
      }
      if (kind === 'basic' && b.eidOn(u, 6) && R && R.main && R.main.hp > 0) b.hit(u, R.main, 0, { e: 'phys', hpM: 0.4, kind: 'basic', label: 'Милосердие лекаря' });
    }
  };

  const shocked = t => t.dots.some(d => d.type === 'shock');

  FX.serval = {
    start(b, u) { if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 15); },
    dotChance(b, u, kind, f) { return kind === 'skill' && f.type === 'shock' && b.hasBonus(u, 'a2') ? 0.2 : 0; },
    kill(b, u) { if (b.hasBonus(u, 'a6')) b.addBuff(u, { s: 'atkP', v: 0.2, turns: 2, name: 'Лихорадка' }, true); },
    talentHit(b, u) { if (b.eidOn(u, 2)) b.gainEnergy(u, 4); },
    dmg(b, u, tgt) { return b.eidOn(u, 6) && shocked(tgt) ? 0.3 : 0; },
    act(b, u, kind, R) {
      if (kind === 'basic' && b.eidOn(u, 1) && R && R.main) {
        const near = b.adjacent(b.living, R.main).filter(t => t.hp > 0);
        if (near.length) b.hit(u, b.rng.pick(near), dmgM(b, u, 'basic') * 0.6, { e: 'elec', kind: 'basic', label: 'Эхо-камера' });
      }
      if (kind === 'ult' && b.eidOn(u, 4)) {
        const dot = b.abilityFor(u, 'skill').ab.fx.find(x => x.k === 'dot');
        for (const t of b.living) {
          if (shocked(t)) continue;
          if (b.rng.chance(b.effectChance(u, t, 1))) b.addDot(u, t, 'shock', atkOf(u) * (dot ? dot.m : 0.5), 2);
          else b.resisted(u);
        }
      }
    }
  };

  const shear = t => t.dots.find(d => d.type === 'shear');

  FX.sampo = {
    shear(b, u) { return { turns: b.hasBonus(u, 'a2') ? 1 : 0, m: b.eidOn(u, 6) ? 0.15 : 0 }; },
    takenCut(b, u, src) { return b.hasBonus(u, 'a6') && shear(src) ? 0.15 : 0; },
    kill(b, u, tgt) {
      if (!b.eidOn(u, 2) || !shear(tgt)) return;
      for (const t of b.living) b.sampoShear(u, t, 1);
    },
    hit(b, u, tgt, o) {
      if (!b.eidOn(u, 4) || o.kind !== 'skill' || !(tgt.hp > 0)) return;
      const d = shear(tgt);
      if (!d || (d.stacks || 1) < 5) return;
      b.hit(d.src || u, tgt, 0, { fixed: d.dmg * d.stacks * 0.08, e: 'wind', isDot: true, label: 'Глубже любовь' });
    },
    act(b, u, kind) {
      if (kind === 'ult' && b.hasBonus(u, 'a4')) b.gainEnergy(u, 10);
      if (kind === 'skill' && b.eidOn(u, 1) && b.living.length) {
        const t = b.rng.pick(b.living);
        b.hit(u, t, dmgM(b, u, 'skill'), { e: 'wind', tough: 5, kind: 'skill', label: 'Восходящая любовь' });
        if (t.hp > 0) b.sampoShear(u, t, 0.65);
      }
    }
  };

  FX.hook = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    dotTurns(b, u, kind, f) { return kind === 'skill' && f.type === 'burn' && b.eidOn(u, 2) ? 1 : 0; },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.kind === 'skill' && u.flags.enhancedUse && b.eidOn(u, 1)) v += 0.2;
      if (b.eidOn(u, 6) && burning(tgt)) v += 0.2;
      return v;
    },
    talentHit(b, u, t) {
      if (b.hasBonus(u, 'a2')) b.heal(u, u, u.maxHp * 0.05);
      if (!b.eidOn(u, 4) || !t) return;
      const dot = b.abilityFor(u, 'skill').ab.fx.find(x => x.k === 'dot');
      for (const a of b.adjacent(b.living, t)) {
        if (!(a.hp > 0)) continue;
        if (b.rng.chance(b.effectChance(u, a, 1))) b.addDot(u, a, 'burn', atkOf(u) * (dot ? dot.m : 0.35), 2 + (b.eidOn(u, 2) ? 1 : 0));
        else b.resisted(u);
      }
    },
    act(b, u, kind) {
      if (kind === 'skill') u.flags.enhancedUse = false;
      if (kind === 'ult' && b.hasBonus(u, 'a6')) { b.advance(u, 0.2); b.gainEnergy(u, 5); }
    }
  };

  const PELA_AURA = 'Тайная стратегия';
  const debuffed = t => t.buffs.some(x => x.debuff) || t.dots.length > 0;

  FX.pela = {
    start(b, u) { if (b.hasBonus(u, 'a4')) for (const a of b.livingAllies) setBuff(a, PELA_AURA, 'ehr', 0.1); },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== PELA_AURA); },
    dmg(b, u, tgt, o) {
      let v = b.hasBonus(u, 'a2') && debuffed(tgt) ? 0.2 : 0;
      if (u.flags.a6next && b.acting === u) v += 0.2;
      return v;
    },
    kill(b, u) { if (b.eidOn(u, 1)) b.gainEnergy(u, 5); },
    dispelled(b, u) {
      if (b.hasBonus(u, 'a6')) u.flags.a6ready = true;
      if (b.eidOn(u, 2)) b.addBuff(u, { s: 'spdP', v: 0.1, turns: 2, name: 'Стремительное продвижение' }, true);
    },
    hit(b, u, tgt, o) {
      if (!b.eidOn(u, 6) || o.label === 'Преследование слабости' || !(tgt.hp > 0) || !debuffed(tgt)) return;
      const key = b.actSerial + ':' + tgt.idx + ':' + b.wave;
      if (u.flags.e6 === key) return;
      u.flags.e6 = key;
      b.hit(u, tgt, 0.4, { e: 'ice', kind: 'follow', label: 'Преследование слабости' });
    },
    act(b, u, kind, R) {
      if (['basic', 'skill', 'ult'].includes(kind)) {
        u.flags.a6next = !!u.flags.a6ready;
        u.flags.a6ready = false;
      }
      if (kind === 'skill' && b.eidOn(u, 4) && R && R.main && R.main.hp > 0) {
        if (b.rng.chance(b.effectChance(u, R.main, 1))) b.addBuff(R.main, { s: 'iceResDown', v: 0.12, turns: 2, name: 'Полный анализ', debuff: true });
        else b.resisted(u);
      }
    }
  };

  const RUAN_AURA = 'Инертное дыхание';
  const RUAN_SPD = [0.08, 0.082, 0.084, 0.086, 0.088, 0.09, 0.0925, 0.095, 0.0975, 0.1, 0.102, 0.104];

  FX.ruanmei = {
    start(b, u) { if (b.hasBonus(u, 'a2')) for (const a of b.livingAllies) setBuff(a, RUAN_AURA, 'breakE', 0.2); },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== RUAN_AURA && x.name !== 'Соматотипическая спираль'); },
    spiralSpd(b, u) { return pickLv(RUAN_SPD, abLv(b, u, 'talent')); },
    spiralBreak(b, u) { return b.eidOn(u, 6) ? 2 : 0; },
    allyTurn(b, u, who) { if (who === u && b.hasBonus(u, 'a4')) b.gainEnergy(u, 5); },
    teamDmg(b, u, src, tgt) { return b.eidOn(u, 2) && tgt.broken ? 0.4 : 0; },
    break(b, u) { if (b.eidOn(u, 4)) b.addBuff(u, { s: 'breakE', v: 1, turns: 3, name: 'Мерцающий блеск зеркала' }, true); },
    act(b, u, kind) {
      if (kind === 'skill' && b.hasBonus(u, 'a6')) {
        const extra = Math.min(0.36, Math.max(0, Math.floor((H.battleStat.sv(u, 'breakE') - 1.2 + 1e-9) / 0.1)) * 0.06);
        if (extra > 0) for (const a of b.livingAllies) { const o = a.buffs.find(x => x.name === 'Обертон'); if (o) o.v = Math.round((o.v + extra) * 1000) / 1000; }
      }
      if (kind !== 'ult') return;
      const turns = 2 + (b.eidOn(u, 6) ? 1 : 0);
      for (const a of b.livingAllies) {
        const zone = a.buffs.find(x => x.name === 'Магический круг');
        if (zone && b.eidOn(u, 6)) zone.turns++;
        if (b.eidOn(u, 1)) b.addBuff(a, { s: 'defIgnore', v: 0.2, turns, name: 'Нейронный узор' }, true);
      }
    }
  };

  const KAFKA_DET_SKILL = [0.6, 0.615, 0.63, 0.645, 0.66, 0.675, 0.6937, 0.7125, 0.7312, 0.75, 0.765, 0.78];
  const KAFKA_DET_ULT = [0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.925, 0.95, 0.975, 1, 1.02, 1.04];

  FX.kafka = {
    detRatio(b, u, which) { return which === 'ult' ? pickLv(KAFKA_DET_ULT, abLv(b, u, 'ult')) : pickLv(KAFKA_DET_SKILL, abLv(b, u, 'skill')); },
    detAll(b, u) { return b.hasBonus(u, 'a2'); },
    dotChance(b, u, kind, f) { return (kind === 'ult' || kind === 'follow') && f.type === 'shock' && b.hasBonus(u, 'a6') ? 0.3 : 0; },
    dotM(b, u, kind, f) { return kind === 'ult' && f.type === 'shock' && b.eidOn(u, 6) ? 1.56 : 0; },
    dotTurns(b, u, kind, f) { return kind === 'ult' && f.type === 'shock' && b.eidOn(u, 6) ? 1 : 0; },
    shockUp(b, u) {
      const dot = b.abilityFor(u, 'ult').ab.fx.find(x => x.k === 'dot');
      return { m: (dot ? dot.m : 0.9) + (b.eidOn(u, 6) ? 1.56 : 0), turns: b.eidOn(u, 6) ? 1 : 0 };
    },
    kill(b, u, tgt) { if (b.hasBonus(u, 'a4') && tgt.dots.some(d => d.type === 'shock')) b.gainEnergy(u, 5); },
    follow(b, u, t) {
      if (!b.eidOn(u, 1)) return;
      if (b.rng.chance(b.effectChance(u, t, 1))) b.addBuff(t, { s: 'dotVuln', v: 0.3, turns: 2, name: 'Da Capo', debuff: true });
      else b.resisted(u);
    },
    teamDmg(b, u, src, tgt, o) { return o.isDot && b.eidOn(u, 2) ? 0.25 : 0; },
    dotTick(b, u, t, d) { if (d.type === 'shock' && b.eidOn(u, 4)) b.gainEnergy(u, 2); }
  };

  const WOLF_BUG = [0.6, 0.612, 0.624, 0.636, 0.648, 0.66, 0.675, 0.69, 0.705, 0.72, 0.732, 0.744];
  const BOTNET = 'Бот-сеть';
  const botnet = (b, u) => { if (b.eidOn(u, 2)) for (const e of b.living) if (!e.buffs.some(x => x.name === BOTNET)) e.buffs.push({ s: 'res', v: -0.2, turns: 999, name: BOTNET, perm: true }); };

  FX.silverwolf = {
    start: botnet,
    allyTurn(b, u, who) { if (who === u) botnet(b, u); },
    down(b, u) { for (const e of b.enemies) e.buffs = e.buffs.filter(x => x.name !== BOTNET); },
    bug(b, u) { return { chance: pickLv(WOLF_BUG, abLv(b, u, 'talent')), turns: b.hasBonus(u, 'a2') ? 1 : 0 }; },
    implantTurns(b, u) { return b.hasBonus(u, 'a4') ? 1 : 0; },
    break(b, u, tgt) { if (b.hasBonus(u, 'a2') && tgt.hp > 0) b.plantBug(u, tgt, 0.65); },
    dmg(b, u, tgt) { return b.eidOn(u, 6) ? Math.min(1, 0.2 * b.debuffCount(tgt)) : 0; },
    act(b, u, kind, R) {
      const t = R && R.main;
      if (!t || !(t.hp > 0)) return;
      if (kind === 'skill' && b.hasBonus(u, 'a6') && b.debuffCount(t) >= 3) b.addBuff(t, { s: 'resDown', v: 0.03, turns: 2, name: 'Примечание', debuff: true });
      if (kind !== 'ult') return;
      const n = Math.min(5, b.debuffCount(t));
      if (b.eidOn(u, 1) && n) b.gainEnergy(u, 7 * n);
      if (b.eidOn(u, 4)) for (let i = 0; i < n && t.hp > 0; i++) b.hit(u, t, 0.2, { e: 'quant', kind: 'ult', label: 'Порт перенаправления' });
    }
  };

  const HELL_DMG = [0.12, 0.148, 0.176, 0.204, 0.232, 0.26, 0.295, 0.33, 0.365, 0.4, 0.428, 0.456];
  const inHell = u => u.buffs.some(x => x.name === 'Адский пейзаж');

  FX.blade = {
    start(b, u) {
      if (b.eidOn(u, 6)) u.flags.shuhuMax = 4;
      if (b.hasBonus(u, 'a2')) u.buffs.push({ s: 'healIn', v: 0.2, turns: 999, cond: 'hp50', name: 'Бесконечная жизнь' });
    },
    hellDmg(b, u) { return pickLv(HELL_DMG, abLv(b, u, 'skill')); },
    shuhuHp(b, u) { return b.eidOn(u, 6) ? 0.5 : 0; },
    dmg(b, u, tgt, o) { return o.label === 'Дар Шуху' && b.hasBonus(u, 'a6') ? 0.2 : 0; },
    crit(b, u) { return b.eidOn(u, 2) && inHell(u) ? 0.15 : 0; },
    hpLost(b, u, v) {
      if (!b.eidOn(u, 4) || (u.flags.e4 || 0) >= 2) return;
      const half = u.maxHp * 0.5;
      if (u.hp + v <= half || u.hp > half) return;
      u.flags.e4 = (u.flags.e4 || 0) + 1;
      const add = Math.round((u.flags.e4Base || (u.flags.e4Base = u.maxHp)) * 0.2);
      u.maxHp += add;
      b.push({ t: 'status', u, text: 'Макс. HP +20%' });
    },
    act(b, u, kind, R) {
      const t = R && R.main;
      if (kind === 'enhanced' && b.hasBonus(u, 'a4') && t && t.broken) b.heal(u, u, u.maxHp * 0.05 + 7 * H.grow(u.lvl));
      if (kind === 'ult' && b.eidOn(u, 1) && t && t.hp > 0 && u.flags.lastTally > 0) b.hit(u, t, 0, { e: 'wind', kind: 'ult', hpM: 1.5 * u.flags.lastTally / u.maxHp, label: 'Порезы в аду' });
    }
  };

  const SUPPORT_SKILL = [0.05, 0.0525, 0.055, 0.0575, 0.06, 0.0625, 0.0656, 0.0688, 0.0719, 0.075, 0.0775, 0.08];

  FX.lynx = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    hotTurns(b, u) { return b.hasBonus(u, 'a6') ? 1 : 0; },
    healBonus(b, u, tgt) { return b.eidOn(u, 1) && tgt.hp <= tgt.maxHp * 0.5 ? 0.2 : 0; },
    survivalUp(b, u) { return { k: pickLv(SUPPORT_SKILL, abLv(b, u, 'skill')) / 0.075, hp: b.eidOn(u, 6) ? 0.06 : 0 }; },
    survived(b, u, a) {
      if (b.eidOn(u, 2)) a.flags.debuffBlock = 1;
      if (b.eidOn(u, 4)) b.addBuff(a, { s: 'atkP', v: Math.round(0.03 * u.maxHp / a.base.atk * 1000) / 1000, turns: 1, name: 'Вечер у тёплого костра' }, true);
      if (b.eidOn(u, 6)) b.addBuff(a, { s: 'res', v: 0.3, turns: 2, name: 'Рассвет над чертежами' }, true);
    }
  };

  const LUKA_CAP = [1.3, 1.43, 1.56, 1.69, 1.82, 2.015, 2.275, 2.6, 2.99, 3.38, 3.549, 3.718];
  const LUKA_DET = [0.68, 0.697, 0.714, 0.731, 0.748, 0.765, 0.7863, 0.8075, 0.8287, 0.85, 0.867, 0.884];
  const LUKA_MARK = [0.12, 0.128, 0.136, 0.144, 0.152, 0.16, 0.17, 0.18, 0.19, 0.2, 0.208, 0.216];
  const bleeding = t => t.dots.find(d => d.type === 'bleed');

  FX.luka = {
    bleedCap(b, u) { return pickLv(LUKA_CAP, abLv(b, u, 'skill')); },
    lukaDet(b, u) { return pickLv(LUKA_DET, abLv(b, u, 'talent')); },
    markV(b, u) { return pickLv(LUKA_MARK, abLv(b, u, 'ult')); },
    fistK(b, u) { return dmgM(b, u, 'basic'); },
    willChanged(b, u) { if (b.eidOn(u, 4)) setBuff(u, 'Несмотря ни на что', 'atkP', Math.round(0.05 * Math.min(4, u.flags.will || 0) * 1000) / 1000); },
    uppercut(b, u, t, jabs, d) {
      if (!b.eidOn(u, 6)) return;
      for (let i = 0; i < jabs && t.hp > 0; i++) b.hit(d.src || u, t, 0, { fixed: d.dmg * (d.stacks || 1) * 0.08, e: 'phys', isDot: true, dot: true, label: 'Аплодисменты чемпиону' });
    },
    act(b, u, kind, R) {
      const t = R && R.main;
      if (!t) return;
      if (b.eidOn(u, 1) && bleeding(t)) b.addBuff(u, { s: 'dmgP', v: 0.15, turns: 2, name: 'Непрерывный бой' }, true);
      if (kind === 'skill' && b.eidOn(u, 2) && t.weak.includes('phys')) b.gainWill(u, 1);
    }
  };

  const SUSHANG_SPD = [0.15, 0.155, 0.16, 0.165, 0.17, 0.175, 0.1812, 0.1875, 0.1938, 0.2, 0.205, 0.21];
  const SMOOTH = 'Плавный клинок';

  FX.sushang = {
    start(b, u) {
      if (b.eidOn(u, 4)) u.buffs.push({ s: 'breakE', v: 0.4, turns: 999, name: 'Острый ум' });
      if (b.eidOn(u, 6)) FX.sushang.smooth(b, u);
    },
    smooth(b, u) {
      const v = pickLv(SUSHANG_SPD, abLv(b, u, 'talent'));
      const name = b.eidOn(u, 6) && u.buffs.some(x => x.name === SMOOTH && x.turns > 0) ? SMOOTH + ' 2' : SMOOTH;
      b.addBuff(u, { s: 'spdP', v, turns: 2, name });
      return true;
    },
    aggro(b, u) { return b.hasBonus(u, 'a2') && halfHp(u) ? 0.5 : 1; },
    stanceK(b, u) { return dmgM(b, u, 'skill') / 2 * (1 + (b.hasBonus(u, 'a4') ? 0.03 * Math.min(10, u.flags.stances || 0) : 0)); },
    stance(b, u) {
      u.flags.stances = (u.flags.stances || 0) + 1;
      if (b.eidOn(u, 2)) b.addBuff(u, { s: 'dr', v: 0.2, turns: 1, name: 'Закалённое тело' }, true);
    },
    act(b, u, kind, R) {
      if (kind !== 'skill' || !b.eidOn(u, 1) || !R || !R.main || !R.main.broken) return;
      b.sp = Math.min(H.TUNING.spMax, b.sp + 1);
      b.push({ t: 'status', u, text: '+1 очко навыка' });
    }
  };

  FX.xueyi = {
    start(b, u) { if (b.eidOn(u, 6)) u.flags.karmaMax = 6; },
    dmg(b, u, tgt, o) {
      if (o.karma && b.eidOn(u, 1)) return 0.4;
      return o.kind === 'ult' && b.hasBonus(u, 'a4') && tgt.maxTough && tgt.tough >= tgt.maxTough * 0.5 ? 0.1 : 0;
    },
    karmaAny(b, u) { return b.eidOn(u, 2); },
    karmaOver(b, u, over) { if (b.hasBonus(u, 'a6')) u.flags.karmaBank = Math.min(6, (u.flags.karmaBank || 0) + over); },
    karmaDone(b, u) {
      if (b.eidOn(u, 2) && u.hp > 0) b.heal(u, u, u.maxHp * 0.05);
      const bank = u.flags.karmaBank || 0;
      if (!bank) return;
      u.flags.karmaBank = 0;
      b.gainKarma(u, bank);
    },
    act(b, u, kind) { if (kind === 'ult' && b.eidOn(u, 4)) b.addBuff(u, { s: 'breakE', v: 0.4, turns: 2, name: 'Карма, действие' }, true); }
  };

  const SKILL_CURVE = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8125, 0.875, 0.9375, 1, 1.05, 1.1];
  const TY_CAP = [0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.2125, 0.225, 0.2375, 0.25, 0.26, 0.27];
  const TY_OMEN = [0.2, 0.23, 0.26, 0.29, 0.32, 0.35, 0.3875, 0.425, 0.4625, 0.5, 0.53, 0.56];
  const blessed = (u, a) => u.flags.bene === a && a.buffs.some(x => x.name === 'Благословение');

  FX.tingyun = {
    bene(b, u) {
      const k = abLv(b, u, 'skill'), r = pickLv(SKILL_CURVE, k);
      return { atk: 0.5 * r, cap: pickLv(TY_CAP, k), hit: 0.4 * r + (b.eidOn(u, 4) ? 0.2 : 0) };
    },
    omen(b, u) { return { dmg: pickLv(TY_OMEN, abLv(b, u, 'ult')), energy: b.eidOn(u, 6) ? 10 : 0 }; },
    dmg(b, u, tgt, o) { return o.kind === 'basic' && b.hasBonus(u, 'a4') ? 0.4 : 0; },
    allyAfter(b, u, who, kind) { if (kind === 'ult' && b.eidOn(u, 1) && blessed(u, who)) b.addBuff(who, { s: 'spdP', v: 0.2, turns: 1, name: 'Весенний ветер' }); },
    allyKill(b, u, who) {
      if (!b.eidOn(u, 2) || !blessed(u, who) || u.flags.e2 === b.actSerial) return;
      u.flags.e2 = b.actSerial;
      b.gainEnergy(who, 5);
    },
    act(b, u, kind) { if (kind === 'skill' && b.hasBonus(u, 'a2')) b.addBuff(u, { s: 'spdP', v: 0.2, turns: 1, name: 'Поддержание хорошего настроения' }); }
  };

  const HANYA_SPD = [0.15, 0.155, 0.16, 0.165, 0.17, 0.175, 0.1812, 0.1875, 0.1938, 0.2, 0.205, 0.21];
  const hanyaKill = (b, u, who, tgt) => {
    if (b.hasBonus(u, 'a4') && tgt.buffs.some(x => x.name === 'Ноша') && (tgt.flags.burdenTrig || 0) <= 1) {
      b.sp = Math.min(H.TUNING.spMax, b.sp + 1);
      b.push({ t: 'status', u, text: 'Преисподняя: очко навыка +1' });
    }
    if (who && b.eidOn(u, 1) && who.buffs.some(x => x.name === 'Указ') && u.flags.e1 !== b.actSerial) {
      u.flags.e1 = b.actSerial;
      b.advance(u, 0.15);
    }
  };

  FX.hanya = {
    edict(b, u) {
      const lv = abLv(b, u, 'ult');
      return { atk: 0.6 * pickLv([0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.85, 0.9, 0.95, 1, 1.04, 1.08], lv), spd: pickLv(HANYA_SPD, lv), turns: b.eidOn(u, 4) ? 1 : 0 };
    },
    sanction(b, u) { return Math.round((0.3 * b.traceTalent(u) + (b.eidOn(u, 6) ? 0.1 : 0)) * 1000) / 1000; },
    kill(b, u, tgt) { hanyaKill(b, u, u, tgt); },
    allyKill(b, u, who, tgt) { hanyaKill(b, u, who, tgt); },
    act(b, u, kind) { if (kind === 'skill' && b.eidOn(u, 2)) b.addBuff(u, { s: 'spdP', v: 0.2, turns: 1, name: 'Два взгляда' }); }
  };

  const sp1 = (b, u, text) => { b.sp = Math.min(H.TUNING.spMax, b.sp + 1); b.push({ t: 'status', u, text }); };

  FX.qingque = {
    tileDmg(b, u) { return Math.round((0.28 * pickLv(SKILL_CURVE, abLv(b, u, 'skill')) + (b.hasBonus(u, 'a4') ? 0.1 : 0)) * 1000) / 1000; },
    drew(b, u, n) { if (b.eidOn(u, 2)) b.gainEnergy(u, n); },
    dmg(b, u, tgt, o) { return o.kind === 'ult' && b.eidOn(u, 1) ? 0.1 : 0; },
    allyTurn(b, u, who) { if (who === u) u.flags.autarky = false; },
    act(b, u, kind, R) {
      if (kind === 'skill') {
        if (b.hasBonus(u, 'a2') && !u.flags.a2used) { u.flags.a2used = true; sp1(b, u, '+1 очко навыка'); }
        if (b.eidOn(u, 4) && b.rng() < 0.24) { u.flags.autarky = true; b.push({ t: 'status', u, text: 'Независимость' }); }
        return;
      }
      if (kind !== 'basic' && kind !== 'enhanced') return;
      if (kind === 'enhanced') {
        if (b.hasBonus(u, 'a6')) b.addBuff(u, { s: 'spdP', v: 0.1, turns: 1, name: 'Кража конга' });
        if (b.eidOn(u, 6)) sp1(b, u, '+1 очко навыка');
      }
      if (!u.flags.autarky || !R || !R.main) return;
      u.flags.autarky = false;
      const ab = b.traceAb(u, kind === 'enhanced' ? u.kit.enhanced : u.kit.basic, kind), f = ab.fx.find(x => x.k === 'dmg');
      b.push({ t: 'act', u, name: 'Независимость', kind: 'follow' });
      if (R.main.hp > 0) b.hit(u, R.main, f.m, { e: 'quant', kind: 'follow', label: 'Независимость' });
      if (kind === 'enhanced' && f.adj) for (const a of R.adj || []) if (a.hp > 0) b.hit(u, a, f.adj, { e: 'quant', kind: 'follow', label: 'Независимость' });
    }
  };

  const YK_CR = [0.21, 0.217, 0.224, 0.231, 0.238, 0.245, 0.2537, 0.2625, 0.2712, 0.28, 0.287, 0.294];
  const YK_CD = [0.39, 0.416, 0.442, 0.468, 0.494, 0.52, 0.5525, 0.585, 0.6175, 0.65, 0.676, 0.702];
  const ykFull = (b, u) => {
    if (!b.eidOn(u, 2)) return;
    const seen = u.flags.e2seen || (u.flags.e2seen = []);
    for (const a of b.livingAllies) if (a.energy >= a.maxEnergy && !seen.includes(a.key)) { seen.push(a.key); b.gainEnergy(u, 5); }
  };

  FX.yukong = {
    start(b, u) { if (b.eidOn(u, 1)) for (const a of b.livingAllies) b.addBuff(a, { s: 'spdP', v: 0.1, turns: 2, name: 'Воздушный маршал' }, true); },
    down(b) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== 'Лук наследия'); },
    bowAtk(b, u) { return 0.8 * pickLv(SKILL_CURVE, abLv(b, u, 'skill')); },
    kestrel(b, u) { const lv = abLv(b, u, 'ult'); return { cr: pickLv(YK_CR, lv), cd: pickLv(YK_CD, lv) }; },
    blockDebuff(b, u) {
      if (!b.hasBonus(u, 'a2') || u.flags.blockCd > 0) return false;
      u.flags.blockCd = 2;
      return true;
    },
    allyTurn(b, u, who) { if (who === u && u.flags.blockCd > 0) u.flags.blockCd--; },
    dmg(b, u) { return b.eidOn(u, 4) && u.flags.bow > 0 ? 0.3 : 0; },
    allyAfter(b, u) { ykFull(b, u); },
    act(b, u, kind, R) {
      ykFull(b, u);
      if (kind === 'ult') {
        u.flags.e2seen = [];
        if (b.eidOn(u, 6)) b.setBow(u, Math.min(2, (u.flags.bow || 0) + 1));
      }
      if (kind === 'basic' && !(u.flags.arrowCd > 0) && R && R.main && R.main.hp > 0) b.hit(u, R.main, H.TUNING.arrowExtra * b.traceTalent(u), { e: 'imag', kind: 'basic', label: 'Семь слоёв' });
    }
  };

  const GN_KISS = [0.04, 0.043, 0.046, 0.049, 0.052, 0.055, 0.0587, 0.0625, 0.0663, 0.07, 0.073, 0.076];
  const GN_BURST = [0.72, 0.74, 0.76, 0.78, 0.8, 0.82, 0.845, 0.87, 0.895, 0.92, 0.94, 0.96];

  FX.guinaifen = {
    kiss(b, u) { return { v: pickLv(GN_KISS, abLv(b, u, 'talent')), max: b.eidOn(u, 6) ? 1 : 0 }; },
    burstV(b, u) { return pickLv(GN_BURST, abLv(b, u, 'ult')); },
    dotTick(b, u, t, d) { if (d.type === 'burn' && b.eidOn(u, 4)) b.gainEnergy(u, 2); },
    act(b, u, kind, R) {
      if ((kind !== 'basic' && kind !== 'skill') || !R || !R.main) return;
      const list = kind === 'skill' ? [R.main, ...(R.adj || [])] : [R.main];
      for (const t of list) {
        if (!(t.hp > 0)) continue;
        if (kind === 'skill' && b.eidOn(u, 1)) {
          if (b.rng.chance(b.effectChance(u, t, 1))) b.addBuff(t, { s: 'res', v: -0.1, turns: 2, name: 'Поедание лапши', debuff: true });
          else b.resisted(u);
        }
        const d = b.eidOn(u, 2) && t.dots.find(x => x.type === 'burn' && x.src === u);
        if (d && !d.e2) { d.dmg += atkOf(u) * 0.4; d.e2 = true; }
      }
    }
  };

  const WEAK_JY = 'Слабость перед генералом';

  FX.jingyuan = {
    lordAdj(b, u) { return b.eidOn(u, 1) ? 0.25 : 0; },
    lordHit(b, u, t) {
      if (b.eidOn(u, 4)) b.gainEnergy(u, 2);
      if (!b.eidOn(u, 6)) return;
      const cur = t.buffs.find(x => x.name === WEAK_JY);
      if (cur) cur.v = Math.min(0.36, Math.round((cur.v + 0.12) * 1000) / 1000);
      else t.buffs.push({ s: 'vuln', v: 0.12, turns: 99, name: WEAK_JY, debuff: true });
    },
    lordDone(b, u) {
      for (const e of b.enemies) e.buffs = e.buffs.filter(x => x.name !== WEAK_JY);
      if (b.eidOn(u, 2)) b.addBuff(u, { s: 'phalanx', v: 0, turns: 2, name: 'Фаланга заслоняет солнце' }, true);
    },
    dmg(b, u, tgt, o) { return ['basic', 'skill', 'ult'].includes(o.kind) && u.buffs.some(x => x.s === 'phalanx') ? 0.2 : 0; }
  };

  const SUPPORT_RATIO = [0.6667, 0.7083, 0.75, 0.7917, 0.8333, 0.8667, 0.9, 0.9333, 0.9667, 1, 1.0333, 1.0667];

  FX.luocha = {
    ccRes(b, u) { return b.hasBonus(u, 'a6') ? 0.7 : 0; },
    zoneK(b, u) { return pickLv(SUPPORT_RATIO, abLv(b, u, 'talent')); },
    prayer(b, u, a) {
      const out = { k: pickLv(SUPPORT_RATIO, abLv(b, u, 'skill')) };
      if (!b.eidOn(u, 2)) return out;
      if (a.hp < a.maxHp * 0.5) out.heal = 0.3;
      else out.shield = atkOf(u) * 0.18 + 17 * H.grow(u.lvl);
      return out;
    },
    zoneOpen(b, u) {
      const turns = H.TUNING.lcZoneTurns;
      if (b.eidOn(u, 1)) for (const a of b.livingAllies) b.addBuff(a, { s: 'atkP', v: 0.2, turns, name: 'Омовение живых' }, true);
      if (b.eidOn(u, 4)) for (const e of b.living) b.addBuff(e, { s: 'dmgDealtDown', v: 0.12, turns, name: 'Тяжесть короны', debuff: true }, true);
    },
    down(b) {
      for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== 'Омовение живых');
      for (const e of b.enemies) e.buffs = e.buffs.filter(x => x.name !== 'Тяжесть короны');
    },
    act(b, u, kind) { if (kind === 'ult' && b.eidOn(u, 6)) for (const e of b.living) b.addBuff(e, { s: 'resDown', v: 0.2, turns: 2, name: 'Прах к праху', debuff: true }); }
  };

  FX.imbibitor = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    ilK(b, u) {
      return {
        right: Math.round(0.1 * b.traceTalent(u) * 10000) / 10000,
        roar: Math.round(0.12 * pickLv(SKILL_CURVE, abLv(b, u, 'skill')) * 10000) / 10000,
        rightMax: b.eidOn(u, 1) ? 10 : 6,
        rightStep: b.eidOn(u, 1) ? 2 : 1,
        leapPen: 0.2 * Math.min(3, u.flags.e6 || 0)
      };
    },
    keepRoar(b, u) { return b.eidOn(u, 4) && !u.flags.roarKept; },
    allyAfter(b, u, who, kind) { if (kind === 'ult' && b.eidOn(u, 6)) u.flags.e6 = Math.min(3, (u.flags.e6 || 0) + 1); },
    act(b, u, kind) {
      if (kind !== 'ult' || !b.eidOn(u, 2)) return;
      u.av = 0;
      b.addScales(u, 1);
      b.push({ t: 'status', u, text: 'Ход сразу' });
    }
  };

  const FX_LUCK = [0.1, 0.108, 0.116, 0.124, 0.132, 0.14, 0.15, 0.16, 0.17, 0.18, 0.188, 0.196];
  const FX_HEAL = [0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.8625, 0.875, 0.8875, 0.9, 0.91, 0.92];

  FX.fuxuan = {
    start(b, u) { if (b.eidOn(u, 1)) for (const a of b.allies) a.buffs.push({ s: 'critD', v: 0.3, turns: 999, cond: 'know', name: 'Власть над жизнью и смертью', perm: true }); },
    luck(b, u) { return pickLv(FX_LUCK, abLv(b, u, 'talent')); },
    fxHealK(b, u) { return pickLv(FX_HEAL, abLv(b, u, 'talent')); },
    knowK(b, u) { return pickLv(SKILL_CURVE, abLv(b, u, 'skill')); },
    matrixUp(b, u) { u.flags.a6used = false; },
    ccBlock(b, u) {
      if (!b.hasBonus(u, 'a6') || !b.matrixOn(u)) return false;
      if (u.flags.a6act === b.actN) return true;
      if (u.flags.a6used) return false;
      u.flags.a6used = true;
      u.flags.a6act = b.actN;
      b.push({ t: 'status', u, text: 'Гексаграмма воды' });
      return true;
    },
    allySurvive(b, u, tgt) {
      if (!b.eidOn(u, 2) || !b.matrixOn(u)) return false;
      if (u.flags.e2used && u.flags.e2act !== b.actN) return false;
      u.flags.e2used = true;
      u.flags.e2act = b.actN;
      tgt.hp = Math.round(tgt.maxHp * 0.7);
      b.push({ t: 'revive', u: tgt, hp: tgt.hp, text: 'Зловещее предзнаменование' });
      return true;
    },
    teamAttacked(b, u, list) { if (b.eidOn(u, 4) && b.matrixOn(u) && list.some(a => a.buffs.some(x => x.name === 'Знание'))) b.gainEnergy(u, 5); },
    teamHpLost(b, u, tgt, v) { if (b.eidOn(u, 6) && b.matrixOn(u)) u.flags.e6tally = Math.min(u.maxHp * 1.2, (u.flags.e6tally || 0) + v); },
    act(b, u, kind) {
      if (kind !== 'ult' || !b.eidOn(u, 6) || !(u.flags.e6tally > 0)) return;
      const hpM = 2 * u.flags.e6tally / u.maxHp;
      u.flags.e6tally = 0;
      for (const e of b.living) b.hit(u, e, 0, { e: 'quant', kind: 'ult', hpM, label: 'Зерно истины' });
    }
  };

  const JL_CRIT = [0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.4625, 0.475, 0.4875, 0.5, 0.51, 0.52];

  FX.jingliu = {
    transK(b, u) { return { crit: pickLv(JL_CRIT, abLv(b, u, 'talent')), cap: 1.8 * b.traceTalent(u) }; },
    transIn(b, u) {
      if (b.hasBonus(u, 'a2')) u.buffs.push({ s: 'res', v: 0.35, turns: 999, name: 'Адское место', perm: true });
      if (!b.eidOn(u, 6)) return;
      u.buffs.push({ s: 'critD', v: 0.5, turns: 999, name: 'Затмение превращается в пустоту', perm: true });
      u.flags.syzMax = 4;
      u.flags.syz = Math.min(4, (u.flags.syz || 0) + 1);
    },
    transOut(b, u) {
      u.buffs = u.buffs.filter(x => x.name !== 'Адское место' && x.name !== 'Затмение превращается в пустоту');
      u.flags.syzMax = 0;
    },
    drainExtra(b, u, got) { return b.eidOn(u, 4) ? Math.min(0.3, 0.9 * got / Math.max(1, u.base.atk)) : 0; },
    dmg(b, u, tgt, o) { return o.kind === 'skill' && u.flags.trans && u.flags.e2 ? 0.8 : 0; },
    act(b, u, kind, R) {
      const moon = kind === 'skill' && u.flags.trans;
      if (moon) u.flags.e2 = false;
      if (kind === 'ult' && b.eidOn(u, 2)) u.flags.e2 = true;
      if ((kind !== 'ult' && !moon) || !b.eidOn(u, 1)) return;
      b.addBuff(u, { s: 'critD', v: 0.24, turns: 1, name: 'Лунная атака ворот Тяньгуань' }, true);
      if (R && R.main && R.main.hp > 0 && !(R.adj || []).some(a => a.hp > 0)) b.hit(u, R.main, 1, { e: 'ice', kind, label: 'Ворота Тяньгуань' });
    }
  };

  const TZ_SKILL = [0.75, 0.825, 0.9, 0.975, 1.05, 1.125, 1.2188, 1.3125, 1.4062, 1.5, 1.575, 1.65];
  const TZ_DEBT = [0.25, 0.275, 0.3, 0.325, 0.35, 0.375, 0.4062, 0.4375, 0.4688, 0.5, 0.525, 0.55];
  const TZ_WCRIT = [0.125, 0.1375, 0.15, 0.1625, 0.175, 0.1875, 0.2031, 0.2188, 0.2344, 0.25, 0.2625, 0.275];

  FX.topaz = {
    numbyK(b, u) {
      const sk = abLv(b, u, 'skill'), ul = abLv(b, u, 'ult');
      return { skill: pickLv(TZ_SKILL, sk), debt: pickLv(TZ_DEBT, sk), talent: pickLv(TZ_SKILL, abLv(b, u, 'talent')), wind: pickLv(TZ_SKILL, ul), windCrit: pickLv(TZ_WCRIT, ul), pen: b.eidOn(u, 6) ? 0.1 : 0 };
    },
    windHits(b, u) { return b.eidOn(u, 6) ? 1 : 0; },
    numbyTurn(b, u) { if (b.eidOn(u, 4)) b.advance(u, 0.2); },
    numbyDone(b, u) { if (b.eidOn(u, 2)) b.gainEnergy(u, 5); },
    teamHit(b, u, src, tgt, o) {
      if (!b.eidOn(u, 1) || o.kind !== 'follow' || !(tgt.hp > 0) || !tgt.buffs.some(x => x.s === 'debt')) return;
      const key = b.actSerial + ':' + tgt.idx;
      if (tgt.flags.execKey === key) return;
      tgt.flags.execKey = key;
      const cur = tgt.buffs.find(x => x.s === 'execCrit');
      if (cur) cur.v = Math.min(0.5, cur.v + 0.25);
      else tgt.buffs.push({ s: 'execCrit', v: 0.25, turns: 999, name: 'Привести в исполнение', debuff: true });
    }
  };

  const HH_ENERGY = [0.15, 0.155, 0.16, 0.165, 0.17, 0.175, 0.1812, 0.1875, 0.1938, 0.2, 0.205, 0.21];
  const HH_SPD = 'Одержимость хелиоби';

  FX.huohuo = {
    ccRes(b, u) { return b.hasBonus(u, 'a4') ? 0.35 : 0; },
    hhK(b, u) {
      const ul = abLv(b, u, 'ult');
      return { skill: pickLv(SUPPORT_RATIO, abLv(b, u, 'skill')), talent: pickLv(SUPPORT_RATIO, abLv(b, u, 'talent')), energy: pickLv(HH_ENERGY, ul), atk: 0.4 * pickLv([0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.85, 0.9, 0.95, 1, 1.04, 1.08], ul), turns: b.eidOn(u, 1) ? 1 : 0 };
    },
    provChanged(b, u) {
      if (!b.eidOn(u, 1)) return;
      const on = u.flags.prov > 0 && u.hp > 0;
      for (const a of b.allies) setBuff(a, HH_SPD, 'spdP', on ? 0.12 : 0);
    },
    down(b, u) { for (const a of b.allies) a.buffs = a.buffs.filter(x => x.name !== HH_SPD); },
    allySurvive(b, u, tgt) {
      if (!b.eidOn(u, 2) || !(u.flags.prov > 0) || (u.flags.e2n || 0) >= 2) return false;
      u.flags.e2n = (u.flags.e2n || 0) + 1;
      tgt.hp = Math.round(tgt.maxHp * 0.5);
      u.flags.prov--;
      FX.huohuo.provChanged(b, u);
      b.push({ t: 'revive', u: tgt, hp: tgt.hp, text: 'Дух в хвосте' });
      return true;
    },
    healBonus(b, u, tgt) { return b.eidOn(u, 4) ? Math.round(0.8 * Math.max(0, 1 - tgt.hp / tgt.maxHp) * 1000) / 1000 : 0; },
    healed(b, u, tgt) { if (b.eidOn(u, 6)) b.addBuff(tgt, { s: 'dmgP', v: 0.5, turns: 2, name: 'Единая цель, общая судьба' }, true); }
  };

  const AG_APO = [0.01, 0.0115, 0.013, 0.0145, 0.016, 0.0175, 0.0194, 0.0213, 0.0231, 0.025, 0.0265, 0.028];
  const ULT_CURVE = [0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.85, 0.9, 0.95, 1, 1.04, 1.08];

  FX.argenti = {
    apoK(b, u) { return { per: pickLv(AG_APO, abLv(b, u, 'talent')), max: b.eidOn(u, 4) ? 12 : 10 }; },
    apoStart(b, u) { if (b.eidOn(u, 4)) b.addApo(u, 2); },
    apoChanged(b, u) { if (b.eidOn(u, 1)) setBuff(u, 'Изъян в царстве эстетики', 'critD', Math.round(0.04 * (u.flags.apo || 0) * 1000) / 1000); },
    bounceK(b, u) { return pickLv(ULT_CURVE, abLv(b, u, 'ult')); },
    ultDefIgnore(b, u, kind) { return kind === 'ult' && b.eidOn(u, 6) ? 0.3 : 0; },
    act(b, u, kind) { if (kind === 'ult' && b.eidOn(u, 2) && b.living.length >= 3) b.addBuff(u, { s: 'atkP', v: 0.4, turns: 1, name: 'Смирение агата' }); }
  };

  const COGITO_LABEL = 'Я мыслю - я существую';

  FX.ratio = {
    raStart(b, u) {
      if (!b.eidOn(u, 1) || !b.hasBonus(u, 'a2')) return;
      u.buffs.push({ s: 'critR', v: 0.1, turns: 1, name: 'Обобщение' });
      u.buffs.push({ s: 'critD', v: 0.2, turns: 1, name: 'Обобщение: крит. урон' });
    },
    sumMax(b, u) { return b.eidOn(u, 1) ? 4 : 0; },
    follyN(b, u) { return b.eidOn(u, 6) ? 1 : 0; },
    dmg(b, u, tgt, o) { return o.label === COGITO_LABEL && b.eidOn(u, 6) ? 0.5 : 0; },
    cogitoHit(b, u, t) {
      if (b.eidOn(u, 4)) b.gainEnergy(u, 15);
      if (!b.eidOn(u, 2)) return;
      const n = Math.min(4, b.debuffCount(t));
      for (let i = 0; i < n && t.hp > 0; i++) b.hit(u, t, 0.2, { e: 'imag', kind: 'follow', label: 'Божественное в деталях' });
    }
  };

  FX.miyabi = {
    start(b, u) {
      if (!b.eidOn(u, 2)) return;
      b.gainFrost(u, 6);
      u.buffs.push({ s: 'critR', v: 0.15, turns: 999, name: 'Техника дыхания', perm: true });
    },
    chaos(b, u) { if (b.hasBonus(u, 'a4')) u.flags.clearIce = true; },
    atkResPen(b, u, kind) { return kind === 'enhanced' && u.flags.clearIce ? 0.3 : 0; },
    ultDefIgnore(b, u, kind) { return kind === 'enhanced' && b.eidOn(u, 1) ? 0.06 * Math.min(6, 2 * (u.flags.shimoLv || 0)) : 0; },
    icefireN(b, u) { return b.hasBonus(u, 'a6') && H.battleStat.sv(u, 'critR') >= 0.5 ? 2 : 1; },
    burstUp(b, u) { return b.eidOn(u, 4) ? 0.3 : 0; },
    frostburn(b, u) { if (b.eidOn(u, 4)) b.gainEnergy(u, 10); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.kind === 'basic' && b.eidOn(u, 2)) v += 0.3;
      if (o.charged && b.eidOn(u, 6)) v += 0.3;
      return v;
    },
    act(b, u, kind, R) {
      if (kind === 'basic' && b.eidOn(u, 2)) b.gainFrost(u, 1);
      if (kind !== 'enhanced') return;
      u.flags.clearIce = false;
      const t = R && R.main;
      if (b.eidOn(u, 1) && u.flags.shimoLv === 3 && t && t.frostbite) {
        delete t.frostbite;
        t.buffs = t.buffs.filter(x => x.name !== 'Ледяной ожог');
        for (const a of b.livingAllies) b.addBuff(a, { s: 'breakEff', v: 0.2, turns: 2, name: 'Иней на снегу' }, true);
      }
      if (!b.eidOn(u, 6) || u.flags.polar || (u.flags.frost || 0) < 2 || !b.living.length) return;
      u.flags.polar = true;
      u.flags.frost -= 2;
      b.push({ t: 'frost', u, v: u.flags.frost, add: -2 });
      const ab = b.traceAb(u, u.kit.charged[0], 'enhanced'), f = ab.fx.find(x => x.k === 'dmg');
      const tgt = t && t.hp > 0 ? t : b.rng.pick(b.living);
      b.push({ t: 'act', u, name: 'Невероятный талант', kind: 'follow' });
      b.hit(u, tgt, f.m, { e: 'ice', kind: 'enhanced', charged: true, tough: f.tough, label: 'Симоцуки' });
      u.flags.polar = false;
    }
  };

  const CLARITY = 'Ясность';
  const clarity = (b, u, n) => {
    u.flags.clarity = Math.max(0, Math.min(3, n));
    setBuff(u, CLARITY, 'chaosP', u.flags.clarity > 0 ? 0.25 : 0);
  };
  const expose = (b, t) => { if (t.hp > 0) b.addBuff(t, { s: 'defDown', v: 0.16, turns: 2, name: 'Мастер шахмат', debuff: true }, true); };

  FX.yanagi = {
    eclipseV(b, u) { return Math.round(0.4 * b.traceTalent(u) * 1000) / 1000; },
    stanced(b, u) {
      if (b.hasBonus(u, 'a6')) b.gainEnergy(u, 5);
      if (b.hasBonus(u, 'a2') && b.allies.some(a => a !== u && (a.path === 'nihility' || a.elem === 'elec'))) u.flags.gessou = true;
    },
    shinraUp(b, u) { return b.eidOn(u, 6) ? 1 : 0; },
    polarityUp(b, u, kind) { return kind === 'skill' && b.eidOn(u, 2) ? 0.5 : 0; },
    teamAnomaly(b, u) { if (b.eidOn(u, 1)) clarity(b, u, (u.flags.clarity || 0) + 1); },
    guard(b, u) {
      if (!(u.flags.clarity > 0)) return false;
      clarity(b, u, u.flags.clarity - 1);
      b.push({ t: 'status', u, text: CLARITY });
      return true;
    },
    dotTick(b, u, t) { if (b.eidOn(u, 4)) expose(b, t); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (b.hasBonus(u, 'a4') && tgt.buffs.some(x => x.s === 'moonlit' && x.src === u)) v += 0.2;
      if (o.kind === 'skill' && b.eidOn(u, 6) && u.flags.shinra > 0) v += 0.2;
      return v;
    },
    act(b, u, kind, R) {
      if (b.eidOn(u, 6)) setBuff(u, 'Нечеловеческая кровь', 'atkP', u.flags.shinra > 0 ? 0.15 : 0);
      const hits = R ? [R.main, ...(R.adj || [])].filter(t => t && t.hp > 0) : [];
      if (kind === 'skill' && b.hasBonus(u, 'a4')) for (const t of hits) b.addBuff(t, { s: 'moonlit', v: 0, turns: 2, name: 'Лунный свет', debuff: true, src: u }, true);
      if ((kind === 'skill' || kind === 'ult') && b.eidOn(u, 4)) for (const t of b.living) if (b.anomalies(t).length) expose(b, t);
      if ((kind === 'basic' || kind === 'enhanced') && u.flags.gessou && R && R.main && R.main.hp > 0) {
        u.flags.gessou = false;
        const dot = u.kit.skill.fx.find(x => x.k === 'dot');
        if (b.rng.chance(b.effectChance(u, R.main, 1))) b.addDot(u, R.main, 'shock', atkOf(u) * (dot ? dot.m : 0.6), 2);
        else b.resisted(u);
      }
    }
  };

  FX.billy = {
    starGain(b, u) { if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 5); },
    steadyHold(b, u) { return b.eidOn(u, 2); },
    knocked(b, u) { if (b.eidOn(u, 6)) { u.flags.hero = 0; u.flags.heroHits = 0; setBuff(u, 'Звёздный герой', 'dmgP', 0); } },
    allyTurn(b, u, who) { if (who === u) u.flags.e1turn = false; },
    hit(b, u, tgt) {
      if (!b.eidOn(u, 6) || tgt.side !== 'enemy') return;
      u.flags.heroHits = (u.flags.heroHits || 0) + 1;
      if (u.flags.heroHits < 10) return;
      u.flags.heroHits = 0;
      u.flags.hero = Math.min(5, (u.flags.hero || 0) + 1);
      setBuff(u, 'Звёздный герой', 'dmgP', Math.round(0.06 * u.flags.hero * 1000) / 1000);
    },
    crit(b, u, tgt, o) { return o && o.kind === 'skill' && b.eidOn(u, 4) ? 0.32 : 0; },
    dmg(b, u, tgt, o) { return o.kind === 'basic' && b.eidOn(u, 2) ? 0.25 : 0; },
    act(b, u, kind) {
      if (kind !== 'basic') return;
      if (b.hasBonus(u, 'a6') && (u.flags.steady || 0) >= 2) b.gainEnergy(u, 3);
      if (b.eidOn(u, 1) && !u.flags.e1turn) { u.flags.e1turn = true; b.gainEnergy(u, 3); }
    }
  };

  FX.nicole = {
    fieldK(b, u) {
      return {
        def: Math.round((0.2 * b.traceTalent(u) + (b.eidOn(u, 4) ? 0.08 : 0)) * 1000) / 1000,
        quant: b.hasBonus(u, 'a2') ? H.TUNING.fieldQuant : 0
      };
    },
    fieldTurns(b, u, kind) { return (kind === 'skill' && b.eidOn(u, 1)) || (kind === 'ult' && b.eidOn(u, 4)) ? 1 : 0; },
    caseExtra(b, u) { return b.hasBonus(u, 'a4') ? 1 : 0; },
    caseFired(b, u) {
      if (b.hasBonus(u, 'a6')) b.gainEnergy(u, 4);
      if (b.eidOn(u, 2) && !u.flags.e2turn) { u.flags.e2turn = true; b.gainEnergy(u, 5); }
    },
    allyTurn(b, u, who) { if (who === u) u.flags.e2turn = false; },
    dmg(b, u, tgt, o) { return o.kind === 'skill' && b.eidOn(u, 1) ? 0.16 : 0; },
    hit(b, u, tgt) {
      if (!b.eidOn(u, 6) || tgt.side !== 'enemy' || !b.fieldOn() || b.field.src !== u) return;
      const cur = tgt.buffs.find(x => x.name === 'Разлагающее поле');
      if (cur) { cur.v = Math.min(0.15, Math.round((cur.v + 0.015) * 1000) / 1000); cur.turns = 2; }
      else b.addBuff(tgt, { s: 'critTaken', v: 0.015, turns: 2, name: 'Разлагающее поле', debuff: true }, true);
    }
  };

  const anbyFeed = (b, u) => { for (const a of b.livingAllies) if (a !== u && a.elem === 'elec') b.gainEnergy(a, 5); };

  FX.anby = {
    voltUp(b, u) { return b.eidOn(u, 2) ? 0.1 : 0; },
    break(b, u) { if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 5); },
    chained(b, u, p) { if (p === u && b.eidOn(u, 4)) anbyFeed(b, u); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.kind === 'enhanced' && tgt.broken && b.eidOn(u, 2)) v += 0.3;
      if ((o.kind === 'basic' || o.kind === 'enhanced') && b.eidOn(u, 6) && u.flags.zaryad > 0) v += 0.45;
      return v;
    },
    act(b, u, kind, R) {
      if (kind === 'skill' && b.eidOn(u, 6)) u.flags.zaryad = 8;
      if ((kind === 'basic' || kind === 'enhanced') && u.flags.zaryad > 0) u.flags.zaryad--;
      if (kind === 'ult' && b.eidOn(u, 4)) anbyFeed(b, u);
      if (kind !== 'enhanced') return;
      if (b.eidOn(u, 1)) b.addBuff(u, { s: 'err', v: 0.12, turns: 2, name: 'Режим быстрой зарядки' }, true);
      const t = R && R.main;
      if (!b.hasBonus(u, 'a6') || !t || !(t.hp > 0)) return;
      if (b.rng.chance(b.effectChance(u, t, 1))) b.addDot(u, t, 'shock', atkOf(u) * 0.6, 2);
      else b.resisted(u);
    }
  };

  FX.phrolova = {
    wuwaStart(b, u) {
      if (!b.eidOn(u, 1)) return;
      while ((u.flags.notes || []).length < 2) { u.flags.notes = u.flags.notes || []; u.flags.notes.push('cad'); }
      b.push({ t: 'notes', u, notes: u.flags.notes.slice() });
    },
    curtainUp(b, u) { return b.hasBonus(u, 'a4') ? 0.3 : 0; },
    outroUp(b, u) { return b.hasBonus(u, 'a6') ? 0.15 : 0; },
    maestroIn(b, u) {
      if (b.eidOn(u, 2)) b.gainAfter(u, 14);
      if (b.eidOn(u, 4) && u.flags.maestro) u.flags.maestro.left = u.flags.maestro.left.map(() => 'cad');
    },
    noteHit(b, u, t, note) { if (note === 'cad' && b.eidOn(u, 4)) b.addBuff(t, { s: 'atkP', v: -0.2, turns: 2, name: 'Кинжал, отсекающий одержимость', debuff: true }, true); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if ((o.kind === 'skill' || o.kind === 'enhanced') && b.eidOn(u, 1)) v += 0.8;
      if (o.kind === 'ult' && b.eidOn(u, 2)) v += 0.75;
      if (o.side === 'hecate' && o.label !== 'Финальный поклон' && b.eidOn(u, 6)) v += 0.24;
      return v;
    },
    act(b, u, kind, R) {
      if ((kind !== 'skill' && kind !== 'enhanced') || !b.eidOn(u, 6) || !R || !R.main || !(R.main.hp > 0)) return;
      b.hit(u, R.main, 1.2, { e: 'quant', kind: 'follow', side: 'hecate', label: 'Видение Гекаты' });
      b.gainAfter(u, 8);
    }
  };

  FX.scar = {
    start(b, u) { if (b.hasBonus(u, 'a4')) u.buffs.push({ s: 'atkP', v: 0.2, turns: 999, cond: 'nightmare', name: 'Разгон' }); },
    emberUp(b, u) { return b.hasBonus(u, 'a2') ? 1 : 0; },
    costDown(b, u) { return b.hasBonus(u, 'a6') ? 0.5 : 0; },
    nightmareHealUp(b, u) { return b.hasBonus(u, 'a6') ? 0.04 : 0; },
    elysNew(b, u, t) { if (b.eidOn(u, 1)) t.elys.embers = Math.max(t.elys.embers, 2); },
    burstDef(b, u) { return b.eidOn(u, 2) ? 0.2 : 0; },
    nightmareUp(b, u) { return b.eidOn(u, 4) ? 1 : 0; },
    burstAdj(b, u) { return b.eidOn(u, 6) ? 1 : 0; },
    dmg(b, u, tgt, o) { return o.label === 'Разрыв Элизиума' && b.eidOn(u, 6) ? 0.3 : 0; }
  };

  FX.kazuma = {
    start(b, u) { if (b.hasBonus(u, 'a2')) b.setLuck(u, Math.min(H.TUNING.luckMax, (u.flags.luck || 0) + 1)); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.kind === 'basic' && b.hasBonus(u, 'a4') && (tgt.flags.bound > 0 || tgt.buffs.some(x => x.name === 'Без оружия'))) v += 0.3;
      if (o.kind === 'ult' && b.eidOn(u, 6) && (u.flags.luck || 0) >= H.TUNING.luckMax) v += 0.5;
      return v;
    },
    heistKeep(b, u) { return b.hasBonus(u, 'a6') ? 2 : 0; },
    stealMore(b, u) { return b.eidOn(u, 1) ? 1 : 0; },
    bindUp(b, u) { return b.eidOn(u, 2) ? 0.2 : 0; },
    drainUp(b, u) { return b.eidOn(u, 4) ? 10 : 0; }
  };

  FX.aqua = {
    purgeAll(b, u) { return b.hasBonus(u, 'a2'); },
    reviveUp(b, u) { return b.hasBonus(u, 'a4') ? 0.25 : 0; },
    aquaFail(b, u) { if (b.eidOn(u, 1)) b.gainEnergy(u, 10); },
    dmg(b, u, tgt, o) { return o.kind === 'basic' && b.eidOn(u, 4) && (H.UNHOLY || []).includes(tgt.id) ? 0.4 : 0; },
    act(b, u, kind, R) {
      if (kind === 'skill' && b.eidOn(u, 2) && R && R.ally && R.ally.hp > 0) b.addBuff(R.ally, { s: 'dmgP', v: 0.15, turns: 2, name: 'Фокус с веером' });
      if (kind !== 'ult') return;
      if (b.hasBonus(u, 'a6')) for (const a of b.livingAllies) {
        const i = a.buffs.findIndex(x => x.debuff);
        if (i >= 0) { a.buffs.splice(i, 1); b.push({ t: 'status', u: a, text: 'Очищение' }); }
        else if (a.dots.length) { a.dots.shift(); b.push({ t: 'status', u: a, text: 'Очищение' }); }
      }
      if (b.eidOn(u, 6)) {
        const fallen = b.allies.filter(a => a.dead && !a.gone && !a.summon);
        for (const a of fallen) b.reviveAlly(a, u);
        if (fallen.length) b.push(b.orderSnap(b.current));
      }
    }
  };

  FX.megumin = {
    start(b, u) {
      if (b.hasBonus(u, 'a2')) u.buffs.push({ s: 'critR', v: 0.2, turns: 999, cond: 'chantFull', name: 'Алые глаза' });
      if (b.hasBonus(u, 'a4')) u.buffs.push({ s: 'dr', v: 0.3, turns: 999, cond: 'collapse', name: 'На спине у Казумы' });
      if (b.eidOn(u, 6)) u.flags.chantMax = H.TUNING.chantMax + 1;
    },
    kill(b, u) {
      if (!b.hasBonus(u, 'a6') || b.actKind !== 'ult' || u.flags.boomSp) return;
      u.flags.boomSp = 1;
      sp1(b, u, 'Сто очков из ста');
    },
    act(b, u, kind) { if (kind === 'ult') u.flags.boomSp = 0; },
    chantEnergy(b, u) { return b.eidOn(u, 1) ? 10 : 0; },
    ultDefIgnore(b, u, kind) { return kind === 'ult' && b.eidOn(u, 2) ? 0.2 : 0; },
    collapseDown(b, u) { return b.eidOn(u, 4) ? 1 : 0; }
  };

  FX.darkness = {
    struck(b, u) {
      if (!b.hasBonus(u, 'a2') || u.flags.painSet === b.hitThisAction) return;
      u.flags.painSet = b.hitThisAction;
      b.heal(u, u, u.maxHp * 0.02);
    },
    coverCut(b, u) { return b.hasBonus(u, 'a4') ? 0.3 : 0; },
    dmg(b, u, tgt, o) { return o.kind === 'enhanced' && b.hasBonus(u, 'a6') ? 0.3 : 0; },
    act(b, u, kind) { if (kind === 'skill' && b.eidOn(u, 1)) b.gainEcstasy(u, 1); },
    ultEcstasy(b, u) { return b.eidOn(u, 2) ? 3 : 0; },
    coverUp(b, u) { return b.eidOn(u, 4) ? 1 : 0; },
    lastStand(b, u) {
      if (!b.eidOn(u, 6) || u.flags.bastion) return false;
      u.flags.bastion = true;
      u.hp = Math.round(u.maxHp * 0.3);
      b.push({ t: 'revive', u, hp: u.hp, text: 'Последний бастион!' });
      return true;
    }
  };

  FX.yu = {
    dmg(b, u, tgt, o) {
      let v = 0;
      if (tgt.broken && b.hasBonus(u, 'a2')) v += 0.2;
      if (o.kind === 'ult' && b.eidOn(u, 1)) v += 0.3;
      if (u.flags.oneMore && b.eidOn(u, 6)) v += 0.4;
      return v;
    },
    wildBreak(b, u) { if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 10); },
    aoaUp(b, u) { return b.hasBonus(u, 'a6') ? 0.15 : 0; },
    act(b, u, kind, R) {
      if (kind === 'skill' && (u.flags.skillSel | 0) === 0 && b.eidOn(u, 2) && R && R.main && R.main.hp > 0) b.addBuff(R.main, { s: 'defDown', v: 0.1, turns: 2, name: 'Гроза над Инабой', debuff: true }, true);
      if (kind === 'ult' && b.eidOn(u, 4)) sp1(b, u, 'Нанако');
    }
  };

  FX.yosuke = {
    act(b, u, kind) {
      u.flags.strike2 = false;
      if (kind === 'skill' && b.hasBonus(u, 'a2')) b.addBuff(u, { s: 'spdP', v: 0.1, turns: 2, name: 'Сукукадзя' });
      if (kind === 'ult' && b.eidOn(u, 2)) for (const e of b.living) b.delay(e, 0.1);
    },
    strikeHit(b, u, t) {
      if (b.hasBonus(u, 'a4') && t.hp > 0 && b.rng.chance(b.effectChance(u, t, 1))) b.addDot(u, t, 'shear', atkOf(u) * 0.5, 2);
      if (b.eidOn(u, 1)) b.gainEnergy(u, 10);
      if (b.eidOn(u, 6) && !u.flags.strike2) { u.flags.strike2 = true; u.flags.strike = true; }
    },
    dmg(b, u, tgt, o) {
      if (o.label !== 'Атака Ёсуке') return 0;
      let v = 0;
      if (b.hasBonus(u, 'a6') && tgt.buffs.some(x => x.debuff && x.s === 'spdP' && x.v < 0)) v += 0.25;
      if (b.eidOn(u, 4)) v += 0.4;
      return v;
    }
  };

  FX.chie = {
    act(b, u, kind) {
      if (kind === 'skill' && b.hasBonus(u, 'a2')) b.addBuff(u, { s: 'critR', v: 0.1, turns: 2, name: 'Ребеллион' });
      if (kind === 'ult') u.flags.puntKill = false;
    },
    executeUp(b, u) { return b.hasBonus(u, 'a4') ? 0.1 : 0; },
    break(b, u, tgt, src) { if (src === u && b.hasBonus(u, 'a6')) b.addBuff(u, { s: 'atkP', v: 0.2, turns: 2, name: 'Тарукадзя' }); },
    adjM(b, u, f) { return b.eidOn(u, 1) ? f.adj * 1.5 : 0; },
    ultDefIgnore(b, u, kind) { return kind === 'ult' && b.eidOn(u, 2) ? 0.25 : 0; },
    critToughUp(b, u) { return b.eidOn(u, 4) ? 0.5 : 0; },
    kill(b, u) {
      if (!b.eidOn(u, 6) || b.actKind !== 'ult' || u.flags.puntKill) return;
      u.flags.puntKill = true;
      b.gainEnergy(u, u.maxEnergy * 0.5);
    }
  };

  FX.yukiko = {
    act(b, u, kind, R) {
      if (kind === 'basic' && b.hasBonus(u, 'a2') && R && R.main && R.main.hp > 0 && b.rng.chance(b.effectChance(u, R.main, 0.6))) b.addDot(u, R.main, 'burn', atkOf(u) * 0.5, 2);
      if (kind === 'skill' && b.hasBonus(u, 'a4')) for (const a of b.livingAllies) if (!R || a !== R.ally) b.heal(u, a, u.maxHp * 0.04);
    },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.dot && b.hasBonus(u, 'a6')) v += 0.25;
      if (o.kind === 'ult' && b.eidOn(u, 1)) v += 0.3;
      return v;
    },
    allySurvive(b, u, tgt) {
      if (!b.eidOn(u, 2) || u.flags.samarecarm) return false;
      u.flags.samarecarm = true;
      tgt.hp = Math.round(tgt.maxHp * 0.25);
      b.push({ t: 'revive', u: tgt, hp: tgt.hp, text: 'Самарекарм!' });
      return true;
    },
    burnTick(b, u) { if (b.eidOn(u, 4)) b.gainEnergy(u, 2); },
    burnHealAll(b, u) { return b.eidOn(u, 6); }
  };

  FX.kanji = {
    start(b, u) { if (b.hasBonus(u, 'a6')) u.buffs.push({ s: 'atkP', v: 0.2, turns: 999, cond: 'stitch', name: 'Номер один' }); },
    stitchLong(b, u) { return b.hasBonus(u, 'a2') ? 1 : 0; },
    stitchUp(b, u) { return (b.hasBonus(u, 'a4') ? 0.1 : 0) + (b.eidOn(u, 6) ? 0.3 : 0); },
    dmg(b, u, tgt, o) { return o.kind === 'ult' && b.eidOn(u, 1) ? 0.3 : 0; },
    stitched(b, u, t, p) {
      for (const e of [t, p]) {
        if (!e || e.hp <= 0) continue;
        if (b.eidOn(u, 2) && b.rng.chance(b.effectChance(u, e, 0.5))) b.addDot(u, e, 'shock', atkOf(u) * 0.5, 2);
        if (b.eidOn(u, 4)) b.addBuff(e, { s: 'defDown', v: 0.15, turns: 2, name: 'Мастер вязания', debuff: true }, true);
      }
    }
  };

  FX.rise = {
    analyzedFoe(b, u, t, turns) { if (b.hasBonus(u, 'a2')) b.addBuff(t, { s: 'vuln', v: 0.1, turns, name: 'Скан слабостей', debuff: true }, true); },
    warned(b, u, list) { if (b.hasBonus(u, 'a6')) for (const a of list) b.gainEnergy(a, 5); },
    analyzeLong(b, u) { return b.eidOn(u, 1) ? 1 : 0; },
    act(b, u, kind, R) {
      if (kind === 'ult') {
        if (b.hasBonus(u, 'a4')) for (const a of b.livingAllies) b.addBuff(a, { s: 'critD', v: 0.15, turns: 2, name: 'Рисетт' });
        if (b.eidOn(u, 4)) for (const a of b.livingAllies) b.addBuff(a, { s: 'dmgP', v: 0.1, turns: 2, name: 'Концерт в Инабе' });
      }
      if (kind === 'basic' && b.eidOn(u, 2) && R && R.main && b.analyzed(R.main)) b.gainEnergy(u, 10);
      if (kind === 'skill' && b.eidOn(u, 6)) for (const e of b.living) if (!R || e !== R.main) b.analyze(u, e, H.TUNING.analyzeTurns + (b.eidOn(u, 1) ? 1 : 0));
    }
  };

  FX.makoto = {
    start(b, u) { if (b.eidOn(u, 4)) u.flags.shinyMax = H.TUNING.mkShinyMax + 1; },
    heistM(b, u) { return pickLv(ULT_CURVE, abLv(b, u, 'ult')); },
    heistKeep(b, u) { return b.hasBonus(u, 'a2') ? 1 : 0; },
    crit(b, u, tgt) { return b.hasBonus(u, 'a4') && b.living.length && b.living.reduce((x, y) => (y.hp > x.hp ? y : x)) === tgt ? 0.15 : 0; },
    heistDef(b, u) { return b.hasBonus(u, 'a6') ? 0.2 : 0; },
    portalUp(b, u) { return b.eidOn(u, 2) ? 0.2 : 0; },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.kind === 'skill' && b.eidOn(u, 1)) v += 0.3;
      if (o.label === 'Самая большая блестяшка' && b.eidOn(u, 6)) v += 0.4;
      return v;
    }
  };

  FX.amanda = {
    start(b, u) { if (b.eidOn(u, 2)) u.buffs.push({ s: 'dr', v: 0.15, turns: 999, cond: 'pink', name: 'Розовая форма' }); },
    transformed(b, u) { if (b.hasBonus(u, 'a2')) b.gainEnergy(u, 30); },
    cocooned(b, u, a) {
      if (!b.hasBonus(u, 'a4')) return;
      const i = a.buffs.findIndex(x => x.debuff);
      if (i >= 0) { a.buffs.splice(i, 1); b.push({ t: 'status', u: a, text: 'Очищение' }); }
      else if (a.dots.length) { a.dots.shift(); b.push({ t: 'status', u: a, text: 'Очищение' }); }
    },
    dmg(b, u, tgt, o) {
      if (o.label !== 'Кокон-сердце') return 0;
      return (b.hasBonus(u, 'a6') ? 0.3 : 0) + (b.eidOn(u, 6) ? 1 : 0);
    },
    cocoonUp(b, u) { return b.eidOn(u, 1) ? 0.2 : 0; },
    popped(b, u) { if (b.eidOn(u, 4)) for (const e of b.living) b.addBuff(e, { s: 'defDown', v: 0.15, turns: 2, name: 'Слизни-мозгоеды', debuff: true }, true); }
  };

  FX.talleah = {
    sigUp(b, u) { return b.hasBonus(u, 'a2') ? 0.1 : 0; },
    gynoidHit(b, u) { if (b.hasBonus(u, 'a4')) b.gainEnergy(u, 5); },
    dmg(b, u, tgt, o) {
      let v = 0;
      if (o.label === 'Оковы' && b.hasBonus(u, 'a6')) v += 0.3;
      if (o.kind === 'skill' && b.eidOn(u, 1)) v += 0.3;
      return v;
    },
    gynoidSpd(b, u) { return b.eidOn(u, 2) ? 0.2 : 0; },
    capsuleUp(b, u) { return b.eidOn(u, 4) ? 0.3 : 0; },
    shackleMore(b, u) { return b.eidOn(u, 6) ? 1 : 0; }
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
