(() => {
  const FORMAT = 'Win98Backup';
  const ARCHIVE_DB = 'win98_backup_sets';
  const PENDING_KEY = 'win98_backup_pending';
  const REPORT_KEY = 'win98_backup_report';
  const TAG = '\u0000t';

  const idbRequest = r => new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

  const txDone = tx => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });

  const toBase64 = bytes => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };

  const fromBase64 = text => {
    const s = atob(text), bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  };

  function packValue(v, blobs) {
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Date) return { [TAG]: 'date', v: v.getTime() };
    if (v instanceof ArrayBuffer) return { [TAG]: 'ArrayBuffer', v: toBase64(new Uint8Array(v)) };
    if (ArrayBuffer.isView(v)) return { [TAG]: v.constructor.name, v: toBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    if (typeof Blob !== 'undefined' && v instanceof Blob) {
      const out = { [TAG]: 'blob', type: v.type, v: '' };
      blobs.push(v.arrayBuffer().then(buf => { out.v = toBase64(new Uint8Array(buf)); }));
      return out;
    }
    if (v instanceof Map) return { [TAG]: 'map', v: packValue([...v], blobs) };
    if (v instanceof Set) return { [TAG]: 'set', v: packValue([...v], blobs) };
    if (Array.isArray(v)) return v.map(x => packValue(x, blobs));
    const out = {};
    for (const k of Object.keys(v)) out[k] = packValue(v[k], blobs);
    return out;
  }

  async function pack(v) {
    const blobs = [];
    const out = packValue(v, blobs);
    await Promise.all(blobs);
    return out;
  }

  function unpack(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(unpack);
    const tag = v[TAG];
    if (tag === 'date') return new Date(v.v);
    if (tag === 'ArrayBuffer') return fromBase64(v.v).buffer;
    if (tag === 'blob') return new Blob([fromBase64(v.v)], { type: v.type || '' });
    if (tag === 'map') return new Map(unpack(v.v));
    if (tag === 'set') return new Set(unpack(v.v));
    if (tag === 'DataView') return new DataView(fromBase64(v.v).buffer);
    if (tag && typeof globalThis[tag] === 'function') {
      const bytes = fromBase64(v.v);
      const Ctor = globalThis[tag];
      return new Ctor(bytes.buffer, 0, bytes.byteLength / (Ctor.BYTES_PER_ELEMENT || 1));
    }
    const out = {};
    for (const k of Object.keys(v)) out[k] = unpack(v[k]);
    return out;
  }

  const catalog = () => window.BackupCatalog;

  function componentOfKey(key) {
    return catalog().componentOfKey(key);
  }

  function componentOfDb(name) {
    return catalog().componentOfDb(name);
  }

  function lsKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== PENDING_KEY && k !== REPORT_KEY) keys.push(k);
    }
    return keys;
  }

  async function dbNames() {
    if (!indexedDB.databases) return [];
    const list = await indexedDB.databases();
    return list.map(d => d.name).filter(n => n && n !== ARCHIVE_DB);
  }

  function openDb(name) {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(name);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onupgradeneeded = () => {};
    });
  }

  async function dumpDb(name) {
    const db = await openDb(name);
    const out = { version: db.version, stores: [] };
    try {
      for (const storeName of [...db.objectStoreNames]) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const indexes = [...store.indexNames].map(n => {
          const ix = store.index(n);
          return { name: n, keyPath: ix.keyPath, unique: ix.unique, multiEntry: ix.multiEntry };
        });
        const [keys, values] = await Promise.all([idbRequest(store.getAllKeys()), idbRequest(store.getAll())]);
        out.stores.push({ name: storeName, keyPath: store.keyPath, autoIncrement: store.autoIncrement, indexes, records: await pack(keys.map((k, i) => [k, values[i]])) });
      }
    } finally {
      db.close();
    }
    return out;
  }

  function deleteDb(name) {
    return new Promise(resolve => {
      const r = indexedDB.deleteDatabase(name);
      r.onsuccess = () => resolve(true);
      r.onerror = () => resolve(false);
      r.onblocked = () => {};
    });
  }

  function createDb(name, dump) {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(name, Math.max(1, dump.version || 1));
      r.onupgradeneeded = () => {
        const db = r.result;
        for (const s of dump.stores) {
          const opts = {};
          if (s.keyPath !== null && s.keyPath !== undefined) opts.keyPath = s.keyPath;
          if (s.autoIncrement) opts.autoIncrement = true;
          const store = db.createObjectStore(s.name, opts);
          for (const ix of s.indexes || []) store.createIndex(ix.name, ix.keyPath, { unique: !!ix.unique, multiEntry: !!ix.multiEntry });
        }
      };
      r.onerror = () => reject(r.error);
      r.onsuccess = async () => {
        const db = r.result;
        try {
          for (const s of dump.stores) {
            if (!s.records.length) continue;
            const tx = db.transaction(s.name, 'readwrite');
            const store = tx.objectStore(s.name);
            for (const [k, v] of unpack(s.records)) {
              if (s.keyPath !== null && s.keyPath !== undefined) store.put(v);
              else store.put(v, k);
            }
            await txDone(tx);
          }
          db.close();
          resolve();
        } catch (e) {
          db.close();
          reject(e);
        }
      };
    });
  }

  function archiveDb() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(ARCHIVE_DB, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('index')) db.createObjectStore('index', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
        if (!db.objectStoreNames.contains('pending')) db.createObjectStore('pending');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function withArchive(stores, mode, fn) {
    const db = await archiveDb();
    try {
      const tx = db.transaction(stores, mode);
      const result = await fn(tx);
      await txDone(tx);
      return result;
    } finally {
      db.close();
    }
  }

  const textBytes = s => (s ? s.length * 2 : 0);

  function archiveSize(data) {
    let n = 0;
    for (const [k, v] of Object.entries(data.ls || {})) n += textBytes(k) + textBytes(v);
    for (const d of Object.values(data.idb || {})) n += JSON.stringify(d).length;
    return n;
  }

  function sizesByComponent(data) {
    const sizes = {};
    const add = (id, n) => { sizes[id] = (sizes[id] || 0) + n; };
    for (const [k, v] of Object.entries(data.ls || {})) add(componentOfKey(k), textBytes(k) + textBytes(v));
    for (const [name, d] of Object.entries(data.idb || {})) add(componentOfDb(name), JSON.stringify(d).length);
    return sizes;
  }

  const Store = {
    FORMAT,
    ARCHIVE_DB,

    async measure() {
      const sizes = {};
      const add = (id, n) => { sizes[id] = (sizes[id] || 0) + n; };
      for (const k of lsKeys()) add(componentOfKey(k), textBytes(k) + textBytes(localStorage.getItem(k)));
      for (const name of await dbNames()) {
        let n = 0;
        try { n = JSON.stringify(await dumpDb(name)).length; } catch (e) { n = 0; }
        add(componentOfDb(name), n);
      }
      return sizes;
    },

    async snapshot(componentIds, label) {
      const want = componentIds ? new Set(componentIds) : null;
      const data = { ls: {}, idb: {} };
      for (const k of lsKeys()) if (!want || want.has(componentOfKey(k))) data.ls[k] = localStorage.getItem(k);
      for (const name of await dbNames()) {
        if (want && !want.has(componentOfDb(name))) continue;
        try { data.idb[name] = await dumpDb(name); } catch (e) {}
      }
      const sizes = sizesByComponent(data);
      return {
        format: FORMAT,
        version: 1,
        id: 'set_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: label || '',
        created: new Date().toISOString(),
        components: Object.keys(sizes),
        sizes,
        size: archiveSize(data),
        data
      };
    },

    toFileText(archive) {
      return JSON.stringify(archive);
    },

    fromFileText(text) {
      let raw;
      try { raw = JSON.parse(text); } catch (e) { return null; }
      if (!raw || typeof raw !== 'object') return null;
      if (raw.format === FORMAT && raw.data && typeof raw.data === 'object') {
        const data = { ls: raw.data.ls || {}, idb: raw.data.idb || {} };
        const sizes = sizesByComponent(data);
        return Object.assign({}, raw, { data, sizes, components: Object.keys(sizes), size: archiveSize(data) });
      }
      const converted = catalog().convertForeign ? catalog().convertForeign(raw) : null;
      if (!converted) return null;
      const sizes = sizesByComponent(converted.data);
      return {
        format: FORMAT,
        version: 1,
        id: 'set_' + Date.now().toString(36),
        label: converted.label,
        created: converted.created || new Date().toISOString(),
        components: Object.keys(sizes),
        sizes,
        size: archiveSize(converted.data),
        data: converted.data
      };
    },

    async list() {
      const list = await withArchive(['index'], 'readonly', tx => idbRequest(tx.objectStore('index').getAll()));
      return list.sort((a, b) => (a.created < b.created ? 1 : -1));
    },

    async save(archive) {
      const meta = { id: archive.id, label: archive.label, created: archive.created, components: archive.components, sizes: archive.sizes, size: archive.size };
      await withArchive(['index', 'data'], 'readwrite', tx => {
        tx.objectStore('index').put(meta);
        tx.objectStore('data').put(archive.data, archive.id);
      });
      return meta;
    },

    async load(id) {
      const [meta, data] = await withArchive(['index', 'data'], 'readonly', tx => Promise.all([idbRequest(tx.objectStore('index').get(id)), idbRequest(tx.objectStore('data').get(id))]));
      if (!meta || !data) return null;
      return Object.assign({ format: FORMAT, version: 1 }, meta, { data });
    },

    async rename(id, label) {
      await withArchive(['index'], 'readwrite', async tx => {
        const st = tx.objectStore('index');
        const meta = await idbRequest(st.get(id));
        if (meta) { meta.label = label; st.put(meta); }
      });
    },

    async remove(id) {
      await withArchive(['index', 'data'], 'readwrite', tx => {
        tx.objectStore('index').delete(id);
        tx.objectStore('data').delete(id);
      });
    },

    freezeStorage() {
      const noop = function () {};
      Storage.prototype.setItem = noop;
      Storage.prototype.removeItem = noop;
      Storage.prototype.clear = noop;
    },

    reboot() {
      Store.freezeStorage();
      setTimeout(() => window.location.reload(), 300);
    },

    async restore(archive, componentIds) {
      const want = new Set(componentIds);
      const before = {};
      for (const k of lsKeys()) if (want.has(componentOfKey(k))) before[k] = localStorage.getItem(k);
      const incoming = Object.entries(archive.data.ls || {}).filter(([k]) => want.has(componentOfKey(k)));
      try {
        for (const k of Object.keys(before)) localStorage.removeItem(k);
        for (const [k, v] of incoming) localStorage.setItem(k, v);
      } catch (e) {
        for (const [k] of incoming) localStorage.removeItem(k);
        for (const [k, v] of Object.entries(before)) { try { localStorage.setItem(k, v); } catch (err) {} }
        return { ok: false, error: 'quota' };
      }
      const dropDbs = (await dbNames()).filter(n => want.has(componentOfDb(n)));
      const putDbs = {};
      for (const [name, dump] of Object.entries(archive.data.idb || {})) if (want.has(componentOfDb(name))) putDbs[name] = dump;
      await Store.stagePending({ drop: dropDbs, put: putDbs, report: { kind: 'restore', label: archive.label, components: [...want] } });
      return { ok: true };
    },

    async wipe(componentIds, opts = {}) {
      const want = componentIds ? new Set(componentIds) : null;
      if (want) {
        for (const k of lsKeys()) if (want.has(componentOfKey(k))) localStorage.removeItem(k);
      } else {
        localStorage.clear();
      }
      const drop = (await dbNames()).filter(n => !want || want.has(componentOfDb(n)));
      if (!want && opts.dropArchives) drop.push(ARCHIVE_DB);
      await Store.stagePending({ drop, put: {}, report: { kind: want ? 'clear' : 'reset', components: want ? [...want] : null } }, !want && opts.dropArchives);
      return { ok: true };
    },

    async stagePending(job, archivesGoing) {
      const putNames = Object.keys(job.put);
      if (putNames.length && !archivesGoing) {
        await withArchive(['pending'], 'readwrite', tx => { tx.objectStore('pending').put(job.put, 'put'); });
      }
      localStorage.setItem(PENDING_KEY, JSON.stringify({ drop: job.drop, put: archivesGoing ? [] : putNames, report: job.report }));
    },

    async applyPending() {
      let job;
      try { job = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch (e) { job = null; }
      if (!job) return null;
      localStorage.removeItem(PENDING_KEY);
      const failed = [];
      let put = {};
      if (job.put && job.put.length) {
        try { put = (await withArchive(['pending'], 'readonly', tx => idbRequest(tx.objectStore('pending').get('put')))) || {}; } catch (e) { put = {}; }
      }
      for (const name of job.drop || []) await deleteDb(name);
      for (const name of job.put || []) {
        if (!put[name]) { failed.push(name); continue; }
        await deleteDb(name);
        try { await createDb(name, put[name]); } catch (e) { failed.push(name); }
      }
      if (job.put && job.put.length) {
        try { await withArchive(['pending'], 'readwrite', tx => { tx.objectStore('pending').delete('put'); }); } catch (e) {}
      }
      const report = Object.assign({}, job.report || {}, { failed, at: new Date().toISOString() });
      localStorage.setItem(REPORT_KEY, JSON.stringify(report));
      return report;
    },

    takeReport() {
      let report = null;
      try { report = JSON.parse(localStorage.getItem(REPORT_KEY) || 'null'); } catch (e) { report = null; }
      localStorage.removeItem(REPORT_KEY);
      return report;
    },

    pack,
    unpack
  };

  window.BackupStore = Store;
  if (typeof indexedDB !== 'undefined' && typeof localStorage !== 'undefined') {
    Store.ready = Store.applyPending().catch(() => null);
  }
})();
