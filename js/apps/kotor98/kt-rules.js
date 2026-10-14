(function (K) {
  'use strict';
  const mod = K.mod;
  let uidSeq = 1;
  K.resetUids = n => { uidSeq = n || 1; };
  K.nextUid = () => uidSeq++;

  const UNARMED = { id: 'unarmed', n: 'Кулаки', k: 'w', wt: 'melee', dmg: [1, 3], dt: 'kinetic', natural: true };

  function effBonus(c, key) {
    let v = 0;
    for (const e of c.effects) {
      if (e.id === 'stim' && (key === 'str' || key === 'dex')) v += 2;
      if (e.id === 'battle_med' && (key === 'ab' || key === 'def')) v += 2;
      if (e.id === 'knockdown' && key === 'def') v -= 4;
      if (e.id === 'stun' && key === 'def') v -= 4;
    }
    return v;
  }

  function accBonus(c, key) {
    const acc = c.equip.acc && K.ITEMS[c.equip.acc];
    return acc && acc.bonus && acc.bonus[key] ? acc.bonus[key] : 0;
  }

  function attr(c, k) { return c.attrs[k] + accBonus(c, k) + effBonus(c, k); }
  function attrMod(c, k) { return mod(attr(c, k)); }

  function hasFeat(c, f) { return c.feats.indexOf(f) >= 0; }

  function skill(c, k) {
    return (c.skills[k] || 0) + attrMod(c, K.SKILL_ATTR[k]) + accBonus(c, k);
  }

  function bab(c) { return Math.floor(c.level * K.CLASSES[c.cls].bab); }

  function maxHpFor(c) {
    const cl = K.CLASSES[c.cls];
    const cm = mod(c.attrs.con);
    let hp = cl.hd + cm + (c.level - 1) * (Math.floor(cl.hd / 2) + 1 + cm);
    if (hasFeat(c, 'toughness')) hp += c.level;
    hp += c.hpBonus || 0;
    return Math.max(4, hp);
  }

  function maxFpFor(c) {
    if (!K.CLASSES[c.cls].force) return 0;
    return 4 + c.level * 4 + Math.max(0, mod(c.attrs.wis)) * 2;
  }

  function recalc(c) {
    const hpWas = c.maxHp || 0;
    c.maxHp = maxHpFor(c);
    if (c.hp == null) c.hp = c.maxHp;
    else if (c.maxHp > hpWas && hpWas > 0) c.hp += c.maxHp - hpWas;
    c.hp = Math.min(c.hp, c.maxHp);
    c.maxFp = maxFpFor(c);
    if (c.fp == null) c.fp = c.maxFp;
    c.fp = Math.min(c.fp, c.maxFp);
  }

  function weaponOf(c, slot) {
    const id = c.equip[slot || 'r'];
    if (id) return K.ITEMS[id];
    if (slot === 'l') return null;
    return UNARMED;
  }

  function isDual(c) {
    const r = c.equip.r && K.ITEMS[c.equip.r];
    const l = c.equip.l && K.ITEMS[c.equip.l];
    return !!(r && l && l.k === 'w');
  }

  function saveBonus(c, type) {
    const cl = K.CLASSES[c.cls];
    const good = cl.good.indexOf(type) >= 0;
    let v = good ? 2 + Math.floor(c.level / 2) : Math.floor(c.level / 3);
    v += attrMod(c, type === 'fort' ? 'con' : type === 'ref' ? 'dex' : 'wis');
    if (hasFeat(c, 'conditioning')) v += 2;
    if (c.droid && type === 'will') v += 4;
    return v;
  }

  function defense(c) {
    const body = c.equip.body && K.ITEMS[c.equip.body];
    const maxDex = body ? body.maxDex : 9;
    let d = 10 + Math.min(attrMod(c, 'dex'), maxDex) + (body ? body.def : 0);
    if (hasFeat(c, 'scoundrel_luck')) d += 1 + Math.floor(c.level / 5);
    if (c.cls === 'sentinel') d += 2 + Math.floor(c.level / 3);
    if (c.natDef) d += c.natDef;
    if (hasFeat(c, 'dueling') && !isDual(c) && c.equip.r && !K.ITEMS[c.equip.r].two) d += 1;
    d += accBonus(c, 'def') + effBonus(c, 'def') + (c.roundDef || 0);
    return d;
  }

  function attackBonus(c, slot) {
    const w = weaponOf(c, slot);
    if (!w) return 0;
    const ranged = w.wt === 'ranged';
    let a = bab(c) + attrMod(c, ranged ? 'dex' : 'str') + (w.ab || 0) + effBonus(c, 'ab');
    if (ranged) a += accBonus(c, 'rab');
    if (isDual(c)) {
      const tw = hasFeat(c, 'two_weapon');
      a += slot === 'l' ? (tw ? -4 : -8) : (tw ? -2 : -4);
    } else if (hasFeat(c, 'dueling') && c.equip.r && !w.two) a += 1;
    return a;
  }

  function damageRange(c, slot) {
    const w = weaponOf(c, slot);
    if (!w) return [0, 0];
    const b = (w.wt === 'melee' ? attrMod(c, 'str') : 0) + (w.db || 0);
    return [Math.max(1, w.dmg[0] + b), Math.max(1, w.dmg[0] * w.dmg[1] + b)];
  }

  function weaponRange(c) {
    const w = weaponOf(c, 'r');
    if (w && w.wt === 'ranged') return 13;
    return (c.radius || 0.35) + 1.15;
  }

  function isRanged(c) { const w = weaponOf(c, 'r'); return !!(w && w.wt === 'ranged'); }

  function sneakDice(c) { return hasFeat(c, 'sneak') ? Math.ceil(c.level / 2) : 0; }

  function hasEffect(c, id) { return c.effects.some(e => e.id === id); }

  function rollAttack(rng, att, tgt, slot, feat, opts) {
    const w = weaponOf(att, slot);
    const f = feat ? K.FEATS[feat] : null;
    const roll = rng.d20();
    const ab = attackBonus(att, slot) + (f && f.ab ? f.ab : 0) + ((opts && opts.ab) || 0);
    const total = roll + ab;
    const def = defense(tgt);
    const res = { roll, ab, total, def, hit: false, crit: false, dmg: 0, dt: w.dt, ranged: w.wt === 'ranged', slot, weapon: w.id, deflect: false, reflect: false, sneak: 0 };
    if (roll !== 1 && (roll === 20 || total >= def)) res.hit = true;
    if (!res.hit) return res;
    if (res.ranged && tgt.equip && tgt.equip.r && K.ITEMS[tgt.equip.r] && K.ITEMS[tgt.equip.r].saber && hasFeat(tgt, 'jedi_defense') && !hasEffect(tgt, 'stun')) {
      const dr = rng.d20() + tgt.level + attrMod(tgt, 'dex');
      if (dr >= total) {
        res.hit = false; res.deflect = true;
        res.reflect = rng.chance(0.3);
        if (res.reflect) res.dmg = Math.max(1, rng.d(w.dmg[0], w.dmg[1]));
        return res;
      }
    }
    const cr = w.cr || [20, 2];
    const threat = cr[0] - (f && f.threat ? f.threat : 0);
    if (roll >= threat) {
      const confirm = rng.d20() + ab;
      if (confirm >= def) res.crit = true;
    }
    const mult = res.crit ? cr[1] : 1;
    let dmg = 0;
    for (let i = 0; i < mult; i++) dmg += rng.d(w.dmg[0], w.dmg[1]) + (w.wt === 'melee' ? attrMod(att, 'str') : 0) + (w.db || 0) + (f && f.db ? f.db : 0);
    const sd = sneakDice(att);
    if (sd && (hasEffect(tgt, 'stun') || hasEffect(tgt, 'knockdown') || (tgt.target && tgt.target !== att.uid))) {
      res.sneak = rng.d(sd, 6);
      dmg += res.sneak;
    }
    if (w.dt === 'ion') dmg = tgt.droid ? dmg * 2 : Math.ceil(dmg / 2);
    res.dmg = Math.max(1, dmg);
    if (w.stun && rng.chance(w.stun) && !tgt.droid) res.stun = true;
    if (w.plague && !tgt.droid) res.plague = true;
    return res;
  }

  function rollSave(rng, c, type, dc) {
    const r = rng.d20();
    return r === 20 || (r !== 1 && r + saveBonus(c, type) >= dc);
  }

  function featLevels(cls, lvl) {
    const cl = K.CLASSES[cls];
    let n = lvl % 2 === 1 ? 1 : 0;
    if (cl.bonusFeat && lvl > 1 && lvl % cl.bonusFeat === 0) n++;
    return n;
  }

  function skillPointsFor(c, lvl) {
    const cl = K.CLASSES[c.cls];
    const base = Math.max(1, cl.sk + mod(c.attrs.int));
    return lvl === 1 ? base * 4 : base;
  }

  function isClassSkill(c, k) { return K.CLASSES[c.cls].cskills.indexOf(k) >= 0; }
  function maxRank(c, k, lvl) { const m = (lvl || c.level) + 3; return isClassSkill(c, k) ? m : Math.floor(m / 2); }
  function skillCost(c, k) { return isClassSkill(c, k) ? 1 : 2; }

  function availableFeats(c) {
    return K.FEAT_POOL.filter(f => !hasFeat(c, f) && (!K.FEATS[f].req || hasFeat(c, K.FEATS[f].req)));
  }

  function levelUpInfo(c) {
    const lvl = c.level + 1;
    return { level: lvl, skillPoints: skillPointsFor(c, lvl), feats: featLevels(c.cls, lvl), attr: lvl % 4 === 0 };
  }

  function autoLevelChoice(c) {
    const info = levelUpInfo(c);
    const choice = { skills: {}, feats: [], attr: null };
    if (info.attr) {
      const prim = c.ai === 'melee' ? 'str' : c.cls === 'sentinel' ? 'wis' : 'dex';
      choice.attr = prim;
    }
    let pts = info.skillPoints;
    const pref = (c.skillPref || K.CLASSES[c.cls].cskills.concat(['awa', 'per', 'tre'])).slice();
    let guard = 0;
    while (pts > 0 && guard++ < 50) {
      let spent = false;
      for (const k of pref) {
        const cost = skillCost(c, k);
        const cur = (c.skills[k] || 0) + (choice.skills[k] || 0);
        if (pts >= cost && cur < maxRank(c, k, info.level)) { choice.skills[k] = (choice.skills[k] || 0) + 1; pts -= cost; spent = true; if (pts <= 0) break; }
      }
      if (!spent) break;
    }
    const pool = availableFeats(c);
    const grow = (c.grow || []).filter(f => pool.indexOf(f) >= 0);
    const ordered = grow.concat(pool.filter(f => grow.indexOf(f) < 0 && (K.FEATS[f].type === 'passive' || K.FEATS[f].type === (isRanged(c) ? 'ranged' : 'melee'))));
    for (let i = 0; i < info.feats && i < ordered.length; i++) choice.feats.push(ordered[i]);
    return choice;
  }

  function applyLevelUp(c, choice) {
    const info = levelUpInfo(c);
    c.level = info.level;
    if (choice.attr && info.attr) c.attrs[choice.attr]++;
    for (const [k, n] of Object.entries(choice.skills || {})) c.skills[k] = (c.skills[k] || 0) + n;
    for (const f of (choice.feats || []).slice(0, info.feats)) if (!hasFeat(c, f)) c.feats.push(f);
    recalc(c);
    c.hp = c.maxHp;
    c.fp = c.maxFp;
  }

  function makeCreature(tplId, opts) {
    const t = K.TEMPLATES[tplId];
    if (!t) throw new Error('template ' + tplId);
    opts = opts || {};
    const c = {
      uid: K.nextUid(), tpl: tplId, name: opts.name || t.n, cls: t.cls, level: t.lvl,
      attrs: Object.assign({}, t.attrs), skills: Object.assign({}, t.skills || {}),
      feats: [], powers: (t.powers || []).slice(),
      equip: { r: null, l: null, body: null, acc: null },
      effects: [], faction: opts.faction || 'hostile', ai: t.ai || 'melee',
      model: Object.assign({}, K.MODELS[t.m || 'citizen_m'], opts.model || {}),
      droid: !!t.droid, beast: !!t.beast, race: t.race || null, natDef: t.def || 0,
      hpBonus: t.hpBonus || 0, grow: (t.grow || []).slice(), boss: !!t.boss, big: !!t.big,
      x: 0, z: 0, ang: 0, radius: t.big ? 1.2 : (t.m === 'zaalbar' || t.m === 'gamorrean_chief') ? 0.45 : 0.35,
      path: null, target: null, queue: [], roundT: 0, anim: { a: 'idle', t: 0 }, walkPh: 0, dead: false, hp: null, fp: null,
      items: (t.items || []).slice(), cr: t.cr || 0, loot: t.loot || [], credits: t.credits || null
    };
    for (const f of K.CLASSES[c.cls].feats) if (c.feats.indexOf(f) < 0) c.feats.push(f);
    for (const f of (t.feats || [])) if (c.feats.indexOf(f) < 0) c.feats.push(f);
    for (const s of ['r', 'l', 'body', 'acc']) if (t.equip && t.equip[s]) c.equip[s] = t.equip[s];
    if (t.equip && t.equip.body && K.ITEMS[t.equip.body] && K.ITEMS[t.equip.body].prof === 'heavy' && c.feats.indexOf('armor_heavy') < 0 && !t.party) c.feats.push('armor_light', 'armor_medium', 'armor_heavy');
    recalc(c);
    if (opts.level && opts.level > c.level) levelTo(c, opts.level);
    return c;
  }

  function levelTo(c, lvl) {
    while (c.level < lvl) applyLevelUp(c, autoLevelChoice(c));
  }

  function canEquip(c, item, slot) {
    if (!item) return { ok: false, why: 'Нет предмета' };
    if (c.droid) {
      if (!item.droid) return { ok: false, why: 'Дроид не может это использовать' };
    } else if (item.droid) return { ok: false, why: 'Только для дроидов' };
    if (item.only === 'wookiee' && c.race !== 'wookiee') return { ok: false, why: 'Только для вуки' };
    if (item.k === 'w') {
      if (slot !== 'r' && slot !== 'l') return { ok: false, why: 'Не тот слот' };
      if (slot === 'l') {
        if (!item.light) return { ok: false, why: 'Во второй руке — только лёгкое оружие' };
        const r = c.equip.r && K.ITEMS[c.equip.r];
        if (r && r.two) return { ok: false, why: 'Основное оружие двуручное' };
        if (r && r.wt !== item.wt) return { ok: false, why: 'Оружие должно быть одного типа' };
      }
      if (item.saber && c.cls !== 'sentinel') return { ok: false, why: 'Световым мечом владеют только джедаи' };
      return { ok: true };
    }
    if (item.k === 'a') {
      if (slot !== 'body') return { ok: false, why: 'Не тот слот' };
      if (item.prof !== 'none' && !hasFeat(c, 'armor_' + item.prof)) return { ok: false, why: 'Нужен навык: ' + K.FEATS['armor_' + item.prof].n };
      if (c.race === 'wookiee' && item.prof !== 'none') return { ok: false, why: 'Вуки не носят броню' };
      return { ok: true };
    }
    if (item.k === 'x') return slot === 'acc' ? { ok: true } : { ok: false, why: 'Не тот слот' };
    return { ok: false, why: 'Нельзя экипировать' };
  }

  function describe(c) {
    const r = weaponOf(c, 'r');
    const d = damageRange(c, 'r');
    return { hp: c.hp, maxHp: c.maxHp, fp: c.fp, maxFp: c.maxFp, def: defense(c), ab: attackBonus(c, 'r'), dmg: d, weapon: r ? r.n : '—', fort: saveBonus(c, 'fort'), ref: saveBonus(c, 'ref'), will: saveBonus(c, 'will'), bab: bab(c) };
  }

  Object.assign(K, { UNARMED, attr, attrMod, hasFeat, skill, bab, recalc, weaponOf, isDual, saveBonus, defense, attackBonus, damageRange, weaponRange, isRanged, rollAttack, rollSave, featLevels, skillPointsFor, isClassSkill, maxRank, skillCost, availableFeats, levelUpInfo, autoLevelChoice, applyLevelUp, makeCreature, levelTo, canEquip, describe, hasEffect, sneakDice, maxHpFor });
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
