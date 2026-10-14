(function (Z) {
  'use strict';

  const G = Z.Game.prototype;

  Z.OBJ_TYPES = {
    crate: { name: 'Ящик', size: [0.8, 0.6, 0.6], cont: true },
    locker: { name: 'Шкафчик', size: [0.6, 1.9, 0.5], cont: true },
    cabinet: { name: 'Шкаф', size: [1.0, 1.9, 0.5], cont: true },
    fridge: { name: 'Холодильник «ЗиЛ»', size: [0.65, 1.6, 0.6], cont: true },
    safe: { name: 'Сейф', size: [0.6, 0.9, 0.6], cont: true },
    desk: { name: 'Письменный стол', size: [1.4, 0.78, 0.7], cont: true, solid: true },
    nightstand: { name: 'Тумбочка', size: [0.45, 0.6, 0.4], cont: true },
    trash: { name: 'Мусорный бак', size: [0.9, 1.1, 0.7], cont: true },
    mailbox: { name: 'Почтовый ящик', size: [0.4, 0.5, 0.2], cont: true, wall: true },
    toolbox: { name: 'Ящик с инструментами', size: [0.55, 0.3, 0.3], cont: true },
    ammobox: { name: 'Патронный ящик', size: [0.6, 0.35, 0.35], cont: true },
    medbox: { name: 'Аптечка', size: [0.4, 0.3, 0.15], cont: true, wall: true },
    car: { name: 'Багажник', size: [1.6, 1.4, 3.8], cont: true, solid: true },
    bag: { name: 'Вещмешок', size: [0.4, 0.4, 0.3], cont: true },
    barrel: { name: 'Бочка', size: [0.6, 0.9, 0.6], solid: true },
    door: { name: 'Дверь', size: [1.2, 2.2, 0.15], door: true },
    hatch: { name: 'Люк', size: [1.0, 0.3, 1.0], door: true },
    gate: { name: 'Ворота', size: [3.5, 2.6, 0.2], door: true },
    terminal: { name: 'ЭВМ «Искра»', size: [0.6, 1.4, 0.5], term: true, solid: true },
    bench: { name: 'Верстак', size: [1.8, 0.9, 0.8], craft: 'bench', solid: true },
    campfire: { name: 'Костёр', size: [1.0, 0.4, 1.0], craft: 'fire' },
    bed: { name: 'Кровать', size: [0.95, 0.6, 2.0], sleep: true, solid: true },
    sofa: { name: 'Диван', size: [1.9, 0.8, 0.8], sleep: true, solid: true },
    note: { name: 'Записка', size: [0.25, 0.02, 0.3], note: true },
    sodamachine: { name: 'Автомат газированной воды', size: [0.8, 1.7, 0.6], soda: true, solid: true },
    radio: { name: 'Радиоприёмник', size: [0.5, 0.3, 0.3], radio: true },
    switch: { name: 'Рубильник', size: [0.3, 0.5, 0.15], use: true, wall: true },
    lever: { name: 'Рычаг', size: [0.3, 0.8, 0.3], use: true },
    item: { name: '', size: [0.5, 0.2, 0.5], item: true },
    corpse: { name: 'Останки', size: [1.6, 0.3, 0.6], cont: true },
    pump: { name: 'Колонка', size: [0.4, 1.2, 0.4], water: true, solid: true },
    custom: { name: '', size: [1, 1, 1] }
  };

  let objId = 1;

  G.addObject = function (cell, o) {
    const T = Z.OBJ_TYPES[o.type] || Z.OBJ_TYPES.custom;
    const ob = Object.assign({ id: o.id || ('o' + (objId++)), name: o.name || T.name, x: 0, y: null, z: 0, yaw: 0, inv: null, lock: 0, open: 0 }, o);
    ob.T = T;
    if (ob.y === null || ob.y === undefined) ob.y = cell.cw.groundAt(ob.x, ob.z, 200);
    if (T.cont && !ob.inv) ob.inv = [];
    if (ob.loot && T.cont && !this.flags['looted_' + ob.id]) {
      const R = Z.rng(Z.hashStr(ob.id) + (this.seed || 0));
      for (const [id, n] of Z.rollLoot(R, Z.LOOT[ob.loot] || ob.loot)) this.addToInv(ob.inv, id, n);
    }
    const sz = ob.size || T.size;
    if ((T.solid || ob.solid) && !ob.noCollide) ob.solidRef = cell.cw.addBox(ob.x, ob.z, sz[0], sz[2], ob.yaw, ob.y - 0.1, ob.y + sz[1], { obj: ob });
    if (T.door && ob.blocks) ob.solidRef = cell.cw.addBox(ob.x, ob.z, sz[0], 0.3, ob.yaw, ob.y, ob.y + sz[1], { obj: ob });
    cell.objects.push(ob);
    return ob;
  };

  G.addToInv = function (inv, id, n = 1, cond) {
    const d = Z.item(id);
    if (!d) return;
    if (d.stack) { const e = inv.find(x => x.id === id); if (e) e.n += n; else inv.push({ id, n }); return; }
    for (let i = 0; i < n; i++) { const e = { id, n: 1, cond: cond === undefined ? 0.35 + Math.random() * 0.5 : cond }; if (d.cat === 'weapon' && d.mag) e.loaded = 0; inv.push(e); }
  };

  G.objectAt = function (o, d, maxD = 2.6) {
    let best = null;
    const cell = this.cell;
    for (const ob of cell.objects) {
      if (ob.hidden || ob.taken) continue;
      const sz = ob.size || ob.T.size;
      const cy = ob.y + sz[1] / 2;
      const r = Math.max(0.35, Math.hypot(sz[0], sz[2]) * 0.5);
      const vx = ob.x - o[0], vy = cy - o[1], vz = ob.z - o[2];
      const t = vx * d[0] + vy * d[1] + vz * d[2];
      if (t < 0 || t > maxD + r) continue;
      const px = o[0] + d[0] * t - ob.x, py = o[1] + d[1] * t - cy, pz = o[2] + d[2] * t - ob.z;
      const off = Math.hypot(px, pz), offy = Math.abs(py);
      if (off > r + 0.15 || offy > sz[1] / 2 + 0.35) continue;
      const score = t + off * 2;
      if (!best || score < best.score) best = { ob, t, score };
    }
    return best;
  };

  G.lookTarget = function (o, d) {
    const p = this.player;
    const wh = this.cell.cw.raycast(o[0], o[1], o[2], d[0], d[1], d[2], 3.2);
    const lim = wh ? wh.t + 0.4 : 3.2;
    const ah = this.actorRay(o[0], o[1], o[2], d[0], d[1], d[2], Math.min(lim, 3.4), p);
    const oh = this.objectAt(o, d, Math.min(lim, 2.8));
    if (ah && (!oh || ah.t < oh.t + 0.3)) return { actor: ah.a, t: ah.t };
    if (oh) return { obj: oh.ob, t: oh.t };
    return null;
  };

  G.promptFor = function (tgt) {
    if (!tgt) return null;
    const p = this.player;
    if (tgt.actor) {
      const a = tgt.actor;
      if (a.dead) return { key: 'E', verb: 'Обыскать', name: a.name + (a.essential ? '' : '') };
      if (a.canTalk && !this.hostileToPlayer(a)) return { key: 'E', verb: 'Говорить', name: a.name };
      if (a.companion) return { key: 'E', verb: 'Говорить', name: a.name };
      return null;
    }
    const ob = tgt.obj, T = ob.T;
    const owned = ob.owner && !this.flags['owned_' + ob.id] && this.ownerPresent(ob);
    let verb = 'Использовать';
    if (T.cont) verb = owned ? 'Украсть' : 'Открыть';
    else if (T.door) verb = ob.to ? 'Войти' : 'Открыть';
    else if (T.term) verb = 'Включить';
    else if (T.craft === 'bench') verb = 'Работать';
    else if (T.craft === 'fire') verb = 'Готовить';
    else if (T.sleep) verb = 'Отдохнуть';
    else if (T.note) verb = 'Прочитать';
    else if (T.item || ob.item) verb = owned ? 'Украсть' : 'Взять';
    else if (T.soda) verb = 'Налить газировки';
    else if (T.water) verb = 'Набрать воды';
    const it = ob.item ? Z.item(ob.item) : null;
    const name = it ? it.name + (ob.n > 1 ? ' (' + ob.n + ')' : '') : ob.name;
    let extra = '';
    if (ob.lock && !this.flags['unlocked_' + ob.id]) extra = ob.lock >= 200 ? 'Заперто — нужен ключ' : '[Взлом ' + ob.lock + ']' + (ob.key && p.has(ob.key) ? ' — есть ключ' : '');
    if (T.term && ob.lock && !this.flags['unlocked_' + ob.id]) extra = '[Наука ' + ob.lock + ']';
    if (ob.dest) extra = ob.dest;
    return { key: 'E', verb, name, extra, red: owned };
  };

  G.ownerPresent = function (ob) {
    if (!ob.owner) return false;
    if (this.repLevel(ob.owner).v >= 3) return false;
    return true;
  };

  G.isLocked = function (ob) { return ob.lock && !this.flags['unlocked_' + ob.id]; };

  G.unlock = function (ob, how) {
    this.flags['unlocked_' + ob.id] = true;
    if (how === 'pick') this.giveXP(Math.round(5 + ob.lock / 5), 'Взлом');
    if (how === 'hack') this.giveXP(Math.round(5 + ob.lock / 5), 'Взлом ЭВМ');
    this.ev.emit('unlock', { ob, how });
  };

  G.witnessCrime = function (ob, kind) {
    const f = ob.owner;
    let seen = false;
    const p = this.player;
    for (const a of this.cell.actors) {
      if (a.dead || !a.ai || a.faction !== f) continue;
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d > 25) continue;
      const vis = this.cell.cw.los(a.x, a.y + 1.6, a.z, p.x, p.y + 1.2, p.z);
      if (!vis) continue;
      const skill = p.sheet.skill('sneak');
      if (p.sneak && this.rng() * 100 < skill * 0.7 && d > 4) continue;
      seen = true;
      break;
    }
    if (seen) {
      this.msg('Вас заметили! Кража у фракции «' + (Z.FACTIONS.find(x => x.id === f) || { short: f }).short + '».', 'warn');
      this.addKarma(-5);
      this.crime({ faction: f, x: p.x, z: p.z }, kind || 'theft');
    } else if (kind === 'theft') this.addKarma(-2);
    return seen;
  };

  G.takeFromObject = function (ob, e, n) {
    const p = this.player;
    const k = Math.min(n || e.n, e.n);
    const d = Z.item(e.id);
    if (d.currency) { p.give('talon', k); }
    else if (d.stack) p.give(e.id, k);
    else { const ne = p.give(e.id, 1, e.cond); if (e.loaded) ne.loaded = e.loaded; }
    e.n -= k;
    if (e.n <= 0) ob.inv.splice(ob.inv.indexOf(e), 1);
    this.flags['looted_' + ob.id] = true;
    if (ob.owner && this.ownerPresent(ob)) this.witnessCrime(ob, 'theft');
    this.ev.emit('take', { id: e.id, n: k });
    if (this.onTake) this.onTake(e.id, k, ob);
    return k;
  };

  G.putToObject = function (ob, e, n) {
    const p = this.player;
    const k = Math.min(n || e.n, e.n);
    const d = Z.item(e.id);
    if (d.quest) { this.msg('Это нельзя выложить.', 'warn'); return 0; }
    if (d.stack) { this.addToInv(ob.inv, e.id, k); p.take(e.id, k); }
    else { const ne = { id: e.id, n: 1, cond: e.cond }; if (e.loaded) ne.loaded = e.loaded; ob.inv.push(ne); p.removeEntry(e); }
    return k;
  };

  G.pickupItem = function (ob) {
    const p = this.player;
    const d = Z.item(ob.item);
    if (!d) return;
    if (ob.owner && this.ownerPresent(ob)) this.witnessCrime(ob, 'theft');
    if (d.stack) p.give(ob.item, ob.n || 1);
    else { const e = p.give(ob.item, 1, ob.cond === undefined ? 1 : ob.cond); if (ob.loaded) e.loaded = ob.loaded; }
    ob.taken = true;
    this.flags['taken_' + ob.id] = true;
    this.msg((d.currency ? 'Талоны: ' + (ob.n || 1) : d.name + (ob.n > 1 ? ' (' + ob.n + ')' : '')) + ' — взято.', 'item');
    this.ev.emit('take', { id: ob.item, n: ob.n || 1 });
    if (this.onTake) this.onTake(ob.item, ob.n || 1, ob);
    if (ob.onTake) ob.onTake(this, ob);
  };

  G.dropItem = function (e, n) {
    const p = this.player, d = Z.item(e.id);
    if (d.quest) { this.msg('Это лучше не выбрасывать.', 'warn'); return; }
    const k = Math.min(n || e.n, e.n);
    const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const ob = this.addObject(this.cell, { type: 'item', item: e.id, n: d.stack ? k : 1, cond: e.cond, loaded: e.loaded, x: p.x + fx * 0.8, z: p.z + fz * 0.8, dropped: true });
    if (d.stack) p.take(e.id, k); else p.removeEntry(e);
    this.ev.emit('drop', { ob });
  };

  G.activate = function (tgt) {
    if (!tgt) return null;
    const p = this.player;
    if (tgt.actor) {
      const a = tgt.actor;
      if (a.dead) return { ui: 'loot', actor: a };
      if (a.canTalk || a.companion) return { ui: 'talk', actor: a };
      return null;
    }
    const ob = tgt.obj, T = ob.T;
    if (ob.onUse) { const r = ob.onUse(this, ob); if (r !== undefined) return r; }
    if (this.isLocked(ob)) {
      if (ob.key && p.has(ob.key)) { this.unlock(ob, 'key'); this.msg('Открыто ключом: ' + Z.item(ob.key).name + '.', 'info'); }
      else if (T.term) return { ui: 'hack', obj: ob };
      else if (ob.lock >= 200) { this.msg('Заперто. Нужен ключ.', 'warn'); return null; }
      else return { ui: 'lockpick', obj: ob };
    }
    if (T.cont) return { ui: 'container', obj: ob };
    if (T.door) {
      if (ob.to) { this.enterCell(ob.to, ob.mark); return { ui: 'transition', obj: ob }; }
      ob.open = ob.open ? 0 : 1;
      if (ob.solidRef) ob.solidRef.disabled = !!ob.open;
      this.ev.emit('door', { ob });
      return null;
    }
    if (T.term) return { ui: 'terminal', obj: ob };
    if (T.craft) return { ui: 'craft', obj: ob, at: T.craft };
    if (T.sleep) return { ui: 'sleep', obj: ob };
    if (T.note) { this.readNote(ob.note); return null; }
    if (T.item || ob.item) { this.pickupItem(ob); return null; }
    if (T.soda) {
      if (p.count('talon') < 1) { this.msg('Нужен талон. Стакан газировки — 1 талон.', 'warn'); return null; }
      p.take('talon', 1); p.give('water', 1); this.msg('Газировка без сиропа. Свежая, почти не фонит.', 'info'); this.ev.emit('soda', {}); return null;
    }
    if (T.water) { p.give('dneprWater', 1); this.msg('Набрали воды из колонки.', 'info'); return null; }
    if (T.use) { this.ev.emit('use', { ob }); return null; }
    return null;
  };

  G.readNote = function (id) {
    const n = Z.NOTES && Z.NOTES[id];
    if (!n) return;
    this.notes = this.notes || [];
    if (!this.notes.includes(id)) { this.notes.push(id); this.msg('Новая запись в «Пионере»: ' + n.title, 'note'); }
    this.ev.emit('note', { id });
  };

  G.enterCell = function (id, mark) {
    const p = this.player;
    const from = this.cell;
    let cell = this.cells.get(id);
    if (!cell) cell = this.loadCell(id);
    if (!cell) { this.msg('Сюда пока не пройти.', 'warn'); return false; }
    const comps = from.actors.filter(a => a.companion && !a.dead && !(a.ai && a.ai.wait));
    from.actors = from.actors.filter(a => a !== p && !comps.includes(a));
    const m = (cell.marks && cell.marks[mark]) || cell.spawn || { x: 0, z: 0, yaw: 0 };
    p.x = m.x; p.z = m.z; p.y = cell.cw.groundAt(m.x, m.z, (m.y || 0) + 3); p.yaw = m.yaw || 0;
    p.vx = p.vz = p.vy = 0; p.ground = p.y; p.cell = id;
    cell.actors.push(p);
    comps.forEach((c, i) => { c.x = p.x - Math.sin(p.yaw) * (1.5 + i); c.z = p.z + Math.cos(p.yaw) * (1.5 + i); c.y = cell.cw.groundAt(c.x, c.z, p.y + 2); c.cell = id; cell.actors.push(c); });
    this.cell = cell;
    this.projs = []; this.mines = []; this.fires = [];
    this.ev.emit('cell', { from: from.id, to: id, yaw: p.yaw });
    if (cell.onEnter) cell.onEnter(this, cell);
    for (const fn of Z.CELL_HOOKS || []) fn(this, cell, from);
    return true;
  };
  Z.CELL_HOOKS = Z.CELL_HOOKS || [];

  G.loadCell = function (id) {
    const def = Z.INTERIORS && Z.INTERIORS[id];
    if (!def) return null;
    const cell = Z.buildInteriorCell(this, id, def);
    this.cells.set(id, cell);
    return cell;
  };

  Z.LOOT = {
    junk: [['tape', 0.3, 1, 1], ['glue', 0.2, 1, 1], ['spring', 0.25, 1, 2], ['can', 0.4, 1, 2], ['bottle', 0.3, 1, 1], ['rag', 0.3, 1, 1], ['wrench', 0.1, 1, 1], ['wire', 0.2, 1, 1], ['talon', 0.4, 1, 10]],
    food: [['tushenka', 0.35, 1, 2], ['sgushenka', 0.25, 1, 1], ['kilka', 0.3, 1, 2], ['bread', 0.3, 1, 1], ['kvass', 0.2, 1, 1], ['water', 0.15, 1, 1], ['sitro', 0.2, 1, 1]],
    med: [['stim', 0.45, 1, 2], ['b190', 0.35, 1, 1], ['kiodine', 0.25, 1, 1], ['promedol', 0.15, 1, 1], ['medbag', 0.08, 1, 1]],
    ammo: [['a918', 0.35, 6, 16], ['a762t', 0.3, 6, 18], ['a762k', 0.25, 8, 24], ['a12', 0.3, 4, 10], ['a762r', 0.15, 3, 8], ['krona', 0.1, 2, 6]],
    office: [['talon', 0.5, 2, 15], ['belomor', 0.25, 1, 1], ['glass', 0.2, 1, 1], ['komsomol', 0.15, 1, 1], ['badgeGTO', 0.08, 1, 1], ['mgSpeech', 0.06, 1, 1], ['mgBarter', 0.05, 1, 1]],
    tools: [['tape', 0.5, 1, 2], ['glue', 0.4, 1, 1], ['spring', 0.4, 1, 3], ['wrench', 0.3, 1, 1], ['wire', 0.4, 1, 2], ['tube', 0.2, 1, 1], ['capacitor', 0.2, 1, 1], ['repairkit', 0.05, 1, 1], ['mgRep', 0.05, 1, 1]],
    military: [['a762k', 0.6, 10, 30], ['a918', 0.4, 8, 16], ['stim', 0.4, 1, 2], ['f1', 0.25, 1, 2], ['rgd', 0.25, 1, 2], ['tushenka', 0.4, 1, 2], ['mgGuns', 0.05, 1, 1]],
    home: [['bread', 0.2, 1, 1], ['samogon', 0.2, 1, 1], ['glass', 0.3, 1, 2], ['clock', 0.1, 1, 1], ['iron', 0.1, 1, 1], ['tie', 0.1, 1, 1], ['talon', 0.4, 1, 8], ['belomor', 0.15, 1, 1], ['matches', 0.3, 1, 1]],
    trash: [['can', 0.6, 1, 3], ['bottle', 0.5, 1, 2], ['rag', 0.4, 1, 1], ['tape', 0.1, 1, 1], ['larva', 0.1, 1, 1]]
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
