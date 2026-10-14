(function (FO) {
  'use strict';

  const VERSION = 1;
  const SLOTS = 10;
  const THUMB = { W: 224, H: 133 };
  const SKIP = new Set(['proto', 'owner', 'script']);
  const DB = { NAME: 'fallout98', STORE: 'saves', VERSION: 1 };
  const KEY = { META: 'meta', DATA: 'data' };
  const LOAD_MUSIC = 'WIND2';
  const SAVED_PREFS = [
    'gameDifficulty', 'combatDifficulty', 'violenceLevel', 'targetHighlight', 'combatMessages', 'combatTaunts', 'languageFilter', 'running',
    'subtitles', 'itemHighlight', 'combatSpeed', 'playerSpeed', 'textDelay', 'masterVolume', 'musicVolume', 'soundVolume', 'speechVolume',
    'brightness', 'mouseSensitivity'
  ];
  const STATE = { EMPTY: 0, VALID: 1, CORRUPT: 2, OLD: 3 };
  const FIXED = 16;

  FO.SAVE = { VERSION, SLOTS, THUMB, STATE };

  FO.toBase64 = function (u8) {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };

  FO.fromBase64 = function (text) {
    const bin = atob(text);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  };

  const isGameObject = v => !!v && typeof v === 'object' && typeof v.pid === 'number' && typeof v.id === 'number' && 'fid' in v;
  const isPlain = v => {
    const p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
  };

  class Encoder {
    constructor(scripts) {
      this.scripts = scripts;
      this.stack = new Set();
    }

    value(v) {
      if (v === undefined || typeof v === 'function') return undefined;
      if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
      if (typeof v === 'number') return Number.isFinite(v) ? v : { $num: Number.isNaN(v) ? 'nan' : v > 0 ? 'inf' : '-inf' };
      if (typeof v !== 'object') return undefined;
      if (v instanceof Uint8Array) return { $u8: FO.toBase64(v) };
      if (ArrayBuffer.isView(v)) return { $typed: v.constructor.name, data: Array.from(v) };
      if (isGameObject(v)) return { $o: v.id };
      if (this.scripts.has(v)) return { $s: this.scripts.get(v) };
      if (v instanceof Set) return { $set: [...v].map(x => this.value(x)) };
      if (v instanceof Map) return { $map: [...v].map(([k, x]) => [this.value(k), this.value(x)]) };
      if (this.stack.has(v)) return undefined;
      if (Array.isArray(v)) {
        this.stack.add(v);
        const out = v.map(x => {
          const e = this.value(x);
          return e === undefined ? null : e;
        });
        this.stack.delete(v);
        return out;
      }
      if (!isPlain(v)) return undefined;
      this.stack.add(v);
      const out = {};
      for (const k of Object.keys(v)) {
        const e = this.value(v[k]);
        if (e !== undefined) out[k] = e;
      }
      this.stack.delete(v);
      return out;
    }

    object(o) {
      const out = {};
      for (const k of Object.keys(o)) {
        if (SKIP.has(k)) continue;
        if (k === 'inventory') {
          out.inventory = (o.inventory || []).map(e => ({ count: e.count, obj: this.object(e.obj) }));
          continue;
        }
        const e = this.value(o[k]);
        if (e !== undefined) out[k] = e;
      }
      return out;
    }
  }

  class Decoder {
    constructor() {
      this.byId = new Map();
      this.objectRefs = [];
      this.scriptRefs = [];
    }

    value(v, holder, key) {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) {
        const out = new Array(v.length);
        v.forEach((x, i) => { out[i] = this.value(x, out, i); });
        return out;
      }
      if ('$o' in v) {
        this.objectRefs.push([holder, key, v.$o]);
        return null;
      }
      if ('$s' in v) {
        this.scriptRefs.push([holder, key, v.$s]);
        return null;
      }
      if ('$u8' in v) return FO.fromBase64(v.$u8);
      if ('$typed' in v) return globalThis[v.$typed] ? globalThis[v.$typed].from(v.data) : v.data;
      if ('$num' in v) return v.$num === 'nan' ? NaN : v.$num === 'inf' ? Infinity : -Infinity;
      if ('$set' in v) return new Set(v.$set.map(x => this.value(x)));
      if ('$map' in v) return new Map(v.$map.map(([k, x]) => [this.value(k), this.value(x)]));
      const out = {};
      for (const k of Object.keys(v)) out[k] = this.value(v[k], out, k);
      return out;
    }

    register(o) {
      this.byId.set(o.id, o);
      for (const e of o.inventory || []) this.register(e.obj);
    }

    link(scripts) {
      for (const [h, k, id] of this.objectRefs) h[k] = this.byId.get(id) || null;
      for (const [h, k, id] of this.scriptRefs) h[k] = scripts[id] || null;
    }
  }

  FO.saveData = function (play) {
    const w = play.w;
    const sc = play.sc;
    const cur = w.map;
    const states = [cur, ...[...w.states.values()].filter(st => st !== cur)];
    const scripts = new Map();
    for (const st of states) for (const s of st.scriptList || []) scripts.set(s, scripts.size);
    const enc = new Encoder(scripts);
    const maps = states.map(st => ({
      name: st.name,
      header: enc.value(st.header),
      mvars: enc.value(st.gvars),
      visited: !!st.visited,
      savedAt: st.savedAt === undefined ? null : st.savedAt,
      firstRun: st.firstRun === undefined ? null : st.firstRun,
      lastVisit: st.lastVisit === undefined ? null : st.lastVisit,
      objects: st.byElev.map(list => list.map(o => enc.object(o))),
      scripts: st.scriptList ? st.scriptList.map(s => ({
        id: scripts.get(s), index: s.index, type: s.type, sid: s.sid, self: s.self ? s.self.id : null,
        tile: s.tile, elev: s.elev, radius: s.radius, lvars: s.lvars.slice(), map: !!s.map, dead: !!s.dead
      })) : null,
      timers: enc.value(st.timers || [])
    }));
    const d = w.dude;
    const prefs = {};
    for (const k of SAVED_PREFS) prefs[k] = FO.prefValue(play.g.prefs, k);
    return {
      version: VERSION,
      prefs,
      scripts: { time: sc.time, gvars: sc.gvars.slice(), events: enc.value(sc.events), waterShown: sc.waterShown | 0, updateAt: sc.updateAt },
      world: {
        map: cur.name, elev: w.elev, ambient: w.ambient, nextId: w.nextId, dude: d.id, tile: d.tile, rot: d.rot,
        party: (w.party || []).map(o => o.id), movies: [...w.movies], walked: FO.toBase64(w.walked), wm: enc.value(w.wm)
      },
      play: { automapHigh: !!play.automapHigh, combat: play.combat.active ? enc.value(play.combat.snapshot()) : null },
      maps
    };
  };

  FO.restoreWorld = async function (g, data) {
    if (!data || data.version !== VERSION) throw new Error('old save version');
    const world = new FO.World(g);
    await world.init();
    const sc = new FO.Scripts(g, world);
    await sc.init();
    const dec = new Decoder();
    const states = [];
    for (const m of data.maps) {
      const st = await world.staticState(m.name);
      delete st.objects;
      Object.assign(st.header, dec.value(m.header));
      st.gvars = dec.value(m.mvars);
      st.visited = m.visited;
      if (m.savedAt !== null) st.savedAt = m.savedAt;
      if (m.firstRun !== null) st.firstRun = m.firstRun;
      if (m.lastVisit !== null) st.lastVisit = m.lastVisit;
      st.byElev = m.objects.map(list => list.map(v => dec.value(v)));
      st.timers = dec.value(m.timers);
      st.saved = m.scripts;
      states.push(st);
    }
    for (const st of states) for (const list of st.byElev) for (const o of list) dec.register(o);
    const events = dec.value(data.scripts.events);
    const wm = dec.value(data.world.wm);
    const combat = data.play.combat ? dec.value(data.play.combat) : null;
    dec.objectRefs.forEach(([h, k, id]) => { h[k] = dec.byId.get(id) || null; });
    dec.objectRefs = [];
    const scripts = [];
    for (const st of states) {
      world.map = st;
      for (let e = 0; e < 3; e++) for (const o of st.byElev[e]) {
        world.adopt(o, e, null);
        world.index(o);
      }
      if (st.saved) {
        st.scriptList = st.saved.map(s => {
          const script = sc.make(s.index, { type: s.type, sid: s.sid, self: s.self === null ? null : dec.byId.get(s.self) || null, tile: s.tile, elev: s.elev, radius: s.radius, lvars: s.lvars });
          script.map = s.map;
          script.dead = s.dead;
          scripts[s.id] = script;
          return script;
        });
      }
      delete st.saved;
    }
    dec.link(scripts);
    const cur = states.find(st => st.name === data.world.map);
    world.map = cur;
    world.states = new Map(states.filter(st => st !== cur).map(st => [st.name, st]));
    world.dude = dec.byId.get(data.world.dude);
    world.party = data.world.party.map(id => dec.byId.get(id)).filter(Boolean);
    world.elev = data.world.elev;
    world.setAmbient(data.world.ambient);
    world.nextId = data.world.nextId;
    world.movies = new Set(data.world.movies);
    world.walked = FO.fromBase64(data.world.walked);
    world.wm = wm;
    sc.time = data.scripts.time;
    sc.gvars = data.scripts.gvars.slice();
    sc.events = events;
    sc.waterShown = data.scripts.waterShown;
    sc.updateAt = data.scripts.updateAt;
    return { world, sc, combat, at: { tile: data.world.tile, elev: data.world.elev, rot: data.world.rot }, automapHigh: data.play.automapHigh };
  };

  FO.applySavedPrefs = function (g, saved) {
    if (!saved) return;
    g.prefs = g.prefs || {};
    for (const k of SAVED_PREFS) if (saved[k] !== undefined) g.prefs[k] = saved[k];
    FO.savePrefs(g.prefs);
    FO.applyBrightness(g);
    if (g.audio) g.audio.apply();
  };

  FO.loadGameData = async function (g, data) {
    FO.applySavedPrefs(g, data.prefs);
    if (g.audio) g.audio.playMusic(LOAD_MUSIC, true);
    const r = await FO.restoreWorld(g, data);
    const { world, sc } = r;
    const play = new FO.Play(g, world, sc);
    play.automapHigh = r.automapHigh;
    await play.enter();
    sc.loading = true;
    try {
      sc.enterMap([]);
    } finally {
      sc.loading = false;
    }
    const d = world.dude;
    if (d.tile !== r.at.tile || d.elev !== r.at.elev) world.moveTo(d, r.at.tile, r.at.elev);
    d.rot = r.at.rot;
    if (g.audio && FO.EXE.mapMusic[world.map.index]) g.audio.playMusic(FO.EXE.mapMusic[world.map.index], true);
    await world.preload(world.elev);
    play.centerOn(d.tile);
    g.world = world;
    g.scripts = sc;
    g.play = play;
    await g.setMode(play, true);
    if (r.combat) {
      play.iface.showCombatPanel();
      play.combat.resume(r.combat);
    }
    return play;
  };

  FO.scaleThumb = function (src, sw, sh, pitch) {
    const out = new Uint8Array(THUMB.W * THUMB.H);
    const ry = Math.trunc((THUMB.H << FIXED) / sh);
    const rx = Math.trunc((THUMB.W << FIXED) / sw);
    for (let y = 0; y < sh; y++) {
      const y0 = (ry * y) >> FIXED;
      const y1 = (ry * (y + 1)) >> FIXED;
      for (let x = 0; x < sw; x++) {
        const x0 = (rx * x) >> FIXED;
        const x1 = (rx * (x + 1)) >> FIXED;
        const c = src[y * pitch + x];
        for (let dy = y0; dy < y1; dy++) for (let dx = x0; dx < x1; dx++) out[dy * THUMB.W + dx] = c;
      }
    }
    return out;
  };

  FO.saveHeader = function (play, description) {
    const w = play.w;
    const d = w.dude;
    return {
      version: VERSION, name: d.name || '', description: description || '', map: w.map.index, elev: w.elev,
      time: play.sc ? play.sc.time >>> 0 : 0, level: d.level || 1
    };
  };

  function memoryStore() {
    const rows = new Map();
    const get = key => (rows.has(key) ? JSON.parse(rows.get(key)) : null);
    return {
      async meta(slot) {
        return get(KEY.META + slot);
      },
      async data(slot) {
        return get(KEY.DATA + slot);
      },
      async write(slot, meta, data) {
        rows.set(KEY.DATA + slot, JSON.stringify(data));
        rows.set(KEY.META + slot, JSON.stringify(meta));
      },
      async remove(slot) {
        rows.delete(KEY.META + slot);
        rows.delete(KEY.DATA + slot);
      }
    };
  }

  function indexedStore() {
    let db = null;
    const open = () => db || (db = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB.NAME, DB.VERSION);
      req.onupgradeneeded = () => req.result.createObjectStore(DB.STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
    const run = (mode, fn) => open().then(base => new Promise((resolve, reject) => {
      const tx = base.transaction(DB.STORE, mode);
      const req = fn(tx.objectStore(DB.STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
    return {
      meta: slot => run('readonly', s => s.get(KEY.META + slot)).then(r => r || null),
      data: slot => run('readonly', s => s.get(KEY.DATA + slot)).then(r => r || null),
      write: (slot, meta, data) => run('readwrite', s => {
        s.put(data, KEY.DATA + slot);
        return s.put(meta, KEY.META + slot);
      }),
      remove: slot => run('readwrite', s => {
        s.delete(KEY.DATA + slot);
        return s.delete(KEY.META + slot);
      })
    };
  }

  FO.saveStore = function (g) {
    if (!g.saves) g.saves = typeof indexedDB !== 'undefined' ? indexedStore() : memoryStore();
    return g.saves;
  };

  FO.slotState = function (meta) {
    if (!meta) return STATE.EMPTY;
    if (!meta.header || typeof meta.header.version !== 'number') return STATE.CORRUPT;
    return meta.header.version === VERSION ? STATE.VALID : STATE.OLD;
  };

  FO.slotList = async function (g) {
    const store = FO.saveStore(g);
    const out = [];
    for (let i = 0; i < SLOTS; i++) {
      let meta = null;
      let state = STATE.CORRUPT;
      try {
        meta = await store.meta(i);
        state = FO.slotState(meta);
      } catch (e) {
        meta = null;
      }
      const valid = state === STATE.VALID;
      out.push({ state, header: valid ? meta.header : null, thumb: valid && meta.thumb ? FO.fromBase64(meta.thumb) : null });
    }
    return out;
  };

  FO.writeSlot = async function (g, slot, play, description, thumb) {
    const meta = { header: FO.saveHeader(play, description), thumb: FO.toBase64(thumb || new Uint8Array(THUMB.W * THUMB.H)) };
    const data = FO.saveData(play);
    await FO.saveStore(g).write(slot, meta, data);
    return { meta, data };
  };

  FO.readSlot = async function (g, slot) {
    const store = FO.saveStore(g);
    const meta = await store.meta(slot);
    if (FO.slotState(meta) !== STATE.VALID) throw new Error('save slot ' + slot + ' is not loadable');
    const data = await store.data(slot);
    if (!data) throw new Error('save slot ' + slot + ' has no data');
    return { meta, data };
  };
})(globalThis.FO = globalThis.FO || {});
