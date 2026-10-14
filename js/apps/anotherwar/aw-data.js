(function (AW) {
  'use strict';

  const CLASS_BY_LETTER = { w: 'cWeapon', a: 'cAmmo', h: 'cHealth', i: 'cItem', u: 'cWear' };
  const HUMAN_NUM = ['strength', 'charisma', 'endurance', 'inteligence', 'speed', 'luck', 'agility', 'level', 'toroll', 'hitpoints', 'maxhitpoints', 'armorclass', 'tohit', 'tomiss', 'damage', 'damagebonus', 'packsize'];
  const HUMAN_LEAF = ['txtName', 'txtDesc', 'dlgDesc', 'wambient'];
  const HUMAN_EITHER = ['ai', 'script', 'sndScheme', 'radius', 'race'];

  const D = AW.Data = {
    base: 'content/anotherwar/',
    loader: null,
    ready: false,
    templates: null,
    anims: null,
    gfx: null,
    audio: null,
    backgrounds: null,
    levels: {},
    humanCache: {},

    async init(loader) {
      D.loader = loader;
      const [templates, anims, gfx, audio, backgrounds, texts] = await Promise.all([
        loader('data/templates.json'), loader('data/anims.json'), loader('data/gfx.json'),
        loader('data/audio.json'), loader('data/backgrounds.json'), loader('data/texts-original.json')
      ]);
      D.texts = texts;
      AW.TEXT = Object.assign({}, texts.global, AW.TEXT_OVERRIDE || {});
      D.templates = templates;
      for (const [k, v] of Object.entries(AW.ITEM_TEXT || {})) {
        const t = templates.items[k];
        if (!t) continue;
        if (v.name) t.ruName = v.name;
        if (v.desc) t.ruDesc = v.desc;
        if (v.gender) t.gender = v.gender;
      }
      D.anims = anims;
      D.gfx = gfx;
      D.audio = audio;
      D.backgrounds = backgrounds;
      D.ready = true;
    },

    async level(id) {
      if (!D.levels[id]) D.levels[id] = await D.loader('data/levels/' + id + '.json');
      return D.levels[id];
    },

    itemKey(ref) {
      let s = String(ref || '').trim();
      const m = s.match(/^([wahiu])\.(.+)$/);
      if (m) return CLASS_BY_LETTER[m[1]] + '/' + m[2];
      if (s.indexOf('/') > 0) return s;
      for (const cls of ['cItem', 'cHealth', 'cWeapon', 'cAmmo', 'cWear']) {
        if (D.templates.items[cls + '/' + s]) return cls + '/' + s;
      }
      const low = s.toLowerCase();
      for (const k of Object.keys(D.templates.items)) {
        if (k.split('/')[1].toLowerCase() === low) return k;
      }
      return s;
    },

    item(ref) {
      const key = D.itemKey(ref);
      let t = D.templates.items[key];
      if (!t) {
        const low = key.toLowerCase();
        const k2 = Object.keys(D.templates.items).find(k => k.toLowerCase() === low);
        if (k2) t = D.templates.items[k2];
      }
      return t || null;
    },

    humanKey(name) {
      const all = D.templates.humans;
      if (all[name]) return name;
      const low = String(name || '').toLowerCase();
      return Object.keys(all).find(k => k.toLowerCase() === low) || '';
    },

    human(name) {
      if (D.humanCache[name]) return D.humanCache[name];
      const all = D.templates.humans;
      const key = D.humanKey(name);
      const leaf = all[key] || {};
      let parent = {};
      if (key && key[1] === '_') {
        const p = key.indexOf('_', 2);
        if (p > 0 && all[key.slice(0, p)]) parent = all[key.slice(0, p)];
      }
      const out = { name: key || name, exprs: {}, kits: {} };
      for (const f of HUMAN_NUM) {
        const e = String(parent[f] || '') + String(leaf[f] || '');
        if (e !== '') out.exprs[f] = [e];
      }
      for (const f of HUMAN_LEAF) if (leaf[f]) out.exprs[f] = [leaf[f]];
      for (const f of HUMAN_EITHER) {
        const v = leaf[f] !== undefined && leaf[f] !== '' ? leaf[f] : parent[f];
        if (v !== undefined && v !== '') out.exprs[f] = [v];
      }
      for (const src of [leaf, parent]) {
        for (const k of Object.keys(src)) {
          if (!/^kit_/.test(k) || !Array.isArray(src[k])) continue;
          out.kits[k] = (out.kits[k] || []).concat(src[k]);
        }
      }
      D.humanCache[name] = out;
      return out;
    },

    humanValue(tml, field, fallback) {
      const e = tml.exprs[field];
      if (!e || !e.length || e[0] === '') return fallback;
      const v = AW.evalValue(e[0], 0);
      return v === undefined || isNaN(v) ? fallback : v;
    },

    sheet(key) { return D.anims && D.anims.sheets[key] || null; },

    infOffset(anim, wclass, dir) {
      const inf = D.anims && D.anims.inf;
      if (!inf) return [0, AW.C.PIVOT_DY];
      const cands = [(anim + '_' + wclass).toLowerCase(), anim.toLowerCase()];
      for (const c of cands) {
        const e = inf[c];
        if (e && e.off && e.off[dir]) return e.off[dir];
      }
      return [0, AW.C.PIVOT_DY];
    },

    audioLen(key) { return (D.audio && D.audio[key]) || 0; },

    gfxMeta(obj) {
      const key = String(obj || '').replace(/\\/g, '/').replace(/\.spx$/i, '').toLowerCase();
      return D.gfx ? (D.gfx[key] ? { key, meta: D.gfx[key] } : null) : null;
    }
  };
})(globalThis.AW = globalThis.AW || {});
