(function (H) {
  'use strict';
  const VERSION = 6;
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const MANUAL = 10, AUTO = 3, MAX_BYTES = 1536 * 1024;

  const packBits = bits => {
    let out = '';
    for (let i = 0; i < bits.length; i += 6) {
      let v = 0;
      for (let k = 0; k < 6; k++) if (bits[i + k]) v |= 1 << k;
      out += B64[v];
    }
    return out;
  };
  const unpackBits = (text, n) => {
    const out = new Array(n).fill(0);
    for (let i = 0; i < text.length; i++) {
      const v = B64.indexOf(text[i]);
      for (let k = 0; k < 6; k++) if (v & (1 << k) && i * 6 + k < n) out[i * 6 + k] = 1;
    }
    return out;
  };

  const MIGRATE = {
    0: d => {
      const S = d.S;
      S.turn = S.turn || 0;
      S.battle = S.battle || null;
      S.difficulty = S.difficulty || 'normal';
      S.mapName = S.mapName || '';
      S.debug = !!S.debug;
      S.goals = S.goals || { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] };
      if (S.over === 'lose') S.over = { winner: -1, why: 'lost' };
      for (const p of S.players) {
        p.out = !!p.out;
        p.townless = p.townless || 0;
        p.hadTown = p.hadTown == null ? true : p.hadTown;
      }
    },
    1: d => {
      const S = d.S;
      S.caravans = S.caravans || [];
      S.nextCaravan = S.nextCaravan || 1;
      S.returning = S.returning || [];
      for (const h of S.heroes) h.machines = h.machines || [];
    },
    2: d => {
      const S = d.S, M = S.map, n = M.w * M.h;
      M.over = M.over || M.ter.map(() => new Array(n).fill(0));
      for (const p of S.players) {
        p.seals = p.seals || [];
        p.menhirs = p.menhirs || [];
        p.kills = p.kills || 0;
      }
      for (const h of S.heroes) {
        h.boat = h.boat || null;
        h.heart = !!h.heart;
        h.fresh = h.fresh || { morale: 0, luck: 0 };
        h.week = h.week || { morale: 0, luck: 0, steps: 0, altar: null };
      }
    },
    3: d => {
      const S = d.S, M = S.map;
      M.river = M.river || M.ter.map(() => new Array(M.w * M.h).fill(0));
      S.scene = S.scene || null;
      S.script = S.script || { flags: {}, done: [], goals: [], read: [], queue: [], run: null, slots: null, hero: null, owners: {} };
    },
    4: d => {
      const S = d.S;
      S.nextDeal = S.nextDeal || 1;
      for (const p of S.players) {
        p.deals = p.deals || [];
        p.dealsDone = p.dealsDone || 0;
      }
    },
    5: d => {
      const S = d.S;
      for (const p of S.players) {
        p.shades = p.shades || [];
        p.risen = p.risen || 0;
      }
      for (const o of S.map.objs) {
        if (o.t !== 'town') continue;
        o.barrow = o.barrow || [];
        o.raised = o.raised || 0;
      }
    }
  };

  const pack = S => {
    const copy = Object.assign({}, S, { players: S.players.map(p => Object.assign({}, p, { seen: p.seen.map(packBits) })) });
    return JSON.stringify({ game: 'heroes98', v: VERSION, S: copy });
  };
  const unpack = text => {
    const d = JSON.parse(text);
    if (d.game !== 'heroes98') throw new Error('not a Heroes 98 save');
    if (d.v > VERSION) throw new Error('save from a newer version');
    const n = d.S.map.w * d.S.map.h;
    for (const p of d.S.players) p.seen = p.seen.map(s => (typeof s === 'string' ? unpackBits(s, n) : s));
    for (let v = d.v; v < VERSION; v++) MIGRATE[v](d);
    return d.S;
  };

  const hash = S => {
    const text = JSON.stringify(S);
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  };

  const squeeze = async (text, Stream) => {
    const stream = new Blob([text]).stream().pipeThrough(new Stream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  };
  const gzip = text => squeeze(text, CompressionStream);
  const gunzip = async bytes => {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  };

  const memory = () => {
    const all = new Map();
    return {
      put: rec => {
        all.set(rec.id, rec);
        return Promise.resolve();
      },
      get: id => Promise.resolve(all.get(id) || null),
      all: () => Promise.resolve([...all.values()]),
      del: id => {
        all.delete(id);
        return Promise.resolve();
      }
    };
  };

  const idb = () => {
    let opening = null;
    const open = () => {
      if (opening) return opening;
      opening = new Promise((ok, no) => {
        const r = indexedDB.open('heroes98', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('saves', { keyPath: 'id' });
          r.result.createObjectStore('maps', { keyPath: 'id' });
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => no(r.error);
      });
      return opening;
    };
    const run = (mode, fn, name) => open().then(db => new Promise((ok, no) => {
      const q = fn(db.transaction(name, mode).objectStore(name));
      q.onsuccess = () => ok(q.result);
      q.onerror = () => no(q.error);
    }));
    const shelf = name => ({
      put: rec => run('readwrite', st => st.put(rec), name).then(() => undefined),
      get: id => run('readonly', st => st.get(id), name).then(v => v || null),
      all: () => run('readonly', st => st.getAll(), name),
      del: id => run('readwrite', st => st.delete(id), name).then(() => undefined)
    });
    return Object.assign(shelf('saves'), { maps: shelf('maps') });
  };

  let store = null;
  const backend = () => {
    if (!store) store = typeof indexedDB !== 'undefined' ? idb() : Object.assign(memory(), { maps: memory() });
    return store;
  };

  const SLOTS = [...Array.from({ length: MANUAL }, (_, i) => 'm' + (i + 1)), ...Array.from({ length: AUTO }, (_, i) => 'a' + (i + 1)), 'q'];
  const slotName = id => (id === 'q' ? 'Быстрое сохранение' : id[0] === 'a' ? 'Автосохранение ' + id.slice(1) : 'Ячейка ' + id.slice(1));
  const autoSlot = S => 'a' + ((S.day - 1) % AUTO + 1);

  const meta = (S, id, mini) => {
    const human = S.players.find(p => p.human) || S.players[0];
    return { id, map: S.mapName, day: S.day, date: H.Moons.dateText(S), faction: human.faction, when: Date.now(), debug: !!S.debug, mini: mini || null, ver: VERSION };
  };

  const write = async (id, S, mini) => {
    const text = pack(S), bytes = await gzip(text);
    if (bytes.length > MAX_BYTES) throw new Error('save is too large');
    const rec = { id, meta: meta(S, id, mini), bytes };
    await backend().put(rec);
    return rec.meta;
  };
  const read = async id => {
    const rec = await backend().get(id);
    if (!rec) return null;
    return unpack(await gunzip(rec.bytes));
  };
  const list = async () => (await backend().all()).map(r => r.meta).sort((a, b) => b.when - a.when);
  const latest = async () => (await list())[0] || null;
  const remove = id => backend().del(id);

  const maps = {
    put: rec => backend().maps.put(rec),
    get: id => backend().maps.get(id),
    all: () => backend().maps.all(),
    del: id => backend().maps.del(id)
  };

  H.Save = { maps, VERSION, MIGRATE, MAX_BYTES, SLOTS, packBits, unpackBits, pack, unpack, hash, gzip, gunzip, slotName, autoSlot, meta, write, read, list, latest, remove, memory };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
