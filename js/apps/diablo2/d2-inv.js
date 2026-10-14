(function (D) {
  'use strict';
  const { BASES, SKILLS, CLASSES } = D;
  const G = D.Game.prototype;

  G.gridOf = function (where) {
    return where === 'stash' ? D.stashGrid(this.char) : D.invGrid(this.char);
  };

  G.take = function (it, where) {
    if (this.held) return false;
    const ch = this.char;
    if (where === 'inv' || where === 'stash') {
      const g = this.gridOf(where);
      if (!g.remove(it)) return false;
      this.held = it;
      if (BASES[it.base].cat === 'charm' && where === 'inv') this.recalc();
      this.sfx('item_up', 0, 0);
      return true;
    }
    if (where === 'belt') {
      const i = ch.belt.indexOf(it);
      if (i < 0) return false;
      ch.belt[i] = undefined;
      D.beltCompact(ch);
      this.held = it;
      return true;
    }
    return this.unequip(where);
  };

  G.place = function (where, x, y) {
    const it = this.held;
    if (!it) return false;
    const ch = this.char;
    const g = this.gridOf(where);
    const b = BASES[it.base];
    if (x < 0 || y < 0 || x + b.w > g.w || y + b.h > g.h) return false;
    const over = g.overlaps(it, x, y);
    if (over.length === 0) {
      g.add(it, x, y);
      this.held = null;
      this.sfx('item_down', 0, 0);
      if (b.cat === 'charm') this.recalc();
      return true;
    }
    if (over.length > 1) return false;
    const o = over[0];
    const ob = BASES[o.base];
    if ((b.type === 'gem' || b.type === 'rune') && D.canSocket(o, it) && where === 'inv') {
      const rw = D.socketInto(o, it);
      this.held = null;
      this.sfx('socket', 0, 0);
      if (rw) { this.msg('Рунное слово «' + rw.name + '» создано!', D.COL.gold); this.sfx('runeword', 0, 0); }
      return true;
    }
    if (b.type === 'scroll' && ob.type === 'tome' && ob.spell === b.spell && o.qty < ob.maxQty) {
      o.qty++;
      this.held = null;
      this.sfx('item_down', 0, 0);
      return true;
    }
    if (D.isStackable(b) && o.base === it.base && o.qty < ob.maxQty) {
      const mv = Math.min(ob.maxQty - o.qty, it.qty);
      o.qty += mv; it.qty -= mv;
      if (it.qty <= 0) this.held = null;
      return true;
    }
    g.remove(o);
    g.add(it, x, y);
    this.held = o;
    this.sfx('item_down', 0, 0);
    if (b.cat === 'charm' || ob.cat === 'charm') this.recalc();
    return true;
  };

  G.reqsMet = function (it) {
    const r = D.reqs(it);
    const st = this.hero.st;
    if (r.cls && r.cls !== this.char.cls) return false;
    return this.char.level >= r.lvl && st.str >= r.str && st.dex >= r.dex;
  };

  G.equipHeld = function (slot) {
    const it = this.held;
    if (!it) return false;
    const ch = this.char;
    let s = slot;
    if (s === 'rh' && ch.swap) s = 'rh2';
    if (s === 'lh' && ch.swap) s = 'lh2';
    const b = BASES[it.base];
    if (!D.slotAccepts(s, b)) return false;
    if (!D.canEquip(ch, it, s)) { this.overhead('Нельзя надеть'); this.sfx('cant', 0, 0); return false; }
    if (!this.reqsMet(it)) { this.overhead('Не могу это использовать'); this.sfx('cant', 0, 0); return false; }
    const out = D.equipSwapOut(ch, it, s);
    if (out.length > 1) {
      const g = D.invGrid(ch);
      const extra = out[1];
      if (!g.add(extra)) { this.overhead('Нет места'); return false; }
      for (const k in ch.equip) if (ch.equip[k] === extra) delete ch.equip[k];
    }
    const prev = ch.equip[s] || null;
    ch.equip[s] = it;
    this.held = prev;
    if (s === 'belt') this.fixBelt();
    this.recalc();
    this.sfx('equip_' + (b.cat === 'weapon' ? 'weapon' : b.type === 'ring' || b.type === 'amulet' ? 'jewel' : 'armor'), 0, 0);
    return true;
  };

  G.unequip = function (slot) {
    if (this.held) return false;
    const ch = this.char;
    let s = slot;
    if (s === 'rh' && ch.swap) s = 'rh2';
    if (s === 'lh' && ch.swap) s = 'lh2';
    const it = ch.equip[s];
    if (!it) return false;
    delete ch.equip[s];
    this.held = it;
    if (s === 'belt') this.fixBelt();
    this.recalc();
    this.sfx('item_up', 0, 0);
    return true;
  };

  G.fixBelt = function () {
    const over = D.beltCompact(this.char);
    const g = D.invGrid(this.char);
    for (const it of over) if (!g.add(it)) this.dropItem(it, this.hero.x, this.hero.y);
  };

  G.dropHeld = function () {
    const it = this.held;
    if (!it) return false;
    const h = this.hero;
    this.held = null;
    this.dropItem(it, h.x + Math.cos(h.dir) * 0.6, h.y + Math.sin(h.dir) * 0.6);
    return true;
  };

  G.beltPut = function (idx) {
    const it = this.held;
    const ch = this.char;
    if (!it) return false;
    const b = BASES[it.base];
    if (!D.beltAccept(b)) return false;
    const rows = D.beltRows(ch);
    const col = idx % 4;
    const cur = ch.belt[idx];
    if (cur) { ch.belt[idx] = it; this.held = cur; return true; }
    for (let r = 0; r < rows; r++) if (!ch.belt[r * 4 + col]) { ch.belt[r * 4 + col] = it; this.held = null; this.sfx('item_down', 0, 0); return true; }
    return false;
  };

  G.toBelt = function (it) {
    const ch = this.char;
    if (!D.beltAccept(BASES[it.base])) return false;
    const g = D.invGrid(ch);
    if (!g.items.includes(it)) return false;
    g.remove(it);
    if (!D.beltAdd(ch, it)) { g.add(it, it.x, it.y); return false; }
    this.sfx('item_down', 0, 0);
    return true;
  };

  G.drink = function (it) {
    const h = this.hero;
    const b = BASES[it.base];
    if (b.rejuv) { h.hp = Math.min(h.hpMax, h.hp + h.hpMax * b.rejuv); h.mp = Math.min(h.mpMax, h.mp + h.mpMax * b.rejuv); }
    else if (b.heal) h.pots.push({ hp: b.heal, dur: 4, t: 4 });
    else if (b.mana) h.pots.push({ mp: b.mana, dur: 3, t: 3 });
    this.sfx('potion', h.x, h.y);
  };

  G.beltUse = function (col) {
    if (this.hero.dead) return false;
    const it = D.beltTake(this.char, col);
    if (!it) return false;
    const b = BASES[it.base];
    if (b.type === 'scroll') return this.readScroll(it) || true;
    this.drink(it);
    return true;
  };

  G.readScroll = function (it) {
    const b = BASES[it.base];
    if (b.spell === 'tp') return this.castTownPortal();
    if (b.spell === 'id') { this.cursorMode = { k: 'identify' }; return true; }
    return false;
  };

  G.useItem = function (it) {
    const ch = this.char;
    const b = BASES[it.base];
    const g = D.invGrid(ch);
    if (b.type === 'hpot' || b.type === 'mpot' || b.type === 'rpot') { g.remove(it); this.drink(it); return true; }
    if (b.type === 'scroll') {
      if (b.spell === 'tp') { if (this.castTownPortal()) g.remove(it); return true; }
      if (b.spell === 'id') { this.cursorMode = { k: 'identify', item: it }; return true; }
    }
    if (b.type === 'tome') {
      if (!it.qty) { this.overhead('Книга пуста'); return false; }
      if (b.spell === 'tp') { if (this.castTownPortal()) it.qty--; return true; }
      if (b.spell === 'id') { this.cursorMode = { k: 'identify', item: it }; return true; }
    }
    if (b.id === 'q_scroll2') { this.ev({ t: 'read', text: 'Акара записала порядок рун на Камнях Каирна: ' + (this.areas.stonyfield && this.areas.stonyfield.cairn ? this.areas.stonyfield.cairn.order.map(i => D.CAIRN_RUNES[i]).join(' — ') : 'пять рун, что откроются вам на Каменистом поле') + '.' }); return true; }
    if (b.id === 'q_scroll') { this.ev({ t: 'read', text: 'Свиток испещрён древними знаками. Вам не прочесть их — отнесите свиток Акаре.' }); return true; }
    return false;
  };

  G.identifyWith = function (target) {
    const cm = this.cursorMode;
    if (!cm || cm.k !== 'identify') return false;
    this.cursorMode = null;
    if (!target || target.idf) return false;
    target.idf = true;
    if (cm.item) {
      const b = BASES[cm.item.base];
      if (b.type === 'tome') cm.item.qty--;
      else D.invGrid(this.char).remove(cm.item);
    }
    this.sfx('identify', 0, 0);
    this.recalc();
    return true;
  };

  G.addStatPoint = function (k) {
    const ch = this.char;
    if (ch.statPts <= 0 || !(k in ch.stats)) return false;
    ch.stats[k]++;
    ch.statPts--;
    const h = this.hero;
    const hp = h.hpMax, mp = h.mpMax;
    this.recalc();
    h.hp += Math.max(0, h.hpMax - hp);
    h.mp += Math.max(0, h.mpMax - mp);
    return true;
  };

  G.canLearn = function (id) {
    const ch = this.char;
    const sk = SKILLS[id];
    if (!sk || sk.cls !== ch.cls) return false;
    if ((ch.skills[id] || 0) >= 20) return false;
    if (ch.level < sk.req) return false;
    for (const p of sk.pre) if (!ch.skills[p]) return false;
    return true;
  };

  G.learnSkill = function (id) {
    const ch = this.char;
    if (ch.skillPts <= 0 || !this.canLearn(id)) return false;
    ch.skills[id] = (ch.skills[id] || 0) + 1;
    ch.skillPts--;
    this.recalc();
    const sk = SKILLS[id];
    if (ch.skills[id] === 1 && sk.kind !== 'passive') {
      if (ch.right === 'attack' && sk.kind !== 'strike') ch.right = id;
      else if (ch.left === 'attack' && (sk.kind === 'strike' || sk.kind === 'shot')) ch.left = id;
    }
    this.sfx('learn', 0, 0);
    return true;
  };

  const LEFT_OK = ['basic', 'throw', 'strike', 'shot', 'bolt', 'nova', 'chain', 'stream', 'meteor', 'blizzard', 'firewall', 'static'];

  G.skillChoices = function (side) {
    const ch = this.char;
    const out = ['attack'];
    if (this.hero.st.throwable) out.push('throw');
    for (const sk of D.classSkills(ch.cls)) {
      if (sk.kind === 'passive') continue;
      if (!D.skillLevel(this.hero, sk.id)) continue;
      if (side === 'left' && !LEFT_OK.includes(sk.kind)) continue;
      out.push(sk.id);
    }
    for (const s in this.hero.st.sums) if (s.startsWith('sk:')) {
      const id = s.slice(3);
      const sk = SKILLS[id];
      if (sk && sk.kind !== 'passive' && !out.includes(id) && (side === 'right' || LEFT_OK.includes(sk.kind))) out.push(id);
    }
    if (side === 'right') {
      if (ch.inv.some(i => i.base === 'tp_tome' && i.qty > 0)) out.push('tp');
      if (ch.inv.some(i => i.base === 'id_tome' && i.qty > 0)) out.push('id');
    }
    return out;
  };

  G.setSkill = function (side, id) {
    const ch = this.char;
    if (side === 'left') ch.left = id; else ch.right = id;
    this.auraT = 0;
    this.sfx('select', 0, 0);
  };

  G.setHot = function (key, id) {
    const ch = this.char;
    for (const k in ch.hot) if (ch.hot[k] === id) delete ch.hot[k];
    ch.hot[key] = id;
  };

  G.useTomeSkill = function (id) {
    const t = this.char.inv.find(i => i.base === (id === 'tp' ? 'tp_tome' : 'id_tome') && i.qty > 0);
    if (!t) return false;
    return this.useItem(t);
  };

  G.swapWeapons = function () {
    const ch = this.char;
    ch.swap = ch.swap ? 0 : 1;
    this.recalc();
    this.sfx('swap', 0, 0);
  };

  G.toggleRun = function () { this.char.runOn = !this.char.runOn; };

  G.stashGold = function (n) {
    const ch = this.char;
    n = Math.min(n, ch.gold, 2500000 - ch.stash.gold);
    if (n <= 0) return false;
    ch.gold -= n; ch.stash.gold += n;
    this.sfx('gold', 0, 0);
    return true;
  };

  G.withdrawGold = function (n) {
    const ch = this.char;
    n = Math.min(n, ch.stash.gold, D.goldMax(ch) - ch.gold);
    if (n <= 0) return false;
    ch.stash.gold -= n; ch.gold += n;
    this.sfx('gold', 0, 0);
    return true;
  };

  G.setCountFn = function () {
    const sc = this.hero.st.setCounts || {};
    return id => sc[id] || 0;
  };

  G.hasSetItemFn = function () {
    const ch = this.char;
    const ids = new Set(D.eqItems(ch).map(x => x[1]).filter(i => i.q === 'set').map(i => i.setItem));
    return id => ids.has(id);
  };

  G.itemCtx = function () {
    const st = this.hero.st;
    const cairn = this.areas.stonyfield && this.areas.stonyfield.cairn ? this.areas.stonyfield.cairn.order : null;
    return { level: this.char.level, str: st.str, dex: st.dex, cls: this.char.cls, setCount: this.setCountFn(), hasSetItem: this.hasSetItemFn(), cairn };
  };

  D.CLASS_NAMES = Object.fromEntries(Object.entries(CLASSES).map(([k, v]) => [k, v.name]));
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
