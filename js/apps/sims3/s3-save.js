(function (S) {
  'use strict';
  const { OBJECTS, NEED_KEYS } = S;
  const G = S.Game.prototype;
  const SAVE_VERSION = 2;

  G.lotsForSale = function () { return this.lots.filter(l => l.kind === 'home' && !l.hh); };

  G.playFamily = function (hhId) {
    const hh = this.households.get(hhId);
    if (!hh) return false;
    this.activeHH = hh.id;
    for (const s of this.members(hh)) s.npc = false;
    this.sel = this.members(hh)[0].id;
    return true;
  };

  G.newHousehold = function (name, simsData) {
    const hh = this.addHousehold(name, -1, 0, null);
    for (const d of simsData) {
      const sim = new S.Sim(d);
      sim.npc = false;
      this.addSim(sim, hh);
      sim.ageDays = 0;
    }
    const sims = this.members(hh);
    const base = 20000 + Math.max(0, sims.length - 2) * 1500;
    hh.funds = base;
    return hh;
  };

  G.linkHousehold = function (hh, links) {
    const sims = hh.members.map(id => this.sims.get(id));
    for (const l of links || []) {
      const a = sims[l[0]], b = sims[l[1]];
      if (!a || !b) continue;
      const r = this.rel(a, b);
      r.met = true;
      r.known[a.id] = b.traits.slice(); r.known[b.id] = a.traits.slice();
      if (l[2] === 'spouse') { r.v = 75; r.flags.married = true; r.flags.romance = true; }
      else if (l[2] === 'partner') { r.v = 60; r.flags.romance = true; r.flags.steady = true; }
      else if (l[2] === 'parent') { r.v = 55; b.parents = (b.parents || []).concat(a.id); }
      else if (l[2] === 'sibling') r.v = 35;
      else r.v = 30;
    }
    for (let i = 0; i < sims.length; i++) for (let j = i + 1; j < sims.length; j++) {
      const r = this.rel(sims[i], sims[j]);
      if (!r.met) { r.met = true; r.v = Math.max(r.v, 25); }
      const pa = sims[i].parents || [], pb = sims[j].parents || [];
      if (pa.length && pa.some(p => pb.includes(p))) r.v = Math.max(r.v, 35);
    }
  };

  G.moveInto = function (hh, lotId) {
    const lot = this.lots[lotId];
    if (!lot || lot.hh) return 'Участок занят';
    const price = lot.price || lot.value || 0;
    if (hh.funds < price) return 'Не хватает денег';
    hh.funds -= price;
    if (hh.lot >= 0 && this.lots[hh.lot]) { this.lots[hh.lot].hh = null; this.lots[hh.lot].sale = true; }
    hh.lot = lotId;
    lot.hh = hh.id; lot.sale = false; lot.dirty = true;
    for (const s of this.members(hh)) { this.hardStop(s); this.placeAtHome(s, hh); s.addMood('new_home', this.t); }
    hh.movedIn = this.t;
    hh.welcomed = false;
    return true;
  };

  G.serialize = function () {
    const w = this.world;
    const out = {
      v: SAVE_VERSION, seed: this.seed, t: this.t, opts: this.opts, activeHH: this.activeHH, sel: this.sel, weather: this.weather || null,
      nextSimId: this.nextSimId, nextHH: this.nextHH, nextObj: w.nextId,
      households: [...this.households.values()].map(h => JSON.parse(JSON.stringify(h))),
      sims: [...this.sims.values()].filter(s => !s.svc).map(s => Object.assign(s.serialize(), { parents: s.parents || [], inCribBaby: !!s.inCrib, carriedBy: s.carriedBy || null, carry: s.carry || null })),
      rels: [...this.rels.entries()].filter(([k, r]) => r.met || r.v || Object.keys(r.flags).length).map(([k, r]) => [k, r]),
      lots: this.lots.map(l => ({ id: l.id, hh: l.hh, sale: l.sale, price: l.price, value: l.value, dirty: !!l.dirty, roof: l.roof || null, roofStyle: l.roofStyle || null, roofPitch: l.roofPitch || null, roofPieces: l.roofPieces || null })),
      lotData: {}
    };
    for (const lot of this.lots) {
      if (!lot.dirty && !(lot.hh === this.activeHH)) continue;
      const objs = [];
      for (const ob of w.objects.values()) {
        if (ob.lot !== lot.id) continue;
        if (ob.t === 'fire') continue;
        objs.push({ id: ob.id, t: ob.t, x: ob.x, y: ob.y, r: ob.r, lv: ob.lv || 0, art: ob.art || 0, col: ob.col, st: ob.st, dirt: ob.dirt || 0, broken: !!ob.broken, upg: ob.upg, value: ob.value });
      }
      const walls = [];
      for (const wl of w.walls) if (wl && wl.lot === lot.id) walls.push({ o: wl.o, x: wl.x, y: wl.y, lv: wl.lv || 0, a: wl.a, b: wl.b, door: wl.door, win: wl.win, fence: wl.fence });
      const floors = [], terr = [], up = [];
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) { const i = w.idx(x, y); floors.push(w.floor[i]); terr.push(w.terrain[i]); for (let l = 1; l < w.L; l++) { const f = w.floor[w.li(x, y, l)]; if (f) up.push([x, y, l, f]); } }
      out.lotData[lot.id] = { objs, walls, floors, terr, up };
    }
    return out;
  };

  S.Game.fromSave = function (data, opt) {
    const game = new S.Game(Object.assign({ seed: data.seed, empty: true, t: data.t, opts: data.opts }, opt || {}));
    const w = game.world;
    for (const [lid, ld] of Object.entries(data.lotData || {})) {
      const lot = game.lots[+lid];
      if (!lot) continue;
      for (const ob of w.objectsInLot(lot.id)) w.removeObject(ob.id);
      for (const wl of w.walls.slice()) if (wl && wl.lot === lot.id) w.removeWall(wl.o, wl.x, wl.y, wl.lv || 0);
      let k = 0;
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) { const i = w.idx(x, y); w.floor[i] = ld.floors[k] || 0; if (ld.terr) w.terrain[i] = ld.terr[k]; k++; for (let l = 1; l < w.L; l++) w.floor[w.li(x, y, l)] = 0; }
      for (const [x, y, l, f] of ld.up || []) if (l < w.L) w.floor[w.li(x, y, l)] = f;
      for (const wl of ld.walls) w.addWall(wl.o, wl.x, wl.y, { a: wl.a, b: wl.b, door: wl.door, win: wl.win, fence: wl.fence, lot: lot.id, lv: wl.lv || 0 });
      const sorted = ld.objs.slice().sort((a, b) => (OBJECTS[a.t] && OBJECTS[a.t].place === 'floor' ? 0 : 1) - (OBJECTS[b.t] && OBJECTS[b.t].place === 'floor' ? 0 : 1));
      for (const o of sorted) {
        if (!OBJECTS[o.t]) continue;
        const props = { lot: lot.id, lv: o.lv || 0, col: o.col, st: o.st || {}, dirt: o.dirt, broken: o.broken, upg: o.upg || {}, value: o.value };
        if (o.art) props.art = o.art;
        if (!w.objects.has(o.id)) props.id = o.id;
        w.placeObject(o.t, o.x, o.y, o.r, props);
      }
      lot.dirty = true;
    }
    w.nextId = Math.max(w.nextId, data.nextObj || 0);
    w.computeRooms();
    for (const l of data.lots || []) { const lot = game.lots[l.id]; if (!lot) continue; lot.hh = l.hh; lot.sale = l.sale; if (l.price) lot.price = l.price; if (l.value) lot.value = l.value; lot.dirty = l.dirty; if (l.roof) lot.roof = l.roof; if (l.roofStyle) lot.roofStyle = l.roofStyle; if (l.roofPitch) lot.roofPitch = l.roofPitch; if (l.roofPieces) lot.roofPieces = l.roofPieces; }
    for (const lid of Object.keys(data.lotData || {})) {
      const lot = game.lots[+lid];
      if (!lot || lot.kind !== 'home') continue;
      const fd = w.frontDoorOf(lot);
      lot.frontDoor = fd ? fd.out : null;
      lot.doorIn = fd ? fd.inn : null;
      lot.entrance = lot.frontDoor || [lot.x + (lot.w >> 1), lot.y + (lot.h >> 1)];
    }
    for (const h of data.households) game.households.set(h.id, h);
    for (const d of data.sims) {
      const sim = new S.Sim(d);
      sim.parents = d.parents || [];
      sim.queue = [];
      game.sims.set(sim.id, sim);
      if (sim.dead) { sim.hidden = true; sim.anim = 'dead'; }
    }
    for (const [k, r] of data.rels) game.rels.set(k, r);
    game.nextSimId = data.nextSimId; game.nextHH = data.nextHH;
    if (data.weather) game.weather = data.weather;
    game.activeHH = data.activeHH; game.sel = data.sel;
    for (const sim of game.sims.values()) {
      if (sim.dead) continue;
      const lot = game.world.lotAt(Math.floor(sim.x), Math.floor(sim.y));
      sim.lv = Math.max(0, Math.min(w.L - 1, sim.lv || 0)); sim.zOff = 0; sim.ride = null; sim.swimZ = 0;
      if (!w.walkable(Math.floor(sim.x), Math.floor(sim.y), sim.lv)) {
        const p = w.nearestWalkable(sim.x, sim.y, 6, null, sim.lv) || w.nearestWalkable(sim.x, sim.y, 6);
        if (p) { sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; sim.lv = p[2] || 0; }
      }
      sim.lot = w.lotAt(Math.floor(sim.x), Math.floor(sim.y));
      sim.inside = null; sim.hidden = false; sim.sleeping = false; sim.seatOf = null; sim.sitH = 0; sim.lieH = 0; sim.censor = false; sim.engage = null;
      if (sim.outfit === 'none' || sim.outfit === 'work' || sim.outfit === 'swim') sim.outfit = 'everyday';
      sim.carriedBy = null; sim.carry = null; sim.inCrib = null;
      if (sim.job) sim.job.inShift = false;
      if (lot === -1 && sim.hh) { const hh = game.households.get(sim.hh); if (hh && hh.lot >= 0) game.placeAtHome(sim, hh); }
    }
    for (const sim of game.sims.values()) {
      if (!sim.isBaby || sim.dead) continue;
      const hh = game.hh(sim);
      const crib = hh ? w.objectsInLot(hh.lot, o => OBJECTS[o.t].crib && !o.use.baby)[0] : null;
      if (crib) game.putInCrib(null, sim, crib);
    }
    game.lastHour = Math.floor(game.t / 60);
    return game;
  };

  const KEY = 'sims3_2000_saves';
  function readSlots() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function writeSlots(slots) {
    try { localStorage.setItem(KEY, JSON.stringify(slots)); return true; } catch (e) { return false; }
  }
  function saveSlot(game, slotId, thumb) {
    const slots = readSlots();
    const hh = game.active();
    const data = game.serialize();
    const entry = { id: slotId || ('s' + Date.now()), name: hh ? 'Семья ' + hh.name : 'Без семьи', lot: hh && hh.lot >= 0 ? game.lots[hh.lot].name : '', t: game.t, saved: Date.now(), thumb: thumb || null, members: hh ? game.members(hh).map(s => ({ first: s.first, gender: s.gender, age: s.age })) : [], data };
    const i = slots.findIndex(s => s.id === entry.id);
    if (i >= 0) slots[i] = entry; else slots.unshift(entry);
    while (slots.length > 6) slots.pop();
    if (!writeSlots(slots)) {
      while (slots.length > 1) { slots.pop(); if (writeSlots(slots)) return entry.id; }
      return null;
    }
    return entry.id;
  }
  function deleteSlot(id) { writeSlots(readSlots().filter(s => s.id !== id)); }

  Object.assign(S, { readSlots, saveSlot, deleteSlot, SAVE_KEY: KEY });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
