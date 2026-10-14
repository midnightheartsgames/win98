(function (D) {
  'use strict';
  const { clamp } = D;
  const ATTR_KEYS = ['str', 'dex', 'wil', 'mag', 'cun', 'con'];
  const EQUIP_SLOTS = ['main', 'off', 'head', 'chest', 'gloves', 'boots', 'amulet', 'belt', 'ring1', 'ring2'];

  const blankAttr = v => ({ str: v, dex: v, wil: v, mag: v, cun: v, con: v });
  const addTo = (dst, src, k) => { if (!src) return; for (const key in src) dst[key] = (dst[key] || 0) + src[key] * (k || 1); };

  const makeCreature = spec => {
    const c = {
      uid: D.uid(), key: spec.key || spec.id || 'x', kind: spec.kind || 'foe', name: spec.name || '?',
      race: spec.race || 'human', cls: spec.cls || 'warrior', sex: spec.sex || 'm', look: Object.assign({}, spec.model || spec.look || {}),
      lvl: spec.lvl || 1, xp: spec.xp0 || 0, base: Object.assign(blankAttr(10), spec.attr ? {} : {}),
      points: { attr: 0, skill: 0, talent: 0 }, skills: Object.assign({}, spec.skills || {}), abilities: (spec.ab || spec.abilities || []).slice(),
      equip: {}, set2: { main: null, off: null }, activeSet: 0,
      hp: 1, mp: 1, x: spec.x || 0, z: spec.z || 0, y: 0, face: spec.face || 0,
      faction: spec.faction || 'hostile', rank: spec.rank || 'normal', tpl: spec.tpl || null,
      xpValue: spec.xpValue || 0, loot: spec.loot || 'none', injuries: [], effects: [], sustained: [], cds: {},
      tactics: null, behavior: 'default', tacticsOn: true, dead: false, down: false, stats: null,
      radius: spec.radius || (spec.model && spec.model.kind === 'dog' ? 0.45 : 0.38), npc: spec.npc || null, dlg: spec.dlg || null,
      flags: {}, approval: 0, group: spec.group || null
    };
    if (spec.attr) for (const k of ATTR_KEYS) if (spec.attr[k] !== undefined) c.base[k] = spec.attr[k];
    if (spec.equip) for (const [slot, id] of Object.entries(spec.equip)) if (id) c.equip[slot] = id;
    if (spec.set2) c.set2 = Object.assign({ main: null, off: null }, spec.set2);
    if (spec.template) c.t = spec.template;
    if (spec.nat) c.nat = spec.nat;
    recalc(c);
    c.hp = c.stats.hpMax; c.mp = c.stats.mpMax;
    return c;
  };

  const fromTemplate = (tplId, opt) => {
    const t = D.TEMPLATES[tplId];
    if (!t) throw new Error('template ' + tplId);
    const base = Object.assign(blankAttr(10), t.attr || {});
    const c = makeCreature({
      key: tplId, tpl: tplId, kind: 'foe', name: (opt && opt.name) || t.name, race: t.race, cls: t.cls, model: Object.assign({}, t.model, opt && opt.model),
      lvl: (opt && opt.lvl) || t.lvl, attr: base, equip: Object.assign({}, t.equip || {}, opt && opt.equip), ab: t.ab || [], faction: (opt && opt.faction) || 'hostile',
      rank: (opt && opt.rank) || t.rank, xpValue: (opt && opt.xp) !== undefined ? opt.xp : t.xp, loot: (opt && opt.loot) || t.loot, radius: t.radius || 0.38, template: t, group: opt && opt.group
    });
    if (opt && opt.hpMul) c.hpMul = opt.hpMul;
    recalc(c);
    c.hp = c.stats.hpMax; c.mp = c.stats.mpMax;
    return c;
  };

  const item = id => D.ITEMS[id];
  const mainWeapon = c => {
    const id = c.equip.main;
    return id ? item(id) : null;
  };
  const offItem = c => (c.equip.off ? item(c.equip.off) : null);
  const style = c => {
    const m = mainWeapon(c), o = offItem(c);
    if (!m) return c.t && c.t.bolt ? 'staff' : 'none';
    if (m.bow) return 'bow';
    if (m.staff) return 'staff';
    if (m.hands === 2) return '2h';
    if (o && o.type === 'shield') return 'shield';
    if (o && o.type === 'weapon') return 'dual';
    return 'single';
  };
  const isRanged = c => {
    const s = style(c);
    return s === 'bow' || s === 'staff' || !!(c.t && c.t.range);
  };

  const passiveMods = c => {
    const m = {};
    for (const id of c.abilities) {
      const a = D.AB[id];
      if (a && a.kind === 'pas' && a.fx.pas) addTo(m, a.fx.pas);
    }
    return m;
  };

  const recalc = (c, partyMods) => {
    const t = c.t || c.nat || null;
    const cls = D.CLASSES[c.cls] || D.CLASSES.warrior;
    const mods = passiveMods(c);
    const armorItems = [];
    for (const slot of EQUIP_SLOTS) {
      const id = c.equip[slot];
      if (!id) continue;
      const i = item(id);
      if (!i) continue;
      if (i.mods) addTo(mods, i.mods);
      if (i.type === 'armor' || i.type === 'shield') armorItems.push(i);
    }
    for (const id of c.sustained) {
      const a = D.AB[id];
      if (a && a.fx.sus) addTo(mods, a.fx.sus);
    }
    for (const e of c.effects) if (e.mods) addTo(mods, e.mods);
    for (const inj of c.injuries) {
      const def = D.INJURIES.find(x => x.id === inj);
      if (def) addTo(mods, def.mods);
    }
    if (partyMods) addTo(mods, partyMods);
    const a = {};
    for (const k of ATTR_KEYS) a[k] = c.base[k] + (mods[k] || 0);
    const lv = c.lvl;
    const rankMul = c.kind === 'foe' ? (D.RANKS[c.rank] || D.RANKS.normal)[1] : 1;
    let hpMax = cls.hp + (a.con - 10) * 5 + (lv - 1) * cls.hpLv + (mods.hpMax || 0);
    if (c.kind === 'foe') hpMax = t && t.hp ? t.hp : Math.round(hpMax * 0.6 * rankMul);
    if (c.hpMul) hpMax = Math.round(hpMax * c.hpMul);
    let mpMax = cls.mp + (a.wil - 10) * 5 + (c.cls === 'mage' ? (a.mag - 10) * 2 : 0) + (lv - 1) * cls.mpLv + (mods.mpMax || 0);
    const w = mainWeapon(c), o = offItem(c);
    const st = style(c);
    let arm = (t && t.arm) || 0, fat = 0, shieldDef = 0, mdef = 0;
    for (const i of armorItems) {
      if (i.arm) arm += i.arm;
      if (i.fat) fat += i.fat;
      if (i.type === 'shield') { shieldDef += i.def || 0; mdef += i.mdef || 0; }
    }
    arm += mods.arm || 0;
    fat = Math.max(0, fat + (mods.fat || 0));
    const ct = c.skills.combat_training || 0;
    const meleeStr = w && w.attr === 'str';
    let atk = 50 + (a.dex - 10) + (meleeStr ? (a.str - 10) * 0.5 : 0) + lv * 1.5 + ct * 3 + (mods.atk || 0);
    let def = 32 + (a.dex - 10) + lv * 1.5 + shieldDef + (mods.def || 0);
    let dmg;
    let attrKey = w ? w.attr : 'str';
    if (w) dmg = w.dmg;
    else if (t && t.dmgBase) dmg = t.dmgBase;
    else dmg = 3;
    const attrBonus = attrKey === 'mag' ? (a.mag - 10) * 0.5 : (a[attrKey] - 10) * 0.7;
    dmg += attrBonus + (mods.dmg || 0);
    if (c.kind !== 'foe' && c.cls === 'rogue') dmg += Math.max(0, (a.cun - 10) * 0.15);
    let spd = w ? w.spd : (t && t.spd) || 1.8;
    let spdMul = 1;
    for (const id of c.sustained) { const ab = D.AB[id]; if (ab && ab.fx.sus && ab.fx.sus.spd) spdMul *= ab.fx.sus.spd; }
    for (const e of c.effects) if (e.mods && e.mods.spdMul) spdMul *= e.mods.spdMul;
    if (mods.partySpdApplied) spdMul *= mods.partySpdApplied;
    spd *= spdMul;
    let crit = (w ? w.crit : 3) + (c.cls === 'rogue' ? (a.cun - 10) * 0.3 : 0) + (a.dex - 10) * 0.15 + (mods.crit || 0);
    let pierce = (w ? w.pierce || 0 : 0) + (c.cls === 'rogue' ? Math.max(0, (a.cun - 10) * 0.25) : 0);
    const sp = (a.mag - 10) + lv + (mods.sp || 0);
    const resMent = clamp((a.wil - 10) * 1.5 + (D.RACES[c.race] ? D.RACES[c.race].resist || 0 : 0) + (mods.res || 0), -50, 80);
    const resPhys = clamp((a.con - 10) * 1.5 + (mods.res || 0), -50, 80);
    let range = w && w.range ? w.range : (t && t.range) || 0;
    const reach = (t && t.reach) || (c.radius > 0.6 ? c.radius + 1.2 : 1.6);
    const move = 3.6 * (1 + (mods.move || 0)) * ((t && t.move) || 1) * (c.look.kind === 'rat' ? 1.1 : 1);
    const lock = c.cls === 'rogue' ? 1 + (mods.lock || 0) + Math.floor(Math.max(0, a.cun - 12) / 6) : 0;
    const offMult = mods.offhand ? 1 : 0.5;
    c.stats = {
      a, hpMax: Math.max(1, Math.round(hpMax)), mpMax: Math.max(0, Math.round(mpMax)), atk: Math.round(atk), def: Math.round(def), mdef, arm: +arm.toFixed(1),
      dmg: +Math.max(1, dmg).toFixed(1), spd: +spd.toFixed(2), crit: clamp(+crit.toFixed(1), 0, 60), pierce, sp: Math.round(sp), resMent: Math.round(resMent), resPhys: Math.round(resPhys),
      fat: Math.round(fat), range, reach, move: Math.max(0.8, move), lock, offMult, style: st, mods,
      hpRegen: (mods.hpRegen || 0), mpRegen: (mods.mpRegen || 0), threat: mods.threat || 1, dodge: mods.dodge || 0,
      fireAdd: mods.fireAdd || 0, coldAdd: mods.coldAdd || 0, stealth: !!mods.stealth, immune: !!(mods.immune || (t && t.immune)),
      fireRes: (t && t.fireRes) || 0, coldRes: (t && t.coldRes) || 0, natureRes: (mods.nature || 0) + (c.skills.survival || 0) * 5
    };
    if (c.hp > c.stats.hpMax) c.hp = c.stats.hpMax;
    if (c.mp > c.stats.mpMax) c.mp = c.stats.mpMax;
    return c.stats;
  };

  const meetsReq = (c, it) => {
    if (!it || !it.req) return true;
    for (const [k, v] of Object.entries(it.req)) if (v && (c.base[k] + ((c.stats && c.stats.mods[k]) || 0)) < v) return false;
    return true;
  };
  const slotFits = (slot, it) => {
    if (!it) return false;
    if (slot === 'ring1' || slot === 'ring2') return it.slot === 'ring';
    if (slot === 'off') return it.slot === 'off' || (it.type === 'weapon' && it.hands === 1 && !it.bow && !it.staff);
    return it.slot === slot;
  };
  const canEquip = (c, slot, id) => {
    const it = item(id);
    if (!it || !slotFits(slot, it)) return 'Не подходит в этот слот';
    if (c.look.kind && c.look.kind !== 'humanoid') return 'Это существо не носит снаряжение';
    if (slot === 'off' && it.type === 'weapon') {
      const m = mainWeapon(c);
      if (m && m.hands === 2) return 'Сначала уберите двуручное оружие';
      if (c.cls === 'mage') return 'Маги не сражаются двумя клинками';
    }
    if (slot === 'off' && it.type === 'shield' && c.cls === 'rogue') return 'Разбойники не носят щиты';
    if (!meetsReq(c, it)) return 'Требования: ' + Object.entries(it.req).filter(([, v]) => v).map(([k, v]) => D.ATTR_NAME[k] + ' ' + v).join(', ');
    return null;
  };

  const abilityState = (c, id) => {
    const a = D.AB[id];
    if (!a) return 'none';
    if (c.abilities.includes(id)) return 'known';
    const line = Object.values(D.LINES).find(l => l.list.includes(id));
    if (!line) return 'locked';
    const clsKey = c.look.kind === 'dog' ? 'dog' : c.cls;
    if (!line.cls.includes(clsKey)) return 'locked';
    const tier = line.list.indexOf(id);
    if (tier > 0 && !c.abilities.includes(line.list[tier - 1])) return 'locked';
    if (c.lvl < D.TIER_LEVEL[tier]) return 'locked';
    return 'open';
  };
  const lineOf = id => Object.entries(D.LINES).find(([, l]) => l.list.includes(id));

  const skillCap = c => Math.min(4, 1 + Math.floor((c.lvl - 1) / 3) + (c.lvl >= 2 ? 1 : 0));

  const skillPointsAt = (cls, lvl) => (cls === 'rogue' ? (lvl % 2 === 1 ? 1 : 0) : (lvl % 3 === 1 ? 1 : 0));

  const gainXp = (c, n) => {
    if (c.dead && c.kind !== 'pc') return 0;
    c.xp += n;
    let ups = 0;
    while (c.xp >= D.xpForLevel(c.lvl + 1)) {
      c.lvl++;
      ups++;
      c.points.attr += 3;
      c.points.talent += 1;
      c.points.skill += skillPointsAt(c.cls, c.lvl);
      const before = c.stats.hpMax;
      recalc(c);
      c.hp = Math.min(c.stats.hpMax, c.hp + (c.stats.hpMax - before) + Math.round(c.stats.hpMax * 0.25));
    }
    return ups;
  };

  const spendAttr = (c, k) => {
    if (c.points.attr <= 0 || !ATTR_KEYS.includes(k)) return false;
    c.base[k]++; c.points.attr--;
    const r = c.hp / c.stats.hpMax;
    recalc(c);
    c.hp = Math.round(c.stats.hpMax * r);
    return true;
  };
  const learnAbility = (c, id) => {
    if (c.points.talent <= 0 || abilityState(c, id) !== 'open') return false;
    c.abilities.push(id);
    c.points.talent--;
    recalc(c);
    return true;
  };
  const raiseSkill = (c, id) => {
    const r = c.skills[id] || 0;
    if (c.points.skill <= 0 || r >= 4 || r >= skillCap(c)) return false;
    c.skills[id] = r + 1;
    c.points.skill--;
    recalc(c);
    return true;
  };

  const BUILDS = {
    warrior: { attr: ['str', 'str', 'con', 'dex', 'str', 'wil'], skill: ['combat_training', 'combat_tactics', 'coercion', 'survival'], ab: ['shield_bash', 'powerful', 'shield_defense', 'precise_striking', 'threaten', 'taunt', 'shield_pummel', 'bravery', 'pommel_strike', 'indomitable', 'assault', 'disengage'] },
    warrior2h: { attr: ['str', 'str', 'con', 'dex', 'str', 'wil'], skill: ['combat_training', 'combat_tactics', 'survival', 'coercion'], ab: ['pommel_strike', 'powerful', 'indomitable', 'precise_striking', 'sunder_arms', 'threaten', 'critical_strike', 'bravery', 'taunt', 'death_blow'] },
    rogue: { attr: ['dex', 'dex', 'cun', 'str', 'dex', 'con'], skill: ['coercion', 'combat_training', 'stealing', 'herbalism', 'poison', 'combat_tactics'], ab: ['dirty_fighting', 'dual_training', 'below_belt', 'dual_striking', 'stealth', 'deadly_strike', 'riposte', 'combat_movement', 'flurry', 'lethality', 'evasion', 'deft_hands'] },
    archer: { attr: ['dex', 'dex', 'cun', 'dex', 'wil', 'con'], skill: ['coercion', 'combat_training', 'herbalism', 'combat_tactics', 'survival'], ab: ['pinning_shot', 'aim', 'dirty_fighting', 'rapid_shot', 'below_belt', 'crippling_shot', 'deadly_strike', 'stealth', 'lethality'] },
    mage: { attr: ['mag', 'mag', 'wil', 'mag', 'con', 'mag'], skill: ['herbalism', 'combat_training', 'coercion', 'combat_tactics'], ab: ['heal', 'winters_grasp', 'flame_blast', 'rejuvenate', 'stonefist', 'rock_armor', 'drain_life', 'mind_blast', 'fireball', 'heroic_offense', 'cone_of_cold', 'sleep', 'spell_wisp', 'haste'] },
    witch: { attr: ['mag', 'mag', 'wil', 'mag', 'con', 'mag'], skill: ['herbalism', 'survival', 'combat_tactics', 'coercion'], ab: ['winters_grasp', 'rock_armor', 'stonefist', 'drain_life', 'disorient', 'weakness', 'frost_weapons', 'cone_of_cold', 'horror', 'sleep', 'earthquake', 'fireball'] },
    dog: { attr: ['str', 'con', 'str', 'dex', 'con', 'wil'], skill: [], ab: ['overwhelm', 'howl', 'shred', 'fortitude'] }
  };
  const buildFor = c => {
    if (c.build && BUILDS[c.build]) return BUILDS[c.build];
    if (c.look.kind === 'dog') return BUILDS.dog;
    if (c.cls === 'mage') return BUILDS.mage;
    const s = style(c);
    if (c.cls === 'warrior') return s === '2h' ? BUILDS.warrior2h : BUILDS.warrior;
    return s === 'bow' ? BUILDS.archer : BUILDS.rogue;
  };
  const autoLevel = c => {
    const b = buildFor(c);
    let i = 0;
    while (c.points.attr > 0 && i < 200) {
      const k = b.attr[i % b.attr.length];
      spendAttr(c, k);
      i++;
    }
    let guard = 0;
    while (c.points.talent > 0 && guard++ < 40) {
      const next = b.ab.find(id => abilityState(c, id) === 'open');
      if (!next) {
        const any = Object.keys(D.AB).find(id => abilityState(c, id) === 'open');
        if (!any || !learnAbility(c, any)) break;
      } else learnAbility(c, next);
    }
    guard = 0;
    while (c.points.skill > 0 && guard++ < 20) {
      const s = b.skill.find(id => (c.skills[id] || 0) < skillCap(c)) || D.SKILL_IDS.find(id => (c.skills[id] || 0) < skillCap(c));
      if (!s || !raiseSkill(c, s)) break;
    }
  };

  const hitChance = (atk, def) => clamp(72 + (atk - def), 5, 97);
  const resistChance = (target, kind, power) => {
    if (kind === 'none') return 0;
    const s = target.stats;
    const base = kind === 'ment' ? s.resMent : s.resPhys;
    const rankB = { critter: -10, normal: 0, lt: 12, elite: 22, boss: 35 }[target.rank] || 0;
    return clamp(base + rankB + 15 - power, 0, 92);
  };

  const skillScore = (c, kind) => {
    const r = c.skills.coercion || 0;
    const a = c.stats.a;
    if (kind === 'intimidate') return r * 2 + Math.floor((a.str - 10) / 2);
    return r * 2 + Math.floor((a.cun - 10) / 2);
  };
  const lockPower = c => c.stats.lock;

  const startingPlayer = (o) => {
    const race = D.RACES[o.race], cls = D.CLASSES[o.cls];
    const base = blankAttr(10);
    addTo(base, race.attr);
    addTo(base, cls.attr);
    if (o.alloc) addTo(base, o.alloc);
    const c = makeCreature({ key: 'pc', kind: 'pc', name: o.name, race: o.race, cls: o.cls, sex: o.sex, model: Object.assign({ kind: 'humanoid', race: o.race, sex: o.sex }, o.look || {}), lvl: 1, attr: base, faction: 'party' });
    c.skills = Object.assign({}, o.skills || {});
    c.abilities = (o.abilities || []).slice();
    c.points = { attr: 0, skill: 0, talent: 0 };
    recalc(c);
    c.hp = c.stats.hpMax; c.mp = c.stats.mpMax;
    return c;
  };

  const serializeCreature = c => ({
    uid: c.uid, key: c.key, kind: c.kind, name: c.name, race: c.race, cls: c.cls, sex: c.sex, look: c.look, lvl: c.lvl, xp: c.xp, base: c.base, points: c.points,
    skills: c.skills, abilities: c.abilities, equip: c.equip, set2: c.set2, activeSet: c.activeSet, hp: c.hp, mp: c.mp, injuries: c.injuries, tactics: c.tactics,
    behavior: c.behavior, tacticsOn: c.tacticsOn, sustained: c.sustained, build: c.build || null, approval: c.approval || 0, faction: c.faction, radius: c.radius, nat: c.nat || null
  });
  const restoreCreature = s => {
    const c = makeCreature({ key: s.key, kind: s.kind, name: s.name, race: s.race, cls: s.cls, sex: s.sex, model: s.look, lvl: s.lvl, attr: s.base, equip: s.equip, faction: s.faction, nat: s.nat });
    Object.assign(c, { xp: s.xp, points: s.points, skills: s.skills, abilities: s.abilities, set2: s.set2 || { main: null, off: null }, activeSet: s.activeSet || 0, injuries: s.injuries || [], tactics: s.tactics, behavior: s.behavior || 'default', tacticsOn: s.tacticsOn !== false, sustained: s.sustained || [], build: s.build, approval: s.approval || 0, radius: s.radius || c.radius });
    recalc(c);
    c.hp = Math.min(s.hp, c.stats.hpMax); c.mp = Math.min(s.mp, c.stats.mpMax);
    return c;
  };

  Object.assign(D, {
    ATTR_KEYS, EQUIP_SLOTS, makeCreature, fromTemplate, recalc, mainWeapon, offItem, style, isRanged, canEquip, slotFits, meetsReq, abilityState, lineOf,
    skillCap, gainXp, spendAttr, learnAbility, raiseSkill, autoLevel, BUILDS, hitChance, resistChance, skillScore, lockPower, startingPlayer,
    serializeCreature, restoreCreature, addMods: addTo
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
