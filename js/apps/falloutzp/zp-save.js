(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  const KEY = 'falloutzp_save_';
  Z.SAVE_VERSION = 1;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { return false; } return true; }
  };
  Z.store = store;

  Z.loadSettings = () => { try { return JSON.parse(store.get('falloutzp_settings') || '{}'); } catch (e) { return {}; } };
  Z.saveSettings = s => store.set('falloutzp_settings', JSON.stringify(s));

  G.serialize = function () {
    const cells = {};
    for (const [id, c] of this.cells) {
      cells[id] = {
        actors: c.actors.filter(a => a.kind !== 'player').map(a => Object.assign(a.serialize(), { npcId: a.npcId || null, companion: !!a.companion, cid: a.cid || null, ai: a.ai ? { home: a.ai.home, wait: !!a.ai.wait, state: a.ai.state === 'combat' ? 'idle' : a.ai.state } : null, vendor: a.vendor ? { inv: a.vendor.inv, talons: a.vendor.talons, stockDay: a.vendor.stockDay } : null, look: a.look, provoked: !!a.provoked, lootable: !!a.lootable, spawnKey: a.spawnKey || null })),
        objects: c.objects.map(o => ({ id: o.id, inv: o.inv, taken: !!o.taken, open: o.open || 0, dropped: !!o.dropped, type: o.type, item: o.item, n: o.n, cond: o.cond, loaded: o.loaded, x: o.x, y: o.y, z: o.z, yaw: o.yaw }))
      };
    }
    return {
      v: Z.SAVE_VERSION, time: this.time, cell: this.cell.id, flags: this.flags, karma: this.karma, rep: this.rep,
      quests: this.quests, notes: this.notes, tracked: this.tracked, found: this.locations.filter(l => l.found).map(l => l.id),
      player: Object.assign(this.player.serialize(), { sex: this.player.sex, look: this.player.look, hotkeys: this.player.hotkeys || {}, addict: this.player.addict || {}, lightOn: !!this.player.lightOn }),
      cells, wx: this.wx || null, hardcore: !!this.hardcore, needs: this.needs || null, difficulty: this.difficulty || 'normal', seed: this.seed || 1234, rng: this.rng.state(), lastExt: this.lastExt || null
    };
  };

  G.restore = function (s) {
    this.time = s.time;
    this.flags = s.flags || {};
    this.karma = s.karma || 0;
    this.rep = Object.assign(this.rep, s.rep || {});
    this.quests = s.quests || {};
    this.notes = s.notes || [];
    this.tracked = s.tracked || null;
    this.hardcore = !!s.hardcore;
    this.needs = s.needs || null;
    this.difficulty = s.difficulty || 'normal';
    this.lastExt = s.lastExt;
    if (s.rng) this.rng.setState(s.rng);
    for (const l of this.locations) l.found = (s.found || []).includes(l.id);
    for (const id of Object.keys(s.cells || {})) if (!this.cells.has(id)) this.loadCell(id);
    for (const [id, cs] of Object.entries(s.cells || {})) {
      const cell = this.cells.get(id);
      if (!cell) continue;
      for (const as of cs.actors) {
        if (cell.actors.some(a => a.id === as.id)) continue;
        for (const other of this.cells.values()) {
          if (other === cell) continue;
          const i = other.actors.findIndex(a => a.id === as.id);
          if (i >= 0) { cell.actors.push(other.actors.splice(i, 1)[0]); break; }
        }
      }
    }
    if (s.wx) this.wx = s.wx;
    const p = Z.Actor.restore(s.player, new Z.Actor({ id: 'player', kind: 'player' }));
    p.sex = s.player.sex; p.look = s.player.look; p.hotkeys = s.player.hotkeys || {}; p.addict = s.player.addict || {}; p.lightOn = !!s.player.lightOn;
    p.faction = 'player';
    this.player = p;
    for (const [id, cs] of Object.entries(s.cells || {})) {
      const cell = this.cells.get(id);
      if (!cell) continue;
      const byId = new Map(cell.actors.map(a => [a.id, a]));
      const keep = [];
      for (const as of cs.actors) {
        let a = byId.get(as.id);
        if (!a) { a = new Z.Actor({ id: as.id, kind: as.kind }); }
        Z.Actor.restore(as, a);
        a.npcId = as.npcId || a.npcId; a.companion = as.companion; a.cid = as.cid || a.cid; a.look = as.look || a.look; a.provoked = as.provoked; a.lootable = as.lootable;
        if (as.def && Z.CREATURES[as.def] && !a.cdef) { const d = Z.CREATURES[as.def]; a.cdef = d; a.rig = d.rig === 'human' ? null : d.rig; a.parts = Z.PARTS[d.parts] || null; a.beast = !!d.beast; a.robot = !!d.robot; a.human = !!d.human; a.big = !!d.big; a.plant = !!d.plant; a.height = d.height; a.radius = d.radius; a.dtBase = d.dt; }
        if (as.def && Z.HUMANS[as.def]) a.human = true;
        if (as.ai) { a.ai = a.ai || {}; a.ai.home = as.ai.home; a.ai.wait = as.ai.wait; a.ai.state = as.ai.state || 'idle'; a.ai.aware = 0; }
        if (as.vendor && a.vendor) Object.assign(a.vendor, as.vendor);
        keep.push(a);
      }
      for (const a of cell.actors) if (!keep.includes(a) && a.kind !== 'player' && !cs.actors.some(x => x.id === a.id)) { if (a.persistent) keep.push(a); }
      cell.actors = keep;
      const obById = new Map(cell.objects.map(o => [o.id, o]));
      for (const os of cs.objects) {
        let o = obById.get(os.id);
        if (!o) { if (os.dropped || os.type === 'item') o = this.addObject(cell, { id: os.id, type: os.type || 'item', item: os.item, n: os.n, cond: os.cond, loaded: os.loaded, x: os.x, y: os.y, z: os.z, yaw: os.yaw, dropped: os.dropped }); else continue; }
        if (os.inv) o.inv = os.inv;
        o.taken = os.taken; o.open = os.open;
        if (o.solidRef && o.T.door) o.solidRef.disabled = !!o.open;
      }
    }
    this.cell = this.cells.get(s.cell) || this.ext;
    p.cell = this.cell.id;
    this.cell.actors.push(p);
    for (const fn of Z.RESTORE_HOOKS || []) fn(this, s);
    return this;
  };
  Z.RESTORE_HOOKS = Z.RESTORE_HOOKS || [];

  Z.listSaves = () => {
    const out = [];
    for (const slot of ['quick', 'auto', '1', '2', '3', '4', '5', '6', '7', '8']) {
      const raw = store.get(KEY + slot + '_meta');
      if (!raw) { out.push({ slot, empty: true }); continue; }
      try { out.push(Object.assign({ slot }, JSON.parse(raw))); } catch (e) { out.push({ slot, empty: true }); }
    }
    return out;
  };

  Z.writeSave = (slot, game) => {
    const data = game.serialize();
    const json = JSON.stringify(data);
    const p = game.player;
    const loc = game.cell.exterior ? (game.nearestLocation ? game.nearestLocation() : 'Пустошь') : (game.cell.name || 'Помещение');
    const meta = { name: p.name, level: p.sheet.level, loc, time: game.time, real: Date.now(), size: json.length };
    const ok = store.set(KEY + slot, json) && store.set(KEY + slot + '_meta', JSON.stringify(meta));
    return ok;
  };

  Z.readSave = slot => { const raw = store.get(KEY + slot); if (!raw) return null; try { return JSON.parse(raw); } catch (e) { return null; } };

  G.nearestLocation = function () {
    const p = this.player;
    let best = null, bd = Infinity;
    for (const l of this.locations) { const d = Math.hypot(l.x - p.x, l.z - p.z); if (d < bd) { bd = d; best = l; } }
    return best && bd < 250 ? best.name : 'Пустошь';
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
