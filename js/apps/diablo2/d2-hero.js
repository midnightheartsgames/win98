(function (D) {
  'use strict';
  const { CLASSES, SKILLS, BASES, SETS, SET_ITEMS, ATK, clamp } = D;

  const SLOTS = ['head', 'neck', 'body', 'rh', 'lh', 'rh2', 'lh2', 'gloves', 'belt', 'feet', 'ring1', 'ring2'];
  const SLOT_NAMES = { head: 'Голова', neck: 'Шея', body: 'Тело', rh: 'Правая рука', lh: 'Левая рука', gloves: 'Руки', belt: 'Пояс', feet: 'Ноги', ring1: 'Кольцо', ring2: 'Кольцо' };
  const INV_W = 10, INV_H = 4, STASH_W = 6, STASH_H = 8;
  const RES_PENALTY = [0, -40, -100];

  function xpFor(L) {
    if (L <= 1) return 0;
    return Math.floor(110 * Math.pow(L - 1, 2.35) * (1 + Math.max(0, L - 50) * 0.06));
  }

  function slotAccepts(slot, b) {
    if (!b) return false;
    switch (slot) {
      case 'head': return b.type === 'helm' || b.type === 'circlet';
      case 'neck': return b.type === 'amulet';
      case 'body': return b.type === 'body';
      case 'gloves': return b.type === 'gloves';
      case 'belt': return b.type === 'belt';
      case 'feet': return b.type === 'boots';
      case 'ring1': case 'ring2': return b.type === 'ring';
      case 'rh': case 'rh2': return b.cat === 'weapon' || b.type === 'questweapon' || b.id === 'q_malus';
      case 'lh': case 'lh2': return b.type === 'shield' || b.type === 'quiver' || b.cat === 'weapon';
    }
    return false;
  }

  function newChar(name, cls, hc) {
    const C = CLASSES[cls];
    const ch = {
      v: 1, name, cls, hc: !!hc, dead: false, level: 1, xp: 0, gold: 0, stash: { items: [], gold: 0 },
      stats: { str: C.str, dex: C.dex, vit: C.vit, ene: C.ene }, statPts: 0, skillPts: 0, skills: {},
      left: 'attack', right: 'attack', hot: {}, swap: 0, inv: [], equip: {}, belt: [],
      prog: [{ q: {}, wp: { town: 1 } }, { q: {}, wp: { town: 1 } }, { q: {}, wp: { town: 1 } }], maxDiff: 0,
      merc: null, corpse: null, life: null, mana: null, stamina: null, time: 0, created: Date.now(), seen: {}, runOn: true
    };
    const w = D.makeItem(C.start[0][0], C.start[0][1]);
    ch.equip.rh = w;
    if (C.start[1]) ch.equip.lh = D.makeItem(C.start[1][0], C.start[1][1]);
    for (let i = 0; i < 4; i++) ch.belt[i] = D.makeItem('hp1');
    const grid = invGrid(ch);
    grid.add(D.makeItem('tp_scroll'));
    grid.add(D.makeItem('id_scroll'));
    ch.inv = grid.items;
    return ch;
  }

  function invGrid(ch) {
    const g = new D.Grid(INV_W, INV_H);
    g.items = ch.inv;
    return g;
  }

  function stashGrid(ch) {
    const g = new D.Grid(STASH_W, STASH_H);
    g.items = ch.stash.items;
    return g;
  }

  function beltRows(ch) {
    const b = ch.equip.belt;
    return b ? BASES[b.base].rows || 1 : 1;
  }

  function activeHands(ch) {
    return ch.swap ? { rh: ch.equip.rh2, lh: ch.equip.lh2 } : { rh: ch.equip.rh, lh: ch.equip.lh };
  }

  function weaponClass(b) {
    if (!b) return 'hand';
    if (b.type === 'bow') return 'bow';
    if (b.type === 'xbow') return 'xbow';
    if (b.type === 'claw') return 'claw';
    if (b.type === 'staff') return 'staff';
    if (b.type === 'dagger' || b.type === 'javelin') return 'thrust';
    if (b.type === 'spear' || b.type === 'polearm') return 'pole';
    if (b.hands === 2) return 'twohand';
    return 'swing';
  }

  function eqItems(ch) {
    const h = activeHands(ch);
    const out = [];
    for (const s of ['head', 'neck', 'body', 'gloves', 'belt', 'feet', 'ring1', 'ring2']) if (ch.equip[s]) out.push([s, ch.equip[s]]);
    if (h.rh) out.push(['rh', h.rh]);
    if (h.lh) out.push(['lh', h.lh]);
    return out;
  }

  function setCounts(items) {
    const c = {};
    for (const it of items) if (it.q === 'set') { const s = SET_ITEMS[it.setItem].set; c[s] = (c[s] || 0) + 1; }
    return c;
  }

  function reqOk(ch, it, st) {
    const r = D.reqs(it);
    if (r.cls && r.cls !== ch.cls) return false;
    return ch.level >= r.lvl && st.str >= r.str && st.dex >= r.dex;
  }

  function sumStats(items) {
    const s = {};
    for (const it of items) { const e = D.effectiveStats(it); for (const k in e) D.addStat(s, k, e[k]); }
    return s;
  }

  function skillBonus(ch, sums, id) {
    const sk = SKILLS[id];
    if (!sk) return 0;
    let b = 0;
    if (sk.cls === ch.cls) {
      b += sums.allSkills || 0;
      b += sums['cls:' + ch.cls] || 0;
      b += sums['tree:' + ch.cls + ':' + sk.tree] || 0;
    }
    b += sums['sk:' + id] || 0;
    return b;
  }

  function skillLevel(hero, id) {
    const ch = hero.char;
    const hard = ch.skills[id] || 0;
    const st = hero.st;
    const specific = st && st.sums ? st.sums['sk:' + id] || 0 : 0;
    if (!hard && !specific) return 0;
    if (!hard) return specific + (st.shrineSkill || 0);
    return hard + (st && st.sums ? skillBonus(ch, st.sums, id) : 0) + (st ? st.shrineSkill || 0 : 0);
  }

  function effPct(v, k) { return v > 0 ? k * v / (k + v) / 100 : v / 100; }

  function recalc(hero, g) {
    const ch = hero.char;
    const C = CLASSES[ch.cls];
    let items = eqItems(ch).map(x => x[1]);
    const charms = ch.inv.filter(it => BASES[it.base].cat === 'charm');
    let base = { str: ch.stats.str, dex: ch.stats.dex, vit: ch.stats.vit, ene: ch.stats.ene };
    let active = items;
    for (let pass = 0; pass < 3; pass++) {
      const s0 = sumStats(active.concat(charms));
      const st0 = { str: base.str + (s0.str || 0), dex: base.dex + (s0.dex || 0) };
      const next = items.filter(it => reqOk(ch, it, st0));
      if (next.length === active.length) break;
      active = next;
    }
    hero.inactive = new Set(items.filter(it => !active.includes(it)).map(it => it.uid));
    const sums = sumStats(active.concat(charms));
    const sc = setCounts(active);
    for (const it of active) if (it.q === 'set') {
      const si = SET_ITEMS[it.setItem];
      const n = sc[si.set];
      for (const k in si.part) if (n >= +k) for (const s in si.part[k]) D.addStat(sums, s, si.part[k][s]);
    }
    for (const sid in sc) {
      const set = SETS.find(s => s.id === sid);
      for (const k in set.bonus) if (sc[sid] >= +k) for (const s in set.bonus[k]) D.addStat(sums, s, Array.isArray(set.bonus[k][s]) ? set.bonus[k][s].slice() : set.bonus[k][s]);
    }
    const st = { sums, setCounts: sc };
    hero.st = st;
    const buffs = hero.fx && hero.fx.buffs ? hero.fx.buffs : {};
    const auraFx = hero.auraFx || {};
    st.shrineSkill = buffs.shrine_skill ? 2 : 0;
    const L = id => skillLevel(hero, id);
    st.str = base.str + (sums.str || 0);
    st.dex = base.dex + (sums.dex || 0);
    st.vit = base.vit + (sums.vit || 0);
    st.ene = base.ene + (sums.ene || 0);
    const lvl = ch.level;
    let life = C.life + (lvl - 1) * C.lvlLife + (st.vit - C.vit) * C.vitLife + (sums.life || 0);
    let mana = C.mana + (lvl - 1) * C.lvlMana + (st.ene - C.ene) * C.eneMana + (sums.mana || 0);
    let stam = C.stamina + (lvl - 1) * C.lvlStam + (st.vit - C.vit) * C.vitStam + (sums.stamina || 0);
    let lifePct = 0, manaPct = sums.manaPct || 0, stamPct = 0;
    if (buffs.battle_orders) { lifePct += buffs.battle_orders.val; manaPct += buffs.battle_orders.val; stamPct += buffs.battle_orders.val; }
    if (auraFx.oak) lifePct += auraFx.oak;
    const form = hero.form;
    if (form) {
      const fl = val1('lycanthropy', 'formLife', L('lycanthropy'));
      lifePct += fl;
      if (form === 'bear') lifePct += D.sval(SKILLS.werebear, 'lifePct', L('werebear'));
    }
    st.lifeMax = Math.max(1, Math.round(life * (1 + lifePct / 100)));
    st.manaMax = Math.max(0, Math.round(mana * (1 + manaPct / 100)));
    st.stamMax = Math.round(stam * (1 + stamPct / 100));
    const pas = { ar: 0, arPct: 0, ed: 0, crit: 0, edef: 0, resAll: 0, dodge: 0, clawBlock: 0 };
    const hands = activeHands(ch);
    const rh = hands.rh && active.includes(hands.rh) ? hands.rh : null;
    const lh = hands.lh && active.includes(hands.lh) ? hands.lh : null;
    const rb = rh ? BASES[rh.base] : null;
    const lb = lh ? BASES[lh.base] : null;
    const wtypes = [rb && rb.cat === 'weapon' ? rb.type : null, lb && lb.cat === 'weapon' ? lb.type : null].filter(Boolean);
    for (const sk of D.classSkills(ch.cls)) {
      if (sk.kind !== 'passive') continue;
      const sl = L(sk.id);
      if (!sl) continue;
      if (sk.weapons && !sk.weapons.some(t => wtypes.includes(t))) continue;
      for (const k in sk.fx) pas[k] = (pas[k] || 0) + D.val(sk.fx[k], sl);
    }
    st.pas = pas;
    st.crit = pas.crit || 0;
    st.dodge = pas.dodge || 0;
    st.clawBlock = rb && rb.type === 'claw' ? pas.clawBlock || 0 : 0;
    st.skelLife = pas.skelLife || 0;
    st.skelDmg = pas.skelDmg || 0;
    let arPct = (sums.arPct || 0) + (pas.arPct || 0) + (auraFx.arPct || 0);
    if (form === 'wolf') arPct += D.sval(SKILLS.werewolf, 'ar', L('werewolf'));
    if (auraFx.wolverineAr) arPct += auraFx.wolverineAr;
    st.ar = Math.max(1, Math.round(((st.dex - 7) * 5 + C.arBonus + (sums.ar || 0) + (pas.ar || 0)) * (1 + arPct / 100)));
    let def = Math.floor(st.dex / 4);
    for (const it of active) if (BASES[it.base].def) def += D.armorDefense(it);
    let nonArmorDef = 0;
    for (const it of active) { const b = BASES[it.base]; if (!b.def && it.stats.def) nonArmorDef += it.stats.def; }
    def += nonArmorDef;
    let edef = (pas.edef || 0) + (auraFx.edef || 0);
    if (buffs.frozen_armor) edef += buffs.frozen_armor.edef;
    if (buffs.shout) edef += buffs.shout.val;
    if (buffs.holy_shield) edef += buffs.holy_shield.edef;
    if (buffs.shrine_armor) edef += 100;
    if (form === 'bear') edef += D.sval(SKILLS.werebear, 'edef', L('werebear'));
    st.def = Math.max(0, Math.round(def * (1 + edef / 100)));
    let block = 0;
    if (lb && lb.type === 'shield') {
      const bb = (lb.block || 0) + (sums.block || 0) + (buffs.holy_shield ? buffs.holy_shield.block : 0) + (ch.cls === 'paladin' ? 10 : 0);
      block = Math.max(0, bb * (st.dex - 15) / (lvl * 2));
    }
    st.block = clamp(block, 0, 75);
    st.shield = !!(lb && lb.type === 'shield');
    const pen = RES_PENALTY[g ? g.diff : 0];
    const resAll = (sums.resAll || 0) + (pas.resAll || 0) + (buffs.fade ? buffs.fade.val : 0) + (buffs.shrine_resist ? 50 : 0);
    st.res = {
      f: Math.min(75, pen + (sums.resF || 0) + resAll), c: Math.min(75, pen + (sums.resC || 0) + resAll),
      l: Math.min(75, pen + (sums.resL || 0) + resAll), p: Math.min(75, pen + (sums.resP || 0) + resAll), ph: 0, m: 0
    };
    st.ias = (sums.ias || 0) + (buffs.burst ? buffs.burst.ias : 0) + (auraFx.ias || 0) + (form === 'wolf' ? D.sval(SKILLS.werewolf, 'ias', L('werewolf')) : 0);
    st.fcr = sums.fcr || 0;
    st.fhr = sums.fhr || 0;
    st.frw = (sums.frw || 0) + (buffs.burst ? buffs.burst.frw : 0) + (auraFx.frw || 0);
    st.mf = (sums.mf || 0);
    st.gf = (sums.gf || 0);
    st.ll = sums.ll || 0; st.ml = sums.ml || 0;
    st.cb = sums.cb || 0; st.ds = sums.dstrike || 0; st.ow = sums.ow || 0;
    st.thorns = sums.thorns || 0;
    st.regen = sums.regen || 0;
    st.manaRegen = (sums.manaRegen || 0) + (auraFx.manaRegen || 0) + (buffs.shrine_mana ? 400 : 0);
    st.lr = Math.max(2, (g && g.area && g.area.theme ? g.area.theme.light || 9 : 9) + (sums.lr || 0) * 0.6);
    st.lak = sums.lak || 0; st.mak = sums.mak || 0;
    st.dr = sums.dr || 0; st.mdr = sums.mdr || 0;
    st.cbf = !!sums.cbf; st.hfd = !!sums.hfd;
    st.kb = !!sums.kb; st.itd = !!sums.itd; st.itdPct = sums.itdPct || 0;
    st.flee = sums.flee || 0; st.freeze = sums.freeze || 0; st.pierce = sums.pierce || 0;
    st.undead = sums.undead || 0;
    st.add = {
      fire: sums.fireDmg || null, cold: sums.coldDmg || null, light: sums.lightDmg || null,
      poison: sums.poisonDmg || 0, magic: sums.magicDmg || null
    };
    st.ed = (pas.ed || 0) + (auraFx.ed || 0) + (buffs.shrine_combat ? 200 : 0) + (form === 'bear' ? D.sval(SKILLS.werebear, 'ed', L('werebear')) : 0) + (auraFx.wolverineEd || 0);
    st.aura = sums.aura ? { id: sums.aura, lvl: sums.auraLvl || 1 } : null;
    st.wclass = form ? 'claw' : weaponClass(rb);
    st.rb = rb; st.lb = lb; st.rh = rh; st.lh = lh;
    st.dual = !!(rb && lb && lb.cat === 'weapon' && rb.cat === 'weapon');
    const wd = rh && rb.dmg ? D.weaponDamage(rh) : (rh && BASES[rh.base].type === 'questweapon' ? { min: 2, max: 8 } : { min: 1, max: 2 });
    st.wdmg = wd;
    const strB = rb && (rb.type === 'bow' || rb.type === 'xbow') ? 0 : (rb && (rb.type === 'dagger' || rb.type === 'javelin' || rb.type === 'claw') ? 0.75 : 1);
    const dexB = rb && (rb.type === 'bow' || rb.type === 'xbow') ? 1 : (rb && (rb.type === 'dagger' || rb.type === 'javelin' || rb.type === 'claw') ? 0.75 : 0);
    st.statDmgPct = st.str * strB + st.dex * dexB;
    st.throwStat = st.str * 0.75 + st.dex * 0.75;
    const base0 = rb ? (ATK[rb.type] || 0.6) * (1 + (rb.wsm || 0) / 100) : 0.55;
    const effIas = effPct(st.ias + (auraFx.fanatIas || 0), 120);
    st.atkDur = Math.max(0.24, (form === 'wolf' ? 0.5 : form === 'bear' ? 0.7 : base0) / (1 + effIas));
    st.castDur = Math.max(0.28, C.cast / (1 + effPct(st.fcr, 120)));
    st.hitDur = Math.max(0.12, C.fhr / (1 + effPct(st.fhr, 120)));
    const frwK = 1 + effPct(st.frw, 150);
    st.walk = 3.1 * frwK;
    st.run = 5.0 * frwK;
    st.ranged = !form && !!(rb && (rb.type === 'bow' || rb.type === 'xbow'));
    st.throwable = !form && !!(rb && rb.throwable);
    st.ammo = st.ranged ? (lh && BASES[lh.base].type === 'quiver' && BASES[lh.base].ammo === rb.type ? lh : null) : null;
    hero.hpMax = st.lifeMax;
    hero.mpMax = st.manaMax;
    hero.spMax = st.stamMax;
    if (hero.hp > hero.hpMax) hero.hp = hero.hpMax;
    if (hero.mp > hero.mpMax) hero.mp = hero.mpMax;
    if (hero.sp > hero.spMax) hero.sp = hero.spMax;
    hero.lvl = lvl;
    hero.lightR = st.lr;
    return st;
  }

  function val1(skillId, key, L) {
    const sk = SKILLS[skillId];
    if (!sk || !L) return 0;
    return D.val(sk.fx[key], L);
  }

  function canEquip(ch, it, slot, st) {
    const b = BASES[it.base];
    if (!slotAccepts(slot, b)) return false;
    const r = D.reqs(it);
    if (r.cls && r.cls !== ch.cls) return false;
    if ((slot === 'lh' || slot === 'lh2') && b.cat === 'weapon') {
      if (!(ch.cls === 'barbarian' || ch.cls === 'assassin')) return false;
      if (b.hands === 2) return false;
      if (ch.cls === 'assassin' && b.type !== 'claw') return false;
      const rh = ch.equip[slot === 'lh' ? 'rh' : 'rh2'];
      if (rh && BASES[rh.base].hands === 2) return false;
    }
    if (slot === 'lh' || slot === 'lh2') {
      const rh = ch.equip[slot === 'lh' ? 'rh' : 'rh2'];
      if (rh && BASES[rh.base].hands === 2 && b.type !== 'quiver') return false;
      if (b.type === 'quiver' && !(rh && BASES[rh.base].type === (b.ammo === 'bow' ? 'bow' : 'xbow'))) return false;
    }
    return true;
  }

  function equipSwapOut(ch, it, slot) {
    const out = [];
    const b = BASES[it.base];
    if (ch.equip[slot]) out.push(ch.equip[slot]);
    if ((slot === 'rh' || slot === 'rh2') && b.hands === 2) {
      const ls = slot === 'rh' ? 'lh' : 'lh2';
      const l = ch.equip[ls];
      if (l && !(BASES[l.base].type === 'quiver' && (b.type === 'bow' || b.type === 'xbow'))) out.push(l);
    }
    return out;
  }

  function beltAccept(b) { return b.type === 'hpot' || b.type === 'mpot' || b.type === 'rpot' || (b.type === 'scroll'); }

  function beltAdd(ch, it) {
    const b = BASES[it.base];
    if (!beltAccept(b)) return false;
    const rows = beltRows(ch);
    for (let c = 0; c < 4; c++) {
      let top = -1;
      for (let r = 0; r < rows; r++) if (ch.belt[r * 4 + c]) top = r;
      const bottom = ch.belt[c];
      if (top === -1 || (top < rows - 1 && bottom && BASES[bottom.base].type === b.type && bottom.base === it.base)) {
        ch.belt[(top + 1) * 4 + c] = it;
        return true;
      }
    }
    for (let c = 0; c < 4; c++) {
      let top = -1;
      for (let r = 0; r < rows; r++) if (ch.belt[r * 4 + c]) top = r;
      if (top < rows - 1) { ch.belt[(top + 1) * 4 + c] = it; return true; }
    }
    return false;
  }

  function beltTake(ch, col) {
    const it = ch.belt[col];
    if (!it) return null;
    const rows = beltRows(ch);
    for (let r = 0; r < rows - 1; r++) ch.belt[r * 4 + col] = ch.belt[(r + 1) * 4 + col];
    ch.belt[(rows - 1) * 4 + col] = undefined;
    return it;
  }

  function beltCompact(ch) {
    const rows = beltRows(ch);
    const over = [];
    for (let c = 0; c < 4; c++) {
      const col = [];
      for (let r = 0; r < 4; r++) if (ch.belt[r * 4 + c]) col.push(ch.belt[r * 4 + c]);
      for (let r = 0; r < 4; r++) ch.belt[r * 4 + c] = r < rows ? col[r] : undefined;
      for (let r = rows; r < col.length; r++) over.push(col[r]);
    }
    return over;
  }

  function goldMax(ch) { return ch.level * 10000; }

  function serializeChar(ch) {
    const c = JSON.parse(JSON.stringify(Object.assign({}, ch, { inv: [], equip: {}, belt: [], stash: { gold: ch.stash.gold, items: [] }, corpse: null })));
    c.inv = ch.inv.map(D.serialize);
    for (const s in ch.equip) if (ch.equip[s]) c.equip[s] = D.serialize(ch.equip[s]);
    c.belt = ch.belt.map(it => it ? D.serialize(it) : null);
    c.stash.items = ch.stash.items.map(D.serialize);
    if (ch.corpse) c.corpse = { diff: ch.corpse.diff, equip: Object.fromEntries(Object.entries(ch.corpse.equip).filter(([, v]) => v).map(([k, v]) => [k, D.serialize(v)])) };
    return c;
  }

  function deserializeChar(o) {
    const ch = Object.assign({}, o);
    ch.inv = (o.inv || []).map(D.deserialize).filter(Boolean);
    ch.equip = {};
    for (const s in o.equip || {}) { const it = D.deserialize(o.equip[s]); if (it) ch.equip[s] = it; }
    ch.belt = (o.belt || []).map(x => x ? D.deserialize(x) : undefined);
    ch.stash = { gold: (o.stash && o.stash.gold) || 0, items: ((o.stash && o.stash.items) || []).map(D.deserialize).filter(Boolean) };
    if (o.corpse) { ch.corpse = { diff: o.corpse.diff, equip: {} }; for (const s in o.corpse.equip) { const it = D.deserialize(o.corpse.equip[s]); if (it) ch.corpse.equip[s] = it; } }
    ch.prog = ch.prog || [{ q: {}, wp: { town: 1 } }, { q: {}, wp: { town: 1 } }, { q: {}, wp: { town: 1 } }];
    ch.hot = ch.hot || {};
    ch.seen = ch.seen || {};
    return ch;
  }

  Object.assign(D, {
    SLOTS, SLOT_NAMES, INV_W, INV_H, STASH_W, STASH_H, RES_PENALTY, xpFor, slotAccepts, newChar, invGrid, stashGrid, beltRows, activeHands,
    weaponClass, eqItems, recalc, skillLevel, skillBonus, canEquip, equipSwapOut, beltAdd, beltTake, beltCompact, beltAccept, goldMax, serializeChar, deserializeChar, effPct, reqOk
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
