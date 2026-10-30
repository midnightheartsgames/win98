(function (A) {
  'use strict';
  const PREFIX = 'aayla98_';

  const canon = v => {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  };

  const MIGRATE = {
    1: blob => {
      const S = A.newState();
      Object.assign(S, { party: blob.party || [], items: blob.items || {}, dark: blob.dark || 0, field: blob.field || null });
      S.chapter = 'pro';
      const from = { lessu_market: 'pro_lessu', ryll_tunnels: 'pro_lessu', ryll_mine: 'pro_pol_glitter' }[S.field && S.field.map] || 'pro_garden';
      S.scene = { pc: { label: from, i: 0 }, vn: { bg: null, time: null, cg: null, still: null, music: 'ryloth', busts: {} }, done: false };
      S.resume = S.field && S.field.map ? null : 'pro_garden';
      return { v: 2, at: blob.at || 0, kind: 'auto', meta: { chapter: 'pro', place: '', time: 0, thumb: null }, S };
    },
    2: blob => {
      const S = blob.S, bonds = {};
      for (const [id, n] of Object.entries(S.bonds || {})) {
        if (n && typeof n === 'object') bonds[id] = n;
        else if (id === 'traa') bonds[id] = { rank: Math.min(1, n || 0), pts: 0, letgo: 0 };
        else bonds[id] = { rank: 0, pts: n || 0, letgo: 0 };
      }
      if (S.flags && S.flags.vos_letgo) {
        bonds.vos = bonds.vos || { rank: 0, pts: 0, letgo: 0 };
        bonds.vos.letgo = Math.max(1, bonds.vos.letgo || 0);
        delete S.flags.vos_letgo;
      }
      S.bonds = bonds;
      S.faded = S.faded || [];
      S.palace = S.palace || null;
      S.respite = S.respite || null;
      S.version = 3;
      return Object.assign({}, blob, { v: 3, S });
    }
  };

  A.Save = {
    SLOTS: 10,
    LIMIT: 60 * 1024,
    KEYS: { auto: PREFIX + 'auto', quick: PREFIX + 'quick', settings: PREFIX + 'settings', album: PREFIX + 'album' },
    slotKey: n => PREFIX + 'slot_' + n,
    keys() {
      return [...Array.from({ length: A.Save.SLOTS }, (_, i) => A.Save.slotKey(i + 1)), A.Save.KEYS.auto, A.Save.KEYS.quick, A.Save.KEYS.settings, A.Save.KEYS.album];
    },
    hash(S) {
      const s = canon(S);
      let h = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return h.toString(16).padStart(8, '0');
    },
    pack(S, meta, kind) {
      return { v: A.SAVE_VERSION, at: Date.now(), kind: kind || 'slot', meta: Object.assign({ chapter: S.chapter, place: '', time: Math.round(S.time || 0), thumb: null }, meta || {}), S: JSON.parse(JSON.stringify(S)) };
    },
    encode(blob) {
      let text = JSON.stringify(blob);
      if (text.length > A.Save.LIMIT && blob.meta.thumb) {
        blob = Object.assign({}, blob, { meta: Object.assign({}, blob.meta, { thumb: null }) });
        text = JSON.stringify(blob);
      }
      if (text.length > A.Save.LIMIT) throw new Error('save is larger than 60 KB: ' + text.length);
      return text;
    },
    write(store, key, blob) {
      const text = A.Save.encode(blob);
      store.setItem(key, text);
      return text.length;
    },
    migrate(blob) {
      let b = blob;
      for (let guard = 0; guard < 20 && b && (b.v || b.version || 1) < A.SAVE_VERSION; guard++) {
        const from = b.v || b.version || 1, step = MIGRATE[from];
        if (!step) throw new Error('no migration from save version ' + from);
        b = step(b);
      }
      if (!b || b.v !== A.SAVE_VERSION || !b.S) throw new Error('bad save');
      return b;
    },
    read(store, key) {
      let raw = null;
      try { raw = store.getItem(key); } catch (e) { return null; }
      if (!raw) return null;
      try { return A.Save.migrate(JSON.parse(raw)); } catch (e) { return null; }
    },
    remove(store, key) {
      try { store.removeItem(key); } catch (e) { }
    },
    list(store) {
      const out = [{ key: A.Save.KEYS.auto, name: 'Автосохранение', kind: 'auto' }, { key: A.Save.KEYS.quick, name: 'Быстрое сохранение', kind: 'quick' }];
      for (let i = 1; i <= A.Save.SLOTS; i++) out.push({ key: A.Save.slotKey(i), name: 'Ячейка ' + i, kind: 'slot' });
      return out.map(e => Object.assign(e, { blob: A.Save.read(store, e.key) }));
    },
    latest(store) {
      const all = A.Save.list(store).filter(e => e.blob);
      all.sort((a, b) => b.blob.at - a.blob.at);
      return all[0] || null;
    },
    loadSettings(store) {
      const def = { cps: 45, music: 70, sfx: 80, difficulty: 'normal' };
      try { return Object.assign(def, JSON.parse(store.getItem(A.Save.KEYS.settings) || '{}')); } catch (e) { return def; }
    },
    saveSettings(store, s) {
      try { store.setItem(A.Save.KEYS.settings, JSON.stringify(s)); } catch (e) { }
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
